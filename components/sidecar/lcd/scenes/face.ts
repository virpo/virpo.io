import { type Framebuffer } from "../framebuffer";
import { cursorLed, type Scene, type SceneContext } from "../types";

// FACE: Peter's gaze photos from face.virpo.sk, pre-dithered to one bit
// (components/sidecar/tools/build-face-sprite.mjs) into an 11 x 11 sprite.

export const FACE_SPRITE_URL = "/lab/sidecar/face-sprite.png";
const STEPS = 11;
const CELL = 96;

let sprite: Uint8Array | null = null;
let loading: Promise<void> | null = null;

function loadSprite(onReady: () => void) {
  if (sprite) return;
  loading ??= new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return resolve();
      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      const bits = new Uint8Array(width * height);
      for (let i = 0; i < bits.length; i += 1) bits[i] = data[i * 4] < 128 ? 1 : 0;
      sprite = bits;
      resolve();
    };
    image.onerror = () => resolve();
    image.src = FACE_SPRITE_URL;
  });
  void loading.then(onReady);
}

const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));

export function createFaceScene(): Scene {
  let gx = 0;
  let gy = 0;
  let inverted = false;
  let nudge = 0;

  function targetGaze(context: SceneContext) {
    const idle = !context.gaze || context.t - context.gazeAt > 4;
    if (context.gaze && !idle) return context.gaze;
    if (context.reduced) return { x: nudge, y: 0 };
    // Nobody is pointing: let him look around the room on his own.
    const t = context.t * 0.35;
    return { x: clamp(nudge + Math.sin(t) * 0.7 + Math.sin(t * 2.3) * 0.2), y: Math.sin(t * 0.7 + 1) * 0.45 };
  }

  return {
    id: "face",
    enter(context) {
      loadSprite(() => context.invalidate());
      context.announce(this.describe(context));
    },
    draw(fb: Framebuffer, context) {
      const target = targetGaze(context);
      const ease = context.reduced ? 1 : Math.min(1, context.dt * 10);
      gx += (target.x - gx) * ease;
      gy += (target.y - gy) * ease;
      const column = Math.round(((clamp(gx) + 1) / 2) * (STEPS - 1));
      const row = Math.round(((1 - clamp(gy)) / 2) * (STEPS - 1));

      fb.clear(0);
      const ox = 32;
      const oy = 2;
      if (sprite) {
        const stride = CELL * STEPS;
        for (let y = 0; y < CELL; y += 1) {
          const source = (row * CELL + y) * stride + column * CELL;
          for (let x = 0; x < CELL; x += 1) {
            if (sprite[source + x]) fb.px(ox + x, oy + y, 3);
          }
        }
      } else {
        fb.text("LOADING", 80, 46, 2, { align: "center" });
        fb.text("FACE...", 80, 53, 2, { align: "center" });
      }

      // Left column: label and model.
      fb.text("FACE", 3, 4, 3);
      fb.text("PH-01", 3, 11, 2);
      fb.text("LOOK", 3, 84, 2);
      fb.text("AROUND", 3, 91, 2);
      // Right column: a little gaze radar.
      const rx = 133;
      const ry = 4;
      fb.frame(rx, ry, 23, 23, 2);
      fb.hline(rx + 1, rx + 21, ry + 11, 1);
      fb.vline(rx + 11, ry + 1, ry + 21, 1);
      const dotX = rx + 11 + Math.round(((column - 5) / 5) * 9);
      const dotY = ry + 11 + Math.round(((row - 5) / 5) * 9);
      fb.rect(dotX - 1, dotY - 1, 3, 3, 3);
      const hx = (column - 5) * 3;
      const hy = (5 - row) * 3;
      const signed = (value: number) => `${value < 0 ? "-" : "+"}${String(Math.abs(value)).padStart(2, "0")}`;
      fb.text(`X${signed(hx)}`, 157, 31, 3, { align: "right" });
      fb.text(`Y${signed(hy)}`, 157, 38, 3, { align: "right" });
      fb.text("1BIT", 157, 91, 2, { align: "right" });

      if (inverted) fb.invert(ox, oy, CELL, CELL);
    },
    action(context) {
      inverted = !inverted;
      context.announce(inverted ? "Face inverted, like a film negative." : "Face back to normal.");
    },
    prev(context) {
      nudge = clamp(nudge - 0.5);
      context.announce("Peter looks left.");
    },
    next(context) {
      nudge = clamp(nudge + 0.5);
      context.announce("Peter looks right.");
    },
    leds() {
      return cursorLed((clamp(gx) + 1) / 2);
    },
    describe() {
      return "Peter's face, dithered to one bit. He follows your cursor.";
    },
    softkeys() {
      return ["Look left", inverted ? "Positive" : "Negative", "Look right"];
    },
  };
}
