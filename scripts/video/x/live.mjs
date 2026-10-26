// Live clips of the real site for the X cuts, captured frame by frame on the fake clock at exactly
// the output size. The camera moves inside the page (a transform on <body>), so every close-up is
// drawn sharp instead of enlarged. A larger cursor, the hand over links, a ring on each click.
// Each clip lands in <work>/<name>/fNNNN.jpg.
//
//   node scripts/video/x/live.mjs <work dir> [clip ...]
import { join } from "node:path";
import { clamp01, ease, launch, lerp, openStage, record } from "../lib/stage.mjs";

const work = process.argv[2] ?? "output/lab/video/.x";
const only = process.argv.slice(3);
const FPS = 30;
const VIEW = { width: 1440, height: 900 };
const SIZES = { "4x5": [1080, 1350], "1x1": [1080, 1080], "9x16": [1080, 1920], "16x9": [1920, 1080], "16x10-4k": [3840, 2400] };
const HAND = `<svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><path d="M9.2 3.4c0-1 .8-1.7 1.7-1.7s1.7.8 1.7 1.7v6.1l.4-.1c.9-.2 1.8.3 2 1.2l.1.3.4-.1c.9-.2 1.8.3 2 1.2l.1.4.3-.1c.9-.1 1.7.5 1.8 1.4.3 2.4.2 4.4-.5 6.3-.9 2.3-2.9 3.7-5.4 3.7h-1.3c-1.8 0-3.4-.9-4.4-2.4l-3.4-5.2c-.5-.8-.3-1.8.5-2.3.8-.5 1.8-.3 2.3.4l1.7 2.4V3.4z" fill="#fff" stroke="#1f1a15" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const ARROW = `<svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg"><path d="M3 2 L3 20.5 L7.6 16.4 L10.9 23.6 L14.3 22.1 L11.1 15 L17.4 15 Z" fill="#1f1a15" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const CSS = `
  #xcur { position: fixed; left: 0; top: 0; width: 26px; height: 26px; pointer-events: none; z-index: 2147483647; transform-origin: 3px 2px; filter: drop-shadow(0 2px 3px rgba(40,25,10,.35)); }
  #xring { position: fixed; left: 0; top: 0; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; border: 3px solid #f0722b; background: rgba(240,114,43,.16); pointer-events: none; z-index: 2147483646; opacity: 0; }
  body { transform-origin: 0 0; }
`;

/**
 * A clip: aspect, length, where its frame sits in the viewport (frame: css box, any size with the
 * aspect's ratio), a camera ([t, focus, zoom] keys, focus a selector or [x, y] in page px), and
 * beats for the pointer ({ at, dur, to } moves, { at, click }, { at, key }, { at, wheel }).
 */
async function clip(name, o) {
  if (only.length && !only.includes(name)) return;
  const t0 = Date.now();
  const FPS = o.fps ?? 30;
  const [W, H] = SIZES[o.aspect];
  const browser = await launch();
  const st = await openStage({ browser, path: o.path ?? "/", viewport: VIEW, dsf: W / o.frame.width, seed: o.seed ?? 41 });
  const { page } = st;
  await page.addStyleTag({ content: CSS });
  await page.evaluate(([arrow]) => {
    for (const id of ["xcur", "xring"]) {
      const el = document.createElement("div");
      el.id = id;
      document.documentElement.appendChild(el);
    }
    document.getElementById("xcur").innerHTML = arrow;
    document.getElementById("vcursor")?.remove();
  }, [ARROW]);
  if (o.prepare) await o.prepare(st);

  // a point in page px; boxes measured while the camera is on are mapped back through it
  let live = null;
  const at = async (to) => {
    if (Array.isArray(to)) return to;
    const b = await st.box(to);
    if (!b) throw new Error(`${name}: nothing at ${to}`);
    const p = [b.x + b.width / 2, b.y + b.height / 2];
    if (!live) return p;
    const [f, z] = live;
    return [(p[0] - C[0]) / z + f[0], (p[1] - C[1]) / z + f[1]];
  };
  const C = [o.frame.x + o.frame.width / 2, o.frame.y + o.frame.height / 2];
  const keys = [];
  for (const [t, focus, z] of o.camera) keys.push([t, await at(focus), z]);
  const cam = (t) => {
    if (t <= keys[0][0]) return keys[0];
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, fa, za] = keys[i];
      const [tb, fb, zb] = keys[i + 1];
      if (t <= tb) {
        const u = ease.inOutCubic(clamp01((t - ta) / (tb - ta)));
        return [t, [lerp(fa[0], fb[0], u), lerp(fa[1], fb[1], u)], lerp(za, zb, u)];
      }
    }
    return keys[keys.length - 1];
  };
  const toScreen = ([x, y], f, z) => [C[0] + (x - f[0]) * z, C[1] + (y - f[1]) * z];

  const beats = o.beats ?? [];
  const state = beats.map(() => ({}));
  let pos = o.start ?? [C[0] + 400, C[1] + 300];
  let ring = { t: -9, at: pos };
  await record(st, join(work, name), Math.round(o.length * FPS), {
    dt: 1000 / FPS,
    clip: o.frame,
    before: async (i, _t) => {
      const t = i / FPS;
      const [, f, z] = cam(t);
      await page.evaluate(([tx, ty, z]) => (document.body.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`), [C[0] - f[0] * z, C[1] - f[1] * z, z]);
      live = [f, z];
      if (o.each) await o.each(st, t);
      if (o.tilt) {
        const [tx, ty] = o.tilt(t, pos);
        await st.tilt(tx, ty);
      }
      for (const [k, b] of beats.entries()) {
        const s = state[k];
        if (t < b.at || s.done) continue;
        if (b.to) {
          if (!s.from) {
            s.from = pos;
            s.to = await at(b.to);
          }
          const u = ease.inOutCubic(clamp01((t - b.at) / b.dur));
          const [x0, y0] = s.from;
          const [x1, y1] = s.to;
          const len = Math.hypot(x1 - x0, y1 - y0) || 1;
          const arc = Math.sin(Math.PI * u) * Math.min(40, len * 0.12);
          pos = [lerp(x0, x1, u) - ((y1 - y0) / len) * arc, lerp(y0, y1, u) + ((x1 - x0) / len) * arc];
          if (u >= 1) s.done = true;
        } else {
          const m = toScreen(pos, f, z);
          if (b.click) await page.mouse.click(m[0], m[1]);
          if (b.wheel) await page.mouse.wheel(0, b.wheel);
          if (b.run) await b.run(st);
          if (b.click) ring = { t, at: pos };
          s.done = true;
        }
      }
      const m = toScreen(pos, f, z);
      if (o.cursor !== false) await page.mouse.move(m[0], m[1]);
      const r = toScreen(ring.at, f, z);
      await page.evaluate(
        ([x, y, show, hand, arrow, age, rx, ry]) => {
          const c = document.getElementById("xcur");
          c.style.display = show ? "block" : "none";
          c.style.transform = `translate(${x - 3}px, ${y - 2}px) scale(1.5)`;
          const link = document.elementFromPoint(x, y)?.closest("a, button, [data-hit]");
          const want = link ? "hand" : "arrow";
          if (c.dataset.k !== want) {
            c.innerHTML = link ? hand : arrow;
            c.dataset.k = want;
          }
          const el = document.getElementById("xring");
          if (age < 0.5) {
            el.style.opacity = String(0.95 * (1 - age / 0.5));
            el.style.transform = `translate(${rx}px, ${ry}px) scale(${0.5 + (age / 0.5) * 1.3})`;
          } else el.style.opacity = "0";
        },
        [m[0], m[1], o.cursor !== false && (!o.cursorFrom || t >= o.cursorFrom), HAND, ARROW, t - ring.t, r[0], r[1]],
      );
    },
  });
  await st.close();
  await browser.close();
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

const hit = (id) => `[data-hit="${id}"]`;
const dev = "[data-variant=hero]";
const body = '[class*="device-module__"][class$="__body"]';
const noText = (st) => st.page.addStyleTag({ content: '[class*="room-module__"][class$="__textCol"], [class*="room-module__"][class$="__deviceHint"] { visibility: hidden !important; }' });
const lean = (k = 0.6) => (t, p) => [(p[0] / VIEW.width - 0.5) * k, (p[1] / VIEW.height - 0.5) * k * 0.8];
const sway = (a = 0.25, b = 0.1, base = [0, 0]) => (t) => [base[0] + Math.sin((t / 4) * Math.PI * 2) * a, base[1] + Math.cos((t / 4) * Math.PI * 2) * b];
const frame45 = { x: 360, y: 0, width: 720, height: 900 };
const frame11 = { x: 270, y: 0, width: 900, height: 900 };
const frame916 = { x: 467, y: 0, width: 506, height: 900 };
const frame169 = { x: 0, y: 0, width: 1440, height: 810 };

// V1: to the window, a click, the Shinkansen view opens and a train passes
await clip("window-open", {
  aspect: "4x5", frame: frame45, length: 4.6,
  camera: [[0, dev, 0.98], [4.6, dev, 1.04]],
  tilt: lean(0.5),
  start: [980, 760],
  beats: [{ at: 0.1, dur: 0.7, to: hit("window") }, { at: 1.0, click: true }],
});
// V2, V4, V7: close on mini Peter; he turns round and waves
await clip("peter", {
  aspect: "4x5", frame: frame45, length: 3.6,
  camera: [[0, hit("peter"), 2.3], [3.6, hit("peter"), 2.45]],
  tilt: () => [0.08, 0.04],
  start: [880, 640],
  beats: [{ at: 0.5, dur: 0.6, to: hit("peter") }],
});
// V3: tight on the screen, the arcade lights up, a train goes by
await clip("room", {
  aspect: "4x5", frame: frame45, length: 8.4, seed: 21,
  prepare: async (st) => {
    await st.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
    await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { every: 1000 / 30 });
  },
  camera: [[0, '[data-variant] [class$="__screen"]', 1.58], [8.4, '[data-variant] [class$="__screen"]', 1.58]],
  tilt: () => [0, 0],
  start: [1060, 660],
  beats: [{ at: 0.4, dur: 0.8, to: hit("arcade") }, { at: 2.2, dur: 0.6, to: [1070, 700] }],
});
// V3: the same frame with what's behind the windows painted out in hot pink, as in the painting
await clip("room-pink", {
  aspect: "4x5", frame: frame45, length: 0.2, seed: 21, cursor: false,
  prepare: async (st) => st.page.addStyleTag({ content: '[class*="scene-module__"][class$="__outside"] { background: #ff00ff !important; } [class*="scene-module__"][class$="__outside"] > * { visibility: hidden !important; }' }),
  camera: [[0, '[data-variant] [class$="__screen"]', 1.58], [0.2, '[data-variant] [class$="__screen"]', 1.58]],
  tilt: () => [0, 0],
});
// V2, V7: the whole device on the page, the pointer comes to mini Peter
await clip("device", {
  aspect: "4x5", frame: frame45, length: 4.6,
  camera: [[0, dev, 1.0], [4.6, dev, 1.05]],
  tilt: lean(0.6),
  start: [1000, 780],
  beats: [{ at: 0.3, dur: 0.9, to: hit("peter") }],
});
// V5: the knob, notch by notch
await clip("knob", {
  aspect: "1x1", frame: frame11, length: 3.2,
  camera: [[0, '[class*="device-module__"][class$="__knob"]', 3.6], [3.2, '[class*="device-module__"][class$="__knob"]', 3.8]],
  tilt: sway(0.25, 0.12, [0.25, -0.25]),
  prepare: async (st) => st.page.addStyleTag({ content: '[class*="device-module__"][class$="__knobMark"] { transition: none !important; }' }),
  cursor: false,
  // a notch every 0.6 s, each turn easing out like the site's
  each: async (st, t) => {
    let deg = 0;
    for (const n of [0.3, 0.9, 1.5, 2.1, 2.7]) deg += 30 * ease.outCubic(clamp01((t - n) / 0.22));
    await st.page.evaluate((d) => document.querySelector("[data-variant]").style.setProperty("--knob", `${d}deg`), deg);
  },
});
// V5: the d-pad pressed, the selection hopping across the room above it
await clip("dpad", {
  aspect: "1x1", frame: frame11, length: 2.0,
  camera: [[0, '[class*="device-module__"][class$="__dpad"]', 2.2], [2.0, '[class*="device-module__"][class$="__dpad"]', 2.3]],
  tilt: sway(0.15, 0.08, [-0.3, -0.25]),
  start: [800, 720],
  beats: [{ at: 0.1, dur: 0.35, to: '[data-dir="right"]' }, { at: 0.55, click: true }, { at: 0.8, dur: 0.3, to: '[data-dir="down"]' }, { at: 1.2, click: true }, { at: 1.4, dur: 0.3, to: '[data-dir="right"]' }, { at: 1.75, click: true }],
});
// V5: the orange side button, the room's light changes
await clip("light", {
  aspect: "1x1", frame: frame11, length: 3.0,
  camera: [[0, dev, 1.25], [3.0, dev, 1.3]],
  tilt: () => [-0.35, 0.05],
  start: [300, 420],
  beats: [{ at: 0.1, dur: 0.4, to: '[class*="device-module__"][class$="__sideButton"]' }, { at: 0.6, click: true }, { at: 1.4, click: true }, { at: 2.2, click: true }],
});
// V5: the device leaning, the knob's rings showing
await clip("tilt", {
  aspect: "1x1", frame: frame11, length: 2.4, cursor: false, prepare: noText,
  camera: [[0, '[class*="device-module__"][class$="__knob"]', 1.7], [2.4, '[class*="device-module__"][class$="__knob"]', 1.8]],
  tilt: (t) => [Math.sin((t / 2.4) * Math.PI * 2) * 0.55, -0.15 + Math.sin((t / 2.4) * Math.PI * 4) * 0.2],
});
// V6: a tour in portrait: Peter, the window, the kana, the arcade, the TV, the radio, then every number
await clip("pov", {
  aspect: "9x16", frame: frame916, length: 14.0,
  camera: [[0, body, 0.76], [14, body, 0.76]],
  tilt: lean(0.4),
  start: [900, 760],
  beats: [
    { at: 0.5, dur: 0.6, to: hit("peter") },
    { at: 2.0, dur: 0.5, to: hit("window") }, { at: 2.6, click: true },
    { at: 3.7, dur: 0.3, to: "[data-app-back]" }, { at: 4.0, click: true },
    { at: 4.1, dur: 0.5, to: hit("kana") }, { at: 4.7, click: true },
    { at: 5.1, dur: 0.4, to: '[data-app] [class*="__card"]' }, { at: 5.6, click: true },
    { at: 5.85, dur: 0.3, to: "[data-app-back]" }, { at: 6.2, click: true },
    { at: 6.3, dur: 0.5, to: hit("arcade") }, { at: 6.9, click: true },
    { at: 7.85, dur: 0.3, to: "[data-app-back]" }, { at: 8.2, click: true },
    { at: 8.3, dur: 0.5, to: hit("tv") },
    { at: 9.5, dur: 0.5, to: hit("radio") },
    { at: 10.6, dur: 0.6, to: '[class*="device-module__"][class$="__pillKey"]' }, { at: 11.3, click: true },
    { at: 11.6, dur: 0.8, to: [1060, 830] },
  ],
});
// V8: from inside the window out to the whole device and back in, a train crossing
await clip("loop", {
  aspect: "1x1", frame: frame11, length: 7.0, seed: 21, cursor: false,
  prepare: async (st) => {
    await noText(st);
    await st.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
    await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { every: 1000 / 30 });
  },
  camera: [[0, hit("window"), 3.1], [0.9, hit("window"), 3.1], [3.4, dev, 1.0], [4.2, dev, 1.0], [6.4, hit("window"), 3.1], [7.0, hit("window"), 3.1]],
  tilt: (t) => [Math.sin((t / 7) * Math.PI * 2) * 0.22, 0.03],
});
// V9: the blog post's build prompt, then the codex exec command, with a highlighter
await clip("prompt", {
  aspect: "16x9", frame: frame169, length: 6.0, path: "/blog/how-this-room-was-made/", cursor: false,
  prepare: async (st) => {
    await st.preload(0);
    await st.page.evaluate(() => {
      const pre = [...document.querySelectorAll("pre")].find((p) => p.textContent.includes("You can't draw"));
      pre.innerHTML = pre.innerHTML.replace("call its image generation through codex exec", '<mark id="hl1">call its image generation through codex exec</mark>');
      pre.id = "p1";
      const code = [...document.querySelectorAll("pre")].find((p) => p.textContent.includes("codex exec -i"));
      code.id = "p2";
      const s = document.createElement("style");
      s.textContent = "#hl1 { color: inherit; background: linear-gradient(transparent 8%, rgba(255, 214, 64, .85) 8%, rgba(255, 214, 64, .85) 92%, transparent 92%) no-repeat 0 0 / var(--hl, 0%) 100%; border-radius: 2px; }";
      document.head.appendChild(s);
      document.body.style.minHeight = "100vh";
    });
  },
  camera: [[0, "#p1", 2.0], [2.9, "#p1", 2.06], [3.6, "#p2", 2.3], [6.0, "#p2", 2.36]],
  // the highlighter wipes in from 0.6 s to 1.6 s
  each: async (st, t) => st.page.evaluate((k) => document.documentElement.style.setProperty("--hl", `${(k * 100).toFixed(1)}%`), ease.inOutCubic(clamp01((t - 0.6) / 1.0))),
});
// V9: the finished room, the window lifts, a train
await clip("room169", {
  aspect: "16x9", frame: frame169, length: 4.0, seed: 21,
  prepare: async (st) => {
    await st.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
    await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { every: 1000 / 30 });
  },
  camera: [[0, dev, 1.0], [4, dev, 1.05]],
  tilt: lean(0.5),
  start: [1100, 700],
  beats: [{ at: 0.3, dur: 0.8, to: hit("window") }],
});
// V10: the Stream Deck on the desk, its label
await clip("deck", {
  aspect: "4x5", frame: frame45, length: 4.0,
  camera: [[0, hit("deck"), 2.2], [4, hit("deck"), 2.35]],
  tilt: () => [0.1, 0.05],
  start: [900, 640],
  beats: [{ at: 0.4, dur: 0.7, to: hit("deck") }],
});

// "My new website is a pocket device": one continuous take at 60 fps and 4K. Tight on the window
// with a train going by, a fast pull back to the device as it swings round, the cursor across the
// room (arcade, knob, kana card), out to the whole page, then along the posts and over to mini Peter.
const title = (slug) => `[class*="room-module__"][class$="__textCol"] a[href^="/blog/${slug}"]`;
await clip("hero", {
  aspect: "16x10-4k", frame: { x: 0, y: 0, width: 1440, height: 900 }, length: 11.5, fps: 60, seed: 21,
  prepare: async (st) => {
    await st.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
    await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { every: 1000 / 60 });
    for (let i = 0; i < 24; i++) await st.step(1000 / 60);
  },
  camera: [[0, hit("window"), 2.9], [0.8, hit("window"), 2.72], [1.45, body, 1.3], [3.95, body, 1.3], [4.75, [720, 450], 1.0], [11.5, [720, 450], 1.0]],
  // a little sway on the close-up, a quick swing as it pulls back, then it leans after the pointer
  tilt: (t, p) => {
    const follow = [(p[0] / VIEW.width - 0.5) * 0.5, (p[1] / VIEW.height - 0.5) * 0.4];
    if (t < 0.8) return [0.06, 0.02];
    if (t < 1.25) { const u = ease.inOutCubic((t - 0.8) / 0.45); return [lerp(0.06, -0.55, u), lerp(0.02, 0.16, u)]; }
    if (t < 1.9) { const u = ease.inOutCubic((t - 1.25) / 0.65); return [lerp(-0.55, 0.32, u), lerp(0.16, -0.08, u)]; }
    const u = ease.inOutCubic(clamp01((t - 1.9) / 0.6));
    return [lerp(0.32, follow[0], u), lerp(-0.08, follow[1], u)];
  },
  start: [822, 262],
  beats: [
    { at: 0.25, dur: 0.45, to: hit("window") },
    { at: 1.45, dur: 0.4, to: hit("arcade") },
    { at: 1.95, dur: 0.35, to: '[class*="device-module__"][class$="__knob"]' }, { at: 2.36, wheel: 60 },
    { at: 2.55, dur: 0.3, to: hit("kana") }, { at: 2.9, click: true },
    { at: 3.12, dur: 0.3, to: '[data-app] [class*="__card"]' }, { at: 3.48, click: true },
    { at: 3.68, dur: 0.25, to: "[data-app-back]" }, { at: 3.97, click: true },
    { at: 4.05, dur: 0.7, to: title("how-this-room-was-made") },
    { at: 6.0, dur: 0.5, to: title("weird-use-of-ai-3") },
    { at: 7.0, dur: 0.4, to: title("weird-use-of-ai-1") },
    { at: 8.0, dur: 0.75, to: hit("peter") },
  ],
});

// the same take, but it opens on the knob (plain CSS, sharp at any zoom), whips out to the whole
// painted room as a train crosses the window, then pulls back as before: no deep zoom into the art
const screen = '[data-variant] [class$="__screen"]';
const knob = '[class*="device-module__"][class$="__knob"]';
await clip("hero2", {
  aspect: "16x10-4k", frame: { x: 0, y: 0, width: 1440, height: 900 }, length: 11.5, fps: 60, seed: 21,
  prepare: async (st) => {
    await st.page.addStyleTag({ content: '[class*="device-module__"][class$="__knobMark"] { transition: none !important; }' });
    await st.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
    await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { every: 1000 / 60 });
  },
  camera: [[0, knob, 4.4], [0.28, knob, 4.25], [0.62, screen, 1.75], [1.1, screen, 1.7], [1.45, body, 1.3], [3.95, body, 1.3], [4.75, [720, 450], 1.0], [11.5, [720, 450], 1.0]],
  tilt: (t, p) => {
    const follow = [(p[0] / VIEW.width - 0.5) * 0.5, (p[1] / VIEW.height - 0.5) * 0.4];
    const seg = (a, b, t0, t1) => { const u = ease.inOutCubic(clamp01((t - t0) / (t1 - t0))); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
    if (t < 0.28) return [0.38, -0.28];
    if (t < 0.62) return seg([0.38, -0.28], [0.0, 0.02], 0.28, 0.62);
    if (t < 1.1) return [0.0, 0.02];
    if (t < 1.4) return seg([0.0, 0.02], [-0.55, 0.16], 1.1, 1.4);
    if (t < 1.9) return seg([-0.55, 0.16], [0.32, -0.08], 1.4, 1.9);
    return seg([0.32, -0.08], follow, 1.9, 2.5);
  },
  // the knob turns two notches on the close-up, easing out like the site's own turn
  each: async (st, t) => {
    if (t > 0.7) return;
    const deg = 30 * ease.outCubic(clamp01((t - 0.02) / 0.14)) + 30 * ease.outCubic(clamp01((t - 0.16) / 0.14));
    await st.page.evaluate((d) => document.querySelector("[data-variant]").style.setProperty("--knob", `${d}deg`), deg);
  },
  start: [690, 640],
  beats: [
    { at: 0.0, dur: 0.12, to: knob },
    { at: 0.5, dur: 0.4, to: hit("window") },
    { at: 1.45, dur: 0.4, to: hit("arcade") },
    { at: 1.95, dur: 0.35, to: knob }, { at: 2.36, wheel: 60 },
    { at: 2.55, dur: 0.3, to: hit("kana") }, { at: 2.9, click: true },
    { at: 3.12, dur: 0.3, to: '[data-app] [class*="__card"]' }, { at: 3.48, click: true },
    { at: 3.68, dur: 0.25, to: "[data-app-back]" }, { at: 3.97, click: true },
    { at: 4.05, dur: 0.7, to: title("how-this-room-was-made") },
    { at: 6.0, dur: 0.5, to: title("weird-use-of-ai-3") },
    { at: 7.0, dur: 0.4, to: title("weird-use-of-ai-1") },
    { at: 8.0, dur: 0.75, to: hit("peter") },
  ],
});
