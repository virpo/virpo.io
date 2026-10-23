"""Card art for the app screens: the big, clean paintings of each object (not the in-room cut).

    python3 components/room/tools/cards.py refs     # write the reference crops for the prompts
    python3 components/room/tools/cards.py          # key, trim and ship every card
    python3 components/room/tools/cards.py tv deck  # just these

Sources: components/room/tools/art/cards/<id>.png, each a ChatGPT painting of one object on flat
#FF00FF magenta (prompts: components/room/tools/prompts/card-<id>.txt, painted with paint.sh and
two references: art/work/card-refs/crop-<id>.png and art/plate-b.png).
Output: public/lab/room/card-<id>.webp, sized to about 2x the largest size the card shows it at
(the art column is at most about 285 x 346 CSS px, on a 2560-wide desktop).
"""
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

from cut import magenta_alpha, preview

TOOLS = Path(__file__).resolve().parent
ART = Path(os.environ.get("ROOM_ART", TOOLS / "art"))
SRC = ART / "cards"
WORK = ART / "work"
REPO = TOOLS.parents[2]
OUT = REPO / "public/lab/room"

# id: the object's box in the cropped plate (same boxes as build.py's OBJECTS)
CARDS = {
    "arcade": (1243, 530, 1357, 694),
    "tv": (116, 538, 226, 634),
    "printer": (216, 386, 418, 600),
    "deck": (528, 448, 606, 514),
    "cork": (10, 226, 234, 446),
    "aiposter": (1212, 140, 1364, 425),
}
# Cards whose object has pink or magenta paint of its own: there only the background is keyed.
# Everywhere else any magenta tint is background (slivers seen between the printer's rods).
PINK = {"arcade", "deck"}
# Things that stand on something get a soft contact shadow on the card; wall things do not.
GROUNDED = {"arcade", "tv", "printer", "deck"}
CROP_X = 104  # build.py crops the 3:2 painting to 4:3 by cutting this much off the left
FIT = (580, 700)  # max width, height of a shipped card in px (2x the largest CSS size)
BUDGET = 120_000


def refs():
    """Reference crops of each object from the plate, upscaled, for the card prompts."""
    plate = Image.open(ART / "plate-b.png").convert("RGB")
    dest = WORK / "card-refs"
    dest.mkdir(parents=True, exist_ok=True)
    for cid, (x0, y0, x1, y1) in CARDS.items():
        m = max(12, (x1 - x0) // 6)
        c = plate.crop((x0 + CROP_X - m, y0 - m, x1 + CROP_X + m, y1 + m))
        s = max(1, 1024 // max(c.size))
        c.resize((c.width * s, c.height * s), Image.LANCZOS).save(dest / f"crop-{cid}.png")
        print(dest / f"crop-{cid}.png")


def key(src, pink=True):
    """Magenta to alpha with despill, minus specks and stray magenta-ish rims; trimmed.
    pink=False: the object has no pink paint, so every magenta tint is keyed, enclosed or not."""
    rgb = np.asarray(src.convert("RGB"))
    out, a = magenta_alpha(rgb)
    if not pink:
        f = rgb.astype(np.float32)
        m = np.minimum(f[..., 0], f[..., 2]) - f[..., 1]
        a = np.minimum(a, (255 * (1 - np.clip((m - 25) / 60, 0, 1)))).astype(np.uint8)
    # Only key the background: magenta-ish regions that touch the frame edge, or that hold
    # near-pure #FF00FF (the background seen through the printer frame). Pink paint inside the
    # object (deck keys, the arcade's pixel hills) is enclosed by ink and stays opaque.
    f = rgb.astype(np.int16)
    pure = (np.minimum(f[..., 0], f[..., 2]) - f[..., 1] > 190) & (f[..., 1] < 70)
    lab, n = ndi.label(a < 250)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg_ids = set(edge.tolist()) | set(np.unique(lab[pure]).tolist())
    bg_ids.discard(0)
    bg = np.isin(lab, list(bg_ids))
    if not pink:
        bg |= a < 250
    # thin slivers of background between rods, anti-aliased into lighter or darker pinks: small
    # magenta-tinted specks right next to the keyed background go too
    tint = (np.minimum(f[..., 0], f[..., 2]) - f[..., 1] > 30) & ~bg
    near = ndi.binary_dilation(bg, iterations=14)
    lab2, n2 = ndi.label(tint)
    if n2:
        sizes = ndi.sum(tint, lab2, range(1, n2 + 1))
        touching = ndi.maximum(near, lab2, range(1, n2 + 1))
        ids = [i + 1 for i in range(n2) if sizes[i] < 400 and touching[i]]
        sliver = np.isin(lab2, ids)
        bg |= sliver
        a = np.where(sliver, 0, a).astype(np.uint8)
    # unmix the edge pixels: observed = alpha * paint + (1 - alpha) * magenta
    al = np.maximum(a.astype(np.float32) / 255, 0.25)[..., None]
    paint = (f - (1 - al) * np.array([255, 0, 255])) / al
    paint = np.clip(np.minimum(paint, out.astype(np.float32) + 0), 0, 255).astype(np.uint8)
    out = np.where(bg[..., None], paint, rgb)
    a = np.where(bg, a, 255).astype(np.uint8)
    solid = a > 24
    # keep the object (and anything big enough to be part of it), drop specks and noise
    lab, n = ndi.label(solid)
    if n > 1:
        sizes = ndi.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= max(400, sizes.max() * 0.002)])
        a = np.where(keep, a, 0).astype(np.uint8)
    # a one-pixel choke: the outermost rim of a painted ink line is still tinted by the background
    hard = ndi.binary_erosion(a > 128, iterations=1)
    a = np.minimum(a, (ndi.gaussian_filter(hard.astype(np.float32), 0.7) * 255).astype(np.uint8))
    ys, xs = np.where(a > 8)
    pad = 6
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(a.shape[1], xs.max() + 1 + pad), min(a.shape[0], ys.max() + 1 + pad)
    return Image.fromarray(np.dstack([out, a])[y0:y1, x0:x1])


def fit(img):
    s = min(FIT[0] / img.width, FIT[1] / img.height, 1)
    if s < 1:
        # resize premultiplied so the dark ink does not bleed into transparent pixels
        a = np.asarray(img).astype(np.float32) / 255
        pre = Image.fromarray((np.dstack([a[..., :3] * a[..., 3:], a[..., 3:]]) * 255).astype(np.uint8))
        size = (round(img.width * s), round(img.height * s))
        pre = np.asarray(pre.resize(size, Image.LANCZOS)).astype(np.float32) / 255
        alpha = pre[..., 3:]
        rgb = np.where(alpha > 0, pre[..., :3] / np.maximum(alpha, 1e-6), 0)
        img = Image.fromarray((np.clip(np.dstack([rgb, alpha]), 0, 1) * 255).astype(np.uint8))
    return img


def ship(cid):
    src = Image.open(SRC / f"{cid}.png")
    card = fit(key(src, pink=cid in PINK))
    path = OUT / f"card-{cid}.webp"
    for q in (88, 84, 80, 76, 72):
        card.save(path, "WEBP", quality=q, method=6, alpha_quality=90)
        if path.stat().st_size <= BUDGET:
            break
    WORK.mkdir(parents=True, exist_ok=True)
    arr = np.asarray(card)
    preview(arr[..., :3], arr[..., 3], WORK / f"card-{cid}-check.png")
    print(f"{path.relative_to(REPO)}  {card.width}x{card.height}  {path.stat().st_size // 1024} KB  q{q}")


def manifest():
    """components/room/screens/cards.ts: the size of every shipped card, for width/height."""
    rows = []
    for cid in CARDS:
        path = OUT / f"card-{cid}.webp"
        if path.exists():
            w, h = Image.open(path).size
            rows.append(f'  {cid}: {{ src: "/lab/room/card-{cid}.webp", width: {w}, height: {h}, grounded: {"true" if cid in GROUNDED else "false"} }},')
    ts = "// Generated by components/room/tools/cards.py. Card art for the app screens, keyed by object id.\n"
    ts += "export const CARD_ART: Record<string, { src: string; width: number; height: number; grounded: boolean }> = {\n"
    ts += "\n".join(rows) + "\n};\n"
    (REPO / "components/room/screens/cards.ts").write_text(ts)


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["refs"]:
        refs()
    else:
        for cid in args or CARDS:
            ship(cid)
        manifest()
