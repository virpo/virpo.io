import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateStaticReferences } from "./validate-static-references.mjs";

const requiredFiles = [
  "dist/index.html",
  "dist/404.html",
  "dist/blog/index.html",
  "dist/projects/index.html",
  "dist/skills/index.html",
  "dist/blog/weird-use-of-ai-3/index.html",
  "dist/blog/weird-use-of-ai-1/index.html",
  "dist/blog/a-different-kind-of-hackathon/index.html",
  "dist/blog/how-this-room-was-made/index.html",
  "dist/rss.xml",
  "dist/sitemap.xml",
  "dist/robots.txt",
  "dist/llms.txt",
  "dist/v2/index.html",
  "dist/levels/index.html",
];

for (const file of requiredFiles) {
  const outputPath = resolve(file);
  try {
    await access(outputPath);
  } catch {
    throw new Error(`Expected static export at ${outputPath}`);
  }
}

await validateStaticReferences(resolve("dist"));

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
  "how-this-room-was-made",
  "weird-use-of-ai-3",
  "weird-use-of-ai-1",
  "a-different-kind-of-hackathon",
];

const homeFile = "dist/index.html";
const homeHtml = await readFile(resolve(homeFile), "utf8");
assertExcludes(homeHtml, 'class="projectCard ', homeFile);

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
  assertIncludes(html, '"@type":"BlogPosting"', file);
  assertIncludes(html, 'aria-label="More posts"', file);
  assertExcludes(html, 'content="noindex', file);
  for (const invalidMarkup of ["<p><figure", "</figure></p>", "<p></p>"]) {
    assertExcludes(html, invalidMarkup, file);
  }
}

// the old projects page and the old v2 home page are redirects now
for (const [file, target] of [["dist/projects/index.html", "/#projects"], ["dist/v2/index.html", "/"]]) {
  const html = await readFile(resolve(file), "utf8");
  assertIncludes(html, `http-equiv="refresh" content="0; url=${target}"`, file);
  assertIncludes(html, 'rel="canonical" href="https://virpo.io/"', file);
}

assertIncludes(homeHtml, 'rel="canonical" href="https://virpo.io/"', homeFile);
assertIncludes(homeHtml, 'property="og:image" content="https://virpo.io/og/og-image.png"', homeFile);
assertIncludes(homeHtml, 'property="og:video" content="https://virpo.io/og/room-loop.mp4"', homeFile);
assertIncludes(homeHtml, '"@type":"ProfilePage"', homeFile);
assertExcludes(homeHtml, 'content="noindex', homeFile);

const skillsFile = "dist/skills/index.html";
const skillsHtml = await readFile(resolve(skillsFile), "utf8");
assertIncludes(
  skillsHtml,
  'rel="canonical" href="https://virpo.io/skills/"',
  skillsFile,
);
assertIncludes(skillsHtml, "npx skills add virpo/agent-skills --skill", skillsFile);
assertIncludes(homeHtml, 'href="/skills/"', homeFile);

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

assertIncludes(sitemap, "https://virpo.io/skills/", "dist/sitemap.xml");
assertIncludes(sitemap, "https://virpo.io/levels/", "dist/sitemap.xml");
assertIncludes(robots, "Sitemap: https://virpo.io/sitemap.xml", "dist/robots.txt");

// every preview image and video a page announces, and every video poster, must ship
{
  const { readdir } = await import("node:fs/promises");
  const pages = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".html")) pages.push(path);
    }
  };
  await walk(resolve("dist"));
  const missing = new Set();
  for (const page of pages) {
    const html = await readFile(page, "utf8");
    const refs = [
      ...html.matchAll(/(?:property|name)="(?:og:image|og:video|og:video:secure_url|twitter:image)" content="https:\/\/virpo\.io(\/[^"]+)"/g),
      ...html.matchAll(/<video[^>]*?\s(?:src|poster)="(\/[^"]+)"/g),
      ...html.matchAll(/<video[^>]*?\sposter="(\/[^"]+)"/g),
    ].map((match) => match[1].split(/[?#]/)[0]);
    for (const ref of refs) {
      try {
        await access(resolve("dist", "." + decodeURI(ref)));
      } catch {
        missing.add(`${ref} (in ${page.replace(resolve("dist"), "dist")})`);
      }
    }
  }
  if (missing.size) throw new Error(`Preview media missing from dist:\n${[...missing].join("\n")}`);
}
