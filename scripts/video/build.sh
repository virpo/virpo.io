#!/bin/sh
# Builds the launch video (16:9 and 4:5), the og:video loop, its poster and the og:image.
# Needs the static site served:  npm run build && python3 -m http.server 4450 -d dist
#
#   sh scripts/video/build.sh [work dir]
#
# Clips are captured a few at a time and deleted once their segments are rendered, so the frames
# never need more than about 400 MB of disk at once.
set -e
WORK=${1:-output/lab/video/.work}
SEG="$WORK/seg"
cap() { node scripts/video/capture.mjs "$WORK" "$@"; }
seg() { for a in 16x9 4x5; do python3 scripts/video/compose.py "$WORK" --aspect $a --shots "$1" --segdir "$SEG/$a"; done; }

# the opening: the device, the pull back, the wall of screens
cap hero tile-iphone tile-iphone-land tile-ipad tile-ipad-land tile-post tile-post-phone tile-projects tile-writing
for t in tile-post tile-projects tile-writing; do python3 scripts/video/shrink.py "$WORK/$t" 820; done
python3 scripts/video/shrink.py "$WORK/tile-ipad" 700
python3 scripts/video/shrink.py "$WORK/tile-ipad-land" 1100
python3 scripts/video/shrink.py "$WORK/tile-iphone-land" 900
python3 scripts/video/shrink.py "$WORK/tile-iphone" 450
python3 scripts/video/shrink.py "$WORK/tile-post-phone" 450
seg opening
(cd "$WORK" && rm -rf hero tile-*)

# the detail cuts
cap knob dpad open-window kana
seg knob,dpad,window,kana
(cd "$WORK" && rm -rf knob dpad open-window kana)
cap card label clock wave phone-tall phone-wide solo type
seg card,label,clock,turn,wave,end
(cd "$WORK" && rm -rf card label clock wave phone-tall phone-wide)

python3 scripts/video/finish.py "$SEG" output/lab/video

# og:video loop, poster, og:image
cap loop
python3 scripts/video/og.py "$WORK" public/og
