// Close-up audit shots of the Pocket Room device. Usage: node scripts/room-audit.mjs <baseUrl> <outDir>
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "@playwright/test";

const [base = "http://localhost:4401", out = "output/lab/audit"] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const logs = [];
const watch = (page, label) => {
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push({ label, type: m.type(), text: m.text() }));
  page.on("pageerror", (e) => logs.push({ label, type: "pageerror", text: String(e) }));
};

const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await desk.newPage();
watch(p, "desktop");
await p.goto(`${base}/room/`, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
const wrap = p.locator("[data-variant=hero]").first();
const box = await wrap.boundingBox();
const clip = { x: Math.max(0, box.x - 30), y: Math.max(0, box.y - 20), width: box.width + 60, height: box.height + 40 };
await p.screenshot({ path: join(out, "d-01-page.png") });
await p.screenshot({ path: join(out, "d-02-device.png"), clip });
// controls close-up
const controls = await p.locator("[class*=controls]").first().boundingBox();
await p.screenshot({ path: join(out, "d-03-controls.png"), clip: { x: controls.x - 80, y: controls.y - 30, width: controls.width + 120, height: controls.height + 120 } });
// hover a few objects
const hits = await p.locator("[data-hit]").evaluateAll((els) => els.map((e) => e.getAttribute("data-hit")));
await writeFile(join(out, "hits.json"), JSON.stringify(hits));
for (const id of hits) {
  const hit = p.locator(`[data-hit="${id}"]`).first();
  const b = await hit.boundingBox();
  if (!b) continue;
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await p.waitForTimeout(450);
  await p.screenshot({ path: join(out, `h-${id}.png`), clip });
}
await p.mouse.move(5, 5);
// pressed d-pad
const right = p.locator("[data-dir=right]").first();
const rb = await right.boundingBox();
await p.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2);
await p.mouse.down();
await p.waitForTimeout(120);
await p.screenshot({ path: join(out, "d-04-press.png"), clip: { x: controls.x - 80, y: controls.y - 30, width: controls.width + 120, height: controls.height + 120 } });
await p.mouse.up();
await p.waitForTimeout(300);
await p.screenshot({ path: join(out, "d-05-dpad-selected.png"), clip });
// open window app
await p.locator('[data-hit="window"]').first().click().catch(() => {});
await p.waitForTimeout(800);
await p.screenshot({ path: join(out, "d-06-app.png"), clip });
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
// night
await p.locator("[class*=sideButton]").first().click();
for (let i = 0; i < 3; i++) await p.locator("[class*=sideButton]").first().click();
await p.waitForTimeout(600);
await p.screenshot({ path: join(out, "d-07-night.png"), clip });

const post = await desk.newPage();
watch(post, "post");
await post.goto(`${base}/room/blog/weird-use-of-ai-1/`, { waitUntil: "networkidle" });
await post.waitForTimeout(1500);
await post.screenshot({ path: join(out, "p-01-post.png") });
const dock = await post.locator("[data-variant=dock]").first().boundingBox();
if (dock) await post.screenshot({ path: join(out, "p-02-dock.png"), clip: { x: dock.x - 20, y: dock.y - 20, width: dock.width + 40, height: dock.height + 40 } });

const phone = await browser.newContext({ ...devices["iPhone 13"] });
const m = await phone.newPage();
watch(m, "phone");
await m.goto(`${base}/room/`, { waitUntil: "networkidle" });
await m.waitForTimeout(2000);
await m.screenshot({ path: join(out, "m-01-landing.png") });
const sw = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth);
logs.push({ label: "phone", type: "info", text: `horizontal overflow ${sw}px` });
const mp = await phone.newPage();
watch(mp, "phone-post");
await mp.goto(`${base}/room/blog/weird-use-of-ai-1/`, { waitUntil: "networkidle" });
await mp.waitForTimeout(1500);
await mp.screenshot({ path: join(out, "m-02-post.png") });

await browser.close();
await writeFile(join(out, "console.json"), JSON.stringify(logs, null, 2));
console.log(JSON.stringify(logs, null, 1));
