#!/usr/bin/env python3
"""4x sharper copies of the room's art for video capture only (the site keeps its own files).

Real-ESRGAN (realesr-animevideov3, the model that keeps the watercolour texture) upscales every
picture under public/lab/room/ into output/lab/video/.hires/lab/room/, same names and formats.
The view behind the window comes from its 1536 px painting (art/view.png) rather than the shipped
1024 px copy. lib/stage.mjs serves these in place of the real files when HIRES is set.

  ESRGAN=/path/to/realesrgan-ncnn-vulkan python3 scripts/video/hires.py
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "lab" / "room"
OUT = ROOT / "output" / "lab" / "video" / ".hires" / "lab" / "room"
ESRGAN = os.environ.get("ESRGAN")
if not ESRGAN:
    sys.exit("set ESRGAN to the realesrgan-ncnn-vulkan binary")


def upscale(png_in, png_out):
    subprocess.run([ESRGAN, "-i", str(png_in), "-o", str(png_out), "-n", "realesr-animevideov3", "-s", "4", "-f", "png"],
                   cwd=Path(ESRGAN).parent, check=True, capture_output=True)


with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    for f in sorted(SRC.rglob("*")):
        if f.suffix not in (".webp", ".png") or f.name.startswith("icon-") or "brand" in f.parts:
            continue
        rel = f.relative_to(SRC)
        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        im = Image.open(f)
        w, h = im.size
        source = ROOT / "components" / "room" / "tools" / "art" / "view.png" if rel.name == "view.webp" else f
        Image.open(source).save(tmp / "in.png")
        upscale(tmp / "in.png", tmp / "out.png")
        big = Image.open(tmp / "out.png").convert(im.mode if im.mode in ("RGB", "RGBA") else "RGBA").resize((w * 4, h * 4), Image.LANCZOS)
        if f.suffix == ".webp":
            big.save(dest, quality=92, method=4)
        else:
            big.save(dest)
        print(rel, (w, h), "->", big.size)
