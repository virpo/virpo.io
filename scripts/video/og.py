#!/usr/bin/env python3
"""og:video loop, its poster, and the og:image.

  python3 scripts/video/og.py <work> <outdir>

loop: the device on paper, a shinkansen through the window, Peter typing; 7.5 s at 30 fps. The
last 0.8 s dissolve into the first, so it loops without a seam (the window is empty at both ends).
og-image: the device and "Peter Hraska" on the room's paper, 1200x630.
"""

import os
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from comp import PAPER, Canvas, Clip, Still, draw_image  # noqa: E402

FFMPEG = "/opt/homebrew/bin/ffmpeg"
FFPROBE = "/opt/homebrew/bin/ffprobe"
W, H = 1280, 720
FPS = 30
LENGTH = 225  # 7.5 s
FADE = 24  # 0.8 s
LEAD = 45  # the train shows 1.5 s in


def device_frame(clip, i, W, H, height, cx, cy):
    m = clip.meta
    c, d = m["clip"], m["device"]
    dx, dy, dw, dh = d["x"] - c["x"], d["y"] - c["y"], d["width"], d["height"]
    s = height / dh
    ox, oy = cx - (dx + dw / 2) * s, cy - (dy + dh / 2) * s
    cw, ch = clip.size
    cv = Canvas(W, H, PAPER)
    draw_image(cv, clip.get(i), (ox, oy, ox + cw * s, oy + ch * s), (max(0, ox), max(0, oy), min(W, ox + cw * s), min(H, oy + ch * s)))
    return cv.a


def loop(work, outdir):
    clip = Clip(work, "loop")
    kinds = clip.meta["frames"]
    s = next(i for i, k in enumerate(kinds) if k == "shinkansen")
    a = s - LEAD
    assert all(k is None for k in kinds[a:a + FADE]) and all(k is None for k in kinds[a + LENGTH:a + LENGTH + FADE]), "a train would cross the seam"
    out = os.path.join(outdir, "room-loop.mp4")
    poster = os.path.join(outdir, "room-loop.jpg")
    kbps = 2150
    common = ["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
              "-tune", "film", "-b:v", f"{kbps}k", "-maxrate", f"{kbps * 2}k", "-bufsize", f"{kbps * 2}k", "-g", str(LENGTH),
              "-vf", "scale=out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p",
              "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709"]
    frames = []
    for k in range(LENGTH):
        px = device_frame(clip, a + k, W, H, 0.84 * H, W / 2, H / 2 + 4)
        if k < FADE:
            # the clip runs on past the loop's end; that tail dissolves into the start
            tail = device_frame(clip, a + LENGTH + k, W, H, 0.84 * H, W / 2, H / 2 + 4)
            t = k / FADE
            px = tail * (1 - t) + px * t
        frames.append(np.clip(px + 0.5, 0, 255).astype(np.uint8))
    Image.fromarray(frames[0]).save(poster, quality=90)
    log = os.path.join(work, "og-x264")
    for p in (1, 2):
        proc = subprocess.Popen([FFMPEG, "-loglevel", "error", "-y", *common, "-pass", str(p), "-passlogfile", log] + (["-f", "mp4", "/dev/null"] if p == 1 else ["-movflags", "+faststart", out]), stdin=subprocess.PIPE)
        for f in frames:
            proc.stdin.write(f.tobytes())
        proc.stdin.close()
        proc.wait()
    print(f"{out}: {os.path.getsize(out) / 1e6:.2f} MB", file=sys.stderr)


def og_image(work, outdir):
    """the device left, the name right; drawn at 2x and reduced, so edges stay clean"""
    k = 2
    w, h = 1200 * k, 630 * k
    solo = Clip(work, "solo")
    cv = Canvas(w, h, PAPER)
    px = device_frame(solo, 40, w, h, 0.84 * h, 0.30 * w, 0.5 * h + 6 * k)
    cv.a[:] = px
    name = Still(os.path.join(work, "type", "t-name.png"), "RGBA")
    url = Still(os.path.join(work, "type", "t-url.png"), "RGBA")
    nw, nh = name.size
    ns = 84 / 54 / 3 * k  # the name was set at 54 CSS px, x3; here it is 84 px
    x = 0.565 * w
    y = 0.5 * h - nh * ns * 0.62
    draw_image(cv, name.get(), (x, y, x + nw * ns, y + nh * ns))
    uw, uh = url.size
    us = 40 / 150 / 3 * k
    y2 = y + nh * ns + 2 * k
    draw_image(cv, url.get(), (x + 4 * k, y2, x + 4 * k + uw * us, y2 + uh * us), alpha=0.9)
    img = Image.fromarray(cv.frame()).resize((1200, 630), Image.LANCZOS)
    img.save(os.path.join(outdir, "og-image.png"), optimize=True)
    print(os.path.join(outdir, "og-image.png"), file=sys.stderr)


if __name__ == "__main__":
    work, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    what = sys.argv[3:] or ["loop", "image"]
    if "loop" in what:
        loop(work, outdir)
    if "image" in what:
        og_image(work, outdir)
