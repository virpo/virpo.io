// Builds the 1-bit FACE sprite for the Sidecar LCD from Peter's gaze photos
// on face.virpo.sk. face.virpo.sk sends no CORS headers, so the browser cannot
// read those pixels at runtime; we dither them once here instead.
//
// Usage: node components/sidecar/tools/build-face-sprite.mjs
// Output: public/lab/sidecar/face-sprite.png (11 x 11 cells, CELL px each)
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const BASE = "https://face.virpo.sk/faces/";
const STEPS = [-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15];
const CELL = 96;
const CROP = { left: 40, top: 14, width: 180, height: 180 };
const out = resolve(process.cwd(), "public/lab/sidecar/face-sprite.png");

const sanitize = (value) => value.toFixed(1).replace("-", "m").replace(".", "p");
const url = (h, v) => `${BASE}gaze_px${sanitize(h)}_py${sanitize(v)}_256.webp`;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function cell(h, v) {
  const response = await fetch(url(h, v));
  if (!response.ok) throw new Error(`${response.status} ${url(h, v)}`);
  const input = Buffer.from(await response.arrayBuffer());
  const { data } = await sharp(input)
    .extract(CROP)
    .resize(CELL, CELL, { kernel: "lanczos3" })
    .grayscale()
    .clahe({ width: 24, height: 24, maxSlope: 3 })
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Luminance with a soft oval vignette that fades the torii background out,
  // so the face reads clearly at 1 bit.
  const lum = new Float32Array(CELL * CELL);
  for (let y = 0; y < CELL; y += 1) {
    for (let x = 0; x < CELL; x += 1) {
      const i = y * CELL + x;
      let value = data[i] / 255;
      value = Math.pow(value, 0.9);
      value = (value - 0.5) * 1.2 + 0.6;
      const dx = (x - CELL * 0.5) / (CELL * 0.5);
      const dy = (y - CELL * 0.52) / (CELL * 0.56);
      const d = Math.sqrt(dx * dx + dy * dy);
      value = value + (1 - value) * smooth(0.75, 1.0, d);
      lum[i] = Math.min(1, Math.max(0, value));
    }
  }

  // Atkinson dithering: the classic Mac look, airy highlights, crisp features.
  const bits = new Uint8Array(CELL * CELL);
  const spread = [
    [1, 0, 2], [2, 0, 2], [-1, 1, 2], [0, 1, 2], [1, 1, 2], [0, 2, 2],
  ];
  for (let y = 0; y < CELL; y += 1) {
    for (let x = 0; x < CELL; x += 1) {
      const i = y * CELL + x;
      const old = lum[i];
      const next = old < 0.5 ? 0 : 1;
      bits[i] = next;
      const error = old - next;
      for (const [ox, oy, weight] of spread) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx >= 0 && nx < CELL && ny < CELL) lum[ny * CELL + nx] += (error * weight) / 16;
      }
    }
  }
  return bits;
}

const size = CELL * STEPS.length;
const sheet = Buffer.alloc(size * size, 255);
for (const [row, v] of [...STEPS].reverse().entries()) {
  for (const [column, h] of STEPS.entries()) {
    const bits = await cell(h, v);
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        sheet[(row * CELL + y) * size + column * CELL + x] = bits[y * CELL + x] ? 255 : 0;
      }
    }
    process.stdout.write(".");
  }
}

await mkdir(resolve(out, ".."), { recursive: true });
await sharp(sheet, { raw: { width: size, height: size, channels: 1 } })
  .png({ palette: true, colours: 2, compressionLevel: 9, effort: 10 })
  .toFile(out);
console.log(`\nWrote ${out}`);
