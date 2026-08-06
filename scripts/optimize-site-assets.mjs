import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = process.cwd();

export const assetJobs = [
  {
    source: "public/assets/v2/radio.png",
    output: "public/assets/optimized/radio.webp",
    width: 1200,
    height: 800,
    webp: { quality: 90, alphaQuality: 100, effort: 6, smartSubsample: false },
  },
  {
    source: "public/assets/v2/study-paper.png",
    output: "public/assets/optimized/study-paper.webp",
    width: 1200,
    height: 800,
    webp: { quality: 90, alphaQuality: 100, effort: 6, smartSubsample: false },
  },
  {
    source: "public/assets/train-window.png",
    output: "public/assets/optimized/train-window.webp",
    width: 1464,
    height: 800,
    webp: { quality: 90, alphaQuality: 100, effort: 6, smartSubsample: false },
  },
  {
    source: "public/assets/train-window-still.png",
    output: "public/assets/optimized/train-window-still.webp",
    width: 398,
    height: 208,
    webp: { quality: 84, effort: 6, smartSubsample: true },
  },
  {
    source: "public/assets/v2/bloom-lotus-large.png",
    output: "public/assets/optimized/bloom-lotus-large.webp",
    width: 480,
    height: 480,
    webp: { lossless: true, effort: 6 },
  },
];

export async function optimizeSiteAssets() {
  for (const job of assetJobs) {
    const output = resolve(root, job.output);
    await mkdir(dirname(output), { recursive: true });
    await sharp(resolve(root, job.source))
      .resize(job.width, job.height, {
        fit: "fill",
        kernel: sharp.kernel.nearest,
      })
      .webp(job.webp)
      .toFile(output);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  await optimizeSiteAssets();
}
