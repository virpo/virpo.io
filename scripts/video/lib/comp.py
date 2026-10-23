"""Small compositor for the launch video: frame sequences, sub-pixel camera moves, rounded screens.

Everything is drawn into a float32 RGB canvas. Images are resampled with Lanczos straight from the
source pixels to the output pixels for every frame (PIL resize with a fractional box), so slow zooms
and pans never snap to whole pixels and never shimmer.
"""

import json
import math
import os

import numpy as np
from PIL import Image

FPS = 60
PAPER = (250, 247, 242)
INK = (29, 26, 23)


# ---------------------------------------------------------------- easing

def clamp01(t):
    return max(0.0, min(1.0, t))


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = clamp01(t)
    return t * t * (3 - 2 * t)


def in_out_cubic(t):
    t = clamp01(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def in_out_quart(t):
    t = clamp01(t)
    return 8 * t ** 4 if t < 0.5 else 1 - (-2 * t + 2) ** 4 / 2


def in_out_sine(t):
    t = clamp01(t)
    return -(math.cos(math.pi * t) - 1) / 2


def out_cubic(t):
    t = clamp01(t)
    return 1 - (1 - t) ** 3


def out_quart(t):
    t = clamp01(t)
    return 1 - (1 - t) ** 4


def out_expo(t):
    t = clamp01(t)
    return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)


def mix_rgb(a, b, t):
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


# ---------------------------------------------------------------- sources

class Clip:
    """A captured frame sequence: work/<name>/fNNNN.(png|jpg) plus meta.json."""

    def __init__(self, work, name):
        self.name = name
        self.dir = os.path.join(work, name)
        self.files = sorted(f for f in os.listdir(self.dir) if f.startswith("f") and f[-4:] in (".png", ".jpg"))
        meta = os.path.join(self.dir, "meta.json")
        self.meta = json.load(open(meta)) if os.path.exists(meta) else {}
        self._cache = {}
        # geometry is in CSS px: frames of one clip may be grabbed at different pixel scales
        if "css" in self.meta:
            self.size = tuple(self.meta["css"])
        else:
            self.size = Image.open(os.path.join(self.dir, self.files[0])).size

    def __len__(self):
        return len(self.files)

    def get(self, i):
        i = int(max(0, min(len(self.files) - 1, i)))
        if i not in self._cache:
            if len(self._cache) > 4:
                self._cache.pop(next(iter(self._cache)))
            im = Image.open(os.path.join(self.dir, self.files[i]))
            self._cache[i] = im.convert("RGB")
        return self._cache[i]


class Still:
    def __init__(self, path, mode="RGB"):
        self.im = Image.open(path).convert(mode)
        self.size = self.im.size

    def get(self, i=0):
        return self.im


def sample(img, box, size):
    """Resample the fractional source box of img to size (w, h); edges are extended, never clamped."""
    bx0, by0, bx1, by1 = box
    w, h = size
    fx = (bx1 - bx0) / w
    fy = (by1 - by0) / h
    m = int(math.ceil(max(fx, fy, 1.0) * 3)) + 2
    cx0, cy0 = math.floor(bx0) - m, math.floor(by0) - m
    cx1, cy1 = math.ceil(bx1) + m, math.ceil(by1) + m
    W0, H0 = img.size
    crop = img.crop((max(cx0, 0), max(cy0, 0), min(cx1, W0), min(cy1, H0)))
    pl, pt = max(0, -cx0), max(0, -cy0)
    pr, pb = max(0, cx1 - W0), max(0, cy1 - H0)
    if pl or pt or pr or pb:
        a = np.asarray(crop)
        widths = ((pt, pb), (pl, pr)) + (((0, 0),) if a.ndim == 3 else ())
        crop = Image.fromarray(np.pad(a, widths, mode="edge"))
    return crop.resize((w, h), Image.LANCZOS, box=(bx0 - cx0, by0 - cy0, bx1 - cx0, by1 - cy0))


# ---------------------------------------------------------------- canvas

class Canvas:
    def __init__(self, w, h, color=PAPER):
        self.w, self.h = w, h
        self.a = np.empty((h, w, 3), np.float32)
        self.a[:] = color

    def region(self, rect, grow=0.0):
        x0, y0, x1, y1 = rect
        ix0 = max(0, int(math.floor(x0 - grow)))
        iy0 = max(0, int(math.floor(y0 - grow)))
        ix1 = min(self.w, int(math.ceil(x1 + grow)))
        iy1 = min(self.h, int(math.ceil(y1 + grow)))
        if ix1 <= ix0 or iy1 <= iy0:
            return None
        xs = np.arange(ix0, ix1, dtype=np.float32)[None, :] + 0.5
        ys = np.arange(iy0, iy1, dtype=np.float32)[:, None] + 0.5
        return (ix0, iy0, ix1, iy1), xs, ys

    def blend(self, box, rgb, alpha):
        ix0, iy0, ix1, iy1 = box
        dst = self.a[iy0:iy1, ix0:ix1]
        if np.isscalar(alpha):
            dst += (rgb - dst) * alpha
        else:
            dst += (rgb - dst) * alpha[..., None]

    def frame(self):
        return np.clip(self.a + 0.5, 0, 255).astype(np.uint8)


def sdf_rrect(xs, ys, rect, r):
    x0, y0, x1, y1 = rect
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    hw, hh = (x1 - x0) / 2, (y1 - y0) / 2
    r = max(0.0, min(r, hw, hh))
    qx = np.abs(xs - cx) - (hw - r)
    qy = np.abs(ys - cy) - (hh - r)
    ox, oy = np.maximum(qx, 0), np.maximum(qy, 0)
    return np.sqrt(ox * ox + oy * oy) + np.minimum(np.maximum(qx, qy), 0) - r


def fill_rrect(cv, rect, r, color, alpha=1.0):
    reg = cv.region(rect, 1)
    if not reg or alpha <= 0:
        return
    box, xs, ys = reg
    cov = np.clip(0.5 - sdf_rrect(xs, ys, rect, r), 0, 1) * alpha
    cv.blend(box, np.array(color, np.float32), cov)


def shadow(cv, rect, r, blur, dx=0.0, dy=0.0, alpha=0.25, color=(70, 50, 30)):
    if alpha <= 0.002:
        return
    x0, y0, x1, y1 = rect
    srect = (x0 + dx, y0 + dy, x1 + dx, y1 + dy)
    reg = cv.region(srect, blur * 2.5)
    if not reg:
        return
    box, xs, ys = reg
    sd = sdf_rrect(xs, ys, srect, r)
    a = alpha / (1 + np.exp(np.clip(sd / max(blur * 0.42, 0.3), -30, 30)))
    cv.blend(box, np.array(color, np.float32), a)


def draw_image(cv, img, rect, clip=None, r=0.0, alpha=1.0, src_box=None):
    """Draw img (or its src_box) mapped onto the fractional output rect, masked by the rounded clip rect."""
    if alpha <= 0.002:
        return
    clip = clip or rect
    reg = cv.region(clip)
    if not reg:
        return
    (ix0, iy0, ix1, iy1), xs, ys = reg
    sx0, sy0, sx1, sy1 = src_box or (0, 0, img.size[0], img.size[1])
    x0, y0, x1, y1 = rect
    kx = (sx1 - sx0) / (x1 - x0)
    ky = (sy1 - sy0) / (y1 - y0)
    box = (sx0 + (ix0 - x0) * kx, sy0 + (iy0 - y0) * ky, sx0 + (ix1 - x0) * kx, sy0 + (iy1 - y0) * ky)
    px = sample(img, box, (ix1 - ix0, iy1 - iy0))
    arr = np.asarray(px, np.float32)
    if arr.shape[2] == 4:
        cov = arr[..., 3] / 255.0
        arr = arr[..., :3]
    else:
        cov = None
    if r > 0 or clip is not rect:
        m = np.clip(0.5 - sdf_rrect(xs, ys, clip, r), 0, 1)
        cov = m if cov is None else cov * m
    if cov is None:
        cov = alpha
    else:
        cov = cov * alpha
    cv.blend((ix0, iy0, ix1, iy1), arr, cov)


# ---------------------------------------------------------------- cameras

class Cam:
    """A view of some plane: centre (cx, cy) in plane units and zoom (output px per plane unit)."""

    def __init__(self, cx, cy, zoom, w, h):
        self.cx, self.cy, self.zoom, self.w, self.h = cx, cy, zoom, w, h

    def rect(self, x0, y0, x1, y1):
        z = self.zoom
        return ((x0 - self.cx) * z + self.w / 2, (y0 - self.cy) * z + self.h / 2, (x1 - self.cx) * z + self.w / 2, (y1 - self.cy) * z + self.h / 2)


def dolly(a, b, u):
    """Zoom from camera a to b along u (0..1): log-space zoom, centre moving with the visible width,
    so the move reads as one straight pull back instead of a swing."""
    za, zb = a[2], b[2]
    z = math.exp(lerp(math.log(za), math.log(zb), u))
    if abs(1 / zb - 1 / za) < 1e-9:
        w = u
    else:
        w = (1 / z - 1 / za) / (1 / zb - 1 / za)
    return lerp(a[0], b[0], w), lerp(a[1], b[1], w), z


def fit_cam(cx, cy, height, w, h):
    """camera on a source showing `height` source px vertically"""
    return Cam(cx, cy, h / height, w, h)
