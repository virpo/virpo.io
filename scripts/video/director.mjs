// Films a scene page frame by frame straight into ffmpeg, so finished frames never touch the disk.
// The scene defines window.render(frame) (async, resolves when that frame is painted) and reads
// window.DATA, which comes from a JSON file. Used by the screen recording (demo-scene.html) and the
// product video (bento-scene.html).
//
//   node scripts/video/director.mjs <scene.html> <data.json> <frames> <out.mp4> [width] [height]
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const [scene, dataFile, framesArg, out, wArg = "1920", hArg = "1080"] = process.argv.slice(2);
const frames = Number(framesArg);
const width = Number(wArg);
const height = Number(hArg);
const data = JSON.parse(await readFile(dataFile, "utf8"));

const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--font-render-hinting=none", "--disable-lcd-text", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("scene:", e.message));
await page.addInitScript((d) => (window.DATA = d), data);
await page.goto(pathToFileURL(resolve(scene)).href);
await page.evaluate(() => document.fonts.ready);
if (await page.evaluate(() => typeof window.ready === "function")) await page.evaluate(() => window.ready());

const ff = spawn("/opt/homebrew/bin/ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", "60", "-c:v", "png", "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p", "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709", out], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, fail) => ff.on("close", (code) => (code === 0 ? ok() : fail(new Error("ffmpeg " + code)))));

const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate((f) => window.render(f), f);
  const buf = await page.screenshot({ type: "png", caret: "hide" });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 120 === 0) console.log(`frame ${f}/${frames}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(out, `${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
