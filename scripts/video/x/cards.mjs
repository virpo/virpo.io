// Renders the on-screen text and graphics for the X cuts as transparent PNGs, in the site's fonts.
// Input: a JSON list of { file, w, h, html } (html is the inner markup; classes below are available).
//
//   node scripts/video/x/cards.mjs <cards.json> <out dir>
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const [list, out] = process.argv.slice(2);
const cards = JSON.parse(await readFile(list, "utf8"));
await mkdir(out, { recursive: true });
const CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap");
  html, body { margin: 0; background: transparent; }
  .box { position: absolute; inset: 0; display: grid; }
  .sans { font-family: Figtree, system-ui, sans-serif; letter-spacing: -0.03em; }
  .mono { font-family: "JetBrains Mono", ui-monospace, monospace; letter-spacing: 0.06em; text-transform: uppercase; }
  .ink { color: #1d1a17; } .paper { color: #faf7f2; } .orange { color: #e8621c; } .grey { color: #6f6860; }
  .pill { display: inline-block; padding: .28em .62em .32em; border-radius: .5em; background: #1d1a17; color: #faf7f2; }
  .pill.o { background: #e8621c; color: #fff; } .pill.w { background: #fffdf8; color: #1d1a17; box-shadow: 0 0 0 1px rgba(60,40,20,.1), 0 10px 30px -12px rgba(60,40,20,.45); }
  .shadow { text-shadow: 0 2px 18px rgba(30,20,10,.35); }
`;
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const c of cards) {
  await page.setViewportSize({ width: c.w, height: c.h });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="box">${c.html}</div>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, c.file), omitBackground: true });
}
await browser.close();
console.log(`${cards.length} cards in ${out}`);
