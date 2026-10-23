import { chromium } from "@playwright/test";
const base = "http://localhost:4401";
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + "/blog/weird-use-of-ai-3/", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
console.log(await p.locator("aside").ariaSnapshot());
console.log("--- tab order post");
for (let i = 0; i < 8; i++) { await p.keyboard.press("Tab"); console.log(await p.evaluate(() => { const e = document.activeElement; return e.tagName + " " + (e.getAttribute("aria-label") || e.textContent.trim().slice(0, 40)); })); }
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
const snap = await p.locator("#room").ariaSnapshot();
console.log(snap.split("\n").slice(0, 60).join("\n"));
await browser.close();
