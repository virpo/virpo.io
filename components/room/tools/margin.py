"""The sleeping shiba in a post's margin: one painting (art/margin/shiba.png, prompt
prompts/margin-shiba.txt), asleep on the left half and awake on the right, on magenta.

Keys the magenta, then lines the two halves up on their cushions (centre and bottom edge), so the
crossfade from asleep to awake doesn't jump. Writes public/lab/room/margin/shiba-{asleep,awake}.webp.
"""
from pathlib import Path

import numpy as np
from PIL import Image

from cut import magenta_alpha

HERE = Path(__file__).parent
SRC = HERE / "art" / "margin" / "shiba.png"
OUT = HERE.parents[2] / "public" / "lab" / "room" / "margin"
SIZE = 640


def cushion_anchor(alpha):
    """Centre x and bottom y of the cushion: the widest band of opaque rows near the bottom."""
    rows = np.where((alpha > 128).any(1))[0]
    bottom = rows.max()
    band = alpha[bottom - 120 : bottom] > 128
    cols = np.where(band.any(0))[0]
    return (cols.min() + cols.max()) / 2, bottom


def main():
    rgb = np.array(Image.open(SRC).convert("RGB"))
    rgb, alpha = magenta_alpha(rgb)
    w = rgb.shape[1]
    halves = []
    for x0, x1 in ((0, w // 2), (w // 2, w)):
        rgba = np.dstack([rgb[:, x0:x1], alpha[:, x0:x1]])
        halves.append((rgba, cushion_anchor(alpha[:, x0:x1])))

    # one square crop, the same size around each anchor, big enough for both dogs
    top = min(np.where((h[0][..., 3] > 16).any(1))[0].min() - h[1][1] for h in halves)
    left = min(np.where((h[0][..., 3] > 16).any(0))[0].min() - h[1][0] for h in halves)
    right = max(np.where((h[0][..., 3] > 16).any(0))[0].max() - h[1][0] for h in halves)
    side = int(max(-top, right - left) + 24)

    OUT.mkdir(parents=True, exist_ok=True)
    for (rgba, (cx, by)), name in zip(halves, ("asleep", "awake")):
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        img = Image.fromarray(rgba)
        canvas.paste(img, (int(side / 2 - cx), int(side - 12 - by)), img)
        canvas.resize((SIZE, SIZE), Image.LANCZOS).save(OUT / f"shiba-{name}.webp", quality=88, method=6)
        print(OUT / f"shiba-{name}.webp")


if __name__ == "__main__":
    main()
