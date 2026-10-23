import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const OUT = "/private/tmp/claude-501/-Users-hraska-Code-virpo-io/4985d3de-31f6-46c1-8d68-678df9bc62cc/scratchpad/review1-desk";
const base = "http://localhost:4401";
const pages = ["/", "/blog/", "/blog/how-this-room-was-made/", "/blog/weird-use-of-ai-3/", "/blog/weird-use-of-ai-1/", "/blog/a-different-kind-of-hackathon/", "/skills/", "/levels/", "/projects/", "/v2/", "/nope/"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const report = {};
const allLinks = new Set();
const failedReq = [];
for (const path of pages) {
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.type() + ": " + m.text()));
  p.on("pageerror", (e) => logs.push("pageerror: " + e));
  p.on("requestfailed", (r) => failedReq.push(path + " FAILED " + r.url() + " " + r.failure()?.errorText));
  p.on("response", (r) => r.status() >= 400 && failedReq.push(path + " " + r.status() + " " + r.url()));
  const resp = await p.goto(base + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  // scroll to bottom to trigger lazy images
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
  await p.waitForTimeout(1200);
  const info = await p.evaluate(() => {
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => h.tagName + ": " + h.textContent.trim().slice(0, 70));
    const imgs = [...document.querySelectorAll("img")].map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute("alt"), ok: i.complete && i.naturalWidth > 0, hiddenAria: !!i.closest("[aria-hidden=true]"), w: i.getBoundingClientRect().width }));
    const links = [...document.querySelectorAll("a[href]")].map((a) => a.href);
    const noName = [...document.querySelectorAll("a,button")].filter((el) => !el.closest("[aria-hidden=true]") && !(el.getAttribute("aria-label") || el.textContent.trim() || el.querySelector("img[alt]:not([alt=''])") || el.getAttribute("title"))).map((el) => el.outerHTML.slice(0, 160));
    return { title: document.title, lang: document.documentElement.lang, headings, imgs, links, noName, url: location.href, h1count: document.querySelectorAll("h1").length, landmarks: [...document.querySelectorAll("main,nav,header,footer")].map(e=>e.tagName) };
  });
  info.links.forEach((l) => allLinks.add(l));
  report[path] = { status: resp?.status(), logs, ...info, imgs: info.imgs.filter((i) => !i.ok || (i.alt === null)).concat([{ count: info.imgs.length, emptyAlt: info.imgs.filter(i=>i.alt==="" && !i.hiddenAria).length }]), links: info.links.length };
  await p.close();
}
const linkStatus = [];
for (const l of allLinks) {
  const u = new URL(l);
  if (u.origin !== base) { linkStatus.push({ l, ext: true }); continue; }
  const r = await fetch(u.origin + u.pathname, { redirect: "manual" });
  linkStatus.push({ l, status: r.status, loc: r.headers.get("location") });
}
writeFileSync(OUT + "/crawl.json", JSON.stringify({ report, failedReq, linkStatus }, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 20000));
console.log("FAILED", failedReq);
console.log("BAD LINKS", linkStatus.filter((x) => !x.ext && x.status !== 200));
console.log("EXT", [...new Set(linkStatus.filter((x) => x.ext).map((x) => x.l))]);
await browser.close();
