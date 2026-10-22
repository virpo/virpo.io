import { ACCENT, BAYER, type Framebuffer, type Tone } from "../framebuffer";
import { cursorLed, type Scene, type SceneContext } from "../types";

// FACE: Peter's 121 gaze photos from face.virpo.sk, prepared once into a
// greyscale sheet (components/sidecar/tools/build-face-sprite.mjs) and
// ordered-dithered here to the LCD's four tones. Loaded only when FACE opens.

export const FACE_SHEET_URL = "/lab/sidecar/face-sheet.webp";
const STEPS = 11;
const CELL = 96;

/** Greyscale sheet, one byte per pixel, 255 = blank glass. */
let sheet: Uint8Array | null = null;
let sheetWidth = 0;
let loading: Promise<void> | null = null;
const frames = new Map<number, Uint8Array>();

function loadSheet(onReady: () => void) {
  if (sheet) return;
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
      const { data, width } = context.getImageData(0, 0, canvas.width, canvas.height);
      const grey = new Uint8Array(width * canvas.height);
      for (let i = 0; i < grey.length; i += 1) grey[i] = data[i * 4];
      sheet = grey;
      sheetWidth = width;
      resolve();
    };
    image.onerror = () => {
      loading = null;
      resolve();
    };
    image.src = FACE_SHEET_URL;
  });
  void loading.then(onReady);
}

/** One gaze frame as LCD tones: a 4x4 Bayer threshold between neighbouring tones. */
function frame(column: number, row: number) {
  const key = row * STEPS + column;
  const cached = frames.get(key);
  if (cached || !sheet) return cached ?? null;
  const tones = new Uint8Array(CELL * CELL);
  for (let y = 0; y < CELL; y += 1) {
    const source = (row * CELL + y) * sheetWidth + column * CELL;
    for (let x = 0; x < CELL; x += 1) {
      const ink = (1 - sheet[source + x] / 255) * 3;
      const base = Math.floor(ink);
      const threshold = (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
      tones[y * CELL + x] = Math.min(3, base + (ink - base > threshold ? 1 : 0));
    }
  }
  frames.set(key, tones);
  return tones;
}

const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));

export function createFaceScene(): Scene {
  let gx = 0;
  let gy = 0;
  let inverted = false;
  let nudge = 0;

  const watching = (context: SceneContext) => Boolean(context.gaze) && context.t - context.gazeAt <= 4;

  function targetGaze(context: SceneContext) {
    if (context.gaze && watching(context)) return context.gaze;
    if (context.reduced) return { x: nudge, y: 0 };
    // Nobody is pointing: let him look around the room on his own.
    const t = context.t * 0.35;
    return { x: clamp(nudge + Math.sin(t) * 0.7 + Math.sin(t * 2.3) * 0.2), y: Math.sin(t * 0.7 + 1) * 0.45 };
  }

  return {
    id: "face",
    enter(context) {
      loadSheet(() => context.invalidate());
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
      const tones = frame(column, row);
      if (tones) {
        for (let y = 0; y < CELL; y += 1) {
          for (let x = 0; x < CELL; x += 1) {
            const tone = tones[y * CELL + x] as Tone;
            if (tone) fb.px(ox + x, oy + y, tone);
          }
        }
        if (inverted) fb.invert(ox, oy, CELL, CELL);
      } else {
        fb.text("LOADING", 80, 44, 2, { align: "center" });
        fb.text("FACE...", 80, 51, 2, { align: "center" });
        const dots = Math.floor(context.t * 4) % 4;
        for (let i = 0; i < 3; i += 1) fb.rect(75 + i * 4, 60, 2, 2, i < dots ? 3 : 1);
      }

      // Left column: subject card.
      fb.text("FACE", 3, 4, 3);
      fb.text("PH-01", 3, 11, 2);
      fb.text("SUBJ.", 3, 22, 2);
      fb.text("PETER", 3, 29, 3);
      fb.text("H.", 3, 36, 3);
      const live = watching(context);
      if (live) {
        fb.rect(3, 85, 3, 3, ACCENT);
        fb.text("SEES", 8, 84, 3);
        fb.text("YOU", 3, 91, 3);
      } else {
        fb.text("LOOK", 3, 84, 2);
        fb.text("AROUND", 3, 91, 2);
      }

      // Right column: a little gaze radar.
      const rx = 133;
      const ry = 4;
      fb.frame(rx, ry, 23, 23, 2);
      fb.hline(rx + 1, rx + 21, ry + 11, 1);
      fb.vline(rx + 11, ry + 1, ry + 21, 1);
      const dotX = rx + 11 + Math.round(((column - 5) / 5) * 9);
      const dotY = ry + 11 + Math.round(((row - 5) / 5) * 9);
      fb.rect(dotX - 1, dotY - 1, 3, 3, live ? ACCENT : 3);
      const hx = (column - 5) * 3;
      const hy = (5 - row) * 3;
      const signed = (value: number) => `${value < 0 ? "-" : "+"}${String(Math.abs(value)).padStart(2, "0")}`;
      fb.text(`X${signed(hx)}`, 157, 31, 3, { align: "right" });
      fb.text(`Y${signed(hy)}`, 157, 38, 3, { align: "right" });
      fb.text(inverted ? "NEG." : "POS.", 157, 84, 2, { align: "right" });
      fb.text("4 TONE", 157, 91, 2, { align: "right" });
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
      return "Peter's face on the LCD. He follows your cursor, or your finger on the screen.";
    },
    softkeys() {
      return ["Left", inverted ? "Normal" : "Invert", "Right"];
    },
  };
}
