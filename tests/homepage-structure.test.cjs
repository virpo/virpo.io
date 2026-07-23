const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

test("loads the homepage data before app behavior", () => {
  assert.ok(html.indexOf("./japan-data.js") < html.indexOf("./app.js"));
});

test("keeps the required toy order", () => {
  const sounds = html.indexOf('data-toy="sounds"');
  const train = html.indexOf('data-toy="train"');
  const study = html.indexOf('data-toy="study"');
  assert.ok(sounds > 0 && sounds < train && train < study);
});

test("contains three linked post previews and no project gallery", () => {
  assert.equal((html.match(/class="post-row"/g) || []).length, 3);
  assert.match(html, /href="\/projects\/"/);
  assert.match(html, /href="\/blog\/#a-different-kind-of-hackathon"/);
  assert.match(html, /href="\/blog\/#weird-use-of-ai-1"/);
  assert.match(html, /href="\/blog\/#weird-use-of-ai-3"/);
  assert.doesNotMatch(html, /class="projects-section"|class="project-card/);
});

test("uses current work copy and only LinkedIn and GitHub profile links", () => {
  assert.match(html, /I work at Slido, now part of Cisco\./);
  assert.match(html, /linkedin\.com\/in\/hraska/);
  assert.match(html, /github\.com\/virpo/);
  assert.doesNotMatch(html, /Old portfolio|Face experiment/);
});

test("removes unexplained and redundant controls", () => {
  assert.doesNotMatch(html, /bloom-help|face-hint|data-train-toggle|Japan in 8 sec/);
  assert.match(html, /Familiar Japanese Sounds/);
  assert.match(html, /data-sound-play-icon/);
  assert.match(html, /data-sound-pause-icon/);
});

test("contains no weather or visual configurator", () => {
  assert.doesNotMatch(html, /data-tokyo-weather|theme-toggle|font-chip|palette-chip/);
});

test("keeps the approved bento tokens and responsive rules", () => {
  assert.match(css, /--gap:\s*3px/);
  assert.match(css, /--radius:\s*10px/);
  assert.match(css, /aspect-ratio:\s*1\s*\/\s*1/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test("keeps the bloom disclosure arrow on the desktop row", () => {
  assert.match(
    css,
    /\.bloom-trigger\s*\{[^}]*grid-template-columns:\s*3\.25rem minmax\(0,\s*1fr\) auto/s,
  );
});

test("keeps only the current homepage initializers", () => {
  for (const name of [
    "initializeBloomTicker",
    "initializeFaceTracker",
    "initializeSounds",
    "initializeTrain",
  ]) {
    assert.match(app, new RegExp(`function ${name}\\(`));
  }
  assert.doesNotMatch(app, /function initializeFocusMenu\(/);
});
