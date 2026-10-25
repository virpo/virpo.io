#!/bin/sh
# Video #1, the screen recording (about 20 s) into output/lab/video/virpo-demo{,-4k}.mp4.
# Each take is captured, filmed into a 4K master and its frames deleted before the next, so the
# frames never need more than one take's worth of disk (about 600 MB).
# Needs the static site served:  npm run build && python3 -m http.server 4450 -d dist
#
#   sh scripts/video/demo.sh
set -e
WORK=output/lab/video/.demo
OUT=output/lab/video
rm -rf "$WORK"; mkdir -p "$WORK"
for TAKE in home post projects; do
  node scripts/video/demo.mjs "$WORK" "$TAKE"
  node -e '
const fs = require("fs"), path = require("path");
const [work, name] = [path.resolve(process.argv[1]), process.argv[2]];
const urls = { home: "virpo.io", post: "virpo.io/blog/how-this-room-was-made", projects: "virpo.io" };
const dir = path.join(work, "demo-" + name);
const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
const n = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
fs.writeFileSync(path.join(work, "data.json"), JSON.stringify({ takes: [{ name, dir: "file://" + dir, n, url: urls[name], boxes: meta.boxes }] }));
fs.writeFileSync(path.join(work, "n.txt"), String(n));
' "$WORK" "$TAKE"
  node scripts/video/director.mjs scripts/video/demo-scene.html "$WORK/data.json" "$(cat "$WORK/n.txt")" "$WORK/seg-$TAKE.mp4"
  rm -rf "$WORK/demo-$TAKE"
done
sh scripts/video/share.sh "$OUT/virpo-demo" "$WORK/seg-home.mp4" "$WORK/seg-post.mp4" "$WORK/seg-projects.mp4"
