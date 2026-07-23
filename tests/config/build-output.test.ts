import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const assertionScript = readFileSync(
  resolve(process.cwd(), "scripts/assert-static-output.mjs"),
  "utf8",
);

describe("static build-output assertions", () => {
  it.each([
    "dist/blog/index.html",
    "dist/blog/weird-use-of-ai-3/index.html",
    "dist/blog/weird-use-of-ai-1/index.html",
    "dist/blog/a-different-kind-of-hackathon/index.html",
    "dist/rss.xml",
    "dist/sitemap.xml",
    "dist/robots.txt",
  ])("checks %s", (route) => {
    expect(assertionScript).toContain(route);
  });

  it.each([
    "rel=\"canonical\"",
    "application/ld+json",
    "og:type",
    "twitter:card",
    "<p><figure",
  ])("checks exported article HTML for %s", (marker) => {
    expect(assertionScript).toContain(marker);
  });
});
