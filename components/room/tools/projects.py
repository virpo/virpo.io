"""Ship the project cards for the Projects section of /room/.

Each project is one clean thing painted by ChatGPT in the room's ink and watercolour, from its real
screenshot or photo (prompts: prompts/project-<slug>.txt, paintings: art/projects/<slug>.png, the
real references: art/projects/refs/). For every card this writes two images into
public/lab/room/projects/:

    <slug>.webp         the painting, in colour
    <slug>-pencil.webp  the same picture in pencil on paper, shown at rest

The page cross-fades from pencil to colour on hover. Photos of people and dark objects (SOFT) get a
lighter, warmer pencil with almost no outlines, so faces don't turn eerie.

    python3 components/room/tools/projects.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).parent
ART = HERE / "art" / "projects"
OUT = HERE.parents[2] / "public" / "lab" / "room" / "projects"
SIZE = (1080, 720)

SLUGS = ["levels", "youtldr", "zlta-stopa", "mood-radio", "pegboard-toy", "ai-build-week", "cmux-deck", "bratislava-slushd"]
SOFT = {"pegboard-toy", "ai-build-week", "cmux-deck", "bratislava-slushd"}

PAPER = np.array([0.947, 0.921, 0.876])
GRAPHITE = {False: np.array([0.27, 0.25, 0.23]), True: np.array([0.36, 0.31, 0.26])}


def cover(im: Image.Image, size: tuple) -> Image.Image:
    w, h = size
    scale = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def pencil(rgb: np.ndarray, soft: bool, seed: int) -> np.ndarray:
    """Graphite on paper: tone from a slightly blurred picture, outlines from its own edges, a
    little hatching in the darks, and paper grain."""
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    tone = ndimage.uniform_filter(lum, 4)
    edge = np.clip(np.hypot(ndimage.sobel(lum, 1), ndimage.sobel(lum, 0)) * 0.25, 0, 1)
    fill = (1 - tone) ** (1.7 if soft else 1.35) * (0.5 if soft else 0.66)
    lines = edge * (0.08 if soft else 0.3)
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    hatch = 0.0 if soft else ((((xx + yy) * 0.18) % 1) > 0.55) * np.clip((1 - tone - 0.45) / 0.45, 0, 1) * 0.06
    rng = np.random.default_rng(seed)
    grain = (rng.random((h, w)) - 0.5) * 0.06 + (ndimage.gaussian_filter(rng.random((h, w)), 6) - 0.5) * 0.35
    amount = np.clip(fill + lines + hatch, 0, 0.74)[..., None]
    graphite = GRAPHITE[soft]
    return np.clip(PAPER + (graphite - PAPER) * amount + grain[..., None], 0, 1)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for index, slug in enumerate(SLUGS):
        card = cover(Image.open(ART / f"{slug}.png").convert("RGB"), SIZE)
        card.save(OUT / f"{slug}.webp", "WEBP", quality=80, method=6)
        rgb = np.asarray(card, dtype=np.float64) / 255
        grey = Image.fromarray((pencil(rgb, slug in SOFT, index) * 255).astype(np.uint8))
        grey.save(OUT / f"{slug}-pencil.webp", "WEBP", quality=78, method=6)
        sizes = [(OUT / f"{slug}{suffix}.webp").stat().st_size // 1024 for suffix in ("", "-pencil")]
        print(f"{slug:18} colour {sizes[0]} KB, pencil {sizes[1]} KB")


if __name__ == "__main__":
    main()
