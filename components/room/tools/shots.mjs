// Screenshots of the Pocket Room art where it shows: every app card, Peter waving in the room,
// the About screen and the end of a post. Also prints the displayed CSS size of each card image,
// which is what the card art is sized against (ship about 2x the largest).
// Usage: node components/room/tools/shots.mjs [baseUrl] [outDir] [prefix]
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const [base = "http://localhost:4420", out = "output/lab/room-art", prefix = "after"] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const sizes = {};
const CARDS = ["arcade", "tv", "printer", "deck", "cork", "aiposter", "peter"];

for (const [w, h, dpr] of [
  [1440, 900, 2],
  [2560, 1440, 1],
]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  await p.goto(`${base}/room/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const device = await p.locator("[data-variant=hero]").first().boundingBox();
  const clip = { x: Math.max(0, device.x - 20), y: Math.max(0, device.y - 20), width: device.width + 40, height: device.height + 40 };
  if (w === 1440) {
    const peter = await p.locator('[data-hit="peter"]').first().boundingBox();
    await p.mouse.move(peter.x + peter.width / 2, peter.y + peter.height / 2, { steps: 4 });
    await p.waitForTimeout(700);
    await p.screenshot({ type: "jpeg", quality: 90, path: join(out, `${prefix}-room-wave.jpg`), clip });
    await p.screenshot({ type: "jpeg", quality: 90, path: join(out, `${prefix}-room-wave-zoom.jpg`), clip: { x: peter.x - 60, y: peter.y - 40, width: peter.width + 120, height: peter.height + 80 } });
    await p.mouse.move(5, 5);
    await p.waitForTimeout(300);
  }
  for (const id of CARDS) {
    await p.locator(`[data-hit="${id}"]`).first().click();
    await p.waitForTimeout(900);
    const img = p.locator("[class*=projectArt] img").first();
    const b = await img.boundingBox();
    const natural = await img.evaluate((el) => [el.naturalWidth, el.naturalHeight, el.getAttribute("src")]);
    sizes[`${w}:${id}`] = { css: b ? [Math.round(b.width), Math.round(b.height)] : null, natural };
    await p.screenshot({ type: "jpeg", quality: 90, path: join(out, `${prefix}-${w}-card-${id}.jpg`), clip });
    if (b && w === 1440) await p.screenshot({ type: "jpeg", quality: 90, path: join(out, `${prefix}-${w}-card-${id}-zoom.jpg`), clip: { x: b.x - 30, y: b.y - 30, width: b.width + 60, height: b.height + 60 } });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(500);
  }
  if (w === 1440) {
    const post = await ctx.newPage();
    await post.goto(`${base}/room/blog/weird-use-of-ai-1/`, { waitUntil: "networkidle" });
    await post.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await post.waitForTimeout(1800);
    await post.screenshot({ type: "jpeg", quality: 90, path: join(out, `${prefix}-post-end.jpg`) });
    const dock = await post.locator("[data-variant=dock]").first().boundingBox();
    if (dock) await post.screenshot({ type: "jpeg", quality: 90, path: join(out, `${prefix}-post-end-dock.jpg`), clip: { x: dock.x - 10, y: dock.y - 10, width: dock.width + 20, height: dock.height + 20 } });
  }
  await ctx.close();
}
await writeFile(join(out, `${prefix}-sizes.json`), JSON.stringify(sizes, null, 2));
console.log(JSON.stringify(sizes, null, 1));
await browser.close();
