/**
 * Screenshot lewat Chrome DevTools Protocol.
 *
 * --window-size tidak bisa dipakai untuk menguji layar sempit: Windows memaksa
 * lebar jendela minimum (~540px), jadi Chrome me-layout di lebar itu lalu
 * memotong gambarnya sesuai yang diminta - hasilnya terlihat seperti bug
 * overflow padahal bukan. Emulation.setDeviceMetricsOverride mengatur viewport
 * CSS secara langsung, jadi 390px benar-benar 390px.
 *
 * Pakai: node design/shot.mjs <url> <keluaran.png> <lebar> <tinggi> [skala]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, w, h, scale = "2"] = process.argv.slice(2);
if (!url || !out || !w || !h) {
  console.error("pakai: node design/shot.mjs <url> <out.png> <lebar> <tinggi> [skala]");
  process.exit(1);
}

const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), "cdp-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {
      /* belum siap */
    }
    await sleep(250);
  }
  throw new Error("Chrome tidak merespons di port debugging");
}

const browserWs = await endpoint();
const ws = new WebSocket(browserWs);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let id = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }
});

function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

await send("Page.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: Number(scale),
  mobile: Number(w) < 768,
}, sessionId);

await send("Page.navigate", { url }, sessionId);
await sleep(3500);

const { data } = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
}, sessionId);

writeFileSync(out, Buffer.from(data, "base64"));
console.log(`  ${out}  viewport ${w}x${h} @${scale}x`);

ws.close();
chrome.kill();
process.exit(0);
