// Screenshot helper for the /room and /sidecar experiments.
// Usage: node scripts/lab-shot.mjs <url> <outDir> [--name home] [--hover "css selector"]... [--wait 2500] [--scroll 0.5]
// Writes desktop (1440x900) and mobile (390x844, touch) viewport + full-page shots,
// one shot per --hover selector (desktop), and console.json with errors/warnings.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "@playwright/test";

const args = process.argv.slice(2);
const [url, outDir] = args;
if (!url || !outDir) {
  console.error('Usage: node scripts/lab-shot.mjs <url> <outDir> [--name n] [--hover "sel"] [--wait ms] [--scroll 0..1]');
  process.exit(1);
}
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const hovers = args.flatMap((value, index) => (args[index - 1] === "--hover" ? [value] : []));
const name = flag("name", "page");
const wait = Number(flag("wait", "2500"));
const scroll = flag("scroll", undefined);

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"] });
const logs = [];

async function shoot(label, contextOptions, { withHovers }) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) logs.push({ label, type: message.type(), text: message.text() });
  });
  page.on("pageerror", (error) => logs.push({ label, type: "pageerror", text: String(error) }));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  if (scroll !== undefined) {
    await page.evaluate((fraction) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * Number(fraction)), scroll);
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: join(outDir, `${name}-${label}.png`) });
  await page.screenshot({ path: join(outDir, `${name}-${label}-full.png`), fullPage: true });
  if (withHovers) {
    for (const [index, selector] of hovers.entries()) {
      const target = page.locator(selector).first();
      try {
        await target.scrollIntoViewIfNeeded({ timeout: 3000 });
        await target.hover({ timeout: 3000, force: true });
        await page.waitForTimeout(700);
        await page.screenshot({ path: join(outDir, `${name}-${label}-hover-${index + 1}.png`) });
      } catch (error) {
        logs.push({ label, type: "hover-failed", text: `${selector}: ${error.message.split("\n")[0]}` });
      }
    }
  }
  await context.close();
}

await shoot("desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, { withHovers: true });
await shoot("mobile", { ...devices["iPhone 13"], defaultBrowserType: undefined }, { withHovers: false });
await browser.close();
await writeFile(join(outDir, `${name}-console.json`), JSON.stringify(logs, null, 2));
console.log(`Saved ${name} shots to ${outDir} (${logs.length} console entries)`);
