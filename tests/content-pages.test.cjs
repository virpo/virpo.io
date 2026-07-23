const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const pages = {
  home: fs.readFileSync("index.html", "utf8"),
  blog: fs.readFileSync("blog/index.html", "utf8"),
  projects: fs.readFileSync("projects/index.html", "utf8"),
};
const styles = fs.readFileSync("styles.css", "utf8");

function pngDimensions(path) {
  const data = fs.readFileSync(path);
  assert.equal(data.toString("ascii", 1, 4), "PNG");
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

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

test("coral copy uses the AA-safe dark accent without changing the brand tile", () => {
  assert.match(styles, /--accent-dark:\s*#8c2014/);
  for (const selector of [
    "\\.section-label",
    "\\.intro h1 em",
    "\\.post-index",
    "\\.post-series",
  ]) {
    assert.match(
      styles,
      new RegExp(`${selector}\\s*\\{[^}]*color:\\s*var\\(--accent-dark\\)`, "s"),
    );
  }
  assert.match(styles, /\.brand\s*\{[^}]*background:\s*var\(--accent\)/s);
});

test("blog images prioritize a responsive, dimensioned first hero and defer later imagery", () => {
  const imageTag = (source) => {
    const tag = pages.blog.match(new RegExp(`<img[^>]+src="${source}"[^>]*>`));
    assert.ok(tag);
    return tag[0];
  };

  const hero = imageTag("/assets/blog/ai-build-day.png");
  assert.match(hero, /fetchpriority="high"/);
  assert.match(hero, /decoding="async"/);
  assert.match(hero, /width="1902"/);
  assert.match(hero, /height="994"/);
  assert.doesNotMatch(hero, /loading="lazy"/);
  assert.match(
    pages.blog,
    /<picture>[\s\S]*?<source[^>]+srcset="\/assets\/blog\/ai-build-day-1200\.webp 1200w"[^>]+type="image\/webp"[^>]*>[\s\S]*?<img[^>]+src="\/assets\/blog\/ai-build-day\.png"[\s\S]*?<\/picture>/,
  );
  const webpPath = "assets/blog/ai-build-day-1200.webp";
  assert.ok(fs.existsSync(webpPath));
  assert.ok(fs.statSync(webpPath).size < 600_000);

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

test("the hackathon post states the verified first-euro timing", () => {
  assert.match(
    pages.blog,
    /one of them earned its first euro within two weeks\./,
  );
  assert.doesNotMatch(pages.blog, /earned its first euro just weeks later/);
});

test("the project archive contains six complete linked projects", () => {
  const cards = [...pages.projects.matchAll(/<a class="project-card[^"]*"[\s\S]*?<\/a>/g)];
  assert.equal(cards.length, 6);
  for (const [index, [card]] of cards.entries()) {
    assert.match(card, /href="https?:\/\//);

    const images = card.match(/<img\b[^>]*>/g) || [];
    const titles = card.match(/<strong>[^<]+<\/strong>/g) || [];
    const types = card.match(/<small>[^<]+<\/small>/g) || [];
    const copies = card.match(/<span class="project-copy">[\s\S]*?<\/span>/g) || [];
    assert.equal(images.length, 1);
    assert.equal(titles.length, 1);
    assert.equal(types.length, 1);
    assert.equal(copies.length, 1);

    const imageSource = images[0].match(/src="(\/assets\/projects\/[^"]+)"/);
    assert.ok(imageSource);
    assert.ok(fs.existsSync(imageSource[1].slice(1)));
    assert.match(images[0], /\bwidth="\d+"/);
    assert.match(images[0], /\bheight="\d+"/);
    assert.match(images[0], /\bdecoding="async"/);
    if (index === 0) assert.doesNotMatch(images[0], /\bloading="lazy"/);
    else assert.match(images[0], /\bloading="lazy"/);

    const copy = copies[0].match(/<span class="project-copy">([\s\S]*?)<\/span>/);
    assert.ok(copy);
    assert.match(
      copy[1],
      /^\s*<strong>[^<]+<\/strong>\s*<small>[^<]+<\/small>\s*$/,
    );
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

test("project cards share a stable ratio and protect screenshot content", () => {
  const cardRule = styles.match(/\.project-card\s*\{([^}]*)\}/);
  const imageRule = styles.match(/\.project-card img\s*\{([^}]*)\}/);
  assert.ok(cardRule);
  assert.ok(imageRule);
  assert.match(cardRule[1], /aspect-ratio:\s*3\s*\/\s*2/);
  assert.doesNotMatch(cardRule[1], /min-height/);
  assert.doesNotMatch(imageRule[1], /min-height/);
  assert.doesNotMatch(
    styles,
    /\.project-card(?:\s*,\s*\.project-card img)?\s*\{[^}]*min-height/s,
  );
  assert.match(
    styles,
    /\.project-card--contain img\s*\{[^}]*object-fit:\s*contain/s,
  );

  const cards = [...pages.projects.matchAll(/<a class="project-card[^"]*"[\s\S]*?<\/a>/g)]
    .map(([card]) => card);
  for (const title of ["YouTLDR", "Žltá stopa", "AI Build Week"]) {
    const card = cards.find((entry) => entry.includes(`<strong>${title}</strong>`));
    assert.ok(card);
    assert.match(card, /class="project-card[^"]*project-card--contain/);
  }
});

test("the YouTLDR card uses its fresh 3:2 capture dimensions", () => {
  const card = pages.projects.match(
    /<a class="project-card[^"]*" href="https:\/\/youtldr\.com\/"[\s\S]*?<\/a>/,
  );
  assert.ok(card);
  const image = card[0].match(
    /<img src="\/assets\/projects\/youtldr-home\.png"[^>]+width="(\d+)" height="(\d+)"/,
  );
  assert.ok(image);
  const markup = { width: Number(image[1]), height: Number(image[2]) };
  const actual = pngDimensions("assets/projects/youtldr-home.png");
  assert.deepEqual(markup, actual);
  assert.deepEqual(actual, { width: 1200, height: 800 });
});
