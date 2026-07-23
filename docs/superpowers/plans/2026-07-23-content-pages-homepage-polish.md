# Virpo Content Pages and Homepage Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved bento homepage into a three-page personal site with sharper identity and copy, three real short posts, a complete projects archive, polished Japan toys, and a local spaced-repetition study tool.

**Architecture:** Keep the site as static, framework-free HTML, CSS, and browser JavaScript. Duplicate the small masthead in each HTML document so navigation remains indexable and usable without JavaScript, keep bloom and toy DOM behavior in `app.js`, and extract the study deck and scheduler into a UMD module that can be tested with Node's built-in test runner.

**Tech Stack:** HTML, CSS, browser JavaScript, UMD modules, `localStorage`, Node `node:test`, Python static server, Playwright CLI.

## Global Constraints

- Keep the Tom's-Toys-inspired bento system: black canvas, white modules, structural gap `3px`, radius `10px`, and Righteous typography.
- Public routes are exactly `/`, `/blog/`, and `/projects/`; About links to `/#about`.
- Written brand is plain `virpo`; visual identity is a red square with a white downward triangle `🔻`.
- No framework, package manager, CMS, client-side router, account, cloud progress, analytics, or autoplay audio.
- Homepage toy order remains Familiar Japanese Sounds, Window Seat, Japanese Study.
- Articles contain one or two direct paragraphs and real images.
- Project cards contain only screenshot/photo, title, project type, and destination URL.
- Study levels unlock in order: Hiragana, Katakana, Kanji vocabulary.
- Every card in a level must receive `Got it` twice before the next level unlocks.
- Preserve `module-lab.*`, `layout-lab.*`, `wireframe-lab.*`, `.superpowers/`, and existing `output/playwright/` files.
- Do not deploy or push.

## File Map

- `index.html`: landing page, introduction, three toys, and three latest-post links.
- `blog/index.html`: chronological feed containing the three complete short posts.
- `projects/index.html`: six-project visual archive, ready to accept more cards.
- `styles.css`: shared bento tokens, masthead, homepage, blog, projects, toys, study UI, and responsive rules.
- `app.js`: bloom, face, sound, train-motion preference, and study DOM controllers.
- `japan-data.js`: existing Tokyo clock and bloom calendar module; behavior remains unchanged.
- `study-engine.js`: pure decks, persistence normalization, scheduling, progress, and level unlocking.
- `assets/brand-mark.svg`: shared favicon and touch icon.
- `assets/blog/ai-build-day.png`: real AI Build Day group photo.
- `assets/blog/pegboard-sketch.jpg`: Peter's rough pegboard sketch.
- `assets/blog/pegboard-finished.jpg`: finished pegboard toy photo.
- `assets/blog/detective-skills.png`: real Žltá stopa visual.
- `tests/homepage-structure.test.cjs`: landing-page structure and removal regressions.
- `tests/content-pages.test.cjs`: route, navigation, article, anchor, and project completeness checks.
- `tests/study-engine.test.cjs`: pure study scheduling and persistence tests.

---

### Task 1: Shared routes, navigation, and identity

**Files:**
- Create: `assets/brand-mark.svg`
- Create: `blog/index.html`
- Create: `projects/index.html`
- Create: `tests/content-pages.test.cjs`
- Modify: `index.html:3-65`
- Modify: `styles.css:76-289`

**Interfaces:**
- Produces: `.masthead`, `.brand`, `.primary-nav`, `[data-bloom-module]`, and `aria-current="page"` markup on all three routes.
- Consumes: `window.VirpoJapanData` through the existing bloom hooks.
- Produces: `/assets/brand-mark.svg` for both `rel="icon"` and `rel="apple-touch-icon"`.

- [x] **Step 1: Write failing route and navigation tests**

Create `tests/content-pages.test.cjs`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const pages = {
  home: fs.readFileSync("index.html", "utf8"),
  blog: fs.readFileSync("blog/index.html", "utf8"),
  projects: fs.readFileSync("projects/index.html", "utf8"),
};

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
```

- [x] **Step 2: Run the route tests and verify RED**

Run: `node --test tests/content-pages.test.cjs`

Expected: FAIL because `blog/index.html`, `projects/index.html`, and `assets/brand-mark.svg` do not exist.

- [x] **Step 3: Create the brand mark**

Create `assets/brand-mark.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="Virpo">
  <rect width="180" height="180" rx="26" fill="#d0513e"/>
  <path d="M44 58h92L90 132z" fill="#fff"/>
</svg>
```

Replace the data-URL favicon in every document with:

```html
<link rel="icon" type="image/svg+xml" href="/assets/brand-mark.svg" />
<link rel="apple-touch-icon" href="/assets/brand-mark.svg" />
```

- [x] **Step 4: Replace the homepage masthead and add page shells**

Use this masthead in `index.html`, with `aria-current="page"` on the brand:

```html
<header class="masthead">
  <a class="tile brand" href="/" aria-current="page" aria-label="Virpo home">
    <span>virpo</span>
  </a>
  <nav class="tile primary-nav" aria-label="Primary">
    <a href="/blog/">Blog</a>
    <a href="/projects/">Projects</a>
    <a href="/#about">About</a>
  </nav>
  <section class="tile bloom-ticker" data-bloom-module aria-label="Tokyo time and seasonal bloom">
    <div class="tokyo-clock">
      <span class="ticker-kicker">Tokyo</span>
      <time data-tokyo-time datetime="">00:00</time>
    </div>
    <button class="bloom-trigger" data-bloom-trigger type="button" aria-expanded="false" aria-controls="bloom-popover">
      <span class="bloom-emoji" data-bloom-emoji aria-hidden="true">🌱</span>
      <span class="bloom-summary">
        <span class="ticker-kicker">Blooming next</span>
        <strong data-bloom-name>Checking Japan</strong>
        <span data-bloom-countdown>one moment</span>
      </span>
    </button>
    <div class="bloom-popover" id="bloom-popover" data-bloom-popover hidden>
      <span class="popover-arrow" aria-hidden="true"></span>
      <p class="popover-kicker">Next in Japan</p>
      <strong data-bloom-place>Somewhere in Japan</strong>
      <span data-bloom-window>Typical bloom window</span>
      <a data-bloom-source href="https://www.japan.travel/en/see-and-do/flowers/" target="_blank" rel="noreferrer">
        Source ↗
      </a>
    </div>
  </section>
</header>
```

Create `blog/index.html` and `projects/index.html` as complete HTML documents.
Each `<head>` contains UTF-8 charset, viewport, black theme color, the two
brand-mark links from Step 3, the existing Righteous font links, and
`<link rel="stylesheet" href="/styles.css" />`. Use these page-specific values:

```html
<!-- blog/index.html -->
<title>Writing · Peter Hraska</title>
<meta name="description" content="Short notes from Peter Hraska about making real things." />

<!-- projects/index.html -->
<title>Projects · Peter Hraska</title>
<meta name="description" content="Products, tools, events, and physical things made by Peter Hraska." />
```

Both pages use the masthead from Step 4, the existing compact footer, and this
script order:

```html
<script src="/japan-data.js"></script>
<script src="/app.js"></script>
```

On `blog/index.html`, put `aria-current="page"` on Blog and use:

```html
<main class="page-main">
  <header class="tile page-intro">
    <span class="section-label">Writing</span>
    <h1>Short notes about making real things.</h1>
  </header>
  <section class="post-feed" aria-label="Posts"></section>
</main>
```

On `projects/index.html`, put `aria-current="page"` on Projects and use:

```html
<main class="page-main">
  <header class="tile page-intro">
    <span class="section-label">Projects</span>
    <h1>Things I made, helped make, or could not leave alone.</h1>
  </header>
  <section class="project-grid" aria-label="Projects"></section>
</main>
```

- [x] **Step 5: Change the primary navigation from buttons to links**

Replace the old `.primary-nav button` rules with:

```css
.primary-nav {
  display: flex;
  min-width: 0;
  align-items: stretch;
  padding: 0 0.55rem;
}

.primary-nav a {
  position: relative;
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 0 1rem;
  font-size: 0.83rem;
}

.primary-nav a::after {
  position: absolute;
  right: 1rem;
  bottom: 14px;
  left: 1rem;
  height: 3px;
  background: var(--accent);
  content: "";
  opacity: 0;
  transform: scaleX(0.4);
  transition: opacity 140ms ease, transform 140ms ease;
}

.primary-nav a:hover::after,
.primary-nav a:focus-visible::after,
.primary-nav a[aria-current="page"]::after {
  opacity: 1;
  transform: scaleX(1);
}
```

Keep the brand red and remove `.brand span:first-child` emoji-specific rules. At 390 px, use:

```css
@media (max-width: 760px) {
  .brand {
    min-width: 94px;
    min-height: 62px;
    padding: 0 0.72rem;
    font-size: 1.3rem;
  }

  .primary-nav {
    min-height: 62px;
    padding: 0;
  }

  .primary-nav a {
    flex: 1;
    padding: 0 0.35rem;
    font-size: 0.69rem;
  }

  .primary-nav a::after {
    right: 0.42rem;
    bottom: 10px;
    left: 0.42rem;
  }
}
```

- [x] **Step 6: Run tests and commit**

Run: `node --test tests/content-pages.test.cjs`

Expected: 3 tests pass, 0 fail.

```bash
git add assets/brand-mark.svg index.html blog/index.html projects/index.html styles.css tests/content-pages.test.cjs
git commit -m "feat: add virpo content routes and navigation"
```

---

### Task 2: Homepage copy and Japan-toy polish

**Files:**
- Modify: `index.html:67-229`
- Modify: `styles.css:290-719`
- Modify: `app.js:1-329`
- Modify: `tests/homepage-structure.test.cjs`

**Interfaces:**
- Keeps: `initializeBloomTicker()`, `initializeFaceTracker()`, `initializeSounds()`, `initializeTrain()`.
- Removes: `initializeFocusMenu()` and the old rotating `initializeStudy()`; Task 6 adds the real study controller.
- Produces: `[data-sound-play-icon]`, `[data-sound-pause-icon]`, and a train iframe with `data-train-src`.

- [x] **Step 1: Replace obsolete homepage assertions with failing polish assertions**

Replace the project-card and initializer tests in `tests/homepage-structure.test.cjs` with:

```js
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
```

- [x] **Step 2: Run the homepage tests and verify RED**

Run: `node --test tests/homepage-structure.test.cjs`

Expected: FAIL on the project gallery, old links, redundant labels, missing sound icon hooks, and focus-menu initializer.

- [x] **Step 3: Update the face, introduction, links, and post previews**

Remove `.face-hint` from the face tile. Use this introduction:

```html
<div class="intro" id="about">
  <span class="section-label">Hello, I’m Peter</span>
  <h1>
    Product engineer from Slovakia. I make useful things where
    <em>product, design, and engineering</em> meet.
  </h1>
  <p>
    I work at Slido, now part of Cisco. I love building products, small tools,
    and occasionally something weirdly useful.
  </p>
  <div class="intro-links" aria-label="Peter elsewhere">
    <a href="https://www.linkedin.com/in/hraska/" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.2H3.3V21h3.2V8.2ZM4.9 3A1.9 1.9 0 1 0 5 6.8 1.9 1.9 0 0 0 4.9 3ZM21 13.7c0-3.9-2.1-5.7-4.9-5.7a4.2 4.2 0 0 0-3.8 2.1V8.2H9.1V21h3.2v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21H20v-7.3Z"/></svg>
    </a>
    <a href="https://github.com/virpo" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5v-2.3c-2.7.6-3.3-1.1-3.3-1.1-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.4-1.1.7-1.3-2.1-.2-4.4-1-4.4-4.7 0-1 .4-1.9 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.2 9.2 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.7.7 1 1.6 1 2.6 0 3.7-2.3 4.5-4.4 4.7.4.3.7.9.7 1.8v2.7A10 10 0 0 0 12 2Z"/></svg>
    </a>
  </div>
</div>
```

Replace the writing list with exactly three linked rows:

```html
<div class="writing-list">
  <div class="writing-header">
    <span class="section-label">Latest writing</span>
    <span class="writing-links">
      <a href="/projects/">Projects</a>
      <a href="/blog/">All posts →</a>
    </span>
  </div>
  <a class="post-row" href="/blog/#a-different-kind-of-hackathon">
    <span class="post-index">01</span>
    <div><h2>A different kind of hackathon</h2><p>Twelve hours, tiny teams, real products.</p></div>
    <span class="post-status">2 min</span>
  </a>
  <a class="post-row" href="/blog/#weird-use-of-ai-1">
    <span class="post-index">02</span>
    <div><h2>Weird use of AI #1: A toy for my son</h2><p>An ugly sketch became something physical.</p></div>
    <span class="post-status">1 min</span>
  </a>
  <a class="post-row" href="/blog/#weird-use-of-ai-3">
    <span class="post-index">03</span>
    <div><h2>Weird use of AI #3: Detective skills for journalists</h2><p>Reusable research tools, not another SaaS.</p></div>
    <span class="post-status">1 min</span>
  </a>
</div>
```

Remove the entire `.projects-section`.

- [x] **Step 4: Make the bloom summary self-explanatory**

Remove `.bloom-help` from the HTML and change the popover kicker to `Next in Japan`. Keep the existing click, hover, focus, outside-click, and Escape handlers. Add:

```css
.bloom-trigger {
  grid-template-columns: 3.25rem minmax(0, 1fr);
}

.bloom-trigger::after {
  align-self: center;
  color: var(--muted);
  content: "↗";
  font-size: 0.78rem;
  justify-self: end;
}

.bloom-trigger:hover,
.bloom-trigger:focus-visible,
.bloom-trigger[aria-expanded="true"] {
  background: #fff5f0;
}
```

At 760 px and below, keep the two content columns and hide only the decorative arrow:

```css
@media (max-width: 760px) {
  .bloom-trigger {
    grid-template-columns: 2.55rem minmax(0, 1fr);
  }

  .bloom-trigger::after {
    display: none;
  }
}
```

- [x] **Step 5: Add explicit play and pause icons to Familiar Japanese Sounds**

Use one heading, and put both icon states inside the central control:

```html
<div class="tile-heading"><h2>Familiar Japanese Sounds</h2></div>
<button class="sound-display" data-sound-play type="button" aria-label="Play FamilyMart entrance" aria-pressed="false">
  <span class="sound-icon" aria-hidden="true">
    <svg data-sound-play-icon viewBox="0 0 24 24"><path d="m8 5 11 7L8 19V5Z"/></svg>
    <svg data-sound-pause-icon viewBox="0 0 24 24" hidden><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/></svg>
  </span>
  <strong data-sound-title>FamilyMart entrance</strong>
  <span data-sound-state>press to play</span>
</button>
```

In `initializeSounds()`, query both icons and update `renderState()`:

```js
const playIcon = root.querySelector("[data-sound-play-icon]");
const pauseIcon = root.querySelector("[data-sound-pause-icon]");

const renderState = () => {
  const playing = isPlaying();
  display.classList.toggle("is-playing", playing);
  display.setAttribute("aria-pressed", String(playing));
  display.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${sounds[index].title}`);
  playIcon.hidden = playing;
  pauseIcon.hidden = !playing;
  stateLabel.textContent = playing ? "playing · press to pause" : "press to play";
};
```

Style the icon:

```css
.sound-icon {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  border: 2px solid #000;
  border-radius: 50%;
  background: #fff;
}

.sound-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}
```

Delete `.sound-bars` markup, styles, and keyframes.

- [x] **Step 6: Remove the train toggle and improve the crop**

Replace the train heading and iframe with:

```html
<div class="tile-heading"><h2>Window Seat</h2></div>
<div class="train-window">
  <iframe
    data-train-frame
    src="about:blank"
    data-train-src="https://www.youtube-nocookie.com/embed/RMpM2Qu3QC8?start=20&autoplay=1&mute=1&controls=0&loop=1&playlist=RMpM2Qu3QC8&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1"
    title="Japanese train window from Mount Fuji to Tokyo"
    loading="lazy"
    allow="autoplay; encrypted-media; picture-in-picture"
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
  <img src="/assets/train-window.png" alt="" aria-hidden="true" />
  <span class="train-glass" aria-hidden="true"></span>
</div>
```

Replace `initializeTrain()` with:

```js
function initializeTrain() {
  const frame = document.querySelector("[data-train-frame]");
  if (!frame) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) frame.src = frame.dataset.trainSrc;
}
```

Replace the train crop and paused-state rules with:

```css
.train-window {
  position: relative;
  min-height: 0;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: linear-gradient(#a9dcfa 0 58%, #8fc79c 58% 71%, #6e9b71 71%);
}

.train-window iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  pointer-events: none;
  transform: scale(1.06);
}
```

- [x] **Step 7: Increase the introduction green and polish profile controls**

Set:

```css
:root {
  --mint: #62d979;
}

.intro > p {
  color: #173d22;
}

.intro-links a {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  padding: 0;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: #fff;
}

.intro-links svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}

.writing-links {
  display: flex;
  gap: 0.8rem;
}

.writing-links a {
  border-bottom: 1px solid currentColor;
  color: var(--muted);
  font-size: 0.72rem;
}
```

Delete `.face-hint`, `.tiny-toggle`, paused-train, focus-mode, project-section, and FLIP-transition rules that no public markup uses.

Replace the initializer calls at the end of `app.js` with:

```js
initializeBloomTicker();
initializeFaceTracker();
initializeSounds();
initializeTrain();
```

- [x] **Step 8: Run tests and commit**

Run: `node --test tests/homepage-structure.test.cjs tests/content-pages.test.cjs`

Expected: all homepage and shared-route tests pass.

```bash
git add index.html styles.css app.js tests/homepage-structure.test.cjs
git commit -m "feat: polish homepage identity and japan toys"
```

---

### Task 3: Blog feed and first three posts

**Files:**
- Create: `assets/blog/ai-build-day.png`
- Create: `assets/blog/pegboard-sketch.jpg`
- Create: `assets/blog/pegboard-finished.jpg`
- Create: `assets/blog/detective-skills.png`
- Modify: `blog/index.html`
- Modify: `styles.css`
- Modify: `tests/content-pages.test.cjs`

**Interfaces:**
- Produces stable anchors: `#a-different-kind-of-hackathon`, `#weird-use-of-ai-1`, and `#weird-use-of-ai-3`.
- Consumes homepage links created in Task 2.
- Uses only locally stored real images.

- [x] **Step 1: Add failing article and asset assertions**

Append to `tests/content-pages.test.cjs`:

```js
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
```

- [x] **Step 2: Run the content tests and verify RED**

Run: `node --test tests/content-pages.test.cjs`

Expected: FAIL because the blog feed and local article assets are absent.

- [x] **Step 3: Copy the verified real images**

Run:

```bash
mkdir -p assets/blog
cp /Users/hraska/Code/temp/ai-build-week/assets/photos/build-day-group-photo.png assets/blog/ai-build-day.png
cp /Users/hraska/Code/temp/pegboard/docs/assets/sketch.jpg assets/blog/pegboard-sketch.jpg
cp /Users/hraska/Code/temp/pegboard/docs/assets/oliver-playing.jpg assets/blog/pegboard-finished.jpg
cp assets/projects/zltastopa-sk-thumb.png assets/blog/detective-skills.png
```

Expected: `file assets/blog/*` reports three PNG/JPEG source images plus the paired pegboard image.

- [x] **Step 4: Add the three complete posts**

Inside `.post-feed`, add:

```html
<article class="tile blog-post" id="a-different-kind-of-hackathon">
  <header class="blog-post__header">
    <span class="post-series">AI Build Day</span>
    <h2>A different kind of hackathon</h2>
  </header>
  <figure class="blog-media blog-media--wide">
    <img src="/assets/blog/ai-build-day.png" alt="People gathered at AI Build Day" />
  </figure>
  <div class="blog-copy">
    <p>Hackathons used to take a weekend. At AI Build Day we wanted to see whether fresh AI agents could compress that into twelve hours. We put people into teams of two or three—once you have five people, you spend more time explaining the work than doing it—and gave them a day to make something real.</p>
    <p>They did. The teams shipped working products, and one of them earned its first euro just weeks later. That was the useful result: not a room full of demos, but proof that a tiny team with good tools can get from an idea to somebody paying surprisingly fast.</p>
  </div>
</article>

<article class="tile blog-post" id="weird-use-of-ai-1">
  <header class="blog-post__header">
    <span class="post-series">Weird use of AI · 01</span>
    <h2>Weird use of AI #1: A toy for my son</h2>
  </header>
  <figure class="blog-media blog-media--pair">
    <img src="/assets/blog/pegboard-sketch.jpg" alt="Peter's rough pegboard toy sketch" />
    <img src="/assets/blog/pegboard-finished.jpg" alt="Oli playing with the finished colorful pegboard toy" />
  </figure>
  <div class="blog-copy">
    <p>With more tokens than restraint and a list of ideas that did not belong on a screen, I wondered whether I could hand one to an agent. I wanted a pegboard toy for Oli, so I gave it an ugly sketch and two measurements: holes 40 mm apart, 8 mm wide. About five minutes later, my printer was making pieces for the board we had drilled by hand.</p>
    <p>I could have opened Fusion 360 and spent an evening modelling it myself. Instead I got to print, test the fit, adjust the tolerances, and hand the result to my son. That is still my favourite kind of AI product: the final interface is a physical object.</p>
  </div>
</article>

<article class="tile blog-post" id="weird-use-of-ai-3">
  <header class="blog-post__header">
    <span class="post-series">Weird use of AI · 03</span>
    <h2>Weird use of AI #3: Detective skills for journalists</h2>
  </header>
  <figure class="blog-media blog-media--wide">
    <img src="/assets/blog/detective-skills.png" alt="Žltá stopa investigative toolkit" />
  </figure>
  <div class="blog-copy">
    <p>We came to a hackathon with AI agents and no clear idea what to build. The journalists in the room had the opposite problem: plenty of investigations, not enough hours to search contracts, companies, ownership records, and the same public databases again and again.</p>
    <p>So we did not build another SaaS. We cleaned the data and packaged the research workflows as skills an agent can use—material journalists could take with them and apply to real cases. Was it 10× faster? 100×? Pick your favourite AI multiplier. The useful part is that the work became reusable.</p>
  </div>
</article>
```

- [x] **Step 5: Style the short-post feed**

Add:

```css
.page-main,
.post-feed {
  display: grid;
  gap: var(--gap);
}

.page-intro {
  min-height: 260px;
  align-content: end;
  padding: clamp(1.5rem, 5vw, 4rem);
  background: var(--mint);
}

.page-intro h1 {
  max-width: 16ch;
  margin: 0.45rem 0 0;
  font-size: clamp(2.4rem, 6vw, 6rem);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 0.95;
}

.blog-post {
  display: grid;
  grid-template-columns: minmax(230px, 0.75fr) minmax(0, 1.25fr);
  overflow: hidden;
}

.blog-post__header,
.blog-copy {
  padding: clamp(1.25rem, 3vw, 3rem);
}

.blog-post__header h2 {
  max-width: 14ch;
  margin: 0.6rem 0 0;
  font-size: clamp(2rem, 4.5vw, 5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 0.98;
}

.post-series {
  color: var(--accent);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.blog-media {
  grid-column: 1 / -1;
  margin: 0;
  background: #ececec;
}

.blog-media--wide img {
  display: block;
  width: 100%;
  max-height: 680px;
  object-fit: cover;
}

.blog-media--pair {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
}

.blog-media--pair img {
  width: 100%;
  height: min(56vw, 650px);
  object-fit: cover;
}

.blog-copy {
  align-self: end;
  font-family: system-ui, sans-serif;
  font-size: clamp(1rem, 1.45vw, 1.25rem);
  line-height: 1.55;
}

.blog-copy p {
  margin: 0;
}

.blog-copy p + p {
  margin-top: 1rem;
}

@media (max-width: 760px) {
  .blog-post {
    grid-template-columns: 1fr;
  }

  .blog-media--pair {
    grid-template-columns: 0.8fr 1.2fr;
  }

  .blog-media--pair img {
    height: 70vw;
  }
}
```

- [x] **Step 6: Run tests and commit**

Run: `node --test tests/content-pages.test.cjs`

Expected: all route and blog tests pass.

```bash
git add assets/blog blog/index.html styles.css tests/content-pages.test.cjs
git commit -m "feat: publish first three short posts"
```

---

### Task 4: Projects archive

**Files:**
- Modify: `projects/index.html`
- Modify: `styles.css`
- Modify: `tests/content-pages.test.cjs`

**Interfaces:**
- Consumes: six existing images under `assets/projects/`.
- Produces: six `.project-card` links with one image, title, type, and destination each.
- Keeps the grid extensible without a hard-coded row count.

- [x] **Step 1: Add failing project completeness tests**

Append:

```js
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
```

- [x] **Step 2: Run the content tests and verify RED**

Run: `node --test tests/content-pages.test.cjs`

Expected: FAIL because the project grid is empty.

- [x] **Step 3: Add the six project cards**

Inside the project grid, add:

```html
<a class="project-card project-card--coral" href="https://youtldr.com/" target="_blank" rel="noreferrer">
  <img src="/assets/projects/youtldr-home.png" alt="YouTLDR homepage" />
  <span class="project-copy"><strong>YouTLDR</strong><small>Product · Browser extension</small></span>
</a>
<a class="project-card project-card--yellow" href="https://zltastopa.sk/" target="_blank" rel="noreferrer">
  <img src="/assets/projects/zltastopa-sk-thumb.png" alt="Žltá stopa website" />
  <span class="project-copy"><strong>Žltá stopa</strong><small>Civic tech · Open data</small></span>
</a>
<a class="project-card project-card--blue" href="https://virpo.sk/wp-content/uploads/radio.jpg" target="_blank" rel="noreferrer">
  <img src="/assets/projects/mood-radio.jpg" alt="Mood Radio" />
  <span class="project-copy"><strong>Mood Radio</strong><small>Hardware · Interaction</small></span>
</a>
<a class="project-card project-card--mint" href="https://github.com/virpo/pegboard" target="_blank" rel="noreferrer">
  <img src="/assets/projects/pegboard.jpg" alt="Colorful 3D-printed pegboard toy" />
  <span class="project-copy"><strong>Pegboard Toy</strong><small>Physical toy · 3D printing</small></span>
</a>
<a class="project-card project-card--violet" href="https://aibuildweek.com/" target="_blank" rel="noreferrer">
  <img src="/assets/projects/ai-build-week.jpg" alt="AI Build Week" />
  <span class="project-copy"><strong>AI Build Week</strong><small>Community · Event</small></span>
</a>
<a class="project-card project-card--orange" href="https://github.com/virpo/cmux-deck" target="_blank" rel="noreferrer">
  <img src="/assets/projects/cmux-deck.jpeg" alt="Stream Deck showing agent status" />
  <span class="project-copy"><strong>CMUX Deck</strong><small>Hardware · Developer tool</small></span>
</a>
```

- [x] **Step 4: Keep the existing project visual language on its own page**

Keep `.project-grid`, `.project-card`, `.project-copy`, and color modifier
rules. Delete `.project-number` and selectors that depend on
`.projects-section` or `body[data-focus-mode]`. Preserve:

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gap);
}

@media (max-width: 760px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 440px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
```

- [x] **Step 5: Run tests and commit**

Run: `node --test tests/content-pages.test.cjs`

Expected: all route, blog, and project tests pass.

```bash
git add projects/index.html styles.css tests/content-pages.test.cjs
git commit -m "feat: move selected work to projects archive"
```

---

### Task 5: Testable spaced-repetition engine

**Files:**
- Create: `study-engine.js`
- Create: `tests/study-engine.test.cjs`

**Interfaces:**
- Produces: `VirpoStudy.levels`, `VirpoStudy.decks`, `VirpoStudy.createStudyState()`, `VirpoStudy.loadStudyState(raw)`, `VirpoStudy.getStudyProgress(state, now)`, `VirpoStudy.getNextStudyCard(state, now)`, and `VirpoStudy.scoreStudyCard(state, cardId, correct, now)`.
- State shape: `{ version: 1, level: "hiragana" | "katakana" | "kanji", cards: Record<string, { stage: number, dueAt: number, correct: number, wrong: number }> }`.
- `getNextStudyCard` returns `{ card, nextDueAt }`; `card` is `null` when no card is due.

- [x] **Step 1: Write failing engine tests**

Create `tests/study-engine.test.cjs`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createStudyState,
  loadStudyState,
  getStudyProgress,
  getNextStudyCard,
  scoreStudyCard,
  decks,
} = require("../study-engine.js");

test("starts in Hiragana with every card due", () => {
  const state = createStudyState();
  const progress = getStudyProgress(state, 1_000);
  assert.equal(state.level, "hiragana");
  assert.equal(progress.total, decks.hiragana.length);
  assert.equal(progress.mastered, 0);
  assert.equal(progress.due, decks.hiragana.length);
});

test("Got it advances a card and Again returns it soon", () => {
  const now = 1_000;
  let state = createStudyState();
  const card = getNextStudyCard(state, now).card;
  state = scoreStudyCard(state, card.id, true, now);
  assert.equal(state.cards[card.id].correct, 1);
  assert.equal(state.cards[card.id].stage, 1);
  assert.equal(state.cards[card.id].dueAt, now + 45_000);
  state = scoreStudyCard(state, card.id, false, now + 1);
  assert.equal(state.cards[card.id].wrong, 1);
  assert.equal(state.cards[card.id].dueAt, now + 1 + 25_000);
});

test("unlocks Katakana only after every Hiragana card is correct twice", () => {
  let state = createStudyState();
  for (const card of decks.hiragana) {
    state = scoreStudyCard(state, card.id, true, 1_000);
    state = scoreStudyCard(state, card.id, true, 50_000);
  }
  assert.equal(state.level, "katakana");
});

test("unlocks Kanji after Katakana is complete", () => {
  let state = createStudyState();
  for (const level of ["hiragana", "katakana"]) {
    for (const card of decks[level]) {
      state = scoreStudyCard(state, card.id, true, 1_000);
      state = scoreStudyCard(state, card.id, true, 50_000);
    }
  }
  assert.equal(state.level, "kanji");
});

test("loads valid progress but repairs corrupted persistence", () => {
  const fallback = loadStudyState("{not-json");
  assert.deepEqual(fallback, createStudyState());

  const saved = createStudyState();
  const first = decks.hiragana[0];
  saved.cards[first.id] = { stage: 2, dueAt: 99_000, correct: 2, wrong: 1 };
  const loaded = loadStudyState(JSON.stringify(saved));
  assert.deepEqual(loaded.cards[first.id], saved.cards[first.id]);
});

test("Kanji cards expose writing and reading while keeping meaning separate", () => {
  const card = decks.kanji[0];
  assert.ok(card.writing);
  assert.ok(card.reading);
  assert.ok(card.meaning);
  assert.notEqual(card.writing, card.meaning);
});
```

- [x] **Step 2: Run the engine tests and verify RED**

Run: `node --test tests/study-engine.test.cjs`

Expected: FAIL because `study-engine.js` does not exist.

- [x] **Step 3: Create the UMD module and decks**

Start `study-engine.js` with:

```js
(function createVirpoStudy(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VirpoStudy = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildVirpoStudy() {
  const levels = ["hiragana", "katakana", "kanji"];
  const intervalsMs = [
    0,
    45 * 1000,
    5 * 60 * 1000,
    45 * 60 * 1000,
    12 * 60 * 60 * 1000,
    2 * 24 * 60 * 60 * 1000,
    5 * 24 * 60 * 60 * 1000,
  ];
  const retryMs = 25 * 1000;

  const kanaRows = [
    ["a", "あ", "ア"], ["i", "い", "イ"], ["u", "う", "ウ"], ["e", "え", "エ"], ["o", "お", "オ"],
    ["ka", "か", "カ"], ["ki", "き", "キ"], ["ku", "く", "ク"], ["ke", "け", "ケ"], ["ko", "こ", "コ"],
    ["sa", "さ", "サ"], ["shi", "し", "シ"], ["su", "す", "ス"], ["se", "せ", "セ"], ["so", "そ", "ソ"],
    ["ta", "た", "タ"], ["chi", "ち", "チ"], ["tsu", "つ", "ツ"], ["te", "て", "テ"], ["to", "と", "ト"],
    ["na", "な", "ナ"], ["ni", "に", "ニ"], ["nu", "ぬ", "ヌ"], ["ne", "ね", "ネ"], ["no", "の", "ノ"],
    ["ha", "は", "ハ"], ["hi", "ひ", "ヒ"], ["fu", "ふ", "フ"], ["he", "へ", "ヘ"], ["ho", "ほ", "ホ"],
    ["ma", "ま", "マ"], ["mi", "み", "ミ"], ["mu", "む", "ム"], ["me", "め", "メ"], ["mo", "も", "モ"],
    ["ya", "や", "ヤ"], ["yu", "ゆ", "ユ"], ["yo", "よ", "ヨ"],
    ["ra", "ら", "ラ"], ["ri", "り", "リ"], ["ru", "る", "ル"], ["re", "れ", "レ"], ["ro", "ろ", "ロ"],
    ["wa", "わ", "ワ"], ["wo", "を", "ヲ"], ["n", "ん", "ン"],
  ];

  const hiragana = kanaRows.map(([romaji, glyph]) => ({
    id: `h-${romaji}`, level: "hiragana", writing: glyph, reading: romaji, meaning: "",
  }));
  const katakana = kanaRows.map(([romaji, , glyph]) => ({
    id: `k-${romaji}`, level: "katakana", writing: glyph, reading: romaji, meaning: "",
  }));
  const kanji = [
    ["densha", "電車", "でんしゃ", "train"],
    ["eki", "駅", "えき", "station"],
    ["kuruma", "車", "くるま", "car"],
    ["jitensha", "自転車", "じてんしゃ", "bicycle"],
    ["mizu", "水", "みず", "water"],
    ["yama", "山", "やま", "mountain"],
    ["kawa", "川", "かわ", "river"],
    ["umi", "海", "うみ", "sea"],
    ["sora", "空", "そら", "sky"],
    ["ame", "雨", "あめ", "rain"],
    ["asa", "朝", "あさ", "morning"],
    ["yoru", "夜", "よる", "night"],
    ["tomodachi", "友達", "ともだち", "friend"],
    ["sensei", "先生", "せんせい", "teacher"],
    ["gakkou", "学校", "がっこう", "school"],
    ["gakusei", "学生", "がくせい", "student"],
    ["eiga", "映画", "えいが", "movie"],
    ["ongaku", "音楽", "おんがく", "music"],
    ["ryokou", "旅行", "りょこう", "travel"],
    ["mise", "店", "みせ", "shop"],
    ["deguchi", "出口", "でぐち", "exit"],
    ["iriguchi", "入口", "いりぐち", "entrance"],
    ["kaimono", "買い物", "かいもの", "shopping"],
    ["toshokan", "図書館", "としょかん", "library"],
    ["raamen", "ラーメン", "ラーメン", "ramen"],
    ["koohii", "コーヒー", "コーヒー", "coffee"],
    ["kissa", "喫茶店", "きっさてん", "coffee shop"],
  ].map(([id, writing, reading, meaning]) => ({
    id: `v-${id}`, level: "kanji", writing, reading, meaning,
  }));

  const decks = { hiragana, katakana, kanji };
  const allCards = levels.flatMap((level) => decks[level]);
```

- [x] **Step 4: Implement normalization, progress, selection, and scoring**

Complete the factory with:

```js
  function blankEntry() {
    return { stage: 0, dueAt: 0, correct: 0, wrong: 0 };
  }

  function createStudyState() {
    return {
      version: 1,
      level: "hiragana",
      cards: Object.fromEntries(allCards.map((card) => [card.id, blankEntry()])),
    };
  }

  function sanitizeCount(value, maximum = Number.MAX_SAFE_INTEGER) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return 0;
    return Math.min(Math.floor(number), maximum);
  }

  function levelComplete(state, level) {
    return decks[level].every((card) => state.cards[card.id].correct >= 2);
  }

  function highestUnlockedLevel(state) {
    if (!levelComplete(state, "hiragana")) return "hiragana";
    if (!levelComplete(state, "katakana")) return "katakana";
    return "kanji";
  }

  function loadStudyState(raw) {
    const state = createStudyState();
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return state;
    }
    if (!parsed || typeof parsed !== "object") return state;

    for (const card of allCards) {
      const saved = parsed.cards?.[card.id];
      if (!saved || typeof saved !== "object") continue;
      state.cards[card.id] = {
        stage: sanitizeCount(saved.stage, intervalsMs.length - 1),
        dueAt: sanitizeCount(saved.dueAt),
        correct: sanitizeCount(saved.correct),
        wrong: sanitizeCount(saved.wrong),
      };
    }

    const unlocked = highestUnlockedLevel(state);
    state.level = levels.includes(parsed.level) && levels.indexOf(parsed.level) <= levels.indexOf(unlocked)
      ? parsed.level
      : unlocked;
    return state;
  }

  function getStudyProgress(state, now = Date.now()) {
    const cards = decks[state.level];
    return {
      level: state.level,
      total: cards.length,
      mastered: cards.filter((card) => state.cards[card.id].correct >= 2).length,
      due: cards.filter((card) => state.cards[card.id].dueAt <= now).length,
    };
  }

  function getNextStudyCard(state, now = Date.now()) {
    const cards = decks[state.level];
    const due = cards
      .filter((card) => state.cards[card.id].dueAt <= now)
      .sort((left, right) => {
        const delta = state.cards[left.id].dueAt - state.cards[right.id].dueAt;
        return delta || left.id.localeCompare(right.id);
      });
    if (due.length) return { card: due[0], nextDueAt: now };
    return {
      card: null,
      nextDueAt: Math.min(...cards.map((card) => state.cards[card.id].dueAt)),
    };
  }

  function scoreStudyCard(state, cardId, correct, now = Date.now()) {
    const card = allCards.find((candidate) => candidate.id === cardId);
    if (!card || card.level !== state.level) return loadStudyState(state);
    const next = loadStudyState(state);
    const entry = next.cards[cardId];
    if (correct) {
      entry.correct += 1;
      entry.stage = Math.min(entry.stage + 1, intervalsMs.length - 1);
      entry.dueAt = now + intervalsMs[entry.stage];
    } else {
      entry.wrong += 1;
      entry.dueAt = now + retryMs;
    }

    const currentIndex = levels.indexOf(next.level);
    if (levelComplete(next, next.level) && currentIndex < levels.length - 1) {
      next.level = levels[currentIndex + 1];
    }
    return next;
  }

  return {
    levels,
    decks,
    createStudyState,
    loadStudyState,
    getStudyProgress,
    getNextStudyCard,
    scoreStudyCard,
  };
});
```

- [x] **Step 5: Run tests and commit**

Run: `node --test tests/study-engine.test.cjs`

Expected: 6 tests pass, 0 fail.

```bash
git add study-engine.js tests/study-engine.test.cjs
git commit -m "feat: add local japanese study engine"
```

---

### Task 6: Compact Japanese Study interface

**Files:**
- Modify: `index.html:116-129`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/homepage-structure.test.cjs`

**Interfaces:**
- Consumes: `window.VirpoStudy` from Task 5.
- Persists: JSON state under `virpo-study-v1`.
- Produces hooks: `[data-study-level]`, `[data-study-progress]`, `[data-study-due]`, `[data-study-card]`, `[data-study-writing]`, `[data-study-reading]`, `[data-study-meaning]`, `[data-study-actions]`, `[data-study-again]`, `[data-study-got-it]`, and `[data-study-reset]`.

- [x] **Step 1: Add failing study structure assertions**

Append to `tests/homepage-structure.test.cjs`:

```js
test("loads the study engine before homepage behavior", () => {
  assert.ok(html.indexOf("/study-engine.js") < html.indexOf("/app.js"));
});

test("contains the complete local study interface", () => {
  for (const hook of [
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
  ]) {
    assert.match(html, new RegExp(hook));
  }
  assert.match(app, /function initializeStudy\(/);
  assert.match(app, /virpo-study-v1/);
});
```

- [x] **Step 2: Run the homepage tests and verify RED**

Run: `node --test tests/homepage-structure.test.cjs`

Expected: FAIL because the new study markup and controller do not exist.

- [x] **Step 3: Replace the decorative study card with the learning UI**

Use:

```html
<section class="tile toy study-toy" data-toy="study" data-study>
  <div class="tile-heading">
    <h2>Japanese Study</h2>
    <span data-study-level>Hiragana</span>
  </div>
  <div class="study-meta">
    <span data-study-progress>0 / 46 learned</span>
    <span data-study-due>46 due</span>
  </div>
  <button class="study-card" data-study-card type="button" aria-label="Reveal answer">
    <strong data-study-writing>あ</strong>
    <span data-study-reading aria-live="polite">a</span>
    <span data-study-meaning></span>
    <small data-study-prompt>tap to reveal</small>
  </button>
  <div class="study-actions" data-study-actions hidden>
    <button type="button" data-study-again>Again</button>
    <button type="button" data-study-got-it>Got it</button>
  </div>
  <div class="study-footer">
    <span data-study-rest aria-live="polite"></span>
    <button type="button" class="study-reset" data-study-reset>Reset progress</button>
  </div>
</section>
```

Immediately before the homepage `app.js` script, add:

```html
<script src="/study-engine.js"></script>
<script src="/app.js"></script>
```

- [x] **Step 4: Implement the study DOM controller**

Add this controller before the initializer calls in `app.js`:

```js
function initializeStudy() {
  const root = document.querySelector("[data-study]");
  const api = window.VirpoStudy;
  if (!root || !api) return;

  const storageKey = "virpo-study-v1";
  const level = root.querySelector("[data-study-level]");
  const progress = root.querySelector("[data-study-progress]");
  const due = root.querySelector("[data-study-due]");
  const cardButton = root.querySelector("[data-study-card]");
  const writing = root.querySelector("[data-study-writing]");
  const reading = root.querySelector("[data-study-reading]");
  const meaning = root.querySelector("[data-study-meaning]");
  const prompt = root.querySelector("[data-study-prompt]");
  const actions = root.querySelector("[data-study-actions]");
  const again = root.querySelector("[data-study-again]");
  const gotIt = root.querySelector("[data-study-got-it]");
  const rest = root.querySelector("[data-study-rest]");
  const reset = root.querySelector("[data-study-reset]");
  if (![level, progress, due, cardButton, writing, reading, meaning, prompt, actions, again, gotIt, rest, reset].every(Boolean)) return;

  const labels = { hiragana: "Hiragana", katakana: "Katakana", kanji: "Kanji" };
  let state;
  try {
    state = api.loadStudyState(window.localStorage.getItem(storageKey));
  } catch {
    state = api.createStudyState();
  }
  let current = null;
  let revealed = false;
  let wakeTimer = null;
  let notice = "";

  const persist = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      rest.textContent = "Progress stays here until this tab closes.";
    }
  };

  const render = () => {
    window.clearTimeout(wakeTimer);
    const now = Date.now();
    const stats = api.getStudyProgress(state, now);
    const next = api.getNextStudyCard(state, now);
    current = next.card;
    level.textContent = labels[state.level];
    progress.textContent = `${stats.mastered} / ${stats.total} learned`;
    due.textContent = `${stats.due} due`;
    actions.hidden = !revealed || !current;

    if (!current) {
      const waitMs = Math.max(1_000, next.nextDueAt - now);
      writing.textContent = "✓";
      reading.textContent = "";
      meaning.textContent = "";
      prompt.textContent = `next card in ${Math.ceil(waitMs / 60_000)} min`;
      rest.textContent = "Saved here. Come back soon.";
      cardButton.disabled = true;
      wakeTimer = window.setTimeout(render, Math.min(waitMs, 60_000));
      return;
    }

    cardButton.disabled = false;
    writing.textContent = current.writing;
    reading.textContent = current.reading;
    meaning.textContent = current.meaning;
    root.dataset.studyLevel = current.level;
    root.classList.toggle("is-revealed", revealed);
    reading.hidden = !revealed && current.level !== "kanji";
    meaning.hidden = !revealed || current.level !== "kanji";
    prompt.textContent = revealed ? "How did it go?" : "tap to reveal";
    rest.textContent = notice;
    notice = "";
    cardButton.setAttribute(
      "aria-label",
      revealed
        ? `${current.writing}, ${current.reading}${current.meaning ? `, ${current.meaning}` : ""}`
        : `Reveal answer for ${current.writing}`,
    );
  };

  const score = (correct) => {
    if (!current) return;
    const previousLevel = state.level;
    state = api.scoreStudyCard(state, current.id, correct, Date.now());
    persist();
    revealed = false;
    if (state.level !== previousLevel) notice = `${labels[state.level]} unlocked.`;
    render();
  };

  cardButton.addEventListener("click", () => {
    if (!current || revealed) return;
    revealed = true;
    render();
  });
  again.addEventListener("click", () => score(false));
  gotIt.addEventListener("click", () => score(true));
  reset.addEventListener("click", () => {
    if (!window.confirm("Reset all Japanese Study progress?")) return;
    state = api.createStudyState();
    persist();
    revealed = false;
    render();
  });
  render();
}
```

Call `initializeStudy()` after `initializeTrain()`.

- [x] **Step 5: Style reveal, rating, progress, and reset states**

Replace the old study reveal rules with:

```css
.study-toy {
  background: var(--yellow);
}

.study-meta,
.study-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  color: #655315;
  font-size: 0.66rem;
}

.study-meta {
  border-bottom: 2px solid rgba(0, 0, 0, 0.14);
}

.study-card {
  display: grid;
  width: 100%;
  min-height: 220px;
  place-items: center;
  align-content: center;
  gap: 0.42rem;
  padding: 1rem;
  background: var(--yellow);
  cursor: pointer;
}

.study-card > strong {
  font-family: system-ui, sans-serif;
  font-size: clamp(4.4rem, 8vw, 7.2rem);
  font-weight: 800;
  line-height: 1;
}

.study-card [data-study-reading] {
  font-family: system-ui, sans-serif;
  font-size: 1.05rem;
}

.study-card [data-study-meaning] {
  color: #493b0e;
  font-family: system-ui, sans-serif;
  font-size: 0.86rem;
}

.study-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);
  border-top: var(--gap) solid #000;
}

.study-actions[hidden] {
  display: none;
}

.study-actions button {
  min-height: 52px;
  background: #fff;
  cursor: pointer;
}

.study-actions [data-study-got-it] {
  background: #72dc86;
}

.study-reset {
  padding: 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
```

- [x] **Step 6: Run all automated tests and commit**

Run: `node --test tests/*.test.cjs`

Expected: all homepage, route, bloom, content, project, and study tests pass.

```bash
git add index.html app.js styles.css tests/homepage-structure.test.cjs
git commit -m "feat: make japanese study a real learning toy"
```

---

### Task 7: End-to-end visual and interaction verification

**Files:**
- Create: `output/playwright/final-home-desktop.png`
- Create: `output/playwright/final-home-mobile.png`
- Create: `output/playwright/final-blog-desktop.png`
- Create: `output/playwright/final-blog-mobile.png`
- Create: `output/playwright/final-projects-desktop.png`
- Create: `output/playwright/final-projects-mobile.png`
- Modify: `docs/superpowers/plans/2026-07-23-content-pages-homepage-polish.md`

**Interfaces:**
- Verifies the production HTML through `http://127.0.0.1:4173`.
- Produces screenshots for Peter's final visual review.

- [x] **Step 1: Run the complete automated suite**

Run:

```bash
node --test tests/*.test.cjs
git diff --check
```

Expected: every test passes and `git diff --check` produces no output.

- [x] **Step 2: Start the static server**

Run: `python3 -m http.server 4173`

Expected: server listens on `http://127.0.0.1:4173`.

- [x] **Step 3: Open and capture all desktop routes**

Using the Playwright skill wrapper:

```bash
PWCLI=/Users/hraska/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" open http://127.0.0.1:4173 --headed
"$PWCLI" screenshot --filename output/playwright/final-home-desktop.png
"$PWCLI" goto http://127.0.0.1:4173/blog/
"$PWCLI" screenshot --filename output/playwright/final-blog-desktop.png
"$PWCLI" goto http://127.0.0.1:4173/projects/
"$PWCLI" screenshot --filename output/playwright/final-projects-desktop.png
```

Verify visually:

- home has the untouched square face, saturated green introduction, three ordered toys, and three post links;
- blog images are real, meaningfully cropped, and each post remains one or two paragraphs;
- projects render 3 × 2 with readable type labels;
- active navigation state matches each route;
- bloom summary and Tokyo time fit the top-right tile.

- [x] **Step 4: Exercise every homepage interaction**

On `/`:

1. Open bloom details by mouse hover, close by mouse leave.
2. Open bloom details by keyboard focus, close with Escape.
3. Open and close bloom details by two clicks.
4. Play Familiar Japanese Sounds and verify the icon becomes pause.
5. Press next while playing and verify the next sound starts.
6. Confirm Window Seat has no pause/run control and the video moves.
7. Reveal one Hiragana card, press Again, and confirm its due count changes.
8. Reveal another card, press Got it, reload, and confirm progress persists.
9. Put malformed JSON under `virpo-study-v1`, reload, and confirm the study tile resets without a console error.
10. Tab through the masthead, bloom summary, sound controls, study controls, profile icons, and article links.

Expected: all controls have visible focus, no audio starts before play, no page throws an error, and every label matches the state.

- [x] **Step 5: Capture and inspect 390 px mobile**

Resize to `390 × 844`, capture each route, and save:

- `output/playwright/final-home-mobile.png`
- `output/playwright/final-blog-mobile.png`
- `output/playwright/final-projects-mobile.png`

Verify:

- masthead links remain readable;
- bloom popover stays inside the viewport;
- face remains square;
- toys stack Sounds → Train → Study;
- train shows more landscape than the previous crop;
- study buttons are at least 44 px high;
- paired pegboard images remain legible;
- project grid uses one column at 390 px;
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [x] **Step 6: Verify reduced motion and clean console**

Emulate `prefers-reduced-motion: reduce`, reload `/`, and verify the train iframe remains `about:blank` with no visible motion toggle. Return to normal motion and verify `data-train-src` loads.

For all three pages, inspect the browser console and network panel.

Expected: zero uncaught errors, zero failed same-origin assets, and no horizontal overflow.

- [x] **Step 7: Mark the plan complete and commit verification artifacts**

Change every completed checkbox in this plan from `[ ]` to `[x]`, then run:

```bash
git add docs/superpowers/plans/2026-07-23-content-pages-homepage-polish.md output/playwright/final-*.png
git commit -m "test: verify virpo content pages"
git status --short
```

Expected: the commit contains only the plan completion marks and six final screenshots. The remaining status output contains only Peter's preserved experiment files.
