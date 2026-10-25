"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, base, arbitrum, optimism, bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * wagmi 配置。
 *
 * ssr: true —— Next.js App Router 下必须开启，
 * 否则服务端渲染时会尝试读 localStorage，导致 hydration 报错。
 */
const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, optimism, bsc],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  // QueryClient 必须放在 state 里，否则每次渲染都会重建、缓存全丢
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
