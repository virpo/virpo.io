import { chromium } from "@playwright/test";
const base = "http://localhost:4401";
const pages = ["/", "/blog/", "/blog/how-this-room-was-made/", "/skills/"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const path of pages) {
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const res = await p.evaluate(() => {
    const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && (c.length < 4 || c[3] > 0.5)) return c; } return [250, 247, 242]; };
    const out = new Map();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode; if (!t.textContent.trim()) continue;
      const el = t.parentElement; if (el.closest("[aria-hidden=true],script,style,noscript")) continue;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
      const fs = parseFloat(cs.fontSize); const fg = parse(cs.color); const bg = bgOf(el);
      const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const large = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) {
        const key = cs.color + "|" + bg.join(",") + "|" + fs;
        if (!out.has(key)) out.set(key, { ratio: ratio.toFixed(2), fs, color: cs.color, bg: bg.join(","), cls: el.className?.toString().slice(0, 40), text: t.textContent.trim().slice(0, 40) });
      }
    }
    return [...out.values()];
  });
  console.log("==", path); res.forEach((r) => console.log(JSON.stringify(r)));
  await p.close();
}
await browser.close();
