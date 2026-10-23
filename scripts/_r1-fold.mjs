// review: above-the-fold + full-page shots and facts for phones/tablets
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, webkit, devices } from "@playwright/test";

const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-phone/fold";
await mkdir(OUT, { recursive: true });
const BASE = "http://localhost:4401";
const DEV = {
  "iphone-se": devices["iPhone SE"],
  "iphone-13": devices["iPhone 13"],
  "iphone-15-pro-max": devices["iPhone 15 Pro Max"],
  "pixel-7": devices["Pixel 7"],
  "iphone-13-land": devices["iPhone 13 landscape"],
  "ipad-mini": devices["iPad Mini"],
  "ipad-mini-land": devices["iPad Mini landscape"],
  "fold-cover": devices["Galaxy Z Fold 6 Cover"],
  "fold-open": devices["Galaxy Z Fold 6"],
};
const only = process.argv[2]?.split(",");
const PAGES = { home: "/", blog: "/blog/", post: "/blog/how-this-room-was-made/", post2: "/blog/weird-use-of-ai-1/", skills: "/skills/", nf: "/nope/" };
const browsers = { webkit: await webkit.launch({ executablePath: process.env.HOME + "/Library/Caches/ms-playwright/webkit-2370/pw_run.sh" }), chromium: await chromium.launch() };
const report = {};
for (const [name, d] of Object.entries(DEV)) {
  if (only && !only.includes(name)) continue;
  const { defaultBrowserType, ...opts } = d;
  const ctx = await browsers[defaultBrowserType].newContext(opts);
  for (const [pn, path] of Object.entries(PAGES)) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    await page.goto(BASE + path, { waitUntil: "networkidle" }).catch((e) => errors.push(String(e)));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, `${name}-${pn}.png`) });
    if (["home", "post", "skills", "blog"].includes(pn)) await page.screenshot({ path: join(OUT, `${name}-${pn}-full.png`), fullPage: true });
    const facts = await page.evaluate(() => {
      const vw = innerWidth, vh = innerHeight;
      const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.05; };
      const desc = (el) => { const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40); return `${el.tagName.toLowerCase()}.${(el.className?.baseVal ?? el.className ?? "").toString().split(" ")[0]?.slice(0, 30)} "${t}"`; };
      const small = [];
      for (const el of document.querySelectorAll("a, button, [role=button], input, summary, [tabindex]")) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) small.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.top + scrollY)}`);
      }
      const tiny = new Map();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode; if (!n.textContent.trim()) continue;
        const el = n.parentElement; if (!vis(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) { const k = `${desc(el)} ${fs.toFixed(1)}px`; tiny.set(k, (tiny.get(k) || 0) + 1); }
      }
      const wide = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed") {
          // ignore if an ancestor clips
          let p = el.parentElement, clipped = false;
          while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o !== "visible") { clipped = true; break; } p = p.parentElement; }
          if (!clipped) wide.push(`${desc(el)} right=${Math.round(r.right)}`);
        }
      }
      const h1 = document.querySelector("h1");
      const dev = document.querySelector("[data-variant]")?.getBoundingClientRect();
      const firstPost = document.querySelector("main ol li a, main ul li a[href*='/blog/']")?.getBoundingClientRect();
      return { vw, vh, scrollW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight, h1: h1 && { text: h1.textContent.trim().slice(0, 40), top: Math.round(h1.getBoundingClientRect().top), fs: getComputedStyle(h1).fontSize }, device: dev && { top: Math.round(dev.top), bottom: Math.round(dev.bottom), w: Math.round(dev.width) }, firstPost: firstPost && { top: Math.round(firstPost.top), bottom: Math.round(firstPost.bottom) }, small: small.slice(0, 40), smallCount: small.length, tiny: [...tiny.entries()].slice(0, 25), wide: wide.slice(0, 15) };
    });
    report[`${name}/${pn}`] = { ...facts, errors };
    await page.close();
  }
  await ctx.close();
}
for (const b of Object.values(browsers)) await b.close();
await writeFile(join(OUT, `report${only ? "-" + only.join("_") : ""}.json`), JSON.stringify(report, null, 1));
for (const [k, r] of Object.entries(report)) console.log(k.padEnd(28), `vw${r.vw} vh${r.vh} sw${r.scrollW}`, r.h1 ? `h1@${r.h1.top}` : "", r.device ? `dev ${r.device.top}-${r.device.bottom}` : "", r.firstPost ? `post1 ${r.firstPost.top}-${r.firstPost.bottom}` : "", `small${r.smallCount}`, `tiny${r.tiny.length}`, `wide${r.wide.length}`, r.errors.length ? `ERR ${r.errors.join(" | ").slice(0, 200)}` : "");
