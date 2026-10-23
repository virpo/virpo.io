import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const reduced = process.argv[4] === "reduce";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: reduced ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const logs = [];
p.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.type() + ": " + m.text()));
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const state = () => p.evaluate(() => ({ active: document.querySelector("[data-variant=hero] [data-active]")?.getAttribute("data-active") ?? null, label: document.querySelector("[role=status][class*=label]")?.textContent ?? null, devTop: Math.round(document.querySelector("[data-variant=hero]").getBoundingClientRect().top), devBottom: Math.round(document.querySelector("[data-variant=hero]").getBoundingClientRect().bottom) }));
// list items
for (const sel of ["[data-room-target=post-0]", "[data-room-target=bookshelf]"]) {
  const b = await p.locator(sel).first().boundingBox();
  await p.mouse.move(b.x + 20, b.y + b.height / 2, { steps: 3 }); await p.waitForTimeout(400);
  console.log(sel, JSON.stringify(await state()));
}
await p.screenshot({ path: `${OUT}/list-hover-${W}${reduced ? "-rm" : ""}.png` });
await p.mouse.move(5, 5);
const cards = p.locator("a[class*=projectCard]");
const n = await cards.count();
await cards.first().scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
for (let i = 0; i < n; i++) {
  const c = cards.nth(i);
  await c.scrollIntoViewIfNeeded();
  const b = await c.boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + 60, { steps: 3 }); await p.waitForTimeout(500);
  const info = await c.evaluate((el) => ({ t: el.querySelector("[class*=rowTitle]").textContent, target: el.dataset.roomTarget ?? null, colour: getComputedStyle(el.querySelector("[class*=projectColour]")).opacity, ok: [...el.querySelectorAll("img")].every(i => i.complete && i.naturalWidth > 0) }));
  console.log("card", i, JSON.stringify(info), JSON.stringify(await state()));
  if (i === 1) await p.screenshot({ path: `${OUT}/proj-hover-${W}${reduced ? "-rm" : ""}.png` });
}
await p.mouse.move(5, 5);
await p.waitForTimeout(300);
const sec = await p.locator("#projects").boundingBox();
await p.screenshot({ path: `${OUT}/projects-${W}.png`, fullPage: true, clip: { x: 0, y: sec.y - 40 + (await p.evaluate(() => scrollY)), width: W, height: Math.min(sec.height + 80, 3000) } });
console.log("LOGS", logs);
await browser.close();
