"""Repairs painted over a source sheet, before it is keyed and cut.

A fix is a ChatGPT edit of one crop of a source painting (art/fixes/<name>.png, prompt in
prompts/<name>.txt). Only a feathered polygon of it is composited back, so everything outside the
repaired region stays pixel-identical and the sprite keeps its size and alignment.

    python3 components/room/tools/fixes.py   # writes art/work/fix-<name>-check.png, before | after
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(os.environ.get("ROOM_ART", Path(__file__).parent / "art"))

# sheet: [(fix name, crop box in the sheet, polygon in crop pixels, feather px)]
FIXES = {
    "peter-sheet": [
        # The wave pose had three hands: a second right sleeve and hand resting on his lap under
        # the waving arm. peter-wave-fix.png is that cell (1100,500)-(1440,1010), upscaled 3x to
        # 1024x1536 and repainted without the extra arm (prompts/peter-wave-fix.txt).
        ("peter-wave-fix", (1100, 500, 1440, 1010), [(136, 158), (196, 146), (222, 186), (252, 246), (258, 322), (148, 324), (128, 250)], 3),
    ],
}


def apply_fixes(name, rgb):
    """rgb: HxWx3 uint8 of art/<name>.png. Returns the repaired copy."""
    out = rgb.astype(np.float32).copy()
    for fix, (x0, y0, x1, y1), poly, feather in FIXES.get(name, []):
        w, h = x1 - x0, y1 - y0
        edit = Image.open(HERE / "fixes" / f"{fix}.png").convert("RGB").resize((w, h), Image.LANCZOS)
        m = Image.new("L", (w, h), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        m = np.asarray(m.filter(ImageFilter.GaussianBlur(feather))).astype(np.float32)[..., None] / 255
        region = out[y0:y1, x0:x1]
        out[y0:y1, x0:x1] = region * (1 - m) + np.asarray(edit).astype(np.float32) * m
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


if __name__ == "__main__":
    work = HERE / "work"
    work.mkdir(parents=True, exist_ok=True)
    for name, fixes in FIXES.items():
        src = np.asarray(Image.open(HERE / f"{name}.png").convert("RGB"))
        fixed = apply_fixes(name, src)
        for fix, (x0, y0, x1, y1), poly, _ in fixes:
            before = Image.fromarray(src[y0:y1, x0:x1])
            after = Image.fromarray(fixed[y0:y1, x0:x1])
            outline = after.copy()
            ImageDraw.Draw(outline).polygon(poly, outline=(0, 255, 0))
            row = Image.new("RGB", (before.width * 3, before.height))
            for i, im in enumerate([before, outline, after]):
                row.paste(im, (i * before.width, 0))
            row = row.resize((row.width * 2, row.height * 2), Image.LANCZOS)
            row.save(work / f"fix-{fix}-check.png")
            print(work / f"fix-{fix}-check.png")
