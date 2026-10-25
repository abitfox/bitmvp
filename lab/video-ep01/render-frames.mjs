// 需求01 成片：用本机 Edge 无头模式逐帧渲染 page.html
// 时间轴来自 timeline.json；输出 frames/f_%05d.png（10fps）
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const FPS = 10;
const TOTAL = 218.592;
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--disable-gpu"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto("http://localhost:8123/page.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

mkdirSync("frames", { recursive: true });
const t0 = Date.now();
let lastPct = -1;
// 可选参数：起始帧 结束帧（用于局部重渲染）
const K_START = Number(process.argv[2] ?? 0);
const K_END = Number(process.argv[3] ?? Math.round(TOTAL * FPS));
const N = K_END;
for (let k = K_START; k <= N; k++) {
  const T = k / FPS;
  await page.evaluate((t) => window.__seek(t), T);
  await page.screenshot({ path: `frames/f_${String(k).padStart(5, "0")}.png`, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  const pct = Math.floor((k / N) * 100);
  if (pct !== lastPct && pct % 5 === 0) { console.log(`${pct}%  k=${k}/${N}  ${Math.round((Date.now() - t0) / 1000)}s`); lastPct = pct; }
}
console.log("完成：", N + 1, "帧，用时", Math.round((Date.now() - t0) / 1000), "s");
await browser.close();
