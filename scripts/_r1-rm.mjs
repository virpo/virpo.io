import { chromium } from "@playwright/test";
const base = "http://localhost:4401";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
await p.mouse.move(200, 200); await p.mouse.move(1200, 700, { steps: 5 }); await p.waitForTimeout(300);
console.log(await p.evaluate(() => {
  const anims = document.getAnimations().map(a => (a.animationName || a.transitionProperty || a.constructor.name) + ":" + (a.effect?.target?.className?.toString().slice(0, 30)) + ":" + a.playState);
  const wrap = document.querySelector("[data-variant=hero]");
  return JSON.stringify({ anims: [...new Set(anims)].slice(0, 30), tx: wrap.style.getPropertyValue("--tx"), bodyTransform: getComputedStyle(wrap.querySelector("[class*=body]")).transform.slice(0, 60), paused: document.querySelector("[data-paused]")?.dataset.paused });
}));
// css transitions durations elsewhere
console.log(await p.evaluate(() => { const c = document.querySelector("a[class*=projectCard] [class*=projectColour]"); const a = document.querySelector("a[class*=projectCard] [class*=projectArt]"); return getComputedStyle(c).transitionDuration + " | " + getComputedStyle(a).transitionDuration + " | scroll-behavior " + getComputedStyle(document.documentElement).scrollBehavior; }));
await p.goto(base + "/blog/how-this-room-was-made/", { waitUntil: "networkidle" }); await p.waitForTimeout(1000);
console.log(await p.evaluate(() => JSON.stringify({ videoAutoplay: document.querySelector("video")?.autoplay, controls: document.querySelector("video")?.controls, dockAnims: document.getAnimations().length, dockTransform: getComputedStyle(document.querySelector("[data-variant=dock] [class*=body]")).transform.slice(0,50) })));
await browser.close();
