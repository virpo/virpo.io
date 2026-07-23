const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("styles.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

test("loads the homepage data before app behavior", () => {
  assert.ok(html.indexOf("./japan-data.js") < html.indexOf("/app.js"));
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
    "initializeStudy",
  ]) {
    assert.match(app, new RegExp(`function ${name}\\(`));
  }
  assert.doesNotMatch(app, /function initializeFocusMenu\(/);
});

test("loads the study engine immediately before homepage behavior", () => {
  assert.match(
    html,
    /<script src="\/study-engine\.js"><\/script>\s*<script src="\/app\.js"><\/script>/,
  );
});

test("contains one complete, accessible local study interface", () => {
  const hooks = [
    "data-study-level",
    "data-study-progress",
    "data-study-due",
    "data-study-card",
    "data-study-writing",
    "data-study-reading",
    "data-study-meaning",
    "data-study-actions",
    "data-study-again",
    "data-study-got-it",
    "data-study-reset",
  ];

  for (const hook of hooks) {
    assert.equal((html.match(new RegExp(hook, "g")) || []).length, 1, hook);
  }

  assert.match(
    html,
    /<button\s+class="study-card"\s+data-study-card\s+type="button"\s+aria-label="Reveal answer"\s+aria-expanded="false"/,
  );
  assert.match(html, /aria-controls="study-actions"/);
  assert.match(html, /data-study-reading aria-live="polite"/);
  assert.match(
    html,
    /<div\b(?=[^>]*data-study-actions)(?=[^>]*\shidden(?:\s|>))[^>]*>/,
  );
  assert.match(html, /data-study-rest aria-live="polite"/);
  assert.match(app, /const storageKey = "virpo-study-v1"/);
  assert.match(app, /window\.localStorage\.getItem\(storageKey\)/);
  assert.match(app, /window\.localStorage\.setItem\(storageKey,\s*JSON\.stringify\(state\)\)/);
  assert.match(app, /window\.confirm\("Reset all Japanese Study progress\?"\)/);
});

test("implements the approved kana and Kanji reveal contract", () => {
  assert.match(app, /reading\.hidden = !revealed && current\.level !== "kanji"/);
  assert.match(app, /meaning\.hidden = !revealed \|\| current\.level !== "kanji"/);
  assert.match(app, /revealed \? "How did it go\?" : "tap to reveal"/);
  assert.match(app, /again\.addEventListener\("click", \(\) => score\(false\)\)/);
  assert.match(app, /gotIt\.addEventListener\("click", \(\) => score\(true\)\)/);
  assert.match(app, /initializeTrain\(\);\s*initializeStudy\(\);/);
});

test("keeps secondary study actions touchable and visibly focused", () => {
  assert.match(
    css,
    /\.study-reset\s*\{[^}]*min-height:\s*32px[^}]*padding:\s*0\s+0\.5rem/s,
  );
  assert.match(
    css,
    /\.study-actions \[data-study-got-it\]:focus-visible\s*\{[^}]*outline:\s*4px solid #173d22[^}]*outline-offset:\s*-4px/s,
  );
});

test("desktop writing stretches with the tall toy rail while mobile stays compact", () => {
  assert.match(
    css,
    /\.primary-field\s*\{[^}]*align-items:\s*stretch/s,
  );
  assert.match(
    css,
    /\.writing-tile\s*\{[^}]*display:\s*grid[^}]*height:\s*100%[^}]*grid-template-rows:/s,
  );
  assert.match(
    css,
    /\.writing-list\s*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*auto repeat\(3,\s*minmax\(138px,\s*1fr\)\)/s,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.writing-tile\s*\{[^}]*display:\s*block[^}]*height:\s*auto/s,
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.writing-list\s*\{[^}]*display:\s*block/s,
  );
});
