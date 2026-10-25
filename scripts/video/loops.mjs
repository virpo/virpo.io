// Short silent loops for the making-of post, captured frame by frame on the page's fake clock (see
// lib/stage.mjs). Each lands in <out>/<name>/fNNNN.jpg; scripts/video/loops.sh encodes them.
// Needs the static site served:  npm run build && python3 -m http.server 4450 -d dist
//
//   node scripts/video/loops.mjs <out dir> [name]     (names: wave, tilt, reveal, room)
import { clamp01, ease, launch, lerp, openStage, record } from "./lib/stage.mjs";

const OUT = process.argv[2];
const only = process.argv[3];
const FPS = 30;
const DT = 1000 / FPS;
const browser = await launch();
const run = async (name, fn) => {
  if (only && only !== name) return;
  const t = Date.now();
  await fn();
  console.log(name, ((Date.now() - t) / 1000).toFixed(0) + "s");
};

// mini Peter turns round to wave when the pointer reaches him
await run("wave", async () => {
  const st = await openStage({ browser, path: "/", dsf: 2, viewport: { width: 1440, height: 900 } });
  const p = await st.box('[data-hit="peter"]');
  const cx = p.x + p.width / 2;
  const cy = p.y + p.height / 2;
  const clip = { x: p.x - 150, y: p.y - 110, width: p.width + 300, height: p.height + 170 };
  await record(st, `${OUT}/wave`, 3.2 * FPS, {
    clip,
    dt: DT,
    before: async (i) => {
      const t = i / FPS;
      const k = t < 0.7 ? 0 : t < 1.2 ? ease.inOutCubic((t - 0.7) / 0.5) : t < 2.5 ? 1 : 1 - ease.inOutCubic(clamp01((t - 2.5) / 0.5));
      await st.pointer(lerp(cx + 230, cx, k), lerp(cy + 120, cy, k), { show: true, hover: true });
    },
  });
  await st.close();
});

// the lower part of the device tilting, so the knob and keys show their sides
await run("tilt", async () => {
  const st = await openStage({ browser, path: "/", dsf: 2, viewport: { width: 1440, height: 900 } });
  const w = await st.box("[data-variant=hero]");
  const clip = { x: w.x - 20, y: w.y + w.height * 0.62, width: w.width + 40, height: w.height * 0.38 };
  const n = 4 * FPS;
  await record(st, `${OUT}/tilt`, n, {
    clip,
    dt: DT,
    before: async (i) => {
      const a = (i / n) * Math.PI * 2;
      await st.tilt(Math.sin(a) * 0.5, Math.sin(a * 2) * 0.25 - 0.1);
    },
  });
  await st.close();
});

// a project card in pencil fading into colour under the pointer
await run("reveal", async () => {
  const st = await openStage({ browser, path: "/", dsf: 2, viewport: { width: 1440, height: 900 } });
  await st.preload(0);
  await st.page.evaluate(() => document.querySelector('a[href="https://youtldr.com/"][data-project-card]')?.scrollIntoView({ block: "center" }));
  await st.settle();
  await st.sync();
  const c = await st.box('a[href="https://youtldr.com/"][data-project-card]');
  const clip = { x: c.x - 16, y: c.y - 16, width: c.width + 32, height: c.height * 0.72 + 32 };
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height * 0.35;
  await record(st, `${OUT}/reveal`, 3 * FPS, {
    clip,
    dt: DT,
    before: async (i) => {
      const t = i / FPS;
      const inside = t > 0.5 && t < 2.1;
      await st.pointer(inside ? cx : cx + c.width * 0.9, inside ? cy : cy + 40, { show: inside, hover: true });
    },
  });
  await st.close();
});

// the whole room: a shinkansen passes while the pointer lifts the window, the arcade and the kana
await run("room", async () => {
  const st = await openStage({ browser, path: "/", dsf: 2, viewport: { width: 1440, height: 900 } });
  await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { limit: 40000 });
  const w = await st.box("[data-variant=hero]");
  const clip = { x: w.x - 20, y: w.y - 10, width: w.width + 40, height: w.height + 20 };
  const pts = await Promise.all(["window", "arcade", "kana"].map((id) => st.box(`[data-hit="${id}"]`)));
  const home = [w.x + w.width * 0.95, w.y + w.height * 0.95];
  const path = [home, ...pts.map((b) => [b.x + b.width / 2, b.y + b.height / 2]), home];
  const n = 7 * FPS;
  const seg = n / (path.length - 1);
  await record(st, `${OUT}/room`, n, {
    clip,
    dt: DT,
    before: async (i) => {
      const s = Math.min(path.length - 2, Math.floor(i / seg));
      const k = ease.inOutCubic(clamp01((i - s * seg) / (seg * 0.45)));
      const [x0, y0] = path[s];
      const [x1, y1] = path[s + 1];
      const x = lerp(x0, x1, k);
      const y = lerp(y0, y1, k);
      await st.tilt((x / 1440 - 0.5) * 0.6, (y / 900 - 0.5) * 0.6);
      await st.pointer(x, y, { show: true, hover: true });
    },
  });
  await st.close();
});

await browser.close();
