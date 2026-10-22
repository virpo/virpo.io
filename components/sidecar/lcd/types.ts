import type { Framebuffer } from "./framebuffer";

export const MODES = ["face", "kana", "window", "sound", "bloom"] as const;
export type Mode = (typeof MODES)[number];

export type SceneContext = {
  /** Seconds since the engine started (frozen when motion is reduced). */
  t: number;
  dt: number;
  reduced: boolean;
  /** Reading progress 0..1 on a post page, null on the landing page. */
  progress: number | null;
  now: Date;
  night: boolean;
  /** Gaze target in -1..1 on both axes, null when no fine pointer is around. */
  gaze: { x: number; y: number } | null;
  /** Engine time of the last pointer movement. */
  gazeAt: number;
  invalidate(): void;
  announce(text: string): void;
};

export interface Scene {
  readonly id: Mode;
  enter?(context: SceneContext): void;
  leave?(context: SceneContext): void;
  draw(fb: Framebuffer, context: SceneContext): void;
  action?(context: SceneContext): void;
  prev?(context: SceneContext): void;
  next?(context: SceneContext): void;
  /** Twelve LED levels, 0..1. */
  leds(context: SceneContext): number[];
  describe(context: SceneContext): string;
  /** True while the scene must keep animating even with reduced motion (live audio). */
  live?(context: SceneContext): boolean;
  /** Soft-key labels for the three small buttons: prev, action, next. */
  softkeys(context: SceneContext): [string, string, string];
}

export const LED_COUNT = 12;

export function fillLeds(fraction: number) {
  const lit = Math.max(0, Math.min(1, fraction)) * LED_COUNT;
  return Array.from({ length: LED_COUNT }, (_, index) => Math.max(0, Math.min(1, lit - index)));
}

export function cursorLed(fraction: number) {
  const index = Math.round(Math.max(0, Math.min(1, fraction)) * (LED_COUNT - 1));
  return Array.from({ length: LED_COUNT }, (_, i) => (i === index ? 1 : Math.abs(i - index) === 1 ? 0.15 : 0));
}
