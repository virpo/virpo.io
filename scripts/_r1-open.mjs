import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const W = Number(process.argv[2] || 1440);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: W > 2000 ? 1440 : 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const logs = [];
p.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.type() + ": " + m.text()));
p.on("pageerror", (e) => logs.push("pageerror: " + e));
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const box = await p.locator("[data-variant=hero]").boundingBox();
const clip = { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 };
const ids = ["peter","window","mirror","kana","radio","hydrangea","printer","arcade","tv","deck","cork","aiposter"];
for (const id of ids) {
  const pt = await p.evaluate((id) => {
    const el = document.querySelector(`[data-hit="${id}"]`); const r = el.getBoundingClientRect();
    const c = []; for (let gy = 0.05; gy < 1; gy += 0.05) for (let gx = 0.05; gx < 1; gx += 0.05) c.push([gx, gy]);
    c.sort((a, b) => Math.hypot(a[0]-.5, a[1]-.5) - Math.hypot(b[0]-.5, b[1]-.5));
    for (const [gx, gy] of c) { const x = r.left + r.width*gx, y = r.top + r.height*gy; if (document.elementFromPoint(x, y) === el) return { x, y }; }
  }, id);
  await p.mouse.move(pt.x, pt.y, { steps: 3 }); await p.waitForTimeout(200);
  await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(900);
  const s = await p.evaluate(() => {
    const sec = document.querySelector("section[data-app]");
    const body = sec?.querySelector("[data-app-body]");
    const imgs = [...(sec?.querySelectorAll("img") ?? [])].map(i => ({ ok: i.complete && i.naturalWidth > 0, src: i.src.split("/").pop(), alt: i.alt }));
    const over = body ? body.scrollHeight > body.clientHeight + 2 : null;
    const buttons = [...(sec?.querySelectorAll("button,a") ?? [])].map(b => (b.getAttribute("aria-label") || b.textContent).trim().slice(0, 30));
    return { url: location.pathname, app: sec?.dataset.app, title: sec?.querySelector("header p")?.textContent, imgs, over, buttons, focus: document.activeElement.tagName + ":" + (document.activeElement.textContent || "").slice(0, 20) };
  });
  console.log(id, JSON.stringify(s));
  await p.screenshot({ path: `${OUT}/open-${W}-${id}.png`, clip });
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({ app: document.querySelector("section[data-app]")?.dataset.app ?? null, label: document.querySelector("[role=status][class*=label]")?.textContent ?? null, focus: document.activeElement.tagName + ":" + (document.activeElement.dataset.hit ?? "") }));
  console.log("  esc ->", JSON.stringify(after));
}
console.log("LOGS", logs);
await browser.close();
