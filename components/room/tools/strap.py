"""The handheld's wrist strap (Lanyard.tsx), painted as one picture: art/strap/strap.png on magenta
(try 2 of 2), prompt prompts/strap.txt, reference art/strap/strap-now-ref.png (the vector strap it
replaces). Keys the magenta, keeps the strap, crops it tight and writes public/lab/room/strap.webp.

    python3 components/room/tools/strap.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

from cut import magenta_alpha

HERE = Path(__file__).parent
OUT = HERE.parents[2] / "public" / "lab" / "room" / "strap.webp"


def main():
    rgb, alpha = magenta_alpha(np.array(Image.open(HERE / "art" / "strap" / "strap.png").convert("RGB")))
    labels, n = ndi.label(alpha > 60)
    sizes = ndi.sum(np.ones_like(labels), labels, range(1, n + 1))
    keep = ndi.binary_dilation(labels == 1 + int(np.argmax(sizes)), iterations=4)
    alpha = np.where(keep, alpha, 0)
    ys, xs = np.where(alpha > 16)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    # centre the crop on the top of the thin cord, which hangs from the lug
    top = np.where(alpha[y0 : y0 + 8] > 100)[1]
    cx = int(top.mean())
    half = max(cx - x0, x1 - cx) + 2
    crop = np.zeros((y1 - y0, half * 2, 4), np.uint8)
    left = half - (cx - x0)
    crop[:, left : left + (x1 - x0)] = np.dstack([rgb, alpha])[y0:y1, x0:x1]
    img = Image.fromarray(crop)
    h = 900
    img = img.resize((round(img.width * h / img.height), h), Image.LANCZOS)
    img.save(OUT, quality=88, method=6)
    print(OUT, img.size)


if __name__ == "__main__":
    main()
