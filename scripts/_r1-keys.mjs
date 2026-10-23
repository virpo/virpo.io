import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const logs = [];
p.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.type() + ": " + m.text()));
p.on("pageerror", (e) => logs.push("pageerror: " + e));
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const desc = () => p.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const lab = document.querySelector("[role=status][class*=label]")?.textContent;
  return { tag: el.tagName, name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 50), hit: el.dataset?.hit, outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor, shadow: cs.boxShadow.slice(0, 60), clip: cs.clipPath.slice(0, 20), inView: r.top >= 0 && r.bottom <= innerHeight, fv: el.matches(":focus-visible"), lab, rect: [r.x, r.y, r.width, r.height].map(Math.round) };
});
console.log("=== TAB ORDER ===");
for (let i = 0; i < 50; i++) {
  await p.keyboard.press("Tab");
  await p.waitForTimeout(80);
  const d = await desc();
  console.log(i + 1, d.tag, d.hit ?? "", JSON.stringify(d.name), "| outline:", d.outline, "| shadow:", d.shadow, "| clip:", d.clip, d.inView ? "" : "OFFSCREEN", "| label:", d.lab ?? "-");
  if (i === 2) await p.screenshot({ path: `${OUT}/tab-03.png`, clip: { x: 40, y: 30, width: 780, height: 820 } });
  if (i === 17) await p.screenshot({ path: `${OUT}/tab-18.png` });
  if (i === 20) await p.screenshot({ path: `${OUT}/tab-21.png` });
}
await browser.close();
console.log("LOGS", logs);
