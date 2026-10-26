// Video #2, the product video: the clips for its bento tiles, each about 6 s at 30 fps, captured
// at the pixel density the scene's closest zoom needs at 4K (so the close-ups are as sharp as the rest),
// on the fake clock (lib/stage.mjs). bento-scene.html lays them out and director.mjs films it.
// Each lands in <work>/<name>/fNNNN.jpg with meta.json.
//
//   node scripts/video/bento.mjs <work dir> [clip ...]     (FPS=60 for 60 fps clips)
//   clips: device, knob, keys, peter, window, kana, card, hydrangea, strap
import { join } from "node:path";
import { clamp01, ease, launch, lerp, openStage, record } from "./lib/stage.mjs";

const work = process.argv[2] ?? "output/lab/video/.bento";
const only = process.argv.slice(3);
const DESKTOP = { width: 1440, height: 900 };
const FPS = Number(process.env.FPS ?? 30);
const DT = 1000 / FPS;
const N = 6 * FPS;
// moments written at 30 fps, at whatever FPS the clips are captured
const F = (f) => Math.round((f * FPS) / 30);
const sel = {
  hit: (id) => `[data-hit="${id}"]`,
  screen: '[data-variant] [class$="__screen"]',
  knob: '[class*="device-module__"][class$="__knob"]',
  dpad: '[class*="device-module__"][class$="__dpad"]',
};
const centre = (b) => [b.x + b.width / 2, b.y + b.height / 2];
const pad = (b, l, t = l, r = l, bt = t) => ({ x: b.x - l, y: b.y - t, width: b.width + l + r, height: b.height + t + bt });
// a path through points, eased per leg, with time t in [0, 1]
const through = (pts, t) => {
  const legs = pts.length - 1;
  const s = Math.min(legs - 1, Math.floor(t * legs));
  const k = ease.inOutCubic(clamp01(t * legs - s));
  return [lerp(pts[s][0], pts[s + 1][0], k), lerp(pts[s][1], pts[s + 1][1], k)];
};

const browser = await launch();
const clip = async (name, fn) => {
  if (only.length && !only.includes(name)) return;
  const t0 = Date.now();
  await fn();
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
};

// the whole device: the pointer glides across the room, labels lift, the device leans after it
await clip("device", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 3.2, seed: 41 });
  const w = await st.box("[data-variant=hero]");
  const ids = ["arcade", "window", "kana", "peter", "tv"];
  const pts = [[w.x + w.width * 0.92, w.y + w.height * 0.9]];
  for (const id of ids) pts.push(centre(await st.box(sel.hit(id))));
  pts.push(pts[0]);
  await record(st, join(work, "device"), 8 * FPS, {
    dt: DT,
    clip: pad(w, 60, 40, 40, 60),
    before: async (i) => {
      const [x, y] = through(pts, i / (8 * FPS));
      await st.tilt((x / DESKTOP.width - 0.5) * 0.8, (y / DESKTOP.height - 0.5) * 0.7);
      await st.pointer(x, y, { show: true, hover: true, scale: 1.4 });
    },
  });
  await st.close();
});

// the knob, very close, turning a notch at a time while the device sways
await clip("knob", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 6 });
  const { page } = st;
  await page.addStyleTag({ content: '[class*="device-module__"][class$="__knobMark"] { transition: none !important; }' });
  const knob = await st.box(sel.knob);
  await page.mouse.move(...centre(knob));
  const notches = [12, 48, 84, 120, 156].map(F);
  await record(st, join(work, "knob"), N, {
    dt: DT,
    clip: pad(knob, 150, 110, 70, 60),
    before: async (i, t) => {
      const a = (i / N) * Math.PI * 2;
      await st.tilt(0.25 + Math.sin(a) * 0.3, -0.25 + Math.cos(a) * 0.15);
      if (notches.includes(i)) await page.mouse.wheel(0, 60);
      let deg = 0;
      for (const at of notches) deg += 30 * ease.outCubic(clamp01((i - at) / F(6)));
      await page.evaluate((d) => document.querySelector("[data-variant]").style.setProperty("--knob", `${d}deg`), deg);
    },
  });
  await st.close();
});

// the white keys pressed, one after another
await clip("keys", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 2.6 });
  const { page } = st;
  const dpad = await st.box(sel.dpad);
  const keys = [];
  for (const dir of ["up", "right", "down", "left"]) keys.push(centre(await st.box(`[data-dir="${dir}"]`)));
  await record(st, join(work, "keys"), N, {
    dt: DT,
    clip: pad(dpad, 90, 70, 240, 50),
    before: async (i) => {
      const a = (i / N) * Math.PI * 2;
      await st.tilt(-0.35 + Math.sin(a) * 0.2, -0.3 + Math.cos(a) * 0.1);
      const at = [20, 55, 90, 125].map(F);
      const k = at.indexOf(i);
      if (k >= 0) await page.mouse.click(...keys[k]);
    },
  });
  await st.close();
});

// mini Peter turns round to wave when the pointer comes to him, twice
await clip("peter", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 6, seed: 12 });
  const p = await st.box(sel.hit("peter"));
  const [cx, cy] = centre(p);
  const away = [cx + 210, cy + 120];
  await record(st, join(work, "peter"), N, {
    dt: DT,
    clip: pad(p, 120, 90, 120, 60),
    before: async (i, t) => {
      // in at 0.4 s, wave, out at 2.4 s, in again at 3.4 s, out at 5.4 s
      const leg = (from, to, start, dur) => clamp01((t - start) / dur);
      let k = 0;
      if (t < 0.4) k = 0;
      else if (t < 0.9) k = ease.inOutCubic(leg(0, 1, 0.4, 0.5));
      else if (t < 2.4) k = 1;
      else if (t < 2.9) k = 1 - ease.inOutCubic(leg(1, 0, 2.4, 0.5));
      else if (t < 3.4) k = 0;
      else if (t < 3.9) k = ease.inOutCubic(leg(0, 1, 3.4, 0.5));
      else if (t < 5.4) k = 1;
      else k = 1 - ease.inOutCubic(clamp01((t - 5.4) / 0.5));
      await st.tilt(0.1, 0.05);
      await st.pointer(lerp(away[0], cx, k), lerp(away[1], cy, k), { show: true, hover: true, scale: 1.3 });
    },
  });
  await st.close();
});

// the window, close, with a shinkansen passing
await clip("window", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 6.5, seed: 21 });
  await st.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
  await st.seek(() => !!document.querySelector('[data-kind="shinkansen"]'), { every: DT });
  for (let i = 0; i < 4; i++) await st.step(DT);
  const win = await st.box(sel.hit("window"));
  await record(st, join(work, "window"), N, {
    dt: DT,
    clip: pad(win, 30, 20, 30, 20),
    before: async (i) => {
      const a = (i / N) * Math.PI * 2;
      await st.tilt(Math.sin(a) * 0.12, 0.04);
    },
  });
  await st.close();
});

// kana cards: tap to reveal, then the next one
await clip("kana", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 3, seed: 5 });
  const { page } = st;
  const screen = await st.box(sel.screen);
  await page.evaluate((s) => document.querySelector(s).click(), sel.hit("kana"));
  for (let i = 0; i < 40; i++) await st.step();
  const card = await st.box('[data-app] [class*="__card"]');
  const at = [card.x + card.width * 0.6, card.y + card.height * 0.65];
  await record(st, join(work, "kana"), N, {
    dt: DT,
    clip: pad(screen, 16),
    before: async (i) => {
      await st.tilt(0.05, 0.04);
      await st.pointer(at[0], at[1], { show: true, hover: true, scale: 1.3 });
      if (i === F(15) || i === F(105)) await page.mouse.click(...at);
      if (i === F(60) || i === F(150)) await page.evaluate(() => document.querySelector("[data-app] [data-next]")?.click());
    },
  });
  await st.close();
});

// project cards, pencil turning to colour under the pointer, one after another
await clip("card", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 3.2 });
  const { page } = st;
  const top = await page.evaluate(() => document.querySelector('[class*="projectCard"]').getBoundingClientRect().top + scrollY - 60);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  await st.step();
  await st.settle();
  const cards = await page.$$eval('[class*="projectCard"]', (els) => els.slice(0, 3).map((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
  const area = { x: cards[0].x - 30, y: cards[0].y - 30, width: cards[2].x + cards[2].width - cards[0].x + 60, height: cards[0].height + 60 };
  const pts = [[cards[0].x - 40, cards[0].y + cards[0].height + 40], ...cards.map((c) => [c.x + c.width * 0.55, c.y + c.height * 0.4]), [cards[2].x + cards[2].width + 60, cards[2].y + cards[2].height + 40]];
  await record(st, join(work, "card"), N, {
    dt: DT,
    clip: area,
    before: async (i) => {
      const [x, y] = through(pts, i / N);
      await st.pointer(x, y, { show: true, hover: true, scale: 1.3 });
    },
  });
  await st.close();
});

// the hydrangea at the end of a post, opening its flowers as the reader gets there
await clip("hydrangea", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 6, path: "/blog/weird-use-of-ai-1/" });
  const { page } = st;
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), max - 620);
  await st.preload(max - 620);
  for (let i = 0; i < 20; i++) await st.step();
  const plant = await st.box('[data-toy="hydrangea"] [role="img"]');
  await record(st, join(work, "hydrangea"), N, {
    dt: DT,
    clip: pad(plant, 40, 60, 40, 0),
    before: async (i, t) => {
      const y = lerp(max - 620, max - 205, ease.inOutSine(clamp01((t - 0.3) / 3.6)));
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    },
  });
  await st.close();
});

// the strap and the side of the case, close, the device turning to show them
await clip("strap", async () => {
  const st = await openStage({ browser, viewport: DESKTOP, dsf: 6 });
  const lan = await st.box('svg[class*="lanyard"]');
  await record(st, join(work, "strap"), N, {
    dt: DT,
    clip: pad(lan, 40, -70, 150, 30),
    before: async (i) => {
      const a = (i / N) * Math.PI * 2;
      await st.tilt(-0.55 + Math.sin(a) * 0.25, Math.cos(a) * 0.18);
    },
  });
  await st.close();
});

await browser.close();
