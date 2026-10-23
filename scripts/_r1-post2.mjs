import { chromium } from "@playwright/test";
const base = "http://localhost:4401";
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + "/blog/how-this-room-was-made/", { waitUntil: "networkidle" });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); } });
await p.waitForTimeout(1500);
console.log(await p.evaluate(() => {
  const r = {};
  r.imgs = [...document.querySelectorAll("article img")].filter(i => !i.naturalWidth).map(i => ({ src: i.getAttribute("src"), srcset: i.getAttribute("srcset"), alt: i.alt, html: i.outerHTML.slice(0, 300) }));
  r.video = [...document.querySelectorAll("article video")].map(v => ({ html: v.outerHTML.slice(0, 500), err: v.error?.code, net: v.networkState, figure: v.closest("figure")?.outerHTML.slice(0, 900) }));
  const cap = document.querySelector("article figcaption");
  r.capFont = cap && getComputedStyle(cap).fontFamily; r.capCls = cap?.className;
  const body = document.querySelector("article p"); r.bodyFont = getComputedStyle(body).fontFamily;
  r.main = !!document.querySelector("main");
  r.skip = [...document.querySelectorAll("a")].slice(0, 3).map(a => a.textContent);
  return JSON.stringify(r, null, 1);
}));
await browser.close();
