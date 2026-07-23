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
  const articles = [...pages.blog.matchAll(/<article class="tile blog-post"[\s\S]*?<\/article>/g)];
  assert.equal(articles.length, 3);
  for (const [article] of articles) {
    const blogCopy = article.match(/<div class="blog-copy">([\s\S]*?)<\/div>/);
    assert.ok(blogCopy);
    const paragraphs = blogCopy[1].match(/<p>[\s\S]*?<\/p>/g) || [];
    assert.ok(paragraphs.length >= 1 && paragraphs.length <= 2);

    const imageSources = [...article.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
      ([, source]) => source,
    );
    assert.ok(imageSources.length >= 1);
    assert.doesNotMatch(article, /<img[^>]+src="https?:\/\//);
    for (const source of imageSources) {
      assert.match(source, /^\/assets\/blog\//);
      assert.ok(fs.existsSync(source.slice(1)));
    }
  }
});

test("the desktop blog uses equal readable columns and places copy on the right", () => {
  assert.match(
    styles,
    /\.blog-post\s*\{[^}]*grid-template-columns:\s*minmax\(360px,\s*1fr\)\s+minmax\(0,\s*1fr\)/s,
  );
  assert.match(styles, /\.blog-copy\s*\{[^}]*grid-column:\s*2/s);
  assert.match(styles, /\.blog-post__header h2\s*\{[^}]*text-wrap:\s*balance/s);
});

test("the mobile blog resets copy to the single column", () => {
  assert.match(
    styles,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.blog-copy\s*\{[^}]*grid-column:\s*1/,
  );
});

test("the blog intro label uses its AA-safe color", () => {
  assert.match(styles, /\.page-intro\s+\.section-label\s*\{[^}]*color:\s*#8c2014/s);
});

test("blog images prioritize the first hero and defer later imagery", () => {
  const imageTag = (source) => {
    const tag = pages.blog.match(new RegExp(`<img[^>]+src="${source}"[^>]*>`));
    assert.ok(tag);
    return tag[0];
  };

  const hero = imageTag("/assets/blog/ai-build-day.png");
  assert.match(hero, /fetchpriority="high"/);
  assert.match(hero, /decoding="async"/);
  assert.doesNotMatch(hero, /loading="lazy"/);

  for (const source of [
    "/assets/blog/pegboard-sketch.jpg",
    "/assets/blog/pegboard-finished.jpg",
    "/assets/blog/detective-skills.png",
  ]) {
    const deferred = imageTag(source);
    assert.match(deferred, /loading="lazy"/);
    assert.match(deferred, /decoding="async"/);
  }
});

test("the project archive contains six complete linked projects", () => {
  const cards = [...pages.projects.matchAll(/<a class="project-card[^"]*"[\s\S]*?<\/a>/g)];
  assert.equal(cards.length, 6);
  for (const [card] of cards) {
    assert.match(card, /href="https?:\/\//);
    assert.match(card, /<img src="\/assets\/projects\/[^"]+"/);
    assert.match(card, /<strong>[^<]+<\/strong>/);
    assert.match(card, /<small>[^<]+<\/small>/);
  }
});

test("the project archive contains the current selected projects", () => {
  for (const title of [
    "YouTLDR",
    "Žltá stopa",
    "Mood Radio",
    "Pegboard Toy",
    "AI Build Week",
    "CMUX Deck",
  ]) {
    assert.match(pages.projects, new RegExp(title));
  }
});
