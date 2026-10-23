// Close-ups of the Pocket Room controls and left side at five pointer tilts.
// Usage: node scripts/room-3d-shots.mjs <baseUrl> <outDir> <prefix> [browser]
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, webkit } from "@playwright/test";

const [base = "http://localhost:4410", out = "output/lab/3d-controls", prefix = "shot", engine = "chromium"] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const browser = await (engine === "webkit" ? webkit : chromium).launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(`${base}/room/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const W = 1440;
const H = 900;
const tilts = { centre: [W / 2, H / 2], left: [1, H / 2], right: [W - 1, H / 2], top: [W / 2, 1], bottom: [W / 2, H - 1] };

const boxOf = (selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, selector);

const wrap = await boxOf("[data-variant=hero]");
const pad = (b, px, py = px) => ({ x: Math.max(0, b.x - px), y: Math.max(0, b.y - py), width: b.width + px * 2, height: b.height + py * 2 });

for (const [name, [x, y]] of Object.entries(tilts)) {
  await page.mouse.move(x, y, { steps: 6 });
  await page.waitForTimeout(1400);
  const controls = await boxOf("[class*=controls]");
  const side = await boxOf("[class*=side]");
  await page.screenshot({ path: join(out, `${prefix}-${name}-device.png`), clip: pad(wrap, 20) });
  await page.screenshot({ path: join(out, `${prefix}-${name}-controls.png`), clip: pad(controls, 40, 30) });
  if (side) await page.screenshot({ path: join(out, `${prefix}-${name}-side.png`), clip: pad(side, 60, 40) });
}

// press states at an angle: pointer far left tilts the device, then hold a key and turn the knob
if (process.env.PRESS) {
  await page.mouse.move(1, H - 1, { steps: 4 });
  await page.waitForTimeout(1400);
  const controls = await boxOf("[class*=controls]");
  await page.evaluate(() => {
    document.querySelector("[data-dir=right]")?.setAttribute("data-pressed", "true");
    document.querySelector("[aria-label^='Open the selected']")?.setAttribute("data-pressed", "true");
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${prefix}-press-keys.png`), clip: pad(controls, 40, 30) });
  await page.evaluate(() => {
    document.querySelector("[data-dir=right]")?.removeAttribute("data-pressed");
    document.querySelector("[aria-label^='Open the selected']")?.removeAttribute("data-pressed");
  });
  // turn the knob three notches with the wheel
  const knob = await boxOf("[class*=knob]");
  await page.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2);
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 60);
    await page.waitForTimeout(250);
  }
  await page.mouse.move(1, H - 1);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(out, `${prefix}-press-knob.png`), clip: pad(controls, 40, 30) });
  const side = await boxOf("[class*=side]");
  await page.evaluate(() => document.querySelector("[class*=sideButton]")?.setAttribute("data-pressed", "true"));
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${prefix}-press-side.png`), clip: pad(side, 60, 40) });
}

console.log(errors.length ? errors.join("\n") : "no errors");
await browser.close();
