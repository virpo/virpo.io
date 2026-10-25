#!/usr/bin/env python3
"""Composes the Pocket Room launch video from the clips that capture.mjs wrote.

  python3 scripts/video/compose.py <work> --aspect 16x9 --out video.mp4
  python3 scripts/video/compose.py <work> --aspect 16x9 --preview 0,130,200 --previewdir dir
  python3 scripts/video/compose.py <work> --aspect 16x9 --sheet sheet.jpg

The timeline runs on a 0.5 s beat (30 frames at 60 fps): the device alive for four beats, a pull
back to a wall of real screens for two, the wall for two, then detail cuts of one or two beats, and
an end card.
"""

import argparse
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from comp import (FPS, INK, PAPER, Cam, Canvas, Clip, Still, clamp01, dolly, draw_image, fill_rrect, in_out_cubic,  # noqa: E402
                  in_out_quart, in_out_sine, lerp, mix_rgb, out_cubic, out_quart, shadow, smooth)

WALL_BG = (234, 227, 216)
BEAT = 30

# ---------------------------------------------------------------- the wall

# The wall is laid out in rows: (top, outer height, anchor index, anchor x, screens). Wall units are
# output pixels when the wall is framed at zoom 1. The desktop room ("hero") sits in the middle row,
# because the pull back starts inside it. Screens bleed off the edges, so the wall reads as bigger
# than the frame.
GAP = 30
WALL = {
    "16x9": {
        "size": (1920, 1080),
        "rows": [
            (36, 228, 1, 576, [("tile-iphone-land", "phone"), ("tile-projects", "page"), ("tile-post", "page"), ("tile-writing", "page")]),
            (294, 486, 2, 576, [("tile-post-phone", "phone"), ("tile-ipad", "tablet"), ("hero", "page"), ("tile-iphone", "phone"), ("tile-ipad-land", "tablet")]),
            (810, 228, 2, 470, [("tile-iphone", "phone"), ("tile-writing", "page"), ("tile-projects", "page"), ("tile-iphone-land", "phone"), ("tile-post", "page")]),
        ],
    },
    "4x5": {
        "size": (1080, 1350),
        "rows": [
            (34, 236, 1, 156, [("tile-iphone-land", "phone"), ("tile-projects", "page"), ("tile-post", "page")]),
            (300, 480, 1, 156, [("tile-ipad", "tablet"), ("hero", "page"), ("tile-iphone", "phone")]),
            (810, 236, 1, 70, [("tile-writing", "page"), ("tile-iphone-land", "phone"), ("tile-projects", "page")]),
            (1076, 236, 1, 300, [("tile-post", "page"), ("tile-ipad-land", "tablet"), ("tile-writing", "page")]),
        ],
    },
}

BEZ = {"phone": 0.055, "tablet": 0.04, "page": 0.0}
RAD = {"phone": 0.15, "tablet": 0.045}


def screen_dims(clip, kind, h):
    """screen w, h and bezel for a screen whose outer box is h tall"""
    sw, sh = clip.size
    a = sw / sh
    hs = h / (1 + 2 * BEZ[kind] * min(a, 1))
    ws = a * hs
    return ws, hs, BEZ[kind] * min(ws, hs)


def tile_geom(clip, kind, x, y, h):
    """outer box (x, y, h) -> screen rect, bezel, screen corner radius"""
    ws, hs, bez = screen_dims(clip, kind, h)
    r = RAD[kind] * min(ws, hs) if kind in RAD else 9.0
    return (x + bez, y + bez, x + bez + ws, y + bez + hs), bez, r


def layout(clips, aspect):
    tiles = []
    for top, h, anchor, ax, items in WALL[aspect]["rows"]:
        widths = []
        for name, kind in items:
            ws, hs, bez = screen_dims(clips[name], kind, h)
            widths.append(ws + 2 * bez)
        x = ax - sum(widths[:anchor]) - GAP * anchor
        for (name, kind), w in zip(items, widths):
            tiles.append((name, kind, x, top, h))
            x += w + GAP
    # the hero first, so it is easy to find; draw order does not matter, nothing overlaps
    tiles.sort(key=lambda t: t[0] != "hero")
    return tiles


def draw_tile(cv, cam, clip, kind, x, y, h, frame, alpha=1.0, chrome=1.0):
    rect, bez, r = tile_geom(clip, kind, x, y, h)
    out = cam.rect(*rect)
    z = cam.zoom
    if out[2] < -300 or out[0] > cv.w + 300 or out[3] < -300 or out[1] > cv.h + 300:
        return
    b = bez * z
    outer = (out[0] - b, out[1] - b, out[2] + b, out[3] + b)
    ro = (r + bez) * z
    shadow(cv, outer, ro, 24 * z, 0, 16 * z, 0.16 * chrome * alpha)
    shadow(cv, outer, ro, 3 * z, 0, 1.5 * z, 0.10 * chrome * alpha)
    if kind == "page":
        hair = max(0.8, 0.8 * z)
        fill_rrect(cv, (out[0] - hair, out[1] - hair, out[2] + hair, out[3] + hair), r * z + hair, (218, 209, 196), chrome * alpha)
    else:
        rim = max(0.8, bez * 0.14 * z)
        fill_rrect(cv, (outer[0] - rim, outer[1] - rim, outer[2] + rim, outer[3] + rim), ro + rim, (168, 160, 150), alpha)
        fill_rrect(cv, outer, ro, (26, 24, 22), alpha)
    draw_image(cv, clip.get(frame), out, out, r * z, alpha)


def hermite(t, p0, p1, m0, m1):
    t2, t3 = t * t, t * t * t
    return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1


def spline(f, keys):
    """keys: [(frame, value, slope per frame)], cubic Hermite between them"""
    if f <= keys[0][0]:
        return keys[0][1]
    for (fa, va, ma), (fb, vb, mb) in zip(keys, keys[1:]):
        if f <= fb:
            d = fb - fa
            return hermite((f - fa) / d, va, vb, ma * d, mb * d)
    return keys[-1][1]


# ---------------------------------------------------------------- shots

class Shot:
    frames = BEAT

    def render(self, cv, f, sub=0.0):
        raise NotImplementedError


class Opening(Shot):
    """0–4 s: inside the screen, pulling back to the whole device; a fast pull back to the wall."""

    frames = 8 * BEAT
    PULL = (4 * BEAT, int(5.6 * BEAT))
    # progress along the pull, in log zoom: slow and accelerating inside the device, fast out, a soft landing
    CURVE = [(0, 0.0, 0.0008), (4 * BEAT, 0.35, 0.0085), (int(5.6 * BEAT), 0.965, 0.0012), (8 * BEAT, 1.0, 0.0)]

    def __init__(self, work, aspect, W, H):
        self.W, self.H, self.aspect = W, H, aspect
        names = {n for row in WALL[aspect]["rows"] for n, _ in row[4]}
        self.clips = {n: Clip(work, n) for n in names}
        self.tiles = layout(self.clips, aspect)
        hero = self.clips["hero"]
        (x0, y0, x1, y1), _, _ = tile_geom(hero, "page", *self.tiles[0][2:])
        s = (x1 - x0) / hero.size[0]  # wall units per CSS px of the hero page
        sc = hero.meta["screen"]
        dv = hero.meta["device"]
        scx, scy = x0 + (sc["x"] + sc["width"] / 2) * s, y0 + (sc["y"] + sc["height"] / 2) * s
        # start: the painted room fills the frame, the bezel just showing (540 CSS px tall)
        vis = (sc["height"] * 1.04 if aspect == "16x9" else dv["width"] * 0.98 * H / W) * s
        self.cam0 = (scx, scy + sc["height"] * 0.02 * s, H / vis)
        ww, wh = WALL[aspect]["size"]
        self.cam1 = (ww / 2, wh / 2, W / ww)
        self.tile_start = self.PULL[0] - 10  # the wall's screens start playing just before they show

    def camera(self, f):
        u = spline(f, self.CURVE)
        cx, cy, z = dolly(self.cam0, self.cam1, u)
        return Cam(cx, cy, z, self.W, self.H)

    def render(self, cv, f, sub=0.0):
        a, b = self.PULL
        cam = self.camera(f + sub)
        p = smooth((f + sub - a + 4) / ((b - a) * 0.6))  # the page becomes one screen among many
        cv.a[:] = mix_rgb(PAPER, WALL_BG, p)
        frame = int(f)
        for i, (name, kind, x, y, h) in enumerate(self.tiles):
            clip = self.clips[name]
            if name == "hero":
                draw_tile(cv, cam, clip, kind, x, y, h, frame, 1.0, p)
            else:
                draw_tile(cv, cam, clip, kind, x, y, h, frame - self.tile_start + (i * 13) % 20, p, p)


class Single(Shot):
    """One clip, a camera moving across it: cam = (cx, cy, height) in clip pixels, from a to b."""

    def __init__(self, work, name, frames, a, b, W, H, start=0, ease=in_out_sine, bg=PAPER, aspect="16x9"):
        self.clip = Clip(work, name)
        self.frames, self.a, self.b, self.W, self.H, self.start, self.ease, self.bg = frames, a, b, W, H, start, ease, bg

    def render(self, cv, f, sub=0.0):
        u = self.ease((f + sub) / max(1, self.frames - 1))
        cx, cy, h = (lerp(p, q, u) for p, q in zip(self.a, self.b))
        cam = Cam(cx, cy, self.H / h, self.W, self.H)
        sw, sh = self.clip.size
        cv.a[:] = self.bg
        draw_image(cv, self.clip.get(self.start + int(f)), cam.rect(0, 0, sw, sh), (0, 0, self.W, self.H))


class Turn(Shot):
    """The phone turns from tall to wide, and the device on its screen changes shape with it."""

    frames = 2 * BEAT
    TURN = (12, 40)

    def __init__(self, work, W, H, aspect):
        self.W, self.H, self.aspect = W, H, aspect
        self.tall, self.wide = Clip(work, "phone-tall"), Clip(work, "phone-wide")
        sw, sh = self.tall.size  # 393 x 852
        self.sw, self.sh = sw, sh
        self.bez, self.r = BEZ["phone"] * sw, RAD["phone"] * sw
        ow, oh = sw + 2 * self.bez, sh + 2 * self.bez
        if aspect == "16x9":
            self.s0, self.s1 = 0.92 * H / oh, 0.74 * W / oh
        else:
            self.s0, self.s1 = 0.80 * H / oh, 0.90 * W / oh

    def layer(self, f, scale, w):
        """the upright (portrait) phone at scale x2, its screen a mix of tall and turned wide"""
        ss = 2
        k = scale * ss
        b, r = self.bez * k, self.r * k
        rim = max(1.0, self.bez * 0.14 * k)
        LW, LH = int(math.ceil((self.sw * k + 2 * b + 2 * rim))), int(math.ceil((self.sh * k + 2 * b + 2 * rim)))
        rim_c = (168, 160, 150)
        cv = Canvas(LW, LH, rim_c)
        outer = (rim, rim, LW - rim, LH - rim)
        fill_rrect(cv, outer, r + b, (26, 24, 22))
        scr = (rim + b, rim + b, LW - rim - b, LH - rim - b)
        if w < 1:
            draw_image(cv, self.tall.get(f), scr, scr, r, 1.0)
        if w > 0:
            wide = self.wide.get(f).rotate(-90, expand=True)
            draw_image(cv, wide, scr, scr, r, w)
        reg = cv.region((0, 0, LW, LH))
        _, xs, ys = reg
        from comp import sdf_rrect
        alpha = np.clip(0.5 - sdf_rrect(xs, ys, (0, 0, LW, LH), r + b + rim), 0, 1)
        rgba = np.dstack([cv.a, alpha * 255]).clip(0, 255).astype(np.uint8)
        return Image.fromarray(rgba), ss

    def render(self, cv, f, sub=0.0):
        a, b = self.TURN
        u = in_out_cubic((f + sub - a) / (b - a))
        angle = 90 * u
        scale = math.exp(lerp(math.log(self.s0), math.log(self.s1), u))
        w = smooth((angle - 28) / 36)
        img, ss = self.layer(int(f), scale, w)
        if angle > 0.01:
            img = img.rotate(angle, resample=Image.BICUBIC, expand=True)
        img = img.resize((max(1, round(img.width / ss)), max(1, round(img.height / ss))), Image.LANCZOS)
        cv.a[:] = PAPER
        x0 = (self.W - img.width) / 2
        y0 = (self.H - img.height) / 2
        # a soft shadow from the phone's own silhouette
        from PIL import ImageFilter
        al = img.getchannel("A")
        sh = al.filter(ImageFilter.GaussianBlur(18 * scale))
        sa = np.asarray(sh, np.float32) / 255 * 0.22
        dy = int(16 * scale)
        ix, iy = int(round(x0)), int(round(y0))
        paste(cv, np.zeros(sa.shape + (3,), np.float32) + (70, 50, 30), sa, ix, iy + dy)
        arr = np.asarray(img, np.float32)
        paste(cv, arr[..., :3], arr[..., 3] / 255, ix, iy)


def paste(cv, rgb, alpha, x, y):
    h, w = alpha.shape
    x0, y0, x1, y1 = max(0, x), max(0, y), min(cv.w, x + w), min(cv.h, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    cv.blend((x0, y0, x1, y1), rgb[y0 - y:y1 - y, x0 - x:x1 - x], alpha[y0 - y:y1 - y, x0 - x:x1 - x])


class End(Shot):
    """The device on paper, a train passing, and the address."""

    frames = 4 * BEAT

    def __init__(self, work, W, H, aspect):
        self.W, self.H, self.aspect = W, H, aspect
        self.solo = Clip(work, "solo")
        self.url = Still(os.path.join(work, "type", "t-url.png"), "RGBA")
        self.name = Still(os.path.join(work, "type", "t-name.png"), "RGBA")
        m = self.solo.meta
        c, d = m["clip"], m["device"]
        # the device's box inside the clip, CSS px
        self.dev = (d["x"] - c["x"], d["y"] - c["y"], d["width"], d["height"])
        self.still = 100

    def render(self, cv, f, sub=0.0):
        W, H = self.W, self.H
        t = f + sub
        push = 1 + 0.03 * in_out_sine(t / self.frames)
        cv.a[:] = PAPER
        dx, dy, dw, dh = self.dev
        cw, ch = self.solo.size
        if self.aspect == "16x9":
            s = 0.80 * H / dh * push
            cxo, cyo = 0.335 * W, 0.5 * H + 6
        else:
            s = 0.80 * W / dw * push
            cxo, cyo = 0.5 * W, 0.40 * H
        # map the device centre to (cxo, cyo), pushing in around the frame centre
        cxo = W / 2 + (cxo - W / 2) * push
        cyo = H / 2 + (cyo - H / 2) * push
        ox = cxo - (dx + dw / 2) * s
        oy = cyo - (dy + dh / 2) * s
        draw_image(cv, self.solo.get(int(f)), (ox, oy, ox + cw * s, oy + ch * s), (max(0, ox), max(0, oy), min(W, ox + cw * s), min(H, oy + ch * s)))
        # the type rises in on the second beat
        k = out_cubic((t - 14) / 26)
        if k <= 0:
            return
        rise = (1 - k) * 26
        uw, uh = self.url.size
        nw, nh = self.name.size
        if self.aspect == "16x9":
            us = 150 / 150 / 3 * 1.0 * push  # the type was set at 150 CSS px, x3
            x = 0.585 * W
            x = W / 2 + (x - W / 2) * push
            yname = H / 2 - 120 * push
            yurl = yname + nh / 3 * push + 4 * push
        else:
            us = push / 3 * 0.95
            x = W / 2 - uw * us / 2
            yname = 0.775 * H
            yurl = yname + nh / 3 * push
        ns = push / 3
        nx = x + (6 * 3 * us if self.aspect == "16x9" else (uw * us - nw * ns) / 2)
        draw_image(cv, self.name.get(), (nx, yname + rise, nx + nw * ns, yname + rise + nh * ns), alpha=k)
        draw_image(cv, self.url.get(), (x, yurl + rise * 1.3, x + uw * us, yurl + rise * 1.3 + uh * us), alpha=k)


# ---------------------------------------------------------------- render

def window_move(t):
    """hold on the lifted window, then follow the figure as it opens (frames 12–44 of 90)"""
    return in_out_cubic((t * 89 - 12) / 32)


# The detail cuts: (shot name, clip, beats, first clip frame, camera from, camera to) per aspect, cameras
# as (centre x, centre y, visible height) in the clip's CSS px.
CUTS = {
    "knob": ("knob", 1, 2, {"16x9": ((330, 238, 330), (346, 250, 286)), "4x5": ((440, 238, 392), (446, 250, 346))}),
    "dpad": ("dpad", 1, 2, {"16x9": ((300, 160, 300), (306, 168, 262)), "4x5": ((296, 160, 300), (300, 166, 262))}),
    "window": ("open-window", 3, 2, {"16x9": ((560, 178, 300), (425, 250, 470)), "4x5": ((570, 170, 340), (425, 250, 500))}, window_move),
    "kana": ("kana", 1, 4, {"16x9": ((288, 250, 300), (288, 246, 270)), "4x5": ((288, 252, 490), (288, 248, 452))}),
    "card": ("card", 2, 0, {"16x9": ((288, 200, 322), (288, 192, 292)), "4x5": ((285, 206, 412), (285, 204, 408))}),
    "label": ("label", 1, 2, {"16x9": ((188, 116, 184), (192, 118, 160)), "4x5": ((228, 120, 205), (230, 122, 190))}),
    "clock": ("clock", 1, 2, {"16x9": ((198, 92, 176), (214, 93, 140)), "4x5": ((240, 92, 180), (250, 94, 160))}),
    # the end of a post: from the whole page in to the hydrangea at the bottom of the margin
    "wave": ("wave", 2, 0, {"16x9": ((720, 450, 900), (1242, 778, 244)), "4x5": ((1000, 450, 900), (1242, 760, 280))}, out_cubic),
}
ORDER = ["opening", "knob", "dpad", "window", "kana", "card", "label", "clock", "turn", "wave", "end"]


def make_shot(name, work, aspect, W, H):
    if name == "opening":
        return Opening(work, aspect, W, H)
    if name == "turn":
        return Turn(work, W, H, aspect)
    if name == "end":
        return End(work, W, H, aspect)
    clip, beats, start, cams = CUTS[name][:4]
    move = CUTS[name][4] if len(CUTS[name]) > 4 else in_out_sine
    a, b = cams[aspect]
    return Single(work, clip, beats * BEAT, a, b, W, H, start=start, ease=move)


def build(work, aspect, names=None):
    W, H = (1920, 1080) if aspect == "16x9" else (1080, 1350)
    shots = [make_shot(n, work, aspect, W, H) for n in (names or ORDER)]
    return W, H, shots


def timeline(shots):
    out = []
    for s in shots:
        for f in range(s.frames):
            out.append((s, f))
    return out


def render_frame(W, H, shot, f, blur=1):
    if blur <= 1:
        cv = Canvas(W, H)
        shot.render(cv, f)
        return cv.frame()
    acc = np.zeros((H, W, 3), np.float32)
    for k in range(blur):
        cv = Canvas(W, H)
        shot.render(cv, f, (k + 0.5) / blur * 0.5 - 0.25)
        acc += cv.a
    return np.clip(acc / blur + 0.5, 0, 255).astype(np.uint8)


def blur_for(shot, f):
    if isinstance(shot, Opening):
        a, b = shot.PULL
        if a <= f < b + 6:
            return 5
    return getattr(shot, "blur", 1)


FFMPEG = "/opt/homebrew/bin/ffmpeg"


def mezzanine(path, W, H):
    """a near-lossless 4:4:4 segment; the final encode happens once, from all segments"""
    cmd = [FFMPEG, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-vf", "scale=out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int", "-c:v", "libx264", "-preset", "medium", "-crf", "10",
           "-pix_fmt", "yuv444p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", path]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("--aspect", default="16x9")
    ap.add_argument("--shots", help="comma list (default: all, in order)")
    ap.add_argument("--preview", help="comma list of frame numbers in the (sub)timeline")
    ap.add_argument("--previewdir", default=".")
    ap.add_argument("--segdir", help="write one mezzanine segment (+ a still for the contact sheet) per shot")
    args = ap.parse_args()
    names = args.shots.split(",") if args.shots else ORDER
    W, H, shots = build(args.work, args.aspect, names)
    tl = timeline(shots)
    print(f"{args.aspect}: {len(tl)} frames, {len(tl) / FPS:.2f} s", file=sys.stderr)
    if args.preview:
        os.makedirs(args.previewdir, exist_ok=True)
        for g in [int(v) for v in args.preview.split(",")]:
            shot, f = tl[g]
            Image.fromarray(render_frame(W, H, shot, f, blur_for(shot, f))).save(os.path.join(args.previewdir, f"p{g:04d}.png"))
        return
    if args.segdir:
        os.makedirs(args.segdir, exist_ok=True)
        for name, shot in zip(names, shots):
            proc = mezzanine(os.path.join(args.segdir, f"{name}.mp4"), W, H)
            still = getattr(shot, "still", shot.frames // 2)
            for f in range(shot.frames):
                px = render_frame(W, H, shot, f, blur_for(shot, f))
                if f == still:
                    Image.fromarray(px).save(os.path.join(args.segdir, f"{name}.jpg"), quality=92)
                proc.stdin.write(px.tobytes())
            proc.stdin.close()
            proc.wait()
            print(f"  {name}: {shot.frames} frames", file=sys.stderr)



if __name__ == "__main__":
    main()
