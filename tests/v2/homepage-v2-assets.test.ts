import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const assets = [
  "public/assets/v2/radio.png",
  "public/assets/v2/study-paper.png",
  "public/assets/v2/bloom-lotus.png",
  "public/assets/v2/daruma.png",
  "public/assets/v2/back-pixel.svg",
  "public/assets/v2/blooms/camellia.png",
  "public/assets/v2/blooms/plum.png",
  "public/assets/v2/blooms/sakura.png",
  "public/assets/v2/blooms/wisteria.png",
  "public/assets/v2/blooms/hydrangea.png",
  "public/assets/v2/blooms/lotus.png",
  "public/assets/v2/blooms/sunflower.png",
  "public/assets/v2/blooms/cosmos.png",
  "public/assets/v2/blooms/chrysanthemum.png",
];

const bloomAssets = assets.filter((asset) => asset.includes("/blooms/"));

describe("homepage v2 pixel assets", () => {
  it("keeps replaceable assets at stable public paths", () => {
    for (const asset of assets) {
      expect(existsSync(resolve(process.cwd(), asset)), asset).toBe(true);
    }
  });

  it("documents how each generated asset can be replaced", () => {
    const path = resolve(process.cwd(), "docs/homepage-v2-assets.md");

    expect(existsSync(path)).toBe(true);
    const guide = readFileSync(path, "utf8");
    expect(guide).toContain("radio.png");
    expect(guide).toContain("study-paper.png");
    expect(guide).toContain("bloom-lotus.png");
    expect(guide).toContain("daruma.png");
    expect(guide).toContain("back-pixel.svg");
    expect(guide).toContain("blooms/*.png");
    expect(guide).toContain("Safe overlay area");
  });

  it("keeps the Study back glyph as one quiet pixel arrow", () => {
    const icon = readFileSync(
      resolve(process.cwd(), "public/assets/v2/back-pixel.svg"),
      "utf8",
    );
    const guide = readFileSync(
      resolve(process.cwd(), "docs/homepage-v2-assets.md"),
      "utf8",
    );

    expect(icon).not.toContain("<circle");
    expect(icon).not.toContain("#d6533d");
    expect(icon.match(/<path\b/g)).toHaveLength(1);
    expect(guide).toContain("pixel back arrow");
  });

  it("keeps every seasonal flower in the same transparent pixel-art format", async () => {
    for (const asset of bloomAssets) {
      const metadata = await sharp(resolve(process.cwd(), asset)).metadata();

      expect(metadata.width, asset).toBe(192);
      expect(metadata.height, asset).toBe(192);
      expect(metadata.hasAlpha, asset).toBe(true);
    }
  });

  it("keeps the bottom-right of the Study artwork free of baked-in progress boxes", async () => {
    const image = sharp(resolve(process.cwd(), "public/assets/v2/study-paper.png"));
    const metadata = await image.metadata();
    const left = Math.floor((metadata.width ?? 0) * 0.75);
    const top = Math.floor((metadata.height ?? 0) * 0.88);
    const width = Math.floor((metadata.width ?? 0) * 0.21);
    const height = Math.floor((metadata.height ?? 0) * 0.1);
    const { data, info } = await image
      .extract({ left, top, width, height })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let darkPixels = 0;

    for (let index = 0; index < data.length; index += info.channels) {
      if (data[index] < 200) darkPixels += 1;
    }

    expect(darkPixels).toBeLessThan(50);
  });
});
