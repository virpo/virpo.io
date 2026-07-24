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
    "dist/projects/index.html",
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

  it.each([
    'rel="canonical" href="https://virpo.io/projects/"',
    'property="og:url" content="https://virpo.io/projects/"',
    'property="og:type" content="website"',
    'name="twitter:card"',
    'name="twitter:title"',
    'class="projectCard ',
    "/assets/projects/youtldr-home.png",
    "/assets/projects/zltastopa-sk-thumb.png",
    "/assets/projects/mood-radio.jpg",
    "/assets/projects/pegboard.jpg",
    "/assets/projects/ai-build-week.jpg",
    "/assets/projects/cmux-deck.jpeg",
  ])("checks exported project HTML for %s", (marker) => {
    expect(assertionScript).toContain(marker);
  });

  it("requires exactly six exported project cards", () => {
    expect(assertionScript).toContain("projectCardCount !== 6");
  });
});
