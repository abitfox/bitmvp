"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useSwitchChain,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import {
  erc20Abi,
  encodeAbiParameters,
  type Address,
  type Hex,
} from "viem";
import { CHAIN_BY_KEY } from "@/lib/chain/chains";

/** SwapRouter02.exactInputSingle 的最小 ABI（struct 无 deadline 字段） */
const ROUTER_ABI = [
  {
    type: "function" as const,
    name: "exactInputSingle" as const,
    stateMutability: "payable" as const,
    inputs: [
      {
        type: "tuple" as const,
        name: "params" as const,
        components: [
          { type: "address" as const, name: "tokenIn" as const },
          { type: "address" as const, name: "tokenOut" as const },
          { type: "uint24" as const, name: "fee" as const },
          { type: "address" as const, name: "recipient" as const },
          { type: "uint256" as const, name: "amountIn" as const },
          { type: "uint256" as const, name: "amountOutMinimum" as const },
          { type: "uint160" as const, name: "sqrtPriceLimitX96" as const },
        ],
      },
    ],
    outputs: [{ type: "uint256" as const, name: "amountOut" as const }],
  },
] as const;

/**
 * Uniswap UniversalRouter 的最小 ABI。
 *
 * 部分链（如 Sepolia）只部署了 UniversalRouter，没有 SwapRouter02。
 * UniversalRouter 用「命令字 + 参数数组」的批处理模型：
 * commands 每个字节是一条命令，inputs 是对应的 ABI 编码参数。
 */
const UNIVERSAL_ROUTER_ABI = [
  {
    type: "function" as const,
    name: "execute" as const,
    stateMutability: "payable" as const,
    inputs: [
      { type: "bytes" as const, name: "commands" as const },
      { type: "bytes[]" as const, name: "inputs" as const },
      { type: "uint256" as const, name: "deadline" as const },
    ],
    outputs: [],
  },
] as const;

/** UniversalRouter 命令字 */
const CMD_V3_SWAP_EXACT_IN = "0x00";
const CMD_WRAP_ETH = "0x0b";

/** UniversalRouter 内部约定的地址常量 */
const ROUTER_ADDR = "0x0000000000000000000000000000000000000002" as Address;

/** V3 单跳路径编码：tokenIn(20) + fee(3) + tokenOut(20) */
function encodeV3Path(
  tokenIn: Address,
  fee: number,
  tokenOut: Address,
): Hex {
  const feeHex = fee.toString(16).padStart(6, "0");
  return `0x${tokenIn.slice(2).toLowerCase()}${feeHex}${tokenOut
    .slice(2)
    .toLowerCase()}` as Hex;
}

export interface ExecuteSwapArgs {
  chainKey: string;
  /** 输入代币合约地址（原生币用 0x0 地址） */
  tokenInAddress: Address;
  tokenOutAddress: Address;
  feeTier: number;
  /** 输入数量（最小单位整数，bigint） */
  amountIn: bigint;
  /** 最小输出（最小单位） */
  amountOutMinimum: bigint;
  /** 卖出 ERC20 时需要：报价用的路由地址（approve 目标） */
  routerAddress: Address;
}

export type SwapStep =
  | "idle"
  | "switching-chain"
  | "checking-allowance"
  | "approving"
  | "waiting-approval"
  | "sending-swap"
  | "waiting-swap"
  | "done"
  | "error";

export function useSwapExecution() {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [step, setStep] = useState<SwapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const execute = useCallback(
    async (args: ExecuteSwapArgs): Promise<boolean> => {
      setError(null);
      setTxHash(null);

      try {
        const cfg = CHAIN_BY_KEY.get(args.chainKey);
        if (!cfg || !address) throw new Error("未连接钱包或链不支持");
        if (!publicClient) throw new Error("公共客户端不可用");

        // 1. 切链
        if (chainId !== cfg.chain.id) {
          setStep("switching-chain");
          await switchChainAsync({ chainId: cfg.chain.id });
        }

        const ZERO = "0x0000000000000000000000000000000000000000" as Address;
        const isNativeIn = args.tokenInAddress === ZERO;

        // 实际转出给路由器的输入代币（原生币要先 wrap 成 WETH 才能进 V3 池）
        const v3TokenIn: Address = isNativeIn
          ? cfg.wNativeAddress
          : args.tokenInAddress;

        // 没有 SwapRouter02 的链（如 Sepolia）走 UniversalRouter
        if (!cfg.uniswapRouter && cfg.uniswapUniversalRouter) {
          const spender = cfg.uniswapUniversalRouter;

          // ERC20 输入：先授权给 UniversalRouter
          if (!isNativeIn) {
            setStep("checking-allowance");
            const allowance = (await publicClient.readContract({
              address: args.tokenInAddress,
              abi: erc20Abi,
              functionName: "allowance",
              args: [address, spender],
            })) as bigint;

            if (allowance < args.amountIn) {
              setStep("approving");
              const approveHash = await writeContractAsync({
                address: args.tokenInAddress,
                abi: erc20Abi,
                functionName: "approve",
                args: [spender, args.amountIn],
                chainId: cfg.chain.id,
              });
              setStep("waiting-approval");
              await publicClient.waitForTransactionReceipt({
                hash: approveHash,
              });
            }
          }

          setStep("sending-swap");
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
          const path = encodeV3Path(
            v3TokenIn,
            args.feeTier,
            args.tokenOutAddress,
          );

          let commands: Hex;
          let inputs: Hex[];

          if (isNativeIn) {
            // ETH 进 V3 池必须先 wrap：
            // WRAP_ETH(留在 router) → V3_SWAP_EXACT_IN(资金已在 router，payerIsUser=false)
            commands = `0x${CMD_WRAP_ETH.slice(2)}${CMD_V3_SWAP_EXACT_IN.slice(
              2,
            )}` as Hex;
            inputs = [
              encodeAbiParameters(
                [{ type: "address" }, { type: "uint256" }],
                [ROUTER_ADDR, args.amountIn],
              ),
              encodeAbiParameters(
                [
                  { type: "address" },
                  { type: "uint256" },
                  { type: "uint256" },
                  { type: "bytes" },
                  { type: "bool" },
                ],
                [
                  address,
                  args.amountIn,
                  args.amountOutMinimum,
                  path,
                  false,
                ],
              ),
            ];
          } else {
            // ERC20：单条命令，payerIsUser=true → router 用 transferFrom 从钱包扣
            commands = CMD_V3_SWAP_EXACT_IN;
            inputs = [
              encodeAbiParameters(
                [
                  { type: "address" },
                  { type: "uint256" },
                  { type: "uint256" },
                  { type: "bytes" },
                  { type: "bool" },
                ],
                [address, args.amountIn, args.amountOutMinimum, path, true],
              ),
            ];
          }

          const swapHash = await writeContractAsync({
            address: spender,
            abi: UNIVERSAL_ROUTER_ABI,
            functionName: "execute",
            args: [commands, inputs, deadline],
            value: isNativeIn ? args.amountIn : undefined,
            chainId: cfg.chain.id,
          });

          setTxHash(swapHash);
          setStep("waiting-swap");
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: swapHash,
          });
          if (receipt.status !== "success") {
            throw new Error("交易执行失败（reverted）");
          }
          setStep("done");
          return true;
        }

        // 2. ERC20 需要 approve（原生币直接跳过）
        if (!isNativeIn) {
          setStep("checking-allowance");
          const allowance = (await publicClient.readContract({
            address: args.tokenInAddress,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address, args.routerAddress],
          })) as bigint;

          if (allowance < args.amountIn) {
            setStep("approving");
            const approveHash = await writeContractAsync({
              address: args.tokenInAddress,
              abi: erc20Abi,
              functionName: "approve",
              args: [args.routerAddress, args.amountIn],
              chainId: cfg.chain.id,
            });

            setStep("waiting-approval");
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
          }
        }

        // 3. 执行 swap（原生币输入时 value = amountIn，tokenIn 用 WETH 地址）
        setStep("sending-swap");
        const swapHash = await writeContractAsync({
          address: args.routerAddress,
          abi: ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: isNativeIn ? cfg.wNativeAddress : args.tokenInAddress,
              tokenOut: args.tokenOutAddress,
              fee: args.feeTier,
              recipient: address,
              amountIn: args.amountIn,
              amountOutMinimum: args.amountOutMinimum,
              sqrtPriceLimitX96: 0n,
            },
          ],
          value: isNativeIn ? args.amountIn : undefined,
          chainId: cfg.chain.id,
        });

        setTxHash(swapHash);
        setStep("waiting-swap");
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: swapHash,
        });

        if (receipt.status !== "success") {
          throw new Error("交易执行失败（reverted）");
        }

        setStep("done");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // 用户在钱包里点了拒绝
        if (/user rejected|denied/i.test(msg)) {
          setError("你取消了钱包签名");
        } else {
          setError(msg);
        }
        setStep("error");
        return false;
      }
    },
    [address, chainId, switchChainAsync, writeContractAsync, publicClient],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return { step, error, txHash, execute, reset };
}
