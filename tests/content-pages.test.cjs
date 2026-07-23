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
