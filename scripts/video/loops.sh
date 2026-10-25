#!/bin/sh
# Records and encodes the making-of post's loops into public/assets/blog/pocket-room/story/
# (loop-<name>.mp4 and its poster loop-<name>.webp, the 41st frame).
# Needs the static site served:  npm run build && python3 -m http.server 4450 -d dist
#
#   sh scripts/video/loops.sh [names...]     (default: tilt room, the two that show the device)
set -e
NAMES=${*:-tilt room}
WORK=output/lab/video/.loops
OUT=public/assets/blog/pocket-room/story
for n in $NAMES; do
  rm -rf "$WORK/$n"
  node scripts/video/loops.mjs "$WORK" "$n"
  ffmpeg -loglevel error -y -framerate 30 -i "$WORK/$n/f%04d.jpg" -vf "scale='min(1200,iw)':-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 23 -movflags +faststart -an "$OUT/loop-$n.mp4"
  ffmpeg -loglevel error -y -i "$OUT/loop-$n.mp4" -vf "select=eq(n\,40)" -frames:v 1 "$WORK/poster.png"
  python3 -c "from PIL import Image; Image.open('$WORK/poster.png').save('$OUT/loop-$n.webp', quality=82, method=6)"
  rm -f "$WORK/poster.png"
  rm -rf "$WORK/$n"
done
