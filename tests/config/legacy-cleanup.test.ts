import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const legacyFiles = [
  "index.html",
  "blog/index.html",
  "projects/index.html",
  "app.js",
  "study-engine.js",
  "japan-data.js",
  "styles.css",
  "tests/app-dom-behavior.test.cjs",
  "tests/content-pages.test.cjs",
  "tests/homepage-structure.test.cjs",
  "tests/japan-data.test.cjs",
  "tests/study-engine.test.cjs",
];

describe("legacy static cleanup", () => {
  it.each(legacyFiles)("removes %s after its Next equivalent is covered", (file) => {
    expect(existsSync(resolve(process.cwd(), file))).toBe(false);
  });
});
