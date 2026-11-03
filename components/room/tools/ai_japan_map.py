"""The Japan knowledge base's card: the places from the trip plan as orange pins on a paper map of
Japan, redrawn in the site's colours. The outline is Natural Earth's (public domain,
art/ai/japan-outline.geojson), the pins come from the trip viewer's data (art/ai/japan-pins.json:
[lat, lng, region, name]). Okinawa is drawn in an inset, like on Japanese maps.

    python3 components/room/tools/ai_japan_map.py    # writes art/ai/japan.png
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent / "art" / "ai"
W, H, SS = 2160, 1440, 2
PAPER, LAND, COAST, PIN, PIN_RIM, INK = (244, 237, 225), (222, 210, 190), (170, 150, 122), (232, 98, 28), (255, 250, 242), (90, 78, 64)


def mercator(lng, lat):
    return lng, math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


def frame(box, view):
    """map [lng0, lat0, lng1, lat1] in degrees into a pixel box"""
    (x0, y0, x1, y1), (a, b, c, d) = box, view
    ma, mb = mercator(a, b)
    mc, md = mercator(c, d)
    s = min((x1 - x0) / (mc - ma), (y1 - y0) / (md - mb))
    ox = x0 + ((x1 - x0) - (mc - ma) * s) / 2
    oy = y0 + ((y1 - y0) - (md - mb) * s) / 2

    def to(lng, lat):
        mx, my = mercator(lng, lat)
        return (ox + (mx - ma) * s) * SS, (oy + (md - my) * s) * SS

    return to


def draw(img, to, geom, pins, clip):
    d = ImageDraw.Draw(img)
    for poly in geom["coordinates"]:
        ring = poly[0]
        if not any(clip[0] <= x <= clip[2] and clip[1] <= y <= clip[3] for x, y in ring):
            continue
        pts = [to(x, y) for x, y in ring]
        d.polygon(pts, fill=LAND, outline=COAST, width=3 * SS)
    for lat, lng, *_ in pins:
        if clip[0] <= lng <= clip[2] and clip[1] <= lat <= clip[3]:
            x, y = to(lng, lat)
            r = 16 * SS
            d.ellipse((x - r - 4 * SS, y - r - 4 * SS, x + r + 4 * SS, y + r + 4 * SS), fill=PIN_RIM)
            d.ellipse((x - r, y - r, x + r, y + r), fill=PIN)


def main():
    geom = json.loads((HERE / "japan-outline.geojson").read_text())
    pins = json.loads((HERE / "japan-pins.json").read_text())
    img = Image.new("RGB", (W * SS, H * SS), PAPER)
    # the main islands, from Kyushu to Tokyo and a little north
    main_view = (128.6, 30.9, 141.4, 37.2)
    draw(img, frame((60, 40, W - 40, H - 40), main_view), geom, pins, main_view)
    # Okinawa, Miyako and Ishigaki in a box in the open sea at the bottom right, like on Japanese maps
    inset = (124.0, 24.2, 128.4, 26.95)
    bx = (W - 900, H - 520, W - 70, H - 70)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([v * SS for v in bx], radius=22 * SS, fill=(248, 243, 234), outline=COAST, width=3 * SS)
    draw(img, frame((bx[0] + 30, bx[1] + 30, bx[2] - 30, bx[3] - 30), inset), geom, pins, inset)
    img = img.resize((W, H), Image.LANCZOS)
    img.save(HERE / "japan.png")
    print(HERE / "japan.png", len(pins), "pins")


if __name__ == "__main__":
    main()
