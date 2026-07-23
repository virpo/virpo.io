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

test("renders six project cards", () => {
  assert.equal((html.match(/class="project-card/g) || []).length, 6);
});

test("contains no weather or visual configurator", () => {
  assert.doesNotMatch(html, /data-tokyo-weather|theme-toggle|font-chip|palette-chip/);
});

test("keeps the approved bento tokens and responsive rules", () => {
  assert.match(css, /--gap:\s*3px/);
  assert.match(css, /--radius:\s*10px/);
  assert.match(css, /aspect-ratio:\s*1\s*\/\s*1/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test("initializes each approved interaction", () => {
  for (const name of [
    "initializeBloomTicker",
    "initializeFaceTracker",
    "initializeSounds",
    "initializeTrain",
    "initializeStudy",
    "initializeFocusMenu",
  ]) {
    assert.match(app, new RegExp(`function ${name}\\(`));
  }
});
