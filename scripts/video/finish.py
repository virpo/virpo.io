#!/usr/bin/env python3
"""Joins the mezzanine segments into the final X videos and draws the contact sheet.

  python3 scripts/video/finish.py <segdir> <outdir>

<segdir>/<aspect>/<shot>.mp4 (+ .jpg) come from compose.py --segdir. Two-pass H.264 High,
yuv420p, BT.709, 60 fps, faststart, sized to stay under 15 MB.
"""

import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from compose import FPS, ORDER  # noqa: E402

FFMPEG = "/opt/homebrew/bin/ffmpeg"
FFPROBE = "/opt/homebrew/bin/ffprobe"
LIMIT_MB = 14.2


def duration(path):
    out = subprocess.check_output([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(out)


def encode(segdir, aspect, out):
    parts = [os.path.join(segdir, aspect, f"{name}.mp4") for name in ORDER]
    listfile = os.path.join(segdir, aspect, "list.txt")
    with open(listfile, "w") as fh:
        fh.writelines(f"file '{os.path.abspath(p)}'\n" for p in parts)
    total = sum(duration(p) for p in parts)
    kbps = int(LIMIT_MB * 8 * 1024 / total * 0.97)
    common = ["-f", "concat", "-safe", "0", "-i", listfile, "-an", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-tune", "film",
              "-b:v", f"{kbps}k", "-maxrate", f"{int(kbps * 1.6)}k", "-bufsize", f"{kbps * 2}k", "-r", str(FPS), "-g", str(FPS * 2),
              "-vf", "scale=in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p",
              "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709"]
    log = os.path.join(segdir, aspect, "x264")
    subprocess.check_call([FFMPEG, "-loglevel", "error", "-y", *common, "-pass", "1", "-passlogfile", log, "-f", "mp4", "/dev/null"])
    subprocess.check_call([FFMPEG, "-loglevel", "error", "-y", *common, "-pass", "2", "-passlogfile", log, "-movflags", "+faststart", out])
    print(f"{out}: {duration(out):.2f} s, {os.path.getsize(out) / 1e6:.2f} MB, {kbps} kbps", file=sys.stderr)


# one frame per moment, on the 60 fps timeline of the final cut
SHEET = [
    (10, "inside the screen"), (100, "the window lifts"), (160, "pull back"), (236, "the wall"),
    (256, "knob"), (290, "d-pad"), (318, "Fig. 06 opens"), (380, "Shinkansen window"), (410, "kana card"),
    (466, "pencil to colour"), (500, "Fig. 12 label"), (525, "TOKYO 21:05"), (572, "tall to wide"),
    (652, "Peter waves"), (770, "end card"),
]


def grab(video, frame, path):
    subprocess.check_call([FFMPEG, "-loglevel", "error", "-y", "-i", video, "-vf", f"select=eq(n\\,{frame})", "-vsync", "0", "-frames:v", "1", path])
    return Image.open(path).convert("RGB")


def sheet(outdir, tmp):
    """the 16:9 frame and the 4:5 frame side by side, with the time on the cut"""
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    cw, ch, pw = 480, 270, 216
    cols = 3
    rows = (len(SHEET) + cols - 1) // cols
    W = cols * (cw + pw + 30) + 30
    H = rows * (ch + 50) + 30
    img = Image.new("RGB", (W, H), (250, 247, 242))
    d = ImageDraw.Draw(img)
    for i, (frame, label) in enumerate(SHEET):
        x = 30 + (i % cols) * (cw + pw + 30)
        y = 30 + (i // cols) * (ch + 50)
        wide = grab(os.path.join(outdir, "virpo-x-16x9.mp4"), frame, os.path.join(tmp, "g.png")).resize((cw, ch), Image.LANCZOS)
        tall = grab(os.path.join(outdir, "virpo-x-4x5.mp4"), frame, os.path.join(tmp, "g.png")).resize((pw, ch), Image.LANCZOS)
        img.paste(wide, (x, y))
        img.paste(tall, (x + cw + 6, y))
        d.text((x, y + ch + 10), f"{i + 1:02d}  {frame / FPS:5.2f} s   {label}", fill=(60, 52, 44), font=font)
    out = os.path.join(outdir, "frames", "contact-sheet.jpg")
    img.save(out, quality=90)
    print(out, file=sys.stderr)


def main():
    segdir, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(outdir, "frames"), exist_ok=True)
    encode(segdir, "16x9", os.path.join(outdir, "virpo-x-16x9.mp4"))
    encode(segdir, "4x5", os.path.join(outdir, "virpo-x-4x5.mp4"))
    sheet(outdir, segdir)


if __name__ == "__main__":
    main()
