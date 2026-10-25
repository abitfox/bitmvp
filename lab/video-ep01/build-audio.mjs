// 需求01 成片：批量 TTS → 时长测量 → 时间轴计算 → 完整音轨合成
// 用 13_AzureTTS 项目的 Key；声音 zh-CN-YunxiNeural（云希）
import { execSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";

const SEGMENTS = [
  { id: "s01", scene: "sc1", text: "前几天我从交易所提币到自己的钱包，转完心里一直没底：到底到没到？我想自己确认，不经过任何人。" },
  { id: "s02", scene: "sc2", text: "结果打开区块链浏览器，一堆数字看得我发懵。这串 0x 开头的地址是什么？余额是谁记的？记在哪？我一条都答不上来。所以我决定从最笨的地方开始：自己查明白。" },
  { id: "s03", scene: "sc3", text: "先补课。以太坊是什么？我以前以为是类似支付宝的东西。查了才知道：它是一本人人持有、改不动的公共账本。没有哪家公司说了算，每个人手里都有一份完整的副本。" },
  { id: "s04", scene: "sc4", text: "ETH，就是记在这本账上的钱。而地址，0x 开头的这一串，就是账号：别人给你转钱，转到这个号上。它是公开的，像银行卡号，不是密码。" },
  { id: "s05", scene: "sc5", text: "那钱存在 MetaMask 里吗？我原来真这么以为。查了才知道：钱包里根本没有钱，钱一直在链上。钱包里存的是私钥，谁有私钥，谁才能动这笔钱。所以钱包更像钥匙串。" },
  { id: "s06", scene: "sc6", text: "概念过了，真正的问题来了：账本在哪？它不是一家网站，没有官网 API。账本的副本存在一种叫节点的机器上。自己跑一个？要同步几个 TB，劝退。所以借别人的：公共 RPC，一个免费的节点入口，我发请求，它把账本状态答给我。" },
  { id: "s07", scene: "sc7", text: "接下来翻译成代码。用 viem 两行建立连接：chain，说明我问的是以太坊主网；transport，说明去问哪个节点。然后一句 getBalance。注意，我故意不格式化，先看看原始答案长什么样。" },
  { id: "s08", scene: "sc8", text: "跑起来了。5773499921329373953。这是个什么数？我盯着看了半天。账本给我的原始数字，根本没打算让我看懂。" },
  { id: "s09", scene: "sc9", text: "去查了：链上所有金额都是整数，记的是最小单位 wei。1 个以太坊币，等于 10 的 18 次方 wei。为什么这么极端？因为账本上不能有浮点数，整数除法最多丢余数，浮点运算是真的会丢钱。所以我只需要除以 10 的 18 次方，viem 自带现成的。" },
  { id: "s10", scene: "sc10", text: "数字能看了，我多玩了三下。第一个实验：vitalik 的地址，5.77 个以太坊币，跟浏览器对得上，成了。第二个：换个空地址，输出 0。我第一反应是地址不存在？查了才发现，地址都在，只是账本上没记它的钱。第三个：故意把节点换成一个坏的，报错了。公共的就是会抽风，这个坑先记下。" },
  { id: "s11", scene: "sc11", text: "这一集我自己带走的：读链，就是向节点发只读请求，不需要钱包，不花钱；余额是最小单位的整数；连接建一次，后面每一集都用它。但是，你打开任何一个真实钱包，大头根本不是以太坊币，是 USDT 这些 ERC-20 代币，getBalance 管不到它们。三十个代币，难道发三十次请求？下一集：把三十次，打进一次。" },
];

const HEAD = 2.5, GAP = 0.7, TAIL = 2.5;

// 1) 逐段 TTS（已有则跳过）
for (const s of SEGMENTS) {
  const f = `${s.id}.mp3`;
  if (existsSync(f)) { console.log("skip", f); continue; }
  console.log("tts", f);
  execSync(`node audio/azure-tts.mjs ${JSON.stringify(s.text)} ${f}`, { stdio: "inherit", timeout: 120000 });
}

// 2) 测时长，算时间轴
const timeline = [];
let t = HEAD;
for (const s of SEGMENTS) {
  const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${s.id}.mp3`).toString().trim());
  timeline.push({ id: s.id, scene: s.scene, text: s.text, start: +(t.toFixed(3)), dur: +dur.toFixed(3) });
  t += dur + GAP;
}
const total = +(t - GAP + TAIL).toFixed(3);
writeFileSync("timeline.json", JSON.stringify({ head: HEAD, gap: GAP, tail: TAIL, total, segments: timeline }, null, 2));
console.log("总时长", total, "s");

// 3) 统一转 24k mono wav → 拼静音 + 段落 → 完整音轨
for (const s of SEGMENTS) execSync(`ffmpeg -y -v error -i ${s.id}.mp3 -ar 24000 -ac 1 ${s.id}.wav`);
execSync(`ffmpeg -y -v error -f lavfi -i anullsrc=r=24000:cl=mono -t ${HEAD} -ar 24000 -ac 1 sil_head.wav`);
execSync(`ffmpeg -y -v error -f lavfi -i anullsrc=r=24000:cl=mono -t ${GAP} -ar 24000 -ac 1 sil_gap.wav`);
execSync(`ffmpeg -y -v error -f lavfi -i anullsrc=r=24000:cl=mono -t ${TAIL} -ar 24000 -ac 1 sil_tail.wav`);
const list = ["sil_head.wav", ...timeline.flatMap((s) => [`${s.id}.wav`, "sil_gap.wav"]), "sil_tail.wav"];
// 最后一个 gap 换成 tail
list[list.length - 1] = "sil_tail.wav";
writeFileSync("concat.txt", list.map((f) => `file '${f}'`).join("\n"));
execSync(`ffmpeg -y -v error -f concat -safe 0 -i concat.txt audio_full.wav`);
const adur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 audio_full.wav`).toString().trim();
console.log("audio_full.wav", adur, "s");
