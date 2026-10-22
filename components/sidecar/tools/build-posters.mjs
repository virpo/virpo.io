// Renders the still LCD posters that show before the engine boots (and
// without JavaScript): the WINDOW scene by day and by night, straight from the
// real engine, with motion reduced so the frame is calm.
//
// Usage: start the dev server, then
//   node components/sidecar/tools/build-posters.mjs http://localhost:4322/sidecar/
// Output: public/lab/sidecar/lcd-window.png and lcd-window-night.png
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:4322/sidecar/";
// 11:00 and 22:00 in Tokyo.
const times = [
  { name: "lcd-window.png", at: "2026-10-22T02:00:00Z" },
  { name: "lcd-window-night.png", at: "2026-10-22T13:00:00Z" },
];

const browser = await chromium.launch();
for (const { name, at } of times) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.clock.install({ time: new Date(at) });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.clock.runFor(1500);
  await page.waitForSelector('[data-sidecar-device][data-ready="true"]');
  await page.clock.runFor(500);
  const data = await page.evaluate(() => document.querySelector("[data-sidecar-device] canvas").toDataURL("image/png"));
  const out = resolve(process.cwd(), "public/lab/sidecar", name);
  await writeFile(out, Buffer.from(data.split(",")[1], "base64"));
  console.log(`Wrote ${out}`);
  await context.close();
}
await browser.close();
