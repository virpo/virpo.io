"""Toys in a post's margin (components/room/margin/). Every painting is in art/margin/, on magenta,
with its prompt in prompts/margin-<name>.txt; the concept sketches it followed are in
art/margin/concepts/.

Keys the magenta, cuts grids into cells and lines poses up so swapping one for another doesn't jump.
Writes public/lab/room/margin/*.webp and the positions the components need to
components/room/margin/art.json.

    python3 components/room/tools/margin.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

from cut import magenta_alpha

HERE = Path(__file__).parent
ART = HERE / "art" / "margin"
OUT = HERE.parents[2] / "public" / "lab" / "room" / "margin"
JSON = HERE.parent / "margin" / "art.json"


def keyed(name):
    rgb, alpha = magenta_alpha(np.array(Image.open(ART / name).convert("RGB")))
    alpha[alpha < 12] = 0
    return np.dstack([rgb, alpha])


def cells(rgba, cols, rows):
    h, w = rgba.shape[:2]
    return [rgba[r * h // rows : (r + 1) * h // rows, c * w // cols : (c + 1) * w // cols] for r in range(rows) for c in range(cols)]


def largest(rgba):
    """Keep only the biggest opaque blob (drops specks and bits of the neighbouring cell)."""
    labels, n = ndi.label(rgba[..., 3] > 40)
    if n > 1:
        sizes = ndi.sum(np.ones_like(labels), labels, range(1, n + 1))
        keep = ndi.binary_dilation(labels == 1 + int(np.argmax(sizes)), iterations=6)
        rgba = rgba.copy()
        rgba[..., 3] = np.where(keep, rgba[..., 3], 0)
    return rgba


def bbox(rgba):
    ys, xs = np.where(rgba[..., 3] > 16)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def save(rgba, name, size=None):
    img = Image.fromarray(rgba)
    if size:
        img = img.resize(size, Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{name}.webp", quality=88, method=6)
    print(OUT / f"{name}.webp", img.size)


def align(sprites, anchor="bottom", pad=16):
    """Put sprites on one shared square canvas, centred, sitting on the same baseline (or centred)."""
    boxes = [bbox(s) for s in sprites]
    side = max(max(b[2] - b[0], b[3] - b[1]) for b in boxes) + pad * 2
    out = []
    for s, (x0, y0, x1, y1) in zip(sprites, boxes):
        canvas = np.zeros((side, side, 4), np.uint8)
        crop = s[y0:y1, x0:x1]
        x = (side - (x1 - x0)) // 2
        y = side - pad - (y1 - y0) if anchor == "bottom" else (side - (y1 - y0)) // 2
        canvas[y : y + crop.shape[0], x : x + crop.shape[1]] = crop
        out.append(canvas)
    return out


def shiba_asleep_awake():
    """The sleeping shiba: asleep on the left, awake on the right, lined up on the cushion."""
    halves = align([largest(h) for h in cells(keyed("shiba.png"), 2, 1)], pad=12)
    for half, name in zip(halves, ("asleep", "awake")):
        save(half, f"shiba-{name}", (640, 640))


def pup():
    """The tiny walking shiba: trot, trot, scratch, asleep, in a 2x2 grid."""
    for sprite, name in zip(align([largest(c) for c in cells(keyed("pup.png"), 2, 2)]), ("trot-a", "trot-b", "scratch", "sleep")):
        save(sprite, f"pup-{name}", (256, 256))


def charm():
    """The strap charm, cropped so the top of its ring is the top centre: that is the pivot."""
    rgba = largest(keyed("charm.png"))
    x0, y0, x1, y1 = bbox(rgba)
    ring = np.where(rgba[y0 : y0 + 6, :, 3] > 100)[1]
    cx = int(ring.mean())
    half = max(cx - x0, x1 - cx) + 4
    crop = rgba[y0:y1, x0:x1]
    canvas = np.zeros((y1 - y0, half * 2, 4), np.uint8)
    left = half - (cx - x0)
    canvas[:, left : left + crop.shape[1]] = crop
    w = 400
    save(canvas, "charm", (w, round(canvas.shape[0] * w / canvas.shape[1])))


def crane():
    """Six folding stages, 3x2."""
    for i, sprite in enumerate(align([largest(c) for c in cells(keyed("crane.png"), 3, 2)], anchor="centre")):
        save(sprite, f"crane-{i + 1}", (512, 512))


def neko():
    """The lucky cat with its paw up (left) and down (right), lined up on one canvas."""
    up, down = align([largest(h) for h in cells(keyed("neko.png"), 2, 1)], pad=12)
    save(up, "neko-up", (560, 560))
    save(down, "neko-down", (560, 560))
    # the coin slot on its belly, in % of the canvas, placed by eye on neko-up.webp
    return {"slot": [51, 78]}


# Centre x, y and width of each bud cluster on hydrangea.webp, in %, placed by eye, listed in the
# order they open, with the flower head that opens there and a tilt so they don't look stamped.
BUDS = [(57, 39, 13, 2, -6), (30, 37, 13, 1, 8), (73.5, 50, 13, 5, -4), (23.5, 17.5, 13, 3, 10), (76.5, 22.5, 14, 6, -10), (49, 6, 14, 4, 4)]


def hydrangea():
    """The plant in bud, seen from the side so it stands on the screen's bottom edge (hydrangea.png
    was the first try, seen from above), and six flower heads that open over its bud clusters."""
    plant = keyed("hydrangea-side.png")
    x0, y0, x1, y1 = bbox(plant)
    side = max(x1 - x0, y1 - y0) + 24
    canvas = np.zeros((side, side, 4), np.uint8)
    ox, oy = (side - (x1 - x0)) // 2, side - 12 - (y1 - y0)
    canvas[oy : oy + y1 - y0, ox : ox + x1 - x0] = plant[y0:y1, x0:x1]
    save(canvas, "hydrangea", (640, 640))
    # head 6 of the first painting is split half blue, half violet: use the even violet one (2) from
    # the second painting instead
    heads = cells(keyed("hydrangea-heads.png"), 3, 2)[:5] + cells(keyed("hydrangea-heads-2.png"), 3, 2)[1:2]
    flowers = align([largest(c) for c in heads], anchor="centre", pad=4)
    for i, flower in enumerate(flowers):
        save(flower, f"bloom-{i + 1}", (256, 256))
    heads = []
    for cx, cy, bud, art, tilt in BUDS:
        w = bud * 1.75
        heads.append({"art": art, "x": round(cx - w / 2, 1), "y": round(cy - w / 2, 1), "w": round(w, 1), "tilt": tilt})
    return {"heads": heads}


def main():
    shiba_asleep_awake()
    pup()
    charm()
    crane()
    data = {"neko": neko(), "hydrangea": hydrangea()}
    JSON.write_text(json.dumps(data, indent=2) + "\n")
    print(JSON, json.dumps(data))


if __name__ == "__main__":
    main()
