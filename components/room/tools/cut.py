"""Cut the painted plate into layers.

Object masks: inside each object's box, pixels that can be reached from the box edge without
crossing an ink line are background; everything enclosed is the object. Ink lines come from a
luminance + gradient edge map, closed by a small dilation so watercolor gaps don't leak.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

# Source PNGs (plate-b.png, view.png, trains.png, peter-sheet.png, props.png) are in art/.
HERE = Path(os.environ.get("ROOM_ART", Path(__file__).parent / "art"))
WORK = HERE / "work"
WORK.mkdir(exist_ok=True)


def lum(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def edge_map(rgb, dark=105, grad=38, grow=1):
    L = lum(rgb.astype(np.float32))
    gx = ndi.sobel(L, axis=1)
    gy = ndi.sobel(L, axis=0)
    g = np.hypot(gx, gy) / 4
    e = (L < dark) | (g > grad)
    if grow:
        e = ndi.binary_dilation(e, iterations=grow)
    return e


def object_mask(rgb, box, dark=105, grad=38, grow=1, close=2, keep="largest", min_area=60, clip=None):
    x0, y0, x1, y1 = box
    sub = rgb[y0:y1, x0:x1]
    e = edge_map(sub, dark, grad, grow)
    free = ~e
    lab, n = ndi.label(free)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    bg = np.isin(lab, list(border))
    m = ~bg
    m = ndi.binary_fill_holes(m)
    # drop thin lines touching the border (other objects' outlines)
    m = ndi.binary_opening(m, iterations=2)
    if close:
        m = ndi.binary_closing(m, iterations=close)
        m = ndi.binary_fill_holes(m)
    lab2, n2 = ndi.label(m)
    if n2:
        sizes = ndi.sum(m, lab2, range(1, n2 + 1))
        if keep == "largest":
            m = lab2 == (1 + int(np.argmax(sizes)))
        else:
            m = np.isin(lab2, [i + 1 for i, s in enumerate(sizes) if s >= min_area])
    if clip is not None:
        m &= clip[y0:y1, x0:x1]
    full = np.zeros(rgb.shape[:2], bool)
    full[y0:y1, x0:x1] = m
    return full


def soft(mask, feather=0.8):
    a = Image.fromarray((mask * 255).astype(np.uint8))
    if feather:
        a = a.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(a)


def magenta_alpha(rgb, lo=40, hi=150):
    a = rgb.astype(np.float32)
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    alpha = 1 - np.clip((m - lo) / (hi - lo), 0, 1)
    # despill: pull magenta out of the edge pixels
    spill = np.clip(m, 0, None)[..., None] * (1 - alpha[..., None]) * 0.9
    out = a.copy()
    out[..., 0] -= spill[..., 0]
    out[..., 2] -= spill[..., 0]
    edge = (alpha > 0) & (alpha < 1)
    out[..., 0] = np.where(edge, np.minimum(out[..., 0], a[..., 1] + 40), out[..., 0])
    out[..., 2] = np.where(edge, np.minimum(out[..., 2], a[..., 1] + 40), out[..., 2])
    return np.clip(out, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)


def inpaint(rgb, mask, rounds=40):
    """Fill mask with a diffused version of the surroundings (good enough under a lifted object)."""
    out = rgb.astype(np.float32).copy()
    known = ~mask
    # nearest known pixel first
    idx = ndi.distance_transform_edt(~known, return_distances=False, return_indices=True)
    out = out[idx[0], idx[1]]
    for _ in range(rounds):
        blurred = np.stack([ndi.uniform_filter(out[..., c], 9) for c in range(3)], -1)
        out = np.where(mask[..., None], blurred, out)
    return out.astype(np.uint8)


def checker(w, h, s=12):
    y, x = np.mgrid[0:h, 0:w]
    c = (((x // s) + (y // s)) % 2) * 40 + 190
    return np.stack([c, c * 0 + 120 + (c - 190), c], -1).astype(np.uint8)


def preview(rgb, alpha, path):
    h, w = alpha.shape
    bg = checker(w, h)
    a = alpha[..., None] / 255
    Image.fromarray((rgb * a + bg * (1 - a)).astype(np.uint8)).save(path)


if __name__ == "__main__":
    print("module")
