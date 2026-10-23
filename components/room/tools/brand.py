"""Export the favicon and the X avatar from the painted brand art.

art/brand/favicon-art.png is mini-Peter shouting under the torii, painted to match the X avatar
(prompt: prompts/favicon.txt). The small icons use a tight crop so the head fills the frame at
16 px; the big ones use the whole painting.

    python3 components/room/tools/brand.py

Writes public/lab/room/brand/icon-{16,32,48,64}.png, apple-touch-icon.png and
output/lab/brand/x-avatar-400.jpg (upload that one to X by hand).
"""

from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
ROOT = HERE.parents[2]
ART = HERE / "art" / "brand" / "favicon-art.png"
OUT = ROOT / "public" / "lab" / "room" / "brand"
AVATAR = ROOT / "output" / "lab" / "brand" / "x-avatar-400.jpg"
TIGHT = (150, 30, 910, 790)  # the head, in favicon-art.png pixels


def rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    AVATAR.parent.mkdir(parents=True, exist_ok=True)
    art = Image.open(ART).convert("RGB")
    tight = art.crop(TIGHT)
    for size in (16, 32, 48, 64):
        rounded(tight.resize((size, size), Image.LANCZOS), max(3, size // 6)).save(OUT / f"icon-{size}.png", optimize=True)
    art.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)
    art.resize((400, 400), Image.LANCZOS).save(AVATAR, quality=90)
    print(f"wrote {OUT.relative_to(ROOT)}/icon-*.png, apple-touch-icon.png and {AVATAR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
