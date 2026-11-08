"""The small painted icons in front of each line of the project list on the home page.

A sheet is one ChatGPT painting of 12 icons in a 4 x 3 grid on flat #FF00FF magenta: art/icons/<sheet>.png,
painted from prompts/icons/<sheet>.txt (every sheet after the first attaches art/icons/list-1.png so the
set stays one set). This keys the magenta, groups what's left by grid cell (so an icon made of separate
pieces, like two googly eyes, stays one icon), trims each to its own outline and centres it in a square
with the same margin, so every icon sits at the same size.

    python3 components/room/tools/icons.py                          every sheet in SHEETS -> public/lab/room/icons/<slug>.webp
    python3 components/room/tools/icons.py <sheet.png> <dir> [slug ...]   try a sheet: <dir>/<slug or 01..12>.png

A project without an icon shows its emoji instead.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

from cut import magenta_alpha

HERE = Path(__file__).parent
OUT = HERE.parents[2] / "public" / "lab" / "room" / "icons"
COLS, ROWS = 4, 3
SIZE = 256
FILL = 0.9  # the icon's longer side, as a share of the square
SHIP = 96  # the list shows them at 28 CSS px, so this is a bit over 3x

# each sheet's 12 icons in reading order; None skips a cell (for one new project, paint 12 takes of it
# on a sheet and keep the best cell)
SHEETS: dict[str, list[str | None]] = {
    "list-1": ["moonlit", "leo", "plane", "pracovna", "timer", "all-packed", "marketplace-seller-agent", "agent-olympics", "posture-check", "bryndza", "dough-press", "ragthoven"],
    "list-2": ["rinok", "product-festival", "agent-skills", "autoslides", "prehistoriq-stacks", "japan", "virpo-pocket-room", "ai-capitan", "blendo-coffee", "ai-build-day", "prompterator", "prompy"],
}


def cut_sheet(path: Path) -> list[Image.Image]:
    rgb = np.asarray(Image.open(path).convert("RGB"))
    keyed, alpha = magenta_alpha(rgb)
    h, w = alpha.shape
    solid = alpha > 128
    labels, count = ndimage.label(solid)
    areas = ndimage.sum(solid, labels, range(1, count + 1))
    centres = ndimage.center_of_mass(solid, labels, range(1, count + 1))
    cells: dict[int, np.ndarray] = {}
    for index, (area, (cy, cx)) in enumerate(zip(areas, centres), start=1):
        if area < 60:  # specks of paper grain
            continue
        cell = min(int(cy / (h / ROWS)), ROWS - 1) * COLS + min(int(cx / (w / COLS)), COLS - 1)
        cells[cell] = cells.get(cell, np.zeros_like(solid)) | (labels == index)
    icons = []
    for cell in range(COLS * ROWS):
        mask = cells.get(cell)
        if mask is None:
            icons.append(Image.new("RGBA", (SIZE, SIZE)))
            continue
        # keep the soft edge of everything near this icon's pieces
        near = ndimage.binary_dilation(mask, iterations=4)
        ys, xs = np.where(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.dstack([keyed, np.where(near, alpha, 0)])[y0:y1, x0:x1]
        icon = Image.fromarray(rgba.astype(np.uint8))
        scale = SIZE * FILL / max(icon.size)
        icon = icon.resize((max(1, round(icon.width * scale)), max(1, round(icon.height * scale))), Image.LANCZOS)
        square = Image.new("RGBA", (SIZE, SIZE))
        square.paste(icon, ((SIZE - icon.width) // 2, (SIZE - icon.height) // 2), icon)
        icons.append(square)
    return icons


def ship() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for sheet, slugs in SHEETS.items():
        for slug, icon in zip(slugs, cut_sheet(HERE / "art" / "icons" / f"{sheet}.png")):
            if slug is None:
                continue
            icon.resize((SHIP, SHIP), Image.LANCZOS).save(OUT / f"{slug}.webp", "WEBP", quality=88, method=6)
        print(f"{sheet}: {', '.join(slug for slug in slugs if slug)}")


def main() -> None:
    if len(sys.argv) == 1:
        ship()
        return
    sheet, out, *slugs = sys.argv[1:]
    out_dir = Path(out)
    out_dir.mkdir(parents=True, exist_ok=True)
    for index, icon in enumerate(cut_sheet(Path(sheet))):
        name = slugs[index] if index < len(slugs) else f"{index + 1:02d}"
        icon.save(out_dir / f"{name}.png")
    print(f"{sheet}: {COLS * ROWS} icons -> {out_dir}")


if __name__ == "__main__":
    main()
