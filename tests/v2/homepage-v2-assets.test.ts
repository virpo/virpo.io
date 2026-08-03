import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const assets = [
  "public/assets/v2/radio.png",
  "public/assets/v2/study-paper.png",
  "public/assets/v2/bloom-lotus.png",
];

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
    expect(guide).toContain("Safe overlay area");
  });
});
