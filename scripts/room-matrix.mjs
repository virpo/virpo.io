// Above-the-fold shots of a page across screens. Usage: node scripts/room-matrix.mjs <url> <outDir>
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "@playwright/test";

const [url = "http://localhost:4401/room/", out = "output/lab/matrix"] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const screens = {
  "2560x1440": { viewport: { width: 2560, height: 1440 } },
  "1920x1080": { viewport: { width: 1920, height: 1080 } },
  "1440x900": { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  "1280x720": { viewport: { width: 1280, height: 720 } },
  "ipad-landscape": devices["iPad (gen 7) landscape"],
  "ipad-portrait": devices["iPad (gen 7)"],
  "ipad-air-portrait": { ...devices["iPad (gen 7)"], viewport: { width: 820, height: 1180 } },
  "iphone-13": devices["iPhone 13"],
  "iphone-se": devices["iPhone SE"],
  "iphone-pro-max": devices["iPhone 14 Pro Max"],
  "iphone-13-landscape": devices["iPhone 13 landscape"],
};
const browser = await chromium.launch();
const report = [];
for (const [name, options] of Object.entries(screens)) {
  const { defaultBrowserType, ...rest } = options;
  const context = await browser.newContext(rest);
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(out, `${name}.png`) });
  const facts = await page.evaluate(() => {
    const vh = innerHeight;
    const posts = [...document.querySelectorAll("ol li a")].map((a) => Math.round(a.getBoundingClientRect().bottom));
    const device = document.querySelector("[data-variant=hero]")?.getBoundingClientRect();
    return { vh, overflowX: document.documentElement.scrollWidth - innerWidth, postsBottom: posts, deviceBottom: device && Math.round(device.bottom) };
  });
  report.push({ name, ...facts, errors });
  await context.close();
}
await browser.close();
await writeFile(join(out, "report.json"), JSON.stringify(report, null, 1));
for (const r of report) console.log(r.name.padEnd(22), `vh ${r.vh}`, `device→${r.deviceBottom}`, `posts→${r.postsBottom.join(",")}`, r.overflowX ? `OVERFLOW ${r.overflowX}` : "", r.errors.length ? `ERR ${r.errors[0]}` : "");
