#!/usr/bin/env python3
"""Shrink a captured clip's frames in place (wall screens are small; disk is not free).

  python3 scripts/video/shrink.py <clip dir> <max width> [max height]
"""

import os
import sys

from PIL import Image

d, mw = sys.argv[1], int(sys.argv[2])
mh = int(sys.argv[3]) if len(sys.argv) > 3 else 10 ** 6
for name in sorted(os.listdir(d)):
    if not name.endswith(".jpg"):
        continue
    p = os.path.join(d, name)
    im = Image.open(p)
    k = min(mw / im.width, mh / im.height)
    if k >= 1:
        continue
    im = im.convert("RGB").resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.save(p, quality=93, subsampling=0)
