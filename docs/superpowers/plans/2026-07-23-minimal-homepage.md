# Minimal virpo.io Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the current configurable homepage with the approved C3 bento homepage: square face, writing, three ordered Japan toys, next-bloom masthead, and six projects.

**Architecture:** Keep the site framework-free. Put date-sensitive bloom logic in a small UMD data module that is testable with Node's built-in test runner, then keep DOM interactions in `app.js`. Replace only the public homepage files; preserve the module, layout, wireframe, and fact labs.

**Tech Stack:** HTML, CSS, browser JavaScript, Node `node:test`, Playwright CLI, existing local audio/image assets.

## Global Constraints

- Canvas black; white modules; structural gap `3px`; radius `10px`; accent `#d0513e`.
- Righteous is the primary typeface.
- Masthead order: `virpo`, menu, Tokyo/next-bloom toy.
- Left-rail order: square face, Familiar Sounds, Window Seat, Japanese Study.
- Writing stays one large right-side module with the short approved introduction.
- Projects are six real projects in a desktop 3 × 2 grid.
- No weather, visual configurator, autoplay audio, CMS, account, or new framework.
- Preserve all unrelated working-tree changes.

---

### Task 1: Testable next-bloom calendar

**Files:**
- Create: `japan-data.js`
- Create: `tests/japan-data.test.cjs`

**Interfaces:**
- Produces: `VirpoJapanData.blooms`
- Produces: `VirpoJapanData.getTokyoParts(date)`
- Produces: `VirpoJapanData.getBloomState(parts, entries)`
- `getBloomState` returns `{ status, bloom, days, label }`, where `status` is `upcoming`, `active`, or `unavailable`.

- [x] **Step 1: Write failing calendar tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { getBloomState } = require("../japan-data.js");

const bloom = {
  id: "sunflower",
  name: "Sunflowers",
  emoji: "🌻",
  startMonth: 7,
  startDay: 27,
  endMonth: 8,
  endDay: 15,
  place: "Hokuryu Sunflower Village",
  region: "Hokkaido",
  sourceUrl: "https://www.japan.travel/en/spot/1882/",
};

test("returns the next bloom before its window", () => {
  const state = getBloomState({ year: 2026, month: 7, day: 23 }, [bloom]);
  assert.equal(state.status, "upcoming");
  assert.equal(state.days, 4);
  assert.equal(state.bloom.id, "sunflower");
});

test("returns active bloom and remaining days inside its window", () => {
  const state = getBloomState({ year: 2026, month: 8, day: 1 }, [bloom]);
  assert.equal(state.status, "active");
  assert.equal(state.days, 14);
});

test("rolls the next bloom into the following year", () => {
  const state = getBloomState({ year: 2026, month: 12, day: 31 }, [bloom]);
  assert.equal(state.status, "upcoming");
  assert.equal(state.bloom.id, "sunflower");
});

test("skips malformed entries", () => {
  const state = getBloomState({ year: 2026, month: 7, day: 23 }, [{ name: "Broken" }]);
  assert.equal(state.status, "unavailable");
});
```

- [x] **Step 2: Run the tests and verify RED**

Run: `node --test tests/japan-data.test.cjs`
Expected: FAIL because `japan-data.js` does not exist.

- [x] **Step 3: Implement the calendar module**

Create a UMD module that assigns the same API to `module.exports` in Node and
`window.VirpoJapanData` in the browser. `getTokyoParts` must use
`Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", ... })`.
`getBloomState` must convert the supplied Tokyo parts and every valid bloom
window to UTC-midnight dates, detect an active window first, then select the
nearest future start across the current and following year. It must return
`unavailable` when no valid entry remains.

The normalized entries are Camellia/Izu Oshima, Plum/Kairakuen, Sakura/Tokyo, Wisteria/Ashikaga, Hydrangea/Hasedera, Lotus/Gyoda, Sunflower/Hokuryu, Cosmos/Hitachi, and Chrysanthemum/Shinjuku Gyoen. Each includes a JNTO or official destination source URL.

- [x] **Step 4: Run the tests and verify GREEN**

Run: `node --test tests/japan-data.test.cjs`
Expected: 4 tests pass, 0 fail.

### Task 2: Homepage structure and real project assets

**Files:**
- Modify: `index.html`
- Create: `assets/projects/pegboard.jpg`
- Create: `assets/projects/ai-build-week.jpg`
- Create: `assets/projects/cmux-deck.jpeg`
- Create: `tests/homepage-structure.test.cjs`

**Interfaces:**
- Consumes: `VirpoJapanData` from `japan-data.js`.
- Produces DOM hooks: `[data-focus]`, `[data-bloom-*]`, `[data-face]`, `[data-sounds]`, `[data-train]`, `[data-study]`, `#primary-field`, and `#projects`.

- [x] **Step 1: Write failing structure tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");

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
```

- [x] **Step 2: Run the tests and verify RED**

Run: `node --test tests/homepage-structure.test.cjs`
Expected: FAIL because the homepage still contains the old controls and only three projects.

- [x] **Step 3: Copy three real assets**

```bash
cp /Users/hraska/Code/temp/pegboard/docs/assets/from-sketch-to-play.jpg assets/projects/pegboard.jpg
cp /Users/hraska/Code/temp/ai-build-week/website/public/og.png assets/projects/ai-build-week.jpg
cp /Users/hraska/Code/personal/stream-deck/assets/cmux-deck.jpeg assets/projects/cmux-deck.jpeg
```

- [x] **Step 4: Replace the public homepage markup**

`index.html` must contain:

```html
<header class="masthead">
  <a class="tile brand" href="/">virpo</a>
  <nav class="tile primary-nav" aria-label="Primary">
    <button data-focus="writing" aria-pressed="true">Writing</button>
    <button data-focus="projects" aria-pressed="false">Projects</button>
    <button data-focus="about" aria-pressed="false">About</button>
  </nav>
  <section class="tile bloom-ticker" data-bloom-module><!-- time, trigger, popover --></section>
</header>
<div class="content-flow">
  <section class="primary-field" id="primary-field">
    <aside class="toy-rail">
      <section class="tile face-tile" data-face></section>
      <section class="tile sound-toy" data-toy="sounds" data-sounds></section>
      <section class="tile train-toy" data-toy="train" data-train></section>
      <section class="tile study-toy" data-toy="study" data-study></section>
    </aside>
    <section class="tile writing-tile" id="writing"><!-- intro and posts --></section>
  </section>
  <section class="project-grid" id="projects"><!-- six project cards --></section>
</div>
```

The six cards are YouTLDR, Žltá stopa, Mood Radio, Pegboard Toy, AI Build Week, and CMUX Deck. Use `https://youtldr.com/`, `https://zltastopa.sk/`, the existing Mood Radio URL, `https://github.com/virpo/pegboard`, `https://aibuildweek.com/`, and `https://github.com/virpo/cmux-deck`.

- [x] **Step 5: Run the structure tests and verify GREEN**

Run: `node --test tests/homepage-structure.test.cjs`
Expected: 4 tests pass, 0 fail.

### Task 3: C3 visual system and responsive layout

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes the DOM class names from Task 2.
- Produces desktop two-column layout, square face, ordered toy rail, 3 × 2 projects, and mobile stacking.

- [x] **Step 1: Add structural assertions**

Extend `tests/homepage-structure.test.cjs`:

```js
const css = fs.readFileSync("styles.css", "utf8");
test("keeps the approved bento tokens and responsive rules", () => {
  assert.match(css, /--gap:\\s*3px/);
  assert.match(css, /--radius:\\s*10px/);
  assert.match(css, /aspect-ratio:\\s*1\\s*\\/\\s*1/);
  assert.match(css, /grid-template-columns:\\s*repeat\\(3,\\s*minmax\\(0,\\s*1fr\\)\\)/);
  assert.match(css, /@media\\s*\\(max-width:\\s*760px\\)/);
});
```

- [x] **Step 2: Run the assertion and verify RED**

Run: `node --test tests/homepage-structure.test.cjs`
Expected: FAIL because the approved variables and layout do not exist.

- [x] **Step 3: Replace `styles.css`**

Implement:

```css
:root {
  --gap: 3px;
  --radius: 10px;
  --accent: #d0513e;
  --ink: #090909;
  --surface: #fff;
}
body { margin: 0; min-height: 100vh; background: #000; font-family: "Righteous", sans-serif; }
.site-shell { padding: var(--gap); }
.masthead { display: grid; grid-template-columns: max-content max-content 1fr; gap: var(--gap); }
.primary-field { display: grid; grid-template-columns: minmax(260px, 35%) 1fr; gap: var(--gap); }
.face-tile { aspect-ratio: 1 / 1; }
.project-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap); }
@media (max-width: 760px) {
  .masthead, .primary-field { grid-template-columns: 1fr; }
  .brand-and-menu { grid-row: 1; }
  .bloom-ticker { grid-row: 2; }
  .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 440px) {
  .project-grid { grid-template-columns: 1fr; }
}
```

Add the full approved component styling: white tiles, internal header rules, colored toy bodies, visible focus states, popover, muted running-train frame, study reveal, sound waveform, article rows, project overlays, and reduced-motion fallbacks.

- [x] **Step 4: Run the assertions and verify GREEN**

Run: `node --test tests/homepage-structure.test.cjs`
Expected: all structure assertions pass.

### Task 4: Homepage interactions

**Files:**
- Modify: `app.js`
- Test: `tests/japan-data.test.cjs`
- Test: `tests/homepage-structure.test.cjs`

**Interfaces:**
- Consumes `window.VirpoJapanData`.
- Produces bloom ticker/popover, face tracking, sound controls, train pause, study reveal/next, and menu reordering.

- [x] **Step 1: Add failing static behavior assertions**

```js
const app = fs.readFileSync("app.js", "utf8");
test("initializes each approved interaction", () => {
  for (const name of [
    "initializeBloomTicker",
    "initializeFaceTracker",
    "initializeSounds",
    "initializeTrain",
    "initializeStudy",
    "initializeFocusMenu",
  ]) assert.match(app, new RegExp(`function ${name}\\\\(`));
});
```

- [x] **Step 2: Run the assertion and verify RED**

Run: `node --test tests/homepage-structure.test.cjs`
Expected: FAIL because the new initializers do not exist.

- [x] **Step 3: Replace `app.js` with focused initializers**

Implement these exact initializers and call them in this order:

1. `initializeBloomTicker()` reads `window.VirpoJapanData`, updates
   `[data-tokyo-time]` once a minute, renders `[data-bloom-emoji]`,
   `[data-bloom-name]`, `[data-bloom-countdown]`, `[data-bloom-place]`, and
   `[data-bloom-window]`, and toggles `[data-bloom-popover]` from
   `[data-bloom-trigger]`.
2. `initializeFaceTracker()` reuses the current `gaze_px...webp` filename
   quantization and updates only on fine-pointer devices.
3. `initializeSounds()` owns one seven-item local audio queue, updates
   `[data-sound-title]`, and wires previous, play/pause, and next buttons.
4. `initializeTrain()` stores the original iframe URL, clears/restores it from
   the train toggle, and starts paused when reduced motion is requested.
5. `initializeStudy()` rotates the compact vocabulary cards `電車`, `駅`, `空`,
   `雨`, and `喫茶店`; first press reveals reading/meaning and second press
   advances; the index persists under `virpo-study-index`.
6. `initializeFocusMenu()` records element rectangles, reorders `#projects` and
   `#primary-field`, animates their FLIP deltas, maintains `aria-pressed`, and
   focuses the introduction in About mode.

The bloom popover closes on outside click, second tap, and `Escape`. Audio never starts until the play button is pressed. Train motion is muted and can be paused. Project focus moves the project grid before `#primary-field`; Writing restores the default order; About highlights and focuses the introduction.

- [x] **Step 4: Run all Node tests and verify GREEN**

Run: `node --test tests/*.test.cjs`
Expected: all tests pass.

### Task 5: Browser verification and documentation

**Files:**
- Modify: `docs/superpowers/plans/2026-07-23-minimal-homepage.md` (check completed steps)
- Create: `output/playwright/minimal-homepage-desktop.png`
- Create: `output/playwright/minimal-homepage-mobile.png`

- [x] **Step 1: Start a local server**

Run: `python3 -m http.server 4173`
Expected: server listens on `http://127.0.0.1:4173`.

- [x] **Step 2: Verify desktop with Playwright CLI**

Run:

```bash
PWCLI=/Users/hraska/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" open http://127.0.0.1:4173 --headed
"$PWCLI" snapshot
"$PWCLI" screenshot --filename output/playwright/minimal-homepage-desktop.png
```

Verify in the snapshot and screenshot: square face, Writing active, bloom ticker visible, toys ordered Sounds → Train → Study, and six project cards.

- [x] **Step 3: Exercise interactions**

Use fresh snapshot refs to:

- open and close the bloom popover;
- start and pause Familiar Sounds;
- pause and resume the train;
- reveal and advance one study card;
- select Projects and confirm the 3 × 2 grid moves above the primary field;
- restore Writing;
- select About and confirm the introduction is emphasized.

- [x] **Step 4: Verify mobile**

Resize the CLI browser to 390 × 844, snapshot, and save `output/playwright/minimal-homepage-mobile.png`. Confirm no horizontal overflow, full-width bloom ticker, readable menu, square face, and usable project cards.

- [x] **Step 5: Run final verification**

Run:

```bash
node --test tests/*.test.cjs
node --check japan-data.js
node --check app.js
git diff --check
```

Expected: tests pass, both scripts parse, and no whitespace errors.
