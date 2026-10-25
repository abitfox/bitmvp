// 用 13_AzureTTS 项目里的 Azure Key 合成配音（REST API，eastus）
import { writeFileSync } from "node:fs";
const KEY = "ac2095b4310542fd9798a4fed24f0df4";
const HOST = "eastus.tts.speech.microsoft.com";
const [,, text, out, voice = "zh-CN-YunxiNeural", rate = "+0%"] = process.argv;
const ssml = `<speak version='1.0' xml:lang='zh-CN'><voice name='${voice}'><prosody rate='${rate}'>${text}</prosody></voice></speak>`;
const res = await fetch(`https://${HOST}/cognitiveservices/v1`, {
  method: "POST",
  headers: {
    "Ocp-Apim-Subscription-Key": KEY,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    "User-Agent": "bitmvp-video",
  },
  body: ssml,
});
if (!res.ok) { console.error("Azure 错误", res.status, await res.text()); process.exit(1); }
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log("OK", out);
