// Video #1, the screen recording: a real session on the site, captured frame by frame on the fake
// clock (lib/stage.mjs) with a larger cursor, a ring on every click and the hand over links.
// Three takes, cut where a click would load the next page: <work>/demo-<take>/fNNNN.jpg + meta.json
// (meta.cursor holds the pointer per frame and meta.boxes the places the camera leans into).
// scripts/video/demo-scene.html lays them into a browser window and director.mjs films that.
//
//   node scripts/video/demo.mjs <work dir> [take]      (takes: home, post, projects)
import { join } from "node:path";
import { clamp01, ease, FPS, launch, lerp, openStage, record } from "./lib/stage.mjs";

const work = process.argv[2] ?? "output/lab/video/.demo";
const only = process.argv[3];
const VIEW = { width: 1440, height: 900 };
const DSF = 1.6;
const CURSOR_SCALE = 1.55;

const HAND_SVG = `<svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><path d="M9.2 3.4c0-1 .8-1.7 1.7-1.7s1.7.8 1.7 1.7v6.1l.4-.1c.9-.2 1.8.3 2 1.2l.1.3.4-.1c.9-.2 1.8.3 2 1.2l.1.4.3-.1c.9-.1 1.7.5 1.8 1.4.3 2.4.2 4.4-.5 6.3-.9 2.3-2.9 3.7-5.4 3.7h-1.3c-1.8 0-3.4-.9-4.4-2.4l-3.4-5.2c-.5-.8-.3-1.8.5-2.3.8-.5 1.8-.3 2.3.4l1.7 2.4V3.4z" fill="#fff" stroke="#1f1a15" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const RING_CSS = `#vring { position: fixed; left: 0; top: 0; width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%; border: 2.5px solid #f0722b; background: rgba(240,114,43,.16); pointer-events: none; z-index: 2147483646; opacity: 0; }`;

/**
 * A take: a list of beats on a timeline, played frame by frame.
 *   { at, dur, to }      move the pointer to [x, y] or to the centre of a selector (resolved when the move starts)
 *   { at, click: true }  click where the pointer is, with a ring
 *   { at, dur, scroll }  scroll to y (a number or a function), easing
 * tilt: the device leans towards the pointer, like it does on the site.
 */
async function take(name, { path, scrollY = 0, seed = 7, start, beats, length, boxes = {}, tilt = true, prepare }) {
  if (only && only !== name) return;
  const t0 = Date.now();
  const browser = await launch();
  const st = await openStage({ browser, path, viewport: VIEW, dsf: DSF, seed, scrollY });
  const { page } = st;
  await page.addStyleTag({ content: RING_CSS });
  await page.evaluate(() => {
    const ring = document.createElement("div");
    ring.id = "vring";
    document.body.appendChild(ring);
  });
  if (prepare) await prepare(st);
  const arrow = await page.evaluate(() => document.getElementById("vcursor").innerHTML);

  const resolve = async (to) => {
    if (Array.isArray(to)) return to;
    if (typeof to === "function") return to(st);
    const b = await st.box(to);
    if (!b) throw new Error(`${name}: nothing at ${to}`);
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  const found = {};
  for (const [key, sel] of Object.entries(boxes)) found[key] = await st.box(sel);

  let pos = start;
  let ringAt = -1;
  let ringPos = start;
  const state = beats.map(() => ({ from: null, to: null, done: false }));
  const cursor = [];
  await record(st, join(work, `demo-${name}`), Math.round(length * FPS), {
    dt: 1000 / FPS,
    before: async (i, t) => {
      for (const [k, beat] of beats.entries()) {
        const s = state[k];
        if (t < beat.at || s.done) continue;
        if (beat.click) {
          await page.mouse.click(pos[0], pos[1]);
          ringAt = t;
          ringPos = pos;
          s.done = true;
        } else if (beat.scroll !== undefined) {
          if (s.from === null) {
            s.from = await page.evaluate(() => scrollY);
            s.to = typeof beat.scroll === "function" ? await beat.scroll(st) : beat.scroll;
          }
          const u = clamp01((t - beat.at) / beat.dur);
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), lerp(s.from, s.to, ease.inOutCubic(u)));
          if (u >= 1) s.done = true;
        } else if (beat.to) {
          if (s.from === null) {
            s.from = pos;
            s.to = await resolve(beat.to);
          }
          const u = ease.inOutCubic(clamp01((t - beat.at) / beat.dur));
          // a slight arc, like a hand
          const [x0, y0] = s.from;
          const [x1, y1] = s.to;
          const bend = Math.min(60, Math.hypot(x1 - x0, y1 - y0) * 0.12);
          const nx = -(y1 - y0) / (Math.hypot(x1 - x0, y1 - y0) || 1);
          const ny = (x1 - x0) / (Math.hypot(x1 - x0, y1 - y0) || 1);
          const arc = Math.sin(Math.PI * u) * bend;
          pos = [lerp(x0, x1, u) + nx * arc, lerp(y0, y1, u) + ny * arc];
          if (u >= 1) s.done = true;
        }
      }
      if (tilt) await st.tilt((pos[0] / VIEW.width - 0.5) * 0.7, (pos[1] / VIEW.height - 0.5) * 0.6);
      await st.pointer(pos[0], pos[1], { show: true, hover: true, scale: CURSOR_SCALE });
      // the hand over anything clickable, the arrow elsewhere; the ring grows and fades after a click
      await page.evaluate(
        ([x, y, hand, arrow, age, rx, ry]) => {
          const el = document.elementFromPoint(x, y);
          const c = document.getElementById("vcursor");
          const link = el?.closest("a, button, [data-hit], [role=button], img[data-zoom], .articleMedia img");
          const want = link ? "hand" : "arrow";
          if (c.dataset.kind !== want) {
            c.innerHTML = link ? hand : arrow;
            c.dataset.kind = want;
          }
          const ring = document.getElementById("vring");
          if (age >= 0 && age < 0.5) {
            const k = age / 0.5;
            ring.style.opacity = String(0.95 * (1 - k));
            ring.style.transform = `translate(${rx}px, ${ry}px) scale(${0.5 + k * 1.3})`;
          } else ring.style.opacity = "0";
        },
        [pos[0], pos[1], HAND_SVG, arrow, ringAt < 0 ? -1 : t - ringAt, ringPos[0], ringPos[1]],
      );
      cursor.push([Math.round(pos[0]), Math.round(pos[1])]);
    },
    info: { boxes: found, cursor },
  });
  await st.close();
  await browser.close();
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

const hit = (id) => `[data-hit="${id}"]`;

// 0–8.8 s: the room. Labels lift, the window opens, mini Peter waves, a project, then a post
await take("home", {
  path: "/",
  seed: 41,
  start: [1330, 870],
  length: 8.8,
  boxes: { screen: '[data-variant] [class$="__screen"]', peter: hit("peter"), list: '[class*="room-module__"][class$="__textCol"] a[href^="/blog/how-this-room-was-made"]' },
  beats: [
    { at: 0.0, dur: 0.9, to: hit("arcade") },
    { at: 1.1, dur: 0.5, to: hit("kana") },
    { at: 1.8, dur: 0.5, to: hit("window") },
    { at: 2.4, click: true },
    { at: 2.7, dur: 1.1, to: (st) => st.box("section[data-app]").then((b) => [b.x + b.width * 0.62, b.y + b.height * 0.55]) },
    { at: 4.0, dur: 0.4, to: "[data-app-back]" },
    { at: 4.5, click: true },
    { at: 4.65, dur: 0.55, to: hit("peter") },
    { at: 6.2, dur: 0.5, to: hit("arcade") },
    { at: 6.8, click: true },
    { at: 7.05, dur: 0.5, to: "section[data-app] header a[data-primary]" },
    { at: 7.95, dur: 0.5, to: '[class*="room-module__"][class$="__textCol"] a[href^="/blog/how-this-room-was-made"]' },
    { at: 8.6, click: true },
  ],
});

// 8.8–16.2 s: the post. Mini Peter in the header, down to a picture, the lightbox, the hydrangea
await take("post", {
  path: "/blog/how-this-room-was-made/",
  start: [1090, 120],
  length: 7.4,
  tilt: false,
  boxes: { mark: "[data-mark] a", plant: '[data-toy] [role="img"]' },
  beats: [
    { at: 0.0, dur: 0.6, to: "[data-mark] a" },
    { at: 1.25, dur: 1.4, scroll: (st) => st.page.evaluate(() => document.querySelector('img[src*="concepts-1-3x3"]').getBoundingClientRect().top + scrollY - 140) },
    { at: 1.35, dur: 1.2, to: [720, 430] },
    { at: 2.75, click: true },
    { at: 3.0, dur: 0.45, to: ".lightboxStep[data-dir=next]" },
    { at: 3.5, click: true },
    { at: 4.6, dur: 0.45, to: ".lightboxClose" },
    { at: 5.1, click: true },
    { at: 5.25, dur: 1.3, scroll: (st) => st.page.evaluate(() => document.querySelector('img[src*="gacha-3"]').getBoundingClientRect().top + scrollY - 200) },
    { at: 5.35, dur: 1.2, to: [1080, 640] },
    { at: 6.6, dur: 0.5, to: '[data-toy] [role="img"]' },
  ],
});

// 16.2–20.6 s: the projects, pencil turning to colour, then back up to the room
await take("projects", {
  path: "/",
  seed: 9,
  start: [1240, 700],
  length: 4.4,
  prepare: async (st) => {
    const top = await st.page.evaluate(() => document.querySelector('[class*="projectCard"]').getBoundingClientRect().top + scrollY - 120);
    await st.page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
    await st.step();
    await st.settle();
  },
  tilt: false,
  boxes: {},
  beats: [
    { at: 0.0, dur: 0.6, to: (st) => st.page.$$eval('[class*="projectCard"]', (els) => { const r = els[0].getBoundingClientRect(); return [r.x + r.width * 0.55, r.y + r.height * 0.4]; }) },
    { at: 0.9, dur: 0.6, to: (st) => st.page.$$eval('[class*="projectCard"]', (els) => { const r = els[1].getBoundingClientRect(); return [r.x + r.width * 0.55, r.y + r.height * 0.4]; }) },
    { at: 2.0, dur: 1.2, scroll: 0 },
    { at: 2.1, dur: 1.2, to: [930, 560] },
  ],
});
