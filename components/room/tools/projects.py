"""Ship the painted project cards for the Projects section of /room/.

Each project is painted by ChatGPT from its real screenshot or photo, in the room's ink and
watercolour (prompts: prompts/project-<slug>.txt, sources: art/projects/<slug>.png). This crops
each painting to 3:2, puts the real Bratislava Slush'D logo on its team grid, and writes
public/lab/room/projects/<slug>.webp.

    python3 components/room/tools/projects.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
ART = HERE / "art" / "projects"
OUT = HERE.parents[2] / "public" / "lab" / "room" / "projects"
SIZE = (1080, 720)

SLUGS = ["levels", "youtldr", "zlta-stopa", "mood-radio", "pegboard-toy", "ai-build-week", "cmux-deck", "bratislava-slushd"]


def cover(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    w, h = size
    scale = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def with_logo(card: Image.Image) -> Image.Image:
    """The real logo, centred on a dark plate over the team. slushd-logo.png is the white
    Bratislava Slush'D mark cut from the site's co-branded logo.svg (left of the "×")."""
    logo = Image.open(ART / "slushd-logo.png").convert("RGBA")
    width = int(card.width * 0.27)
    logo = logo.resize((width, round(logo.height * width / logo.width)), Image.LANCZOS)
    pad_x, pad_y = int(card.width * 0.03), int(card.width * 0.022)
    plate = (logo.width + pad_x * 2, logo.height + pad_y * 2)
    x, y = (card.width - plate[0]) // 2, (card.height - plate[1]) // 2
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((x, y + 10, x + plate[0], y + plate[1] + 10), radius=14, fill=(20, 12, 4, 120))
    card = Image.alpha_composite(card.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(14)))
    ImageDraw.Draw(card).rounded_rectangle((x, y, x + plate[0], y + plate[1]), radius=14, fill=(22, 20, 18, 235))
    card.alpha_composite(logo, (x + pad_x, y + pad_y))
    return card.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in SLUGS:
        card = cover(Image.open(ART / f"{slug}.png").convert("RGB"), SIZE)
        if slug == "bratislava-slushd":
            card = with_logo(card)
        path = OUT / f"{slug}.webp"
        card.save(path, "WEBP", quality=80, method=6)
        print(f"{path.relative_to(HERE.parents[2])}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
