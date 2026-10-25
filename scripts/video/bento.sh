#!/bin/sh
# Video #2, the product video (15 s, 1920x1080, 60 fps) into output/lab/video/virpo-bento.mp4.
# Needs the static site served:  npm run build && python3 -m http.server 4450 -d dist
#
#   sh scripts/video/bento.sh [skip-capture]
set -e
WORK=output/lab/video/.bento
OUT=output/lab/video
if [ "$1" != "skip-capture" ]; then
  rm -rf "$WORK"
  node scripts/video/bento.mjs "$WORK"
fi
node -e '
const fs = require("fs"), path = require("path");
const work = path.resolve(process.argv[1]);
const clips = {};
for (const name of fs.readdirSync(work)) {
  const dir = path.join(work, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const n = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
  if (n) clips[name] = { dir: "file://" + dir, n };
}
const pup = "file://" + path.resolve("public/lab/room/margin");
fs.writeFileSync(path.join(work, "data.json"), JSON.stringify({ clips, pup }));
console.log(Object.entries(clips).map(([k, v]) => k + " " + v.n).join(", "));
' "$WORK"
node scripts/video/director.mjs scripts/video/bento-scene.html "$WORK/data.json" 900 "$OUT/virpo-bento.mp4"
