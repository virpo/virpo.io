import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const browser = await chromium.launch();
for (const [w, h] of [[1280, 800], [1920, 1080], [2560, 1440]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  for (const path of ["/", "/blog/", "/blog/how-this-room-was-made/", "/skills/"]) {
    await p.goto(base + path, { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
    const name = path === "/" ? "home" : path.replace(/\//g, "_");
    await p.screenshot({ path: `${OUT}/w${w}-${name}.png` });
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight }));
    console.log(w, path, JSON.stringify(m));
  }
  await ctx.close();
}
await browser.close();
