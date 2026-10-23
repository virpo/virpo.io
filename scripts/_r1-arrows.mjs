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
const st = () => p.evaluate(() => ({
  url: location.pathname + location.hash,
  label: document.querySelector("[role=status][class*=label]")?.textContent ?? null,
  app: document.querySelector("section[data-app]")?.getAttribute("data-app") ?? null,
  appTitle: document.querySelector("section[data-app] header p")?.textContent ?? null,
  active: document.activeElement?.tagName + ":" + (document.activeElement?.dataset?.hit ?? document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.slice(0, 20)),
  live: document.querySelector("[aria-live]")?.textContent,
}));
console.log("== ArrowRight x17 from body");
for (let i = 0; i < 17; i++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(120); const s = await st(); console.log(i + 1, s.label, "| focus", s.active); }
console.log("== ArrowLeft x2"); for (let i = 0; i < 2; i++) { await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(120); console.log((await st()).label); }
// select Fig 06 window: press right until label Fig. 06
await p.keyboard.press("Escape"); await p.waitForTimeout(200);
console.log("after esc", await st());
for (let i = 0; i < 6; i++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(100); }
console.log("selected", (await st()).label);
await p.keyboard.press("Enter"); await p.waitForTimeout(700);
console.log("after Enter", await st());
await p.screenshot({ path: `${OUT}/app-window-enter.png`, clip: { x: 40, y: 30, width: 780, height: 820 } });
console.log("== ArrowRight in app x12");
for (let i = 0; i < 12; i++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500); const s = await st(); console.log(i + 1, s.app, "|", s.appTitle, "| focus", s.active); }
console.log("== Tab inside app");
for (let i = 0; i < 6; i++) { await p.keyboard.press("Tab"); await p.waitForTimeout(100); const s = await st(); console.log("tab", i + 1, s.active, s.app); }
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
console.log("after Esc", await st());
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
console.log("after Esc2", await st());
// Post: ArrowRight to Fig. 02 then Enter -> navigates?
await p.evaluate(() => document.activeElement.blur());
for (let i = 0; i < 2; i++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(100); }
console.log("before enter post", await st());
await p.keyboard.press("Enter"); await p.waitForTimeout(1500);
console.log("after Enter on post", await st());
await p.goBack(); await p.waitForTimeout(1500);
console.log("back", await st());
console.log("LOGS", logs);
await browser.close();
