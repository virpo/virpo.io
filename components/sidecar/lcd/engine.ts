import { getTokyoParts } from "../../../lib/japan/bloom";
import { Framebuffer } from "./framebuffer";
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
    if (dirty || (animating() && accumulator >= FRAME)) {
      accumulator = accumulator % FRAME;
      dirty = false;
      draw(now);
    }
    if (animating()) schedule();
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
