// Builds the FACE sheet for the Sidecar LCD from Peter's 121 gaze photos on
// face.virpo.sk. That host sends no CORS headers, so the browser cannot read
// the pixels at runtime; we prepare them once here and ship one same-origin
// greyscale sheet. The LCD dithers it to its four tones (Bayer 4x4) at draw
// time, so the face, the palette and the "negative" mode always match.
//
// Usage:
//   node components/sidecar/tools/build-face-sprite.mjs [dir-with-gaze-webps]
// Without a directory the 121 frames are fetched from face.virpo.sk.
// Output: public/lab/sidecar/face-sheet.webp (11 x 11 cells, CELL px each).
// Rows run from looking up (+15) to looking down (-15), columns from left to right.
import { readFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const BASE = "https://face.virpo.sk/faces/";
const STEPS = [-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15];
const CELL = 96;
const CROP = { left: 40, top: 16, width: 176, height: 176 };
const out = resolve(process.cwd(), "public/lab/sidecar/face-sheet.webp");
const sourceDir = process.argv[2];

const sanitize = (value) => value.toFixed(1).replace("-", "m").replace(".", "p");
const fileName = (h, v) => `gaze_px${sanitize(h)}_py${sanitize(v)}_256.webp`;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function source(h, v) {
  if (sourceDir) return readFile(join(sourceDir, fileName(h, v)));
  const response = await fetch(BASE + fileName(h, v));
  if (!response.ok) throw new Error(`${response.status} ${BASE + fileName(h, v)}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Distance from the head's centre in an ellipse, 0 at the centre and 1 at its edge. */
function ellipse(x, y, size = CELL) {
  const dx = (x - size * 0.5) / (size * 0.5);
  const dy = (y - size * 0.52) / (size * 0.55);
  return Math.sqrt(dx * dx * 1.15 + dy * dy);
}

async function cell(h, v, size = CELL) {
  const input = await source(h, v);
  const base = sharp(input).extract(CROP).resize(size, size, { kernel: "lanczos3" });
  const { data: rgb } = await base.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // Local contrast brings out eyes, brows and the grin on a brightly lit face.
  const { data: grey } = await base.clone().greyscale().clahe({ width: Math.round(size * 0.21), height: Math.round(size * 0.21), maxSlope: 3 }).raw().toBuffer({ resolveWithObject: true });

  const lum = new Float32Array(size * size);
  for (let i = 0; i < lum.length; i += 1) {
    const r = rgb[i * 3] / 255;
    const g = rgb[i * 3 + 1] / 255;
    const b = rgb[i * 3 + 2] / 255;
    const max = Math.max(r, g, b);
    const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
    const value = grey[i] / 255;
    // The torii behind him are saturated vermilion. Fade them to blank glass,
    // but only outside the face, so the open mouth keeps its shadow.
    const torii = smooth(0.45, 0.7, saturation) * smooth(0.05, 0.25, r - g * 1.25) * smooth(0.58, 0.78, ellipse(i % size, Math.floor(i / size), size));
    lum[i] = value + (1 - value) * torii * 0.9;
  }

  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(sorted.length * 0.03)];
  const hi = sorted[Math.floor(sorted.length * 0.99)];
  const pixels = Buffer.alloc(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      let value = Math.min(1, Math.max(0, (lum[i] - lo) / (hi - lo)));
      value = Math.pow(value, 1.2);
      value += (1 - value) * smooth(0.78, 0.97, ellipse(x, y, size));
      pixels[i] = Math.round(value * 255);
    }
  }
  return pixels;
}

const size = CELL * STEPS.length;
const sheet = Buffer.alloc(size * size, 255);
for (const [row, v] of [...STEPS].reverse().entries()) {
  for (const [column, h] of STEPS.entries()) {
    const pixels = await cell(h, v);
    for (let y = 0; y < CELL; y += 1) pixels.copy(sheet, (row * CELL + y) * size + column * CELL, y * CELL, (y + 1) * CELL);
    process.stdout.write(".");
  }
}

await mkdir(resolve(out, ".."), { recursive: true });
await sharp(sheet, { raw: { width: size, height: size, channels: 1 } }).webp({ quality: 70, effort: 6 }).toFile(out);
console.log(`\nWrote ${out}`);

// The author avatar on post pages: the straight-ahead frame, dithered to the
// same four LCD tones, as a tiny indexed PNG.
const AVATAR = 80;
const PALETTE = [
  [0xd4, 0xd7, 0xc8],
  [0xa2, 0xa7, 0x98],
  [0x5b, 0x61, 0x56],
  [0x1d, 0x21, 0x1b],
];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const small = await cell(0, 0, AVATAR);
const avatar = Buffer.alloc(AVATAR * AVATAR * 3);
for (let y = 0; y < AVATAR; y += 1) {
  for (let x = 0; x < AVATAR; x += 1) {
    const ink = (1 - small[y * AVATAR + x] / 255) * 3;
    const base = Math.floor(ink);
    const tone = Math.min(3, base + (ink - base > (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16 ? 1 : 0));
    PALETTE[tone].forEach((value, channel) => (avatar[(y * AVATAR + x) * 3 + channel] = value));
  }
}
const avatarOut = resolve(process.cwd(), "public/lab/sidecar/peter-lcd.png");
await sharp(avatar, { raw: { width: AVATAR, height: AVATAR, channels: 3 } }).png({ palette: true, colours: 4, compressionLevel: 9 }).toFile(avatarOut);
console.log(`Wrote ${avatarOut}`);
