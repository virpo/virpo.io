import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const optimizedAssets = [
  { path: "public/assets/optimized/radio.webp", maxBytes: 300_000 },
  { path: "public/assets/optimized/study-paper.webp", maxBytes: 300_000 },
  { path: "public/assets/optimized/train-window.webp", maxBytes: 400_000 },
  { path: "public/assets/optimized/train-window-mobile.webp", maxBytes: 250_000 },
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
