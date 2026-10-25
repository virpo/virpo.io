#!/bin/sh
# Video #1, the screen recording (about 20 s, 1920x1080, 60 fps) into output/lab/video/virpo-demo.mp4.
# Needs the static site served:  npm run build && python3 -m http.server 4450 -d dist
#
#   sh scripts/video/demo.sh [skip-capture]
set -e
WORK=output/lab/video/.demo
OUT=output/lab/video
if [ "$1" != "skip-capture" ]; then
  rm -rf "$WORK"
  node scripts/video/demo.mjs "$WORK"
fi
node -e '
const fs = require("fs"), path = require("path");
const work = path.resolve(process.argv[1]);
const urls = { home: "virpo.io", post: "virpo.io/blog/how-this-room-was-made", projects: "virpo.io" };
const takes = ["home", "post", "projects"].map((name) => {
  const dir = path.join(work, "demo-" + name);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const n = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
  return { name, dir: "file://" + dir, n, url: urls[name], boxes: meta.boxes };
});
fs.writeFileSync(path.join(work, "data.json"), JSON.stringify({ takes }));
console.log(takes.map((t) => t.name + " " + t.n).join(", "), "frames:", takes.reduce((a, t) => a + t.n, 0));
' "$WORK"
FRAMES=$(node -e 'const d=require(require("path").resolve(process.argv[1])); console.log(d.takes.reduce((a,t)=>a+t.n,0))' "$WORK/data.json")
node scripts/video/director.mjs scripts/video/demo-scene.html "$WORK/data.json" "$FRAMES" "$OUT/virpo-demo.mp4"
