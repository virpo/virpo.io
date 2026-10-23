import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const W = Number(process.argv[2] || 1440);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
const p = await ctx.newPage();
const logs = [];
p.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.type() + ": " + m.text()));
p.on("pageerror", (e) => logs.push("pageerror: " + e));
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.screenshot({ path: `${OUT}/home-${W}.png` });
await p.screenshot({ path: `${OUT}/home-${W}-full.png`, fullPage: true });
const wrap = p.locator("[data-variant=hero]").first();
const box = await wrap.boundingBox();
console.log("device box", box);
const clip = { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: Math.min(W, box.width + 40), height: box.height + 40 };
const ids = await p.locator("[data-hit]").evaluateAll((els) => els.map((e) => e.getAttribute("data-hit")));
for (const id of ids) {
  const hit = p.locator(`[data-hit="${id}"]`).first();
  const b = await hit.boundingBox();
  // find a point inside the clip-path polygon: use elementFromPoint search
  const pt = await p.evaluate((id) => {
    const el = document.querySelector(`[data-hit="${id}"]`);
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 400; i++) {
      const gx = (i % 20) / 20 + 0.025, gy = Math.floor(i / 20) / 20 + 0.025;
      // spiral from center
    }
    const cands = [];
    for (let gy = 0.05; gy < 1; gy += 0.05) for (let gx = 0.05; gx < 1; gx += 0.05) cands.push([gx, gy]);
    cands.sort((a, b) => Math.hypot(a[0] - 0.5, a[1] - 0.5) - Math.hypot(b[0] - 0.5, b[1] - 0.5));
    for (const [gx, gy] of cands) {
      const x = r.left + r.width * gx, y = r.top + r.height * gy;
      if (document.elementFromPoint(x, y) === el) return { x, y, gx, gy };
    }
    return null;
  }, id);
  if (!pt) { console.log("NO HOVERABLE POINT", id, b); continue; }
  await p.mouse.move(pt.x, pt.y, { steps: 3 });
  await p.waitForTimeout(400);
  const lab = await p.evaluate(() => {
    const l = document.querySelector("[role=status][class*=label]");
    const v = document.querySelector("[data-variant=hero] [data-active]");
    let r = l?.getBoundingClientRect();
    const scr = document.querySelector("[class*=screen]").getBoundingClientRect();
    return { text: l?.textContent, active: v?.getAttribute("data-active"), lbox: r && [r.left, r.top, r.right, r.bottom].map(Math.round), screen: [scr.left, scr.top, scr.right, scr.bottom].map(Math.round), lit: [...document.querySelectorAll("[data-room-lit]")].map(e => e.textContent.slice(0, 30)) };
  });
  const out = lab.lbox && (lab.lbox[0] < lab.screen[0] - 1 || lab.lbox[2] > lab.screen[2] + 1 || lab.lbox[1] < lab.screen[1] - 1 || lab.lbox[3] > lab.screen[3] + 1);
  console.log(id, "pt", pt.gx.toFixed(2), pt.gy.toFixed(2), "|", lab.text, "| active:", lab.active, out ? "LABEL OUTSIDE SCREEN " + JSON.stringify(lab) : "", "| lit:", lab.lit.join(";"));
  if (W === 1440) await p.screenshot({ path: `${OUT}/hover-${W}-${id}.png`, clip });
}
await p.mouse.move(5, 5);
console.log("LOGS", logs);
await browser.close();
