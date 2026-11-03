"""Ship the cards for virpo.io/ai: every project's real screenshot, photo or figure (art/ai/<slug>.png),
in colour and in pencil, like the Projects section of the home page. Projects that already have a
painted card there (art/projects/) reuse it, so this only builds the rest.

For every source this writes into public/ai/:

    <slug>.webp, <slug>-720.webp, <slug>-540.webp                      colour
    <slug>-pencil.webp, <slug>-pencil-720.webp, <slug>-pencil-540.webp  pencil, shown at rest
    <slug>.mp4                                  for art/ai/loops/<slug>.mp4: a small muted loop, 3:2,
                                                that plays over the card on hover

The list itself, with dates, words and logos, is lib/ai-projects.ts.

    python3 components/room/tools/ai_projects.py
"""

import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

from projects import SIZE, WIDTHS, cover, pencil

HERE = Path(__file__).parent
ART = HERE / "art" / "ai"
OUT = HERE.parents[2] / "public" / "ai"
# photos of people and objects get the soft pencil, so faces and hardware don't turn eerie
SOFT = {"enkiplate", "ai-build-day", "product-festival", "blendo-coffee"}
# where to cut a source that isn't 3:2 (0 top, 0.5 middle, 1 bottom)
FOCUS = {"enkiplate": 0.45, "tada": 0.4}


def save(img: Image.Image, name: str) -> None:
    img.save(OUT / f"{name}.webp", quality=84, method=6)
    for w in WIDTHS:
        img.resize((w, round(w * SIZE[1] / SIZE[0])), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", quality=82, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for index, src in enumerate(sorted(ART.glob("*.png"))):
        slug = src.stem
        im = Image.open(src).convert("RGB")
        if slug in FOCUS:
            w, h = SIZE
            scale = max(w / im.width, h / im.height)
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
            y = round((im.height - h) * FOCUS[slug])
            x = (im.width - w) // 2
            colour = im.crop((x, y, x + w, y + h))
        else:
            colour = cover(im, SIZE)
        rgb = np.asarray(colour, dtype=np.float32) / 255
        grey = Image.fromarray((pencil(rgb, slug in SOFT, 100 + index) * 255).astype(np.uint8))
        save(colour, slug)
        save(grey, f"{slug}-pencil")
        print(f"{slug:26} done")
    # loops: cropped to the card's 3:2, 720 px wide, 30 fps, no sound, small enough to autoplay
    for src in sorted((ART / "loops").glob("*.mp4")):
        out = OUT / f"{src.stem}.mp4"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-vf", "crop='min(iw,ih*3/2)':'min(ih,iw*2/3)',scale=720:480:flags=lanczos,fps=30,format=yuv420p",
                        "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "27", "-movflags", "+faststart", "-an", str(out)], check=True)
        print(f"{src.stem:26} loop {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
