// Captures every source clip for the launch video and the og:video loop, frame by frame on the
// page's fake clock (see lib/stage.mjs). Each clip lands in <work>/<name>/fNNNN.(png|jpg).
//
// Usage: node scripts/video/capture.mjs <work dir> [clip names...]   (no names = all)
//        STILL=1 captures only the first frame of each clip (for layout work)
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { devices } from "@playwright/test";
import { clamp01, ease, FPS, launch, lerp, openStage, record } from "./lib/stage.mjs";

const work = process.argv[2] ?? "output/lab/video/.work";
const only = process.argv.slice(3);
const STILL = Boolean(process.env.STILL);
const n = (frames) => (STILL ? 1 : frames);

const DESKTOP = { width: 1440, height: 900 };
const IPHONE = { ...devices["iPhone 15 Pro"], viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 } };
const IPHONE_LAND = { ...devices["iPhone 15 Pro landscape"], viewport: { width: 852, height: 393 }, screen: { width: 852, height: 393 } };
const IPAD = { ...devices["iPad Pro 11"], viewport: { width: 834, height: 1194 }, screen: { width: 834, height: 1194 } };
const IPAD_LAND = { ...devices["iPad Pro 11 landscape"], viewport: { width: 1194, height: 834 }, screen: { width: 1194, height: 834 } };

const sel = {
  hit: (id) => `[data-hit="${id}"]`,
  screen: '[data-variant] [class$="__screen"]',
  knob: '[class*="device-module__"][class$="__knob"]',
  dpad: '[class*="device-module__"][class$="__dpad"]',
  clock: '[class*="device-module__"][class$="__clock"]',
  bezel: '[class*="device-module__"][class$="__bezel"]',
};

const centre = (b) => [b.x + b.width / 2, b.y + b.height / 2];
const pad = (b, l, t = l, r = l, bt = t) => ({ x: b.x - l, y: b.y - t, width: b.width + l + r, height: b.height + t + bt });
const quadratic = (p0, p1, p2, t) => [lerp(lerp(p0[0], p1[0], t), lerp(p1[0], p2[0], t), t), lerp(lerp(p0[1], p1[1], t), lerp(p1[1], p2[1], t), t)];

/** wait (fast, no frames) for a fresh shinkansen to enter the window */
async function nextShinkansen(stage, lead = 0) {
  const isTrain = () => Boolean(document.querySelector('[data-kind="shinkansen"]'));
  await stage.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
  await stage.seek(isTrain, { every: DT_SEEK });
  for (let i = 0; i < lead; i++) await stage.step();
}
const DT_SEEK = 1000 / FPS;

/** hide the page around the device (end card, og) */
const SOLO_CSS = `
  [class*="room-module__"][class$="__textCol"], [class*="room-module__"][class$="__deviceHint"], [class*="room-module__"][class$="__projects"], footer { display: none !important; }
  [class*="room-module__"][class$="__hero"] { grid-template-columns: 1fr !important; justify-items: center; padding: 0 !important; min-height: 100vh !important; max-width: none !important; }
  [class*="room-module__"][class$="__deviceCol"] { justify-self: center !important; width: var(--solo-w, 700px) !important; }
  main > *:not(section:first-child) { display: none !important; }
`;

async function soloStage(browser, dsf = 2) {
  const stage = await openStage({ browser, viewport: { width: 1600, height: 900 }, dsf, seed: 41 });
  await stage.page.addStyleTag({ content: SOLO_CSS });
  await stage.tilt(-0.18, 0.06);
  await stage.step();
  const box = await stage.box("[data-variant=hero]");
  return { stage, clip: pad(box, 70, 40, 90, 70) };
}

const clips = {
  // 0–4 s: the device full frame, a shinkansen, the pointer lifts the window; then the wall
  async hero(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 2.5 });
    await nextShinkansen(stage, 0);
    const win = await stage.box(sel.hit("window"));
    const target = [win.x + win.width * 0.52, win.y + win.height * 0.55];
    const from = [target[0] + 260, target[1] + 330];
    const bend = [target[0] + 230, target[1] + 40];
    await record(stage, join(work, "hero"), n(240), {
      info: { device: await stage.box("[data-variant=hero]"), screen: await stage.box(sel.screen) },
      // full resolution while the device fills the frame; once it is one screen on the wall, 1x is plenty
      scaleFor: (i) => (i < 64 ? "device" : i < 160 ? 0.8 : "css"),
      before: async (i, t) => {
        // a slow lean, left to right, a touch of nod
        const u = ease.inOutSine(clamp01(t / 4));
        await stage.tilt(lerp(-0.42, 0.2, u), lerp(0.18, -0.08, u));
        await stage.parallax(lerp(-0.3, 0.2, u), 0);
        const g = clamp01((t - 0.62) / 0.72);
        if (t < 0.62) await stage.pointer(from[0], from[1], { show: false, hover: false });
        else {
          const [x, y] = quadratic(from, bend, target, ease.inOutCubic(g));
          await stage.pointer(x, y, { hover: true });
        }
      },
    });
    await stage.close();
  },

  // wall tiles
  async "tile-iphone"(browser) {
    const stage = await openStage({ browser, device: IPHONE, dsf: 1.5, seed: 11 });
    await nextShinkansen(stage, 30);
    await record(stage, join(work, "tile-iphone"), n(150));
    await stage.close();
  },
  async "tile-iphone-land"(browser) {
    const stage = await openStage({ browser, device: IPHONE_LAND, dsf: 1.5, seed: 12 });
    await nextShinkansen(stage, 0);
    await record(stage, join(work, "tile-iphone-land"), n(150));
    await stage.close();
  },
  async "tile-ipad"(browser) {
    const stage = await openStage({ browser, device: IPAD, dsf: 1.5, seed: 13 });
    await nextShinkansen(stage, 50);
    await record(stage, join(work, "tile-ipad"), n(150));
    await stage.close();
  },
  // an iPad held sideways with the Shinkansen window open on its screen
  async "tile-ipad-land"(browser) {
    const stage = await openStage({ browser, device: IPAD_LAND, dsf: 1.5, seed: 14 });
    await stage.page.evaluate((s) => document.querySelector(s).click(), sel.hit("window"));
    await stage.page.evaluate((s) => document.querySelector(s).click(), sel.hit("window"));
    for (let i = 0; i < 40; i++) await stage.step();
    await record(stage, join(work, "tile-ipad-land"), n(150));
    await stage.close();
  },
  async "tile-writing"(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 1, path: "/room/writing/" });
    const rows = await stage.page.$$eval("a[href*='/room/blog/']", (els) => els.map((el) => { const r = el.getBoundingClientRect(); return [r.x + 160, r.y + r.height / 2]; }));
    await record(stage, join(work, "tile-writing"), n(150), {
      before: async (i, t) => {
        const a = rows[0];
        const b = rows[1] ?? rows[0];
        const [x, y] = quadratic([a[0] + 300, a[1] - 120], [a[0] + 60, a[1] - 40], t < 1.2 ? a : b, ease.inOutCubic(clamp01((t < 1.2 ? t - 0.3 : t - 1.2) / 0.5)));
        await stage.pointer(x, y);
      },
    });
    await stage.close();
  },
  // a post on a phone: the room comes along as a small strip
  async "tile-post-phone"(browser) {
    const stage = await openStage({ browser, device: IPHONE, dsf: 1.5, path: "/room/blog/weird-use-of-ai-3/", seed: 15 });
    const { page } = stage;
    await stage.preload();
    await record(stage, join(work, "tile-post-phone"), n(150), {
      before: async (i, t) => {
        const y = lerp(0, 420, ease.inOutSine(clamp01((t - 0.8) / 2.5)));
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      },
    });
    await stage.close();
  },
  async "tile-post"(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 1, path: "/room/blog/weird-use-of-ai-1/" });
    const { page } = stage;
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await stage.preload();
    await record(stage, join(work, "tile-post"), n(150), {

      before: async (i, t) => {
        const y = lerp(max * 0.18, max * 0.62, ease.inOutSine(clamp01(t / 2.5)));
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      },
    });
    await stage.close();
  },
  async "tile-projects"(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 1 });
    const { page } = stage;
    const top = await page.evaluate(() => document.querySelector('[class*="projectCard"]').getBoundingClientRect().top + scrollY - 110);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
    await stage.step();
    await stage.settle();
    const cards = await page.$$eval('[class*="projectCard"]', (els) => els.map((el) => { const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height * 0.35]; }));
    const a = cards[1];
    const b = cards[2];
    await record(stage, join(work, "tile-projects"), n(150), {

      before: async (i, t) => {
        if (t < 0.5) await stage.pointer(a[0] - 120, a[1] + 260, { show: false, hover: false });
        else if (t < 1.3) {
          const [x, y] = quadratic([a[0] - 120, a[1] + 260], [a[0] - 60, a[1] + 60], a, ease.inOutCubic(clamp01((t - 0.5) / 0.55)));
          await stage.pointer(x, y);
        } else {
          const [x, y] = quadratic(a, [lerp(a[0], b[0], 0.5), a[1] + 50], b, ease.inOutCubic(clamp01((t - 1.3) / 0.6)));
          await stage.pointer(x, y);
        }
      },
    });
    await stage.close();
  },

  // the knob, turned two notches, the device leaning so its rings show
  async knob(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 4 });
    const { page } = stage;
    await page.addStyleTag({ content: '[class*="device-module__"][class$="__knobMark"] { transition: none !important; }' });
    const knob = await stage.box(sel.knob);
    const notchAt = [4, 20]; // frames
    await page.mouse.move(...centre(knob));
    let base = 0;
    await record(stage, join(work, "knob"), n(36), {
      before: async (i, t) => {
        const u = clamp01(t / 0.6);
        await stage.tilt(lerp(0.5, -0.15, ease.inOutSine(u)), lerp(-0.5, -0.2, ease.inOutSine(u)));
        if (notchAt.includes(i)) await page.mouse.wheel(0, 60);
        // the knurl turns smoothly between notches (the site's own turn snaps 30° per notch)
        let deg = 0;
        for (const at of notchAt) deg += 30 * ease.outCubic(clamp01((i - at) / 9));
        base = deg;
        await page.evaluate((d) => document.querySelector("[data-variant]").style.setProperty("--knob", `${d}deg`), base);
      },
      clip: pad(knob, 380, 200, 110, 70),
    });
    await stage.close();
  },

  async dpad(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 4 });
    const { page } = stage;
    const dpad = await stage.box(sel.dpad);
    const key = async (dir) => stage.box(`[data-dir="${dir}"]`);
    const right = centre(await key("right"));
    const down = centre(await key("down"));
    await record(stage, join(work, "dpad"), n(36), {
      before: async (i, t) => {
        const u = clamp01(t / 0.6);
        await stage.tilt(lerp(-0.5, 0.15, ease.inOutSine(u)), lerp(-0.45, -0.15, ease.inOutSine(u)));
        if (i === 4) await page.mouse.click(...right);
        if (i === 19) await page.mouse.click(...down);
      },
      clip: pad(dpad, 220, 90, 260, 60),
    });
    await stage.close();
  },

  // Fig. 06: the window lifts, a click, and the Shinkansen window opens on the screen
  async "open-window"(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 3, seed: 21 });
    const { page } = stage;
    const screen = await stage.box(sel.screen);
    const win = await stage.box(sel.hit("window"));
    const target = [win.x + win.width * 0.5, win.y + win.height * 0.6];
    const from = [target[0] + 46, target[1] - 40];
    await stage.tilt(-0.1, 0.05);
    await record(stage, join(work, "open-window"), n(100), {
      before: async (i, t) => {
        await stage.tilt(lerp(-0.1, 0.02, t), lerp(0.05, 0, t));
        if (i <= 14) {
          const [x, y] = quadratic(from, [target[0] + 30, target[1] - 5], target, ease.inOutCubic(clamp01(i / 14)));
          await stage.pointer(x, y);
        }
        if (i === 16) await page.mouse.click(...target);
        if (i === 26) await stage.pointer(target[0], target[1], { show: false, hover: false });
      },
      clip: pad(screen, 165, 24),
    });
    await stage.close();
  },

  // Fig. 08: a hiragana card, flipped
  async kana(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 3, seed: 5 });
    const { page } = stage;
    const screen = await stage.box(sel.screen);
    await page.evaluate((s) => document.querySelector(s).click(), sel.hit("kana"));
    for (let i = 0; i < 40; i++) await stage.step();
    const card = await stage.box('[data-app] [class*="__card"]');
    const at = [card.x + card.width * 0.62, card.y + card.height * 0.7];
    await record(stage, join(work, "kana"), n(36), {
      before: async (i) => {
        await stage.tilt(0.05, 0.05);
        if (i < 8) {
          const [x, y] = quadratic([at[0] + 120, at[1] + 120], [at[0] + 90, at[1] + 20], at, ease.inOutCubic(i / 8));
          await stage.pointer(x, y);
        }
        if (i === 10) await page.mouse.click(...at);
      },
      clip: pad(screen, 24),
    });
    await stage.close();
  },

  // a project card from pencil to colour
  async card(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 3 });
    const { page } = stage;
    const top = await page.evaluate(() => document.querySelector('[class*="projectCard"]').getBoundingClientRect().top + scrollY - 200);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
    await stage.step();
    await stage.settle();
    const card = await stage.box('[class*="projectCard"]');
    const at = [card.x + card.width * 0.6, card.y + card.height * 0.42];
    const from = [at[0] + 260, at[1] + 240];
    await record(stage, join(work, "card"), n(66), {
      before: async (i) => {
        if (i < 6) await stage.pointer(...from, { show: false, hover: false });
        else if (i <= 24) {
          const [x, y] = quadratic(from, [at[0] + 200, at[1] + 30], at, ease.inOutCubic((i - 6) / 18));
          await stage.pointer(x, y);
        }
      },
      clip: pad(card, 120, 80, 120, 40),
    });
    await stage.close();
  },

  // Fig. 12: the arcade lifts with its label
  async label(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 7, seed: 3 });
    const screen = await stage.box(sel.screen);
    const arc = await stage.box(sel.hit("arcade"));
    const at = [arc.x + arc.width * 0.45, arc.y + arc.height * 0.55];
    const from = [at[0] - 140, at[1] + 120];
    await record(stage, join(work, "label"), n(36), {
      before: async (i) => {
        await stage.tilt(0.3, 0.1);
        if (i <= 10) {
          const [x, y] = quadratic(from, [at[0] - 110, at[1] + 10], at, ease.inOutCubic(i / 10));
          await stage.pointer(x, y);
        }
      },
      clip: { x: screen.x + 210, y: screen.y + 150, width: 350, height: 205 },
    });
    await stage.close();
  },

  // the bezel print, very close
  async clock(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 8 });
    const clock = await stage.box(sel.clock);
    await record(stage, join(work, "clock"), n(36), {
      before: async (i, t) => await stage.tilt(lerp(0.28, 0.4, t / 0.6), -0.1),
      clip: pad(clock, 230, 90, 70, 80),
    });
    await stage.close();
  },

  // the phone shapes, big (reused for the turn from tall to wide)
  async "phone-tall"(browser) {
    const stage = await openStage({ browser, device: IPHONE, dsf: 3, seed: 31 });
    await nextShinkansen(stage, 10);
    await record(stage, join(work, "phone-tall"), n(84));
    await stage.close();
  },
  async "phone-wide"(browser) {
    const stage = await openStage({ browser, device: IPHONE_LAND, dsf: 3, seed: 32 });
    await nextShinkansen(stage, 40);
    await record(stage, join(work, "phone-wide"), n(84));
    await stage.close();
  },

  // mini-Peter reads to the end of a post and waves
  async wave(browser) {
    const stage = await openStage({ browser, viewport: DESKTOP, dsf: 2, path: "/room/blog/weird-use-of-ai-1/" });
    const { page } = stage;
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), max - 420);
    await stage.preload(max - 420);
    for (let i = 0; i < 30; i++) await stage.step();
    const dock = await stage.box("[data-variant=dock]");
    await record(stage, join(work, "wave"), n(66), {
      before: async (i, t) => {
        const y = lerp(max - 420, max, ease.inOutCubic(clamp01((t - 0.05) / 0.45)));
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      },
      info: { dock },
    });
    await stage.close();
  },

  // end card and og loop: the device alone on paper
  async solo(browser) {
    const { stage, clip } = await soloStage(browser);
    await nextShinkansen(stage, 0);
    await record(stage, join(work, "solo"), n(150), { clip, info: { device: await stage.box("[data-variant=hero]") } });
    await stage.close();
  },
  // the og:video loop: from a quiet window, through a shinkansen, to a quiet window again
  async loop(browser) {
    // 30 fps is plenty for a calm loop, and half the frames
    const { stage, clip } = await soloStage(browser, 1.25);
    await stage.seek(() => document.querySelector("[data-kind]")?.dataset.kind === "local", { every: 50 });
    await stage.seek(() => !document.querySelector("[data-kind]"), { every: 50 });
    await record(stage, join(work, "loop"), n(390), {
      dt: 1000 / 30,

      clip,
      info: { device: await stage.box("[data-variant=hero]") },
      probe: () => stage.page.evaluate(() => document.querySelector("[data-kind]")?.dataset.kind ?? null),
    });
    await stage.close();
  },
  // "virpo.io" and the name, in the room's own Figtree, on a transparent background
  async type(browser) {
    const stage = await openStage({ browser, viewport: { width: 1400, height: 500 }, dsf: 3 });
    const { page } = stage;
    await page.evaluate(() => {
      const shell = document.querySelector('[class*="room-module__"][class$="__shell"]');
      for (const el of [document.documentElement, document.body, shell]) el.style.background = "transparent";
      shell.innerHTML = `
        <div id="t-url" style="position:absolute;left:40px;top:40px;padding:0 10px 24px;font:600 150px/1 var(--font-room-sans);letter-spacing:-0.045em;color:#1d1a17;white-space:nowrap">virpo<span style="color:#e8621c">.</span>io</div>
        <div id="t-name" style="position:absolute;left:40px;top:260px;padding:0 6px 12px;font:500 54px/1 var(--font-room-sans);letter-spacing:-0.02em;color:#1d1a17;white-space:nowrap">Peter Hraska</div>`;
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await mkdir(join(work, "type"), { recursive: true });
    for (const id of ["t-url", "t-name"]) {
      const el = await page.$("#" + id);
      await el.screenshot({ path: join(work, "type", `${id}.png`), omitBackground: true });
    }
    await stage.close();
  },
};

const browser = await launch();
for (const [name, run] of Object.entries(clips)) {
  if (only.length && !only.includes(name)) continue;
  const t0 = Date.now();
  await rm(join(work, name), { recursive: true, force: true });
  await run(browser);
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await browser.close();
