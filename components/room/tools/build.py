"""Build the Pocket Room layers into public/lab/room and write components/room/scene/layers.ts."""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

from cut import inpaint, magenta_alpha, object_mask, preview, soft
from fixes import apply_fixes

# Source PNGs (plate-b.png, view.png, trains.png, peter-sheet.png, props.png) are in art/;
# repairs painted over them (art/fixes/) are applied by fixes.py before keying.
HERE = Path(os.environ.get("ROOM_ART", Path(__file__).parent / "art"))
REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "public/lab/room"
OUT.mkdir(parents=True, exist_ok=True)
WORK = HERE / "work"
WORK.mkdir(parents=True, exist_ok=True)

CROP_X = 104
W, H = 1365, 1024

plate_src = np.asarray(Image.open(HERE / "plate-b.png").convert("RGB"))[:, CROP_X:CROP_X + W].copy()
rgb = plate_src.copy()


def poly_mask(points, shape=(H, W)):
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon(points, fill=255)
    return np.asarray(im) > 0


def save_webp(arr_rgba, path, q=84):
    Image.fromarray(arr_rgba).save(path, "WEBP", quality=q, method=6, alpha_quality=90)


manifest = {"plate": {"w": W, "h": H}, "objects": {}, "sprites": {}}

# --- window glass -------------------------------------------------------------------------
window_poly = [(712, 20), (1212, 128), (1212, 530), (712, 420)]
win_region = poly_mask(window_poly)
_, glass_alpha = magenta_alpha(plate_src)
glass = (glass_alpha < 128) & win_region
glass_alpha_full = np.where(win_region, glass_alpha, 255).astype(np.uint8)
gy, gx = np.where(glass)
glass_box = [int(gx.min()), int(gy.min()), int(gx.max() + 1), int(gy.max() + 1)]
manifest["glass"] = glass_box
keyed_rgb, _ = magenta_alpha(plate_src)
rgb = np.where(win_region[..., None], keyed_rgb, plate_src)

# --- objects cut from the plate -------------------------------------------------------------
# id: (box, options)
OBJECTS = {
    "radio": ((66, 50, 210, 208), {}),
    "clay": ((258, 112, 310, 186), {}),
    "mirror": ((232, 216, 346, 380), {"clip": [(232, 216), (334, 216), (334, 380), (232, 380)]}),
    "kana": ((330, 42, 530, 400), {"clip": [(334, 42), (530, 42), (530, 400), (334, 400)]}),
    "printer": ((216, 386, 418, 600), {"clip": [(216, 386), (418, 386), (418, 560), (400, 600), (216, 600)]}),
    "tv": ((116, 538, 226, 634), {}),
    "deck": ((528, 448, 606, 514), {}),
    "arcade": ((1243, 530, 1357, 694), {"clip": [(1252, 530), (1357, 530), (1357, 694), (1252, 694)]}),
    "hydrangea": ((1075, 436, 1340, 660), {"minus": ["arcade"], "noglass": True}),
    "aiposter": ((1212, 140, 1364, 425), {}),
    "cork": ((10, 226, 234, 446), {}),
    "books": ((896, 606, 1012, 732), {}),
    "plant": ((0, 640, 215, 1024), {"keep": "all"}),
}
masks = {}
for oid, (box, opt) in OBJECTS.items():
    clip = poly_mask(opt["clip"]) if "clip" in opt else None
    m = object_mask(plate_src, box, clip=clip, keep=opt.get("keep", "largest"))
    for other in opt.get("minus", []):
        m &= ~ndi.binary_dilation(masks[other], iterations=1)
    if opt.get("noglass"):
        m &= ~glass
    masks[oid] = m

# window frame: enclosed by its ink outline, minus what stands in front of it
wm = (object_mask(plate_src, (700, 12, 1222, 540), keep="largest") | glass) & poly_mask([(712, 22), (1210, 130), (1210, 524), (760, 424), (712, 420)])
wm &= ~ndi.binary_dilation(masks["hydrangea"], iterations=1)
masks["window"] = wm & ~glass
gm_alpha = np.where(ndi.binary_dilation(glass, iterations=2) & win_region, 255, 0).astype(np.uint8)
gm = Image.merge("RGBA", [Image.new("L", (W, H), 0)] * 3 + [Image.fromarray(gm_alpha)]).crop(tuple(glass_box))
gm.save(OUT / "glass-mask.png", optimize=True)

# printed part inside the printer: its own layer so it can grow
part_box = (296, 478, 356, 552)
pm = np.zeros((H, W), bool)
sub = plate_src[part_box[1]:part_box[3], part_box[0]:part_box[2]].astype(int)
orange = (sub[..., 0] > 150) & (sub[..., 0] - sub[..., 2] > 70)
orange = ndi.binary_closing(orange, iterations=2)
orange = ndi.binary_fill_holes(orange)
orange = ndi.binary_dilation(orange, iterations=1)
pm[part_box[1]:part_box[3], part_box[0]:part_box[2]] = orange
part_rgb = rgb.copy()
# the printer without its part: fill the part with the printer interior around it
rgb = inpaint(rgb, ndi.binary_dilation(pm, iterations=2), rounds=60)
ys, xs = np.where(pm)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
save_webp(np.dstack([part_rgb[y0:y1, x0:x1], soft(pm, 0.6)[y0:y1, x0:x1]]), OUT / "part.webp")
manifest["sprites"]["part"] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]

holes = np.zeros((H, W), bool)
for oid, m in masks.items():
    ys, xs = np.where(m)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    a = soft(m, 0.7)[y0:y1, x0:x1]
    piece = np.dstack([rgb[y0:y1, x0:x1], a])
    if oid == "window":
        piece[..., 3] = np.minimum(piece[..., 3], glass_alpha_full[y0:y1, x0:x1])
    save_webp(piece, OUT / f"obj-{oid}.webp")
    preview(rgb[y0:y1, x0:x1], piece[..., 3], WORK / f"o-{oid}.png")
    manifest["objects"][oid] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
    if oid != "window":
        holes |= m

# the old notebook stack is replaced by three separate notebooks
stack = poly_mask([(772, 548), (850, 524), (944, 560), (944, 600), (870, 638), (772, 590)])
holes_for_plate = holes | pm

base = inpaint(rgb, ndi.binary_dilation(holes_for_plate, iterations=1))
# the printer interior where the part was: keep it dark like the bed
plate_rgba = np.dstack([base, glass_alpha_full])
save_webp(plate_rgba, OUT / "plate.webp", q=82)
small = Image.fromarray(plate_rgba).resize((800, 600), Image.LANCZOS)
small.save(OUT / "plate-800.webp", "WEBP", quality=80, method=6)

# --- view through the window ---------------------------------------------------------------
view = Image.open(HERE / "view.png").convert("RGB")
view.resize((1024, 683), Image.LANCZOS).save(OUT / "view.webp", "WEBP", quality=74, method=6)
manifest["view"] = {"w": 1536, "h": 1024, "track": 528}


# --- sprites on magenta ----------------------------------------------------------------------
def keyed(name):
    src = apply_fixes(name, np.asarray(Image.open(HERE / f"{name}.png").convert("RGB")))
    out, a = magenta_alpha(src)
    return out, a


def crop_sprite(out, a, box, scale=1.0):
    x0, y0, x1, y1 = box
    piece = Image.fromarray(np.dstack([out[y0:y1, x0:x1], a[y0:y1, x0:x1]]))
    if scale != 1:
        piece = piece.resize((round(piece.width * scale), round(piece.height * scale)), Image.LANCZOS)
    return piece


def darken_hair(img):
    """The painted hair came out mid-brown; Peter's is dark brown. Darken brown, mid-value pixels up top."""
    a = np.asarray(img).astype(np.float32)
    rgb_ = a[..., :3] / 255
    mx, mn = rgb_.max(-1), rgb_.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb_[..., 0], rgb_[..., 1], rgb_[..., 2]
    brownish = (r >= g) & (g >= b * 0.9) & (s > 0.22) & (v < 0.72) & (v > 0.08)
    h = a.shape[0]
    rows = np.arange(h)[:, None] < h * 0.3
    m = brownish & rows & (a[..., 3] > 0)
    m = ndi.binary_opening(m, iterations=1)
    soft_m = ndi.gaussian_filter(m.astype(np.float32), 0.8)[..., None]
    dark = rgb_ * np.array([0.62, 0.56, 0.52])
    out = rgb_ * (1 - soft_m) + dark * soft_m
    a[..., :3] = np.clip(out * 255, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


# Peter: six poses, aligned on the chair (left edge of the chair back, bottom of the legs)
pout, pa = keyed("peter-sheet")
POSES = {
    "typing": (153, 36, 451, 489),
    "mug": (644, 41, 944, 489),
    "window": (1123, 34, 1417, 490),
    "reading": (160, 535, 461, 980),
    "page": (641, 535, 941, 981),
    "wave": (1122, 524, 1422, 981),
}
PETER = {"x": 362, "bottom": 806, "scale": 0.98}
for pose, (x0, y0, x1, y1) in POSES.items():
    pad = 2
    box = (x0 - pad, y0 - pad, x1 + pad, y1 + pad)
    piece = darken_hair(crop_sprite(pout, pa, box, PETER["scale"]))
    piece.save(OUT / f"peter-{pose}.webp", "WEBP", quality=84, method=6, alpha_quality=90)
    w, h = piece.size
    manifest["sprites"][f"peter-{pose}"] = [PETER["x"], PETER["bottom"] - h, w, h]

# props
rout, ra = keyed("props")
PROPS = {
    # name: (sheet box, scale, (x, y) top-left in plate)
    "notebook-2": ((1052, 46, 1441, 295), 0.31, (866, 524)),
    "notebook-1": ((576, 48, 964, 292), 0.31, (818, 550)),
    "notebook-0": ((97, 46, 488, 292), 0.31, (768, 576)),
    "cat": ((564, 344, 957, 637), 0.3, (1000, 838)),
}
for name, (box, scale, (px, py)) in PROPS.items():
    x0, y0, x1, y1 = box
    piece = crop_sprite(rout, ra, (x0 - 2, y0 - 2, x1 + 2, y1 + 2), scale)
    piece.save(OUT / f"{name}.webp", "WEBP", quality=84, method=6, alpha_quality=90)
    manifest["sprites"][name] = [px, py, piece.width, piece.height]

# trains: shinkansen = tail + middle + middle + head; local = two cars
tout, ta = keyed("trains")
def strip(parts, gap, scale):
    pieces = [crop_sprite(tout, ta, p, scale) for p in parts]
    hh = max(p.height for p in pieces)
    ww = sum(p.width for p in pieces) + gap * (len(pieces) - 1)
    canvas = Image.new("RGBA", (ww, hh), (0, 0, 0, 0))
    x = 0
    for p in pieces:
        canvas.alpha_composite(p, (x, hh - p.height))
        x += p.width + gap
    return canvas

tail, mid, head = (35, 255, 533, 399), (551, 255, 985, 399), (1002, 255, 1500, 399)
shinkansen = strip([tail, mid, mid, mid, head], 6, 0.5)
shinkansen.save(OUT / "train-shinkansen.webp", "WEBP", quality=84, method=6, alpha_quality=90)
local = strip([(82, 619, 758, 813), (779, 619, 1456, 813)], 6, 0.5)
local.save(OUT / "train-local.webp", "WEBP", quality=84, method=6, alpha_quality=90)
manifest["trains"] = {"shinkansen": list(shinkansen.size), "local": list(local.size), "scale": 0.5}

# --- hit shapes: convex hull of each layer's alpha, as % of its box ---
from scipy.spatial import ConvexHull
from skimage.measure import approximate_polygon


def hull_of(alpha, pad=3):
    ys, xs = np.where(alpha > 100)
    pts = np.stack([xs, ys], 1).astype(float)
    hull = ConvexHull(pts)
    ring = pts[hull.vertices]
    ring = np.vstack([ring, ring[:1]])
    ring = approximate_polygon(ring, tolerance=2.5)[:-1]
    h, w = alpha.shape
    cx, cy = w / 2, h / 2
    out = []
    for x, y in ring:
        # grow a little so the outline itself is inside the hit area
        dx, dy = x - cx, y - cy
        d = max(1e-6, (dx * dx + dy * dy) ** 0.5)
        x, y = x + dx / d * pad, y + dy / d * pad
        out.append([round(float(np.clip(x / w * 100, 0, 100)), 1), round(float(np.clip(y / h * 100, 0, 100)), 1)])
    return out


manifest["hulls"] = {}
for oid in list(manifest["objects"].keys()):
    a = np.asarray(Image.open(OUT / f"obj-{oid}.webp").convert("RGBA"))[..., 3]
    manifest["hulls"][oid] = hull_of(a)
for sid in ["notebook-0", "notebook-1", "notebook-2", "peter-typing"]:
    a = np.asarray(Image.open(OUT / f"{sid}.webp").convert("RGBA"))[..., 3]
    manifest["hulls"][sid] = hull_of(a)

# --- manifest ----------------------------------------------------------------------------------
ts = "// Generated by the layer build script (see docs/lab/v2-layers.md). Plate pixel coordinates.\n"
ts += "export const LAYERS = " + json.dumps(manifest, indent=2) + " as const;\n"
(REPO / "components/room/scene").mkdir(parents=True, exist_ok=True)
(REPO / "components/room/scene/layers.ts").write_text(ts)

# --- composite preview -------------------------------------------------------------------------
comp = Image.new("RGBA", (W, H))
v = view.resize((int(1536 * 0.5), int(1024 * 0.5)))
gx0, gy0, gx1, gy1 = glass_box
comp.paste(v.crop((100, 30, 100 + gx1 - gx0, 30 + gy1 - gy0)), (gx0, gy0))
comp.alpha_composite(Image.open(OUT / "plate.webp").convert("RGBA"))
for oid, (x, y, w, h) in manifest["objects"].items():
    comp.alpha_composite(Image.open(OUT / f"obj-{oid}.webp").convert("RGBA"), (x, y))
for name in ["part", "notebook-2", "notebook-1", "notebook-0", "cat", "peter-" + (sys.argv[1] if len(sys.argv) > 1 else "typing")]:
    x, y, w, h = manifest["sprites"][name]
    comp.alpha_composite(Image.open(OUT / f"{name}.webp").convert("RGBA"), (x, y))
comp.convert("RGB").save(WORK / "composite.png")
print(json.dumps({k: v for k, v in manifest.items() if k != "objects"}, indent=0)[:600])
