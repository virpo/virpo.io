import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const optimizedAssets = [
  { path: "public/assets/optimized/radio.webp", maxBytes: 300_000 },
  { path: "public/assets/optimized/study-paper.webp", maxBytes: 300_000 },
  { path: "public/assets/optimized/train-window.webp", maxBytes: 400_000 },
  { path: "public/assets/optimized/train-window-still.webp", maxBytes: 60_000 },
  { path: "public/assets/optimized/bloom-lotus-large.webp", maxBytes: 200_000 },
] as const;

describe("homepage performance assets", () => {
  it("ships display-sized WebP derivatives within explicit byte budgets", async () => {
    for (const asset of optimizedAssets) {
      const path = resolve(process.cwd(), asset.path);

      expect(existsSync(path), asset.path).toBe(true);
      expect(statSync(path).size, asset.path).toBeLessThanOrEqual(asset.maxBytes);
      expect((await sharp(path).metadata()).format, asset.path).toBe("webp");
    }
  });

  it("serves optimized derivatives while retaining PNG files as sources", () => {
    const css = [
      readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/v2/v2.module.css"), "utf8"),
    ].join("\n");
    const train = readFileSync(
      resolve(process.cwd(), "components/toys/WindowSeatToy.tsx"),
      "utf8",
    );

    expect(css).toContain('/assets/optimized/radio.webp');
    expect(css).toContain('/assets/optimized/study-paper.webp');
    expect(css).toContain('/assets/optimized/train-window-still.webp');
    expect(train).toContain('/assets/optimized/train-window.webp');

    for (const source of [
      "public/assets/v2/radio.png",
      "public/assets/v2/study-paper.png",
      "public/assets/train-window.png",
      "public/assets/train-window-still.png",
    ]) {
      expect(existsSync(resolve(process.cwd(), source)), source).toBe(true);
    }
  });

  it("provides a repeatable production-build budget check", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    const budgetScript = resolve(
      process.cwd(),
      "scripts/check-performance-budget.mjs",
    );

    expect(existsSync(budgetScript)).toBe(true);
    expect(packageJson.scripts?.["test:performance-budget"]).toBe(
      "node scripts/check-performance-budget.mjs",
    );
  });
});
