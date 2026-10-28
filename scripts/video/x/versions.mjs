// The ten X cuts, as timelines for edit.html (stills from the blog post, live clips from live.mjs,
// burned-in text in the site's fonts). Writes <work>/vNN.json and renders each to
// output/lab/video/x/vNN-<name>.mp4 with director.mjs (30 fps, at the output size).
//
//   node scripts/video/x/versions.mjs [work dir] [v01 v02 ...]
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const work = resolve(process.argv[2] ?? "output/lab/video/.x");
const only = process.argv.slice(3);
const out = resolve("output/lab/video/x");
mkdirSync(out, { recursive: true });
const story = (n) => `file://${resolve("public/assets/blog/pocket-room/story", n)}.webp`;
const clip = (name) => ({ dir: `file://${work}/${name}`, n: readdirSync(`${work}/${name}`).filter((f) => f.endsWith(".jpg")).length });
// the bento tiles, captured at 60 fps by scripts/video/bento.mjs (FPS=60) into .b60 next to the work dir
const b60 = resolve(work, "../.b60");
const clip60 = (name) => ({ dir: `file://${b60}/${name}`, n: readdirSync(`${b60}/${name}`).filter((f) => f.endsWith(".jpg")).length });
const SIZE = { "4x5": [1080, 1350], "1x1": [1080, 1080], "9x16": [1080, 1920], "16x9": [1920, 1080] };

// ---- layer helpers
const img = (src, o = {}) => ({ type: "img", src: story(src), ...o });
const seq = (name, o = {}) => ({ type: "seq", ...clip(name), ...o });
const rect = (o) => ({ type: "rect", ...o });
const pencil = (o) => ({ type: "pencil", dur: 0.45, ...o });
const tick = (o) => ({ type: "tick", dur: 0.3, ...o });
/** big Figtree text; chip wraps it on a paper label so it reads over anything */
const text = (html, t0, t1, box, o = {}) => ({
  type: "html", t0, t1, box, in: o.in ?? { type: "up", dur: 0.25, dist: 24 }, out: o.out ?? { type: "fade", dur: 0.2 },
  align: o.align ?? "center", justify: o.justify ?? "center", textAlign: o.textAlign ?? "center",
  html: o.chip === false
    ? `<div class="T${o.paper ? " paper" : ""}" style="font-size:${o.size ?? 72}px;max-width:${box[2]}px">${html}</div>`
    : `<div class="T chip${o.dark ? " dark" : ""}${o.orange ? " o" : ""}" style="font-size:${o.size ?? 66}px;max-width:${box[2] - 20}px">${html}</div>`,
});
const mono = (html, t0, t1, box, o = {}) => ({
  type: "html", t0, t1, box, in: o.in ?? { type: "pop", dur: 0.25 }, out: o.out ?? { type: "fade", dur: 0.15 },
  align: o.align ?? "center", justify: o.justify ?? "center",
  steps: o.steps?.map(([t, h]) => [t, `<div class="M chip${o.dark ? " dark" : ""}${o.orange ? " o" : ""}" style="font-size:${o.size ?? 34}px">${h}</div>`]),
  html: `<div class="M chip${o.dark ? " dark" : ""}${o.orange ? " o" : ""}" style="font-size:${o.size ?? 34}px">${html}</div>`,
});
const sign = (t0, t1, box, o = {}) => mono("virpo.io", t0, t1, box, { size: 30, dark: true, ...o });

const versions = {
  // ------------------------------------------------------------------ V1
  v01: { name: "ask-for-ten", aspect: "4x5", dur: 12, layers: () => [
    img("concepts-1-3x3", { id: "c1", t0: 0, t1: 3.0, box: [30, 330, 1020, 694], fit: "contain", clamp: false, radius: 18,
      view: [[0, [0.5, 0.5, 1]], [0.6, [0.5, 0.5, 1]], [1.3, [0.78, 0.55, 1.75]], [1.9, [0.78, 0.55, 1.75]], [2.4, [0.5, 0.78, 1.75]], [3.0, [0.5, 0.78, 1.75]]],
      out: { type: "right", dur: 0.45 } }),
    img("concepts-2-3x3", { id: "c2", t0: 2.55, t1: 6.1, box: [[2.55, [30, 330, 1020, 694]], [4.9, [30, 330, 1020, 694]], [5.6, [0, 0, 1080, 1350]]], fit: "contain", clamp: false, radius: 18,
      in: { type: "left", dur: 0.45 },
      view: [[2.55, [0.5, 0.5, 1]], [3.4, [0.5, 0.5, 1]], [4.4, [0.8, 0.2, 1.6]], [4.9, [0.8, 0.2, 1.6]], [5.6, [0.83, 0.18, 2.9]]] }),
    seq("window-open", { t0: 5.6, in: { type: "fade", dur: 0.45 } }),
    text("I asked AI for<br>10 website ideas.", 0, 2.6, [60, 70, 960, 220], { chip: false, size: 84 }),
    text("Merged two.<br>Asked for 10 more.", 2.6, 4.9, [60, 70, 960, 220], { chip: false, size: 84 }),
    text("Kept one.", 4.9, 6.0, [60, 70, 960, 220], { chip: false, size: 96 }),
    text("This is my website now.", 6.3, 10.0, [40, 1130, 1000, 160]),
    rect({ t0: 9.9, box: [0, 0, 1080, 1350], color: "#faf7f2", in: { type: "fade", dur: 0.35 } }),
    img("gacha-3", { t0: 10.0, box: [40, 470, 1000, 667], fit: "contain", radius: 16, in: { type: "up", dur: 0.4, dist: 80 } }),
    text("Gacha prompting:<br><span class=o>ask for ten, keep one.</span>", 10.1, undefined, [40, 120, 1000, 300], { chip: false, size: 80 }),
    sign(10.6, undefined, [0, 1190, 1080, 80]),
  ] },

  // ------------------------------------------------------------------ V2
  v02: { name: "picked-vs-built", aspect: "4x5", dur: 10, layers: () => [
    img("concepts-2-3x3", { t0: 0, t1: 6.0, box: [0, 0, 1080, 675], view: [0.835, 0.175, 2.85], out: { type: "up", dur: 0.4, dist: -675 } }),
    img("first-build", { t0: 0, t1: 2.6, box: [0, 675, 1080, 675], view: [0.3, 0.55, 1.05] }),
    ...[0, 1, 2, 3, 4, 5].map((k) => img("first-builds-rest", { t0: 2.6 + k * 0.233, t1: 2.6 + (k + 1) * 0.233, box: [0, 675, 1080, 675], view: [0.167 + 0.333 * (k % 3), 0.25 + 0.5 * Math.floor(k / 3), 2.6] })),
    img("three-tries", { t0: 4.0, t1: 6.0, box: [0, 675, 1080, 675], view: [[4.0, [0.5, 0.5, 1.0]], [4.7, [0.835, 0.5, 1.12]]] }),
    rect({ t0: 0, t1: 6.0, box: [0, 671, 1080, 8], color: "#1d1a17" }),
    mono("What I picked", 0.15, 5.6, [40, 40, 520, 70], { justify: "flex-start", size: 40 }),
    mono("What Claude built", 0.35, 4.0, [40, 715, 620, 70], { justify: "flex-start", size: 40, orange: true }),
    mono("first try", 2.0, 2.6, [0, 1200, 1080, 90], { size: 40, dark: true }),
    mono("try 2", 2.6, 4.0, [0, 1200, 1080, 90], { size: 40, dark: true, in: null, steps: [[2.6, "try 2"], [2.83, "try 3"], [3.07, "try 4"], [3.3, "try 5"], [3.53, "try 6"], [3.77, "try 7"]] }),
    text("Then I let it call<br>ChatGPT for the art.", 4.0, 5.6, [40, 1110, 1000, 200], { size: 56 }),
    seq("device", { t0: 5.7, in: { type: "up", dur: 0.45, dist: 1350 } }),
    text("What it built after that.", 6.4, undefined, [40, 60, 1000, 150]),
    sign(9.0, undefined, [0, 1230, 1080, 80]),
  ] },

  // ------------------------------------------------------------------ V3
  v03: { name: "one-painting", aspect: "4x5", dur: 11, layers: () => [
    // the train passes from 5 s, so the opening uses the quiet frames after it
    seq("room", { t0: 0, t1: 3.05, start: 150 }),
    seq("room", { t0: 5.0, t1: 9.6, start: 0 }),
    seq("room-pink", { t0: 2.4, t1: 5.9, loop: true, in: { type: "wipeR", dur: 0.6 }, out: { type: "fade", dur: 0.8 } }),
    text("This is my website.", 0, 2.0, [40, 60, 1000, 150]),
    text("None of it is 3D.", 2.0, 2.6, [40, 60, 1000, 150], { in: null }),
    text("It's one painting.", 2.6, 4.0, [40, 60, 1000, 150], { in: null }),
    text("The windows are painted <span style='color:#e0189a'>pink</span>…", 4.0, 5.5, [40, 60, 1000, 150], { size: 58 }),
    text("…so a train can drive through them.", 5.6, 8.1, [40, 1150, 1000, 150], { size: 56 }),
    rect({ t0: 8.0, t1: 9.7, box: [0, 0, 1080, 1350], color: "rgba(250,247,242,.82)", in: { type: "fade", dur: 0.3 } }),
    img("pink-props", { t0: 8.1, t1: 9.7, box: [70, 360, 460, 307], radius: 14, shadow: "0 24px 50px -24px rgba(40,25,10,.6)", in: { type: "pop", dur: 0.35 } }),
    img("pink-peter", { t0: 8.35, t1: 9.7, box: [550, 520, 460, 307], radius: 14, shadow: "0 24px 50px -24px rgba(40,25,10,.6)", in: { type: "pop", dur: 0.35 } }),
    text("Everything you can touch<br>was painted on pink and cut out.", 8.1, 9.7, [40, 900, 1000, 220], { chip: false, size: 58 }),
    seq("device", { t0: 9.6, start: 100, in: { type: "fade", dur: 0.4 } }),
    mono("virpo.io · painted with ChatGPT, wired up by Claude Code", 9.9, undefined, [0, 1220, 1080, 80], { size: 24, dark: true }),
  ] },

  // ------------------------------------------------------------------ V4
  v04: { name: "three-hands", aspect: "1x1", dur: 8, layers: () => [
    ...[0, 1, 2, 3].map((k) => img("hands", { t0: [0, 1.8, 3.2, 4.6][k], t1: [1.8, 3.2, 4.6, 5.4][k], box: [210, 60, 660, 1020], view: [0.125 + 0.25 * k, 0.5, 1.0] })),
    text("Me: draw me waving.", 0, 5.4, [40, 40, 1000, 130], { size: 60, in: { type: "up", dur: 0.2 } }),
    mono("try 1", 0.3, 5.4, [760, 940, 280, 90], { dark: true, size: 40, steps: [[0.3, "try 1"], [1.8, "try 2"], [3.2, "try 3"], [4.6, "try 6"]] }),
    text("3 hands.", 0.3, 1.8, [40, 920, 700, 130], { size: 70, orange: true }),
    text("1 hand.", 1.8, 3.2, [40, 920, 700, 130], { size: 70, orange: true }),
    text("wrong hand.", 3.2, 4.6, [40, 920, 700, 130], { size: 70, orange: true }),
    text("finally.", 4.6, 5.4, [40, 920, 700, 130], { size: 70 }),
    seq("peter", { t0: 5.4, box: [0, 0, 1080, 1080], view: [0.5, 0.42, 1], in: { type: "fade", dur: 0.3 } }),
    text("Now he waves at everyone<br>who visits.", 6.0, undefined, [40, 860, 1000, 200], { size: 58 }),
  ] },

  // ------------------------------------------------------------------ V5
  v05: { name: "knob", aspect: "1x1", dur: 10, layers: () => [
    seq("knob", { t0: 0, t1: 2.5 }),
    seq("dpad", { t0: 2.5, t1: 4.0 }),
    seq("light", { t0: 4.0, t1: 6.5, start: 15 }),
    seq("tilt", { t0: 6.5, t1: 8.5 }),
    seq("knob", { t0: 8.5, t1: 10.0, start: 0, in: { type: "fade", dur: 0.25 } }),
    text("my website has a knob.", 0.1, 4.0, [40, 50, 1000, 140], { size: 70 }),
    text("and a light switch.", 4.1, 6.5, [40, 50, 1000, 140], { size: 70 }),
    text("No 3D engine.<br>The knob is 16 stacked rings of CSS.", 6.6, 8.5, [40, 50, 1000, 220], { size: 54 }),
  ] },

  // ------------------------------------------------------------------ V6
  v06: { name: "pov", aspect: "9x16", dur: 14, layers: () => [
    seq("pov", { t0: 0 }),
    text("POV: you open<br>my website", 0, 2.2, [60, 160, 960, 260], { chip: false, size: 104 }),
    mono("01/16", 0.9, 11.4, [760, 70, 280, 90], { orange: true, size: 40, steps: [[0.9, "Fig. 01"], [2.4, "Fig. 06"], [4.5, "Fig. 08"], [6.7, "Fig. 12"], [8.6, "Fig. 13"], [9.8, "Fig. 09"]] }),
    text("16 things in this room<br>open something.", 11.4, undefined, [60, 1400, 960, 220], { chip: false, size: 74 }),
    text("How many can you find?", 12.4, undefined, [60, 1630, 960, 120], { size: 64, orange: true }),
    sign(13.0, undefined, [0, 1780, 1080, 80]),
  ] },

  // ------------------------------------------------------------------ V7
  v07: { name: "old-was-screaming", aspect: "4x5", dur: 8, layers: () => [
    img("old-site", { t0: 0, t1: 3.0, box: [0, 0, 1080, 1350], fit: "contain", clamp: false, view: [[0, [0.13, 0.42, 4.6]], [0.5, [0.13, 0.42, 4.4]], [2.5, [0.5, 0.5, 1.0]]], out: { type: "wipeD", dur: 0.45 } }),
    text("My old website was<br>screaming at you.", 0, 2.6, [40, 60, 1000, 240], { size: 70 }),
    mono("(literally)", 0.8, 2.6, [0, 1180, 1080, 90], { size: 36, dark: true }),
    seq("device", { t0: 2.6, start: 0 }),
    text("The new one just waves.", 3.9, undefined, [40, 60, 1000, 150]),
    mono("virpo.io · every pixel painted by AI", 7.0, undefined, [0, 1230, 1080, 80], { size: 28, dark: true }),
  ] },

  // ------------------------------------------------------------------ V8
  v08: { name: "infinite-window", aspect: "1x1", dur: 7, layers: () => [
    seq("loop", { t0: 0 }),
    mono("this is my homepage", 3.0, 6.5, [0, 950, 1080, 90], { size: 34 }),
  ] },

  // ------------------------------------------------------------------ V9
  v09: { name: "claude-cant-draw", aspect: "16x9", dur: 15, layers: () => [
    text("Claude can't draw.", 0, 1.3, [100, 300, 1720, 200], { chip: false, size: 150 }),
    text("So I let it <span class=o>call ChatGPT.</span>", 0.55, 1.3, [100, 540, 1720, 200], { chip: false, size: 110 }),
    seq("prompt", { t0: 1.3, t1: 7.0, in: { type: "fade", dur: 0.3 } }),
    rect({ t0: 7.0, t1: 9.0, box: [0, 0, 1920, 1080], color: "#faf7f2" }),
    img("first-build", { t0: 7.0, t1: 9.0, box: [60, 200, 880, 560], radius: 16, view: [0.3, 0.55, 1.2], in: { type: "pop", dur: 0.3 } }),
    img("three-tries", { t0: 7.15, t1: 9.0, box: [980, 200, 880, 560], radius: 16, view: [0.835, 0.5, 2.0], in: { type: "pop", dur: 0.3 } }),
    mono("before: Claude drawing", 7.1, 9.0, [60, 790, 880, 80], { size: 32 }),
    mono("after: Claude calling ChatGPT", 7.25, 9.0, [980, 790, 880, 80], { size: 32, orange: true }),
    seq("room169", { t0: 9.0, in: { type: "fade", dur: 0.35 } }),
    rect({ t0: 13.0, box: [0, 0, 1920, 1080], color: "rgba(250,247,242,.9)", in: { type: "fade", dur: 0.4 } }),
    text("Every picture on my site.<br><span class=o>Prompts in the repo.</span>", 13.1, undefined, [100, 300, 1720, 340], { chip: false, size: 104 }),
    sign(13.6, undefined, [0, 760, 1920, 90], { size: 40 }),
  ] },

  // ------------------------------------------------------------------ V10
  v10: { name: "how-anime", aspect: "4x5", dur: 9, layers: () => [
    img("manga-5", { id: "m", t0: 0, t1: 5.0, box: [0, 420, 1080, 258], fit: "contain", view: [0.5, 0.5, 1] }),
    ...[1, 2, 3, 4, 5].map((k) => mono(String(k), 0.1 + k * 0.05, 5.0, [(k - 1) * 216 + 68, 330, 80, 70], { size: 40, dark: k === 4 })),
    text("How anime should<br>my website be?", 0, 5.0, [40, 70, 1000, 220], { chip: false, size: 84 }),
    text("Pick a number.", 3.0, 5.0, [40, 780, 1000, 150], { size: 72, orange: true }),
    pencil({ t0: 4.4, t1: 5.0, on: "m", rect: [0.6, -0.05, 0.2, 0.75], width: 10 }),
    text("I picked 4.", 4.5, 5.0, [40, 960, 1000, 150], { size: 72 }),
    seq("deck", { t0: 5.0, in: { type: "fade", dur: 0.3 } }),
    text("Then the whole room<br>got painted at 4.", 5.4, undefined, [40, 60, 1000, 220], { size: 60 }),
    sign(8.4, undefined, [0, 1230, 1080, 80]),
  ] },

  // ------------------------------------------------------------------ V11
  // "my new website is a pocket device": no overlays, only the site and the cursor
  v11: { name: "pocket-device", aspect: "16x9", dur: 11.5, fps: 60, ss: 2, world: [[5.0, [0, 0, 1]], [5.6, [0, 0, 0.955]], [7.6, [2.2, -2.6, 0.95]], [9.4, [-1.8, 2.2, 0.955]], [10.2, [0, 0, 1]]], layers: (hero = "hero", hd = null) => {
    const A = [0, -60, 1920, 1200];
    const B = [490, 84, 940, 587.5];
    const chrome = (b) => [b[0], b[1] - 44, b[2], 44];
    const frame = (b) => [b[0], b[1] - 44, b[2], b[3] + 44];
    const keys = (f) => [[4.8, f(A)], [5.45, f(B), "io"], [9.6, f(B)], [10.4, f(A), "io"]];
    const shadow = "0 0 0 1px rgba(60,40,20,.08), 0 2px 6px rgba(60,40,20,.06), 0 34px 70px -34px rgba(60,40,20,.5)";
    const tiles = [
      ["knob", [40, 40, 430, 490]], ["peter", [1450, 40, 430, 490]], ["strap", [40, 552, 430, 488]], ["hydrangea", [1450, 552, 430, 488]],
      ["keys", [490, 692, 300, 348]], ["kana", [810, 692, 300, 348]], ["card", [1130, 692, 300, 348]],
    ];
    const tile = ([name, box], k) => ({ type: "seq", ...clip60(name), fps: 60, t0: 5.2 + k * 0.07, t1: 10.05, box, radius: 22, shadow, start: [40, 0, 20, 90, 0, 30, 60][k],
      in: { type: "pop", dur: 0.45 }, out: { type: "fade", dur: 0.35 } });
    return [
      rect({ t0: 0, box: [0, 0, 1920, 1080], color: "#ebe3d5", opacity: [[4.9, 0], [5.5, 1], [9.7, 1], [10.3, 0]], fixed: true }),
      rect({ t0: 0, box: keys(frame), color: "#faf7f2", radius: 14, shadow, opacity: [[4.8, 0], [5.2, 1], [9.9, 1], [10.4, 0]] }),
      { type: "seq", ...clip(hero), fps: 60, t0: 0, box: keys((b) => b), radius: "0 0 14px 14px" },
      // the opening again, drawn sharp (live.mjs hero2hd), fading into the take at 0.75 s
      ...(hd ? [{ type: "seq", ...clip(hd), fps: 60, t0: 0, t1: 0.8, box: A, out: { type: "fade", dur: 0.08 } }] : []),
      { type: "html", t0: 4.9, t1: 10.35, box: keys(chrome), in: { type: "fade", dur: 0.3 }, out: { type: "fade", dur: 0.25 }, justify: "center", align: "stretch",
        html: `<div style="position:relative;width:100%;height:100%;background:#f3eee6;border-radius:14px 14px 0 0;border-bottom:1px solid rgba(60,40,20,.08);display:flex;align-items:center;justify-content:center">
          <span style="position:absolute;left:16px;display:flex;gap:8px"><i style="width:12px;height:12px;border-radius:50%;background:#dcd4c8"></i><i style="width:12px;height:12px;border-radius:50%;background:#dcd4c8"></i><i style="width:12px;height:12px;border-radius:50%;background:#dcd4c8"></i></span>
          <span style="display:flex;align-items:center;gap:7px;height:26px;padding:0 16px;min-width:360px;justify-content:center;border-radius:8px;background:#e9e2d7;color:#4a433b;font:500 15px/1 Figtree,system-ui,sans-serif;letter-spacing:.01em">
            <svg viewBox="0 0 12 12" width="11" height="11"><path d="M3.2 5.2V3.8a2.8 2.8 0 1 1 5.6 0v1.4h.6c.4 0 .7.3.7.7v4.2c0 .4-.3.7-.7.7H2.6a.7.7 0 0 1-.7-.7V5.9c0-.4.3-.7.7-.7h.6Zm1.3 0h3V3.8a1.5 1.5 0 0 0-3 0v1.4Z" fill="#6b6259"/></svg>virpo.io</span></div>` },
      ...tiles.map(tile),
    ];
  } },
};

// V12: V11 opening on the knob instead of deep inside the window
versions.v12 = { ...versions.v11, name: "pocket-device-knob", layers: () => versions.v11.layers("hero2", "hero2hd") };

for (const [id, v] of Object.entries(versions)) {
  if (only.length && !only.includes(id)) continue;
  const [w, h] = SIZE[v.aspect];
  const file = `${work}/${id}.json`;
  writeFileSync(file, JSON.stringify({ w, h, fps: v.fps ?? 30, world: v.world, layers: v.layers() }));
  const dest = `${out}/${id}-${v.name}.mp4`;
  execFileSync("node", ["scripts/video/director.mjs", "scripts/video/x/edit.html", file, String(Math.round(v.dur * (v.fps ?? 30))), dest, String(w), String(h)], {
    stdio: "inherit", env: { ...process.env, SS: String(v.ss ?? 1), FPS: String(v.fps ?? 30), CRF: v.ss ? "10" : "15" },
  });
}
