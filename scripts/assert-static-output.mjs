import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const requiredFiles = [
  "dist/index.html",
  "dist/blog/index.html",
  "dist/blog/weird-use-of-ai-3/index.html",
  "dist/blog/weird-use-of-ai-1/index.html",
  "dist/blog/a-different-kind-of-hackathon/index.html",
  "dist/rss.xml",
  "dist/sitemap.xml",
  "dist/robots.txt",
];

for (const file of requiredFiles) {
  const outputPath = resolve(file);
  try {
    await access(outputPath);
  } catch {
    throw new Error(`Expected static export at ${outputPath}`);
  }
}

function assertIncludes(source, marker, file) {
  if (!source.includes(marker)) {
    throw new Error(`Expected ${file} to include ${marker}`);
  }
}

function assertExcludes(source, marker, file) {
  if (source.includes(marker)) {
    throw new Error(`Expected ${file} to exclude ${marker}`);
  }
}

const articleSlugs = [
  "weird-use-of-ai-3",
  "weird-use-of-ai-1",
  "a-different-kind-of-hackathon",
];

for (const slug of articleSlugs) {
  const file = `dist/blog/${slug}/index.html`;
  const html = await readFile(resolve(file), "utf8");

  assertIncludes(
    html,
    `rel="canonical" href="https://virpo.io/blog/${slug}/"`,
    file,
  );
  assertIncludes(html, 'property="og:type" content="article"', file);
  assertIncludes(html, 'name="twitter:card"', file);
  assertIncludes(html, "application/ld+json", file);
  assertIncludes(html, '"@type":"Article"', file);
  assertIncludes(html, 'aria-label="Continue exploring"', file);
  for (const invalidMarkup of ["<p><figure", "</figure></p>", "<p></p>"]) {
    assertExcludes(html, invalidMarkup, file);
  }
}

const rss = await readFile(resolve("dist/rss.xml"), "utf8");
const sitemap = await readFile(resolve("dist/sitemap.xml"), "utf8");
const robots = await readFile(resolve("dist/robots.txt"), "utf8");

if ((rss.match(/<item>/g) ?? []).length !== articleSlugs.length) {
  throw new Error(`Expected dist/rss.xml to include ${articleSlugs.length} items`);
}

for (const slug of articleSlugs) {
  const url = `https://virpo.io/blog/${slug}/`;
  assertIncludes(rss, url, "dist/rss.xml");
  assertIncludes(sitemap, url, "dist/sitemap.xml");
}

assertIncludes(robots, "Sitemap: https://virpo.io/sitemap.xml", "dist/robots.txt");
