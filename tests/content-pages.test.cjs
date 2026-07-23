const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const pages = {
  home: fs.readFileSync("index.html", "utf8"),
  blog: fs.readFileSync("blog/index.html", "utf8"),
  projects: fs.readFileSync("projects/index.html", "utf8"),
};
const styles = fs.readFileSync("styles.css", "utf8");

test("all public routes use the shared identity and navigation", () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /href="\/"[^>]*>[\s\S]*?<span>virpo<\/span>/);
    assert.match(html, /href="\/blog\/"/);
    assert.match(html, /href="\/projects\/"/);
    assert.match(html, /href="\/#about"/);
    assert.match(html, /href="\/assets\/brand-mark\.svg"/);
    assert.doesNotMatch(html, /🧩/);
  }
});

test("each route exposes one current page", () => {
  assert.match(pages.home, /class="tile brand" href="\/" aria-current="page"/);
  assert.match(pages.blog, /href="\/blog\/" aria-current="page"/);
  assert.match(pages.projects, /href="\/projects\/" aria-current="page"/);
});

test("all routes retain Tokyo time and bloom details", () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /data-tokyo-time/);
    assert.match(html, /data-bloom-trigger/);
    assert.match(html, /data-bloom-popover/);
  }
});

test("keeps the shared project grid responsive", () => {
  assert.match(
    styles,
    /\.project-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(
    styles,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.project-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(
    styles,
    /@media\s*\(max-width:\s*440px\)[\s\S]*?\.project-grid\s*\{[^}]*grid-template-columns:\s*1fr/,
  );
});

test("the blog contains three complete anchored posts", () => {
  const ids = [
    "a-different-kind-of-hackathon",
    "weird-use-of-ai-1",
    "weird-use-of-ai-3",
  ];
  for (const id of ids) assert.match(pages.blog, new RegExp(`id="${id}"`));
  assert.equal((pages.blog.match(/class="tile blog-post"/g) || []).length, 3);
  assert.match(pages.blog, /A different kind of hackathon/);
  assert.match(pages.blog, /Weird use of AI #1: A toy for my son/);
  assert.match(pages.blog, /Weird use of AI #3: Detective skills for journalists/);
});

test("every blog post uses local real imagery and one or two paragraphs", () => {
  for (const source of [
    "/assets/blog/ai-build-day.png",
    "/assets/blog/pegboard-sketch.jpg",
    "/assets/blog/pegboard-finished.jpg",
    "/assets/blog/detective-skills.png",
  ]) {
    assert.match(pages.blog, new RegExp(source.replaceAll("/", "\\/")));
    assert.ok(fs.existsSync(source.slice(1)));
  }
  const articles = [...pages.blog.matchAll(/<article class="tile blog-post"[\s\S]*?<\/article>/g)];
  assert.equal(articles.length, 3);
  for (const [article] of articles) {
    const paragraphs = article.match(/<p>/g) || [];
    assert.ok(paragraphs.length >= 1 && paragraphs.length <= 2);
  }
});
