import { getTokyoParts } from "../../../lib/japan/bloom";
import { lcdSafe, measure } from "./font";
import { ACCENT, Framebuffer, LCD_H, LCD_W } from "./framebuffer";
import { createBloomScene } from "./scenes/bloom";
import { createFaceScene } from "./scenes/face";
import { createKanaScene } from "./scenes/kana";
import { createSoundScene } from "./scenes/sound";
import { createWindowScene } from "./scenes/window";
import type { Mode, Scene, SceneContext } from "./types";

export type EngineSnapshot = {
  mode: Mode;
  softkeys: [string, string, string];
  description: string;
};

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  mode: Mode;
  reducedMotion: boolean;
  onLeds(levels: number[]): void;
  onChange(snapshot: EngineSnapshot): void;
  onAnnounce(text: string): void;
};

export type Engine = {
  setMode(mode: Mode): void;
  action(): void;
  prev(): void;
  next(): void;
  setProgress(progress: number | null): void;
  setReducedMotion(reduced: boolean): void;
  setGaze(x: number, y: number): void;
  /** Scroll a line of text (a post title, say) along the bottom of the LCD; null clears it. */
  setTicker(text: string | null): void;
  destroy(): void;
};

const FRAME = 1 / 30;

export function createEngine(options: EngineOptions): Engine {
  const context2d = options.canvas.getContext("2d", { alpha: false });
  const fb = new Framebuffer();
  const scenes: Record<Mode, Scene> = {
    window: createWindowScene(),
    face: createFaceScene(),
    kana: createKanaScene(),
    sound: createSoundScene(),
    bloom: createBloomScene(),
  };
  let mode = options.mode;
  let reduced = options.reducedMotion;
  let progress: number | null = null;
  let visible = true;
  let onscreen = true;
  let raf = 0;
  let dirty = true;
  let last = performance.now();
  let accumulator = 0;
  let lastDraw = performance.now();
  let lastLeds = "";
  let ticker: { text: string; width: number; since: number } | null = null;
  const started = performance.now();

  const context: SceneContext = {
    t: 0,
    dt: 0,
    reduced,
    progress,
    now: new Date(),
    night: isNight(new Date()),
    gaze: null,
    gazeAt: -100,
    invalidate: () => {
      dirty = true;
      schedule();
      emitChange();
    },
    announce: (text) => options.onAnnounce(text),
  };

  function isNight(date: Date) {
    const { hour } = getTokyoParts(date);
    return hour < 5 || hour >= 19;
  }

  function emitChange() {
    const scene = scenes[mode];
    options.onChange({ mode, softkeys: scene.softkeys(context), description: scene.describe(context) });
  }

  function animating() {
    const scene = scenes[mode];
    return !reduced || Boolean(scene.live?.(context));
  }

  /** A ticker strip along the bottom edge, drawn over whatever scene is showing. */
  function drawTicker(now: number) {
    if (!ticker) return;
    const top = LCD_H - 10;
    fb.rect(0, top, LCD_W, 10, 3);
    fb.hline(0, LCD_W - 1, top - 1, 0);
    const lane = LCD_W - 14;
    const elapsed = (now - ticker.since) / 1000;
    let x = 13;
    if (ticker.width > lane && !reduced) {
      // Hold for a beat so the start is readable, then loop.
      const cycle = ticker.width + 40;
      x = 13 - (Math.max(0, elapsed * 34 - 30) % cycle);
      fb.text(ticker.text, Math.round(x + cycle), top + 3, 0);
    }
    const still = ticker.width > lane && reduced ? `${ticker.text.slice(0, Math.floor(lane / 4) - 3)}...` : ticker.text;
    fb.text(still, Math.round(x), top + 3, 0);
    // Keep the bullet clean where the text scrolls under it.
    fb.rect(0, top, 11, 10, 3);
    fb.rect(2, top + 2, 7, 7, ACCENT);
    fb.text("▶", 4, top + 3, 3);
  }

  function draw(now: number) {
    const scene = scenes[mode];
    context.t = (now - started) / 1000;
    context.dt = animating() ? Math.min(0.1, (now - lastDraw) / 1000) : 0;
    context.reduced = reduced;
    context.progress = progress;
    context.now = new Date();
    context.night = isNight(context.now);
    lastDraw = now;
    scene.draw(fb, context);
    drawTicker(now);
    if (context2d) fb.blit(context2d);
    const levels = scene.leds(context);
    const key = levels.map((value) => value.toFixed(2)).join();
    if (key !== lastLeds) {
      lastLeds = key;
      options.onLeds(levels);
    }
  }

  function tick(now: number) {
    raf = 0;
    if (!visible || !onscreen) return;
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    const moving = animating() || (ticker !== null && !reduced);
    if (dirty || (moving && accumulator >= FRAME)) {
      accumulator = accumulator % FRAME;
      dirty = false;
      draw(now);
    }
    if (moving) schedule();
  }

  function schedule() {
    if (raf || !visible || !onscreen) return;
    raf = requestAnimationFrame(tick);
  }

  const onVisibility = () => {
    visible = document.visibilityState !== "hidden";
    last = performance.now();
    if (visible) schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);

  let observer: IntersectionObserver | null = null;
  if (typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver((entries) => {
      onscreen = entries.some((entry) => entry.isIntersecting);
      last = performance.now();
      if (onscreen) {
        dirty = true;
        schedule();
      }
    });
    observer.observe(options.canvas);
  }

  scenes[mode].enter?.(context);
  emitChange();
  draw(performance.now());
  schedule();

  function run(fn: (scene: Scene) => void) {
    fn(scenes[mode]);
    dirty = true;
    emitChange();
    schedule();
  }

  return {
    setMode(next) {
      if (next === mode) return;
      scenes[mode].leave?.(context);
      mode = next;
      context.t = (performance.now() - started) / 1000;
      scenes[mode].enter?.(context);
      dirty = true;
      emitChange();
      schedule();
    },
    action: () => run((scene) => scene.action?.(context)),
    prev: () => run((scene) => scene.prev?.(context)),
    next: () => run((scene) => scene.next?.(context)),
    setProgress(value) {
      if (value === progress) return;
      progress = value;
      dirty = true;
      schedule();
    },
    setReducedMotion(value) {
      reduced = value;
      dirty = true;
      schedule();
    },
    setGaze(x, y) {
      context.gaze = { x, y };
      context.gazeAt = (performance.now() - started) / 1000;
      if (mode === "face") {
        dirty = true;
        schedule();
      }
    },
    setTicker(text) {
      const value = text ? lcdSafe(text).replace(/\s+/g, " ").trim() : "";
      if ((ticker?.text ?? "") === value) return;
      ticker = value ? { text: value, width: measure(value), since: performance.now() } : null;
      dirty = true;
      schedule();
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scenes[mode].leave?.(context);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      visible = false;
    },
  };
}
