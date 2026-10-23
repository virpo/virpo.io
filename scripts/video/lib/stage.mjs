// Deterministic frame capture of the Pocket Room.
//
// The page runs on Playwright's fake clock (timers, Date, rAF, performance.now), and every CSS
// animation and transition is paused and seeked to virtual time before each screenshot. So a
// frame sequence plays back at exactly the rate we capture it, however slow the screenshots are.
//
// The device's own pointer tilt is switched off: shots set --tx/--ty themselves on an eased curve,
// and a drawn pointer stands in for the real one.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

export const BASE = process.env.BASE ?? "http://localhost:4450";
export const FPS = 60;
export const DT = 1000 / FPS;
/** Tokyo 21:05 on a Friday evening: the bezel clock reads "TOKYO 21:05". */
export const TOKYO_2105 = new Date("2026-10-23T12:05:10Z");

const INIT = ({ light, seed }) => {
  // a seeded Math.random, so the timetable and Peter's sips are the same every run
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    if (light) localStorage.setItem("virpo-room-time", light);
  } catch {}
  // the shot drives the tilt itself: keep the device's pointermove handler from seeing the mouse
  window.addEventListener(
    "pointermove",
    (event) => {
      if (window.__blockMove) event.stopImmediatePropagation();
    },
    { capture: true },
  );
  const starts = new WeakMap();
  window.__sync = () => {
    const t = performance.now();
    for (const a of document.getAnimations()) {
      let start = starts.get(a);
      if (start === undefined) {
        start = t;
        starts.set(a, start);
      }
      try {
        a.pause();
        a.currentTime = Math.max(0, t - start);
      } catch {}
    }
  };
  window.__flush = () =>
    new Promise((resolve) => {
      let n = 0;
      const ch = new MessageChannel();
      ch.port1.onmessage = () => (++n < 4 ? ch.port2.postMessage(0) : resolve());
      ch.port2.postMessage(0);
    });
};

const CAPTURE_CSS = `
  [class*="device-module__"][class$="__body"], [class*="device-module__"][class$="__shadow"], [class*="scene-module__"][class$="__outside"] { transition: none !important; }
  html { scrollbar-width: none; } ::-webkit-scrollbar { display: none; }
  #vcursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; pointer-events: none; z-index: 2147483647; transform-origin: 3px 2px; will-change: transform; filter: drop-shadow(0 2px 3px rgba(40,25,10,.35)); }
  #vcursor[hidden] { display: none; }
`;

const CURSOR_SVG = `<svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><path d="M3 2 L3 20.5 L7.6 16.4 L10.9 23.6 L14.3 22.1 L11.1 15 L17.4 15 Z" fill="#1f1a15" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

export async function launch() {
  return chromium.launch({ args: ["--font-render-hinting=none", "--disable-lcd-text", "--force-color-profile=srgb"] });
}

/**
 * Open a page on the fake clock.
 * opts: { browser, path, viewport, dsf, device, light, seed, time, scrollY }
 */
export async function openStage(opts) {
  const { browser, path = "/room/", dsf = 2, device, light = null, seed = 7, time = TOKYO_2105 } = opts;
  const contextOpts = device ? { ...device, deviceScaleFactor: dsf } : { viewport: opts.viewport ?? { width: 1440, height: 900 }, deviceScaleFactor: dsf };
  const context = await browser.newContext({ ...contextOpts, reducedMotion: "no-preference", colorScheme: "light" });
  await context.addInitScript(INIT, { light, seed });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.clock.install({ time });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(() => document.fonts.ready);
  if (opts.scrollY) await page.evaluate((y) => window.scrollTo(0, y), opts.scrollY);
  await settleImages(page);
  await page.waitForTimeout(400);
  // from here on time only moves when we say so
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(Math.max(now + 1000, time.getTime() + 4000)));
  await page.evaluate(() => {
    window.__blockMove = true;
    const cursor = document.createElement("div");
    cursor.id = "vcursor";
    cursor.hidden = true;
    document.body.appendChild(cursor);
  });
  await page.evaluate((svg) => (document.getElementById("vcursor").innerHTML = svg), CURSOR_SVG);
  const stage = new Stage(page, context, errors);
  await stage.sync();
  return stage;
}

/** wait (real time) until every image on screen has loaded and decoded */
export async function settleImages(page, limit = 8000) {
  const t0 = Date.now();
  let last = [];
  while (Date.now() - t0 < limit) {
    const pending = await page.evaluate(() =>
      [...document.images].filter((img) => {
        const r = img.getBoundingClientRect();
        const onScreen = r.bottom > -200 && r.top < innerHeight + 200 && r.width > 0;
        return onScreen && !(img.complete && img.naturalWidth > 0);
      }).map((img) => img.currentSrc || img.src),
    );
    last = pending;
    if (!pending.length) {
      await page.evaluate(() => Promise.all([...document.images].filter((i) => i.complete && i.naturalWidth).map((i) => i.decode().catch(() => null))));
      return;
    }
    await page.waitForTimeout(100);
  }
  console.warn("settleImages: never loaded:", last.join(", "));
}

export class Stage {
  constructor(page, context, errors) {
    this.page = page;
    this.context = context;
    this.errors = errors;
    this.t = 0;
  }

  async settle() {
    await settleImages(this.page);
  }

  /** scroll through the whole page once so lazy images are in, then back to y */
  async preload(y = 0) {
    const h = await this.page.evaluate(() => document.documentElement.scrollHeight);
    for (let top = 0; top < h; top += 600) {
      await this.page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
      await this.page.waitForTimeout(60);
      await this.settle();
    }
    await this.page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), y);
    await this.settle();
  }

  async sync() {
    await this.page.evaluate(async () => {
      await window.__flush();
      window.__sync();
    });
  }

  /** advance virtual time; React gets to commit before animations are seeked */
  async step(ms = DT) {
    await this.page.evaluate(() => window.__sync());
    // the fake clock only takes whole milliseconds: keep the running total exact (16, 17, 17, ...)
    const ticks = Math.round(this.t + ms) - Math.round(this.t);
    if (ticks > 0) await this.page.clock.runFor(ticks);
    this.t += ms;
    await this.sync();
  }

  /** run forward quickly (no frames) until fn() is true in the page, or limit ms */
  async seek(fn, { limit = 60000, every = 100 } = {}) {
    for (let waited = 0; waited < limit; waited += every) {
      if (await this.page.evaluate(fn)) return waited;
      await this.step(every);
    }
    const state = await this.page.evaluate(() => ({ kind: document.querySelector("[data-kind]")?.dataset.kind, paused: document.querySelector("[data-paused]")?.dataset.paused, vis: document.visibilityState, now: performance.now() }));
    throw new Error("seek: condition never met " + JSON.stringify(state));
  }

  async tilt(tx, ty) {
    await this.page.evaluate(
      ([x, y]) => {
        const root = document.querySelector("[data-variant]");
        root?.style.setProperty("--tx", x.toFixed(4));
        root?.style.setProperty("--ty", y.toFixed(4));
      },
      [tx, ty],
    );
  }

  async parallax(px, py) {
    await this.page.evaluate(
      ([x, y]) => {
        const vp = document.querySelector('[class*="scene-module__"][class$="__viewport"]');
        vp?.style.setProperty("--px", x.toFixed(4));
        vp?.style.setProperty("--py", y.toFixed(4));
      },
      [px, py],
    );
  }

  /** the drawn pointer; hover=true also moves the real mouse so things lift */
  async pointer(x, y, { show = true, hover = true, scale = 1 } = {}) {
    await this.page.evaluate(
      ([x, y, show, scale]) => {
        const c = document.getElementById("vcursor");
        c.hidden = !show;
        c.style.transform = `translate(${x - 3}px, ${y - 2}px) scale(${scale})`;
      },
      [x, y, show, scale],
    );
    if (hover) await this.page.mouse.move(x, y);
  }

  async box(selector) {
    return this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, selector);
  }

  /** png stays lossless; jpeg is re-encoded from a lossless grab at q94 with full-resolution colour */
  /** scale: "device", "css", or a number (fraction of device pixels, resampled with Lanczos) */
  async shot(file, clip, type = "jpeg", scale = "device") {
    const buf = await this.page.screenshot({ clip, type: "png", caret: "hide", scale: typeof scale === "number" ? "device" : scale });
    let img = sharp(buf);
    if (typeof scale === "number" && scale < 1) {
      const { width } = await img.metadata();
      img = sharp(buf).resize({ width: Math.round(width * scale), kernel: "lanczos3" });
    }
    if (type === "png") await img.png().toFile(file);
    else await img.jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toFile(file);
  }

  async close() {
    if (this.errors.length) console.warn("page errors:", this.errors.join("\n"));
    await this.context.close();
  }
}

/** capture n frames; before(i, t) sets up each frame */
/**
 * capture n frames; before(i, t) sets up each frame.
 * cropFor(i) may grab only part of the clip for some frames ({x, y, width, height} relative to the
 * clip, in CSS px); meta.json records it so compose.py puts the part back where it belongs.
 */
export async function record(stage, dir, n, { clip, before, type = "jpeg", from = 0, info = {}, probe, scaleFor = () => "device", cropFor = () => null, dt = DT } = {}) {
  await mkdir(dir, { recursive: true });
  const ext = type === "jpeg" ? "jpg" : "png";
  const frames = [];
  const crops = [];
  const view = stage.page.viewportSize();
  const base = clip ?? { x: 0, y: 0, width: view.width, height: view.height };
  for (let i = 0; i < n; i++) {
    if (before) await before(i, i / FPS);
    await stage.sync();
    if (probe) frames.push(await probe(i));
    const crop = cropFor(i);
    crops.push(crop ? [crop.x, crop.y, crop.width, crop.height] : null);
    const grab = crop ? { x: base.x + crop.x, y: base.y + crop.y, width: crop.width, height: crop.height } : clip;
    await stage.shot(join(dir, `f${String(i + from).padStart(4, "0")}.${ext}`), grab, type, scaleFor(i));
    await stage.step(dt);
  }
  const dsf = await stage.page.evaluate(() => devicePixelRatio);
  // css: the clip's size in CSS px, the unit compose.py frames shots in (frames may differ in pixel scale)
  const css = [base.width, base.height];
  await writeFile(join(dir, "meta.json"), JSON.stringify({ dsf, css, fps: 1000 / dt, clip: clip ?? null, ...info, frames, crops }, null, 1));
}

export const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
};
export const clamp01 = (t) => Math.max(0, Math.min(1, t));
export const lerp = (a, b, t) => a + (b - a) * t;
