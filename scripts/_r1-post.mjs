import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const browser = await chromium.launch();
for (const w of [1280, 1440, 1920, 2560]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 2000 ? 1440 : 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/blog/how-this-room-was-made/", { waitUntil: "networkidle" });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, 0); });
  await p.waitForTimeout(800);
  const imgs = await p.evaluate(() => [...document.querySelectorAll("article img")].map((i) => { const r = i.getBoundingClientRect(); return { src: i.currentSrc.split("/").pop(), nat: [i.naturalWidth, i.naturalHeight], shown: [Math.round(r.width), Math.round(r.height)], scale: (r.width / i.naturalWidth).toFixed(2), ok: i.naturalWidth > 0, zoom: !!i.closest("a,button") }; }));
  const col = await p.evaluate(() => { const b = document.querySelector("article [class*=body]") || document.querySelector("article"); return Math.round(b.getBoundingClientRect().width); });
  console.log("==", w, "article body width", col);
  imgs.forEach((i) => console.log(JSON.stringify(i)));
  if (w === 1440 || w === 2560) for (const name of ["five-ways", "manga-scale", "shapes"]) {
    const loc = p.locator(`article img[src*="${name}"]`).first();
    await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const fig = loc.locator("xpath=ancestor::figure[1]");
    const target = (await fig.count()) ? fig : loc;
    await target.screenshot({ path: `${OUT}/post-${w}-${name}.png` });
  }
  if (w === 1440) {
    const v = p.locator("article video").first();
    if (await v.count()) { await v.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); const fig = v.locator("xpath=ancestor::figure[1]"); await ((await fig.count()) ? fig : v).screenshot({ path: `${OUT}/post-1440-video.png` }); }
    await p.screenshot({ path: `${OUT}/post-1440-full.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
