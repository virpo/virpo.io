import { chromium } from "@playwright/test";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); // window hit
await p.keyboard.press("Enter"); await p.waitForTimeout(700);
const where = () => p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const top = document.elementFromPoint(x, y); return e.tagName + ":" + (e.dataset.hit ?? e.textContent.trim().slice(0, 20)) + " visible=" + (top === e || e.contains(top)) + " app=" + document.querySelector("section[data-app]")?.dataset.app; });
console.log("after Enter:", await where());
for (let i = 0; i < 17; i++) { await p.keyboard.press("Tab"); await p.waitForTimeout(60); console.log("Tab", i + 1, await where()); }
await p.screenshot({ path: `${OUT}/app-open-tab-hidden.png`, clip: { x: 40, y: 30, width: 780, height: 820 } });
// esc then escape again; screenshot focus ring on cleared hit
await p.keyboard.press("Escape"); await p.waitForTimeout(400);
await p.keyboard.press("Escape"); await p.waitForTimeout(400);
console.log("after 2x esc:", await where());
await p.screenshot({ path: `${OUT}/focus-after-esc.png`, clip: { x: 40, y: 30, width: 780, height: 820 } });
// dpad focus close-up
await p.locator("[data-dir=left]").focus(); await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab"); await p.waitForTimeout(300);
const b = await p.locator("[data-dir=left]").boundingBox();
await p.screenshot({ path: `${OUT}/dpad-focus.png`, clip: { x: b.x - 80, y: b.y - 80, width: 360, height: 220 } });
await browser.close();
