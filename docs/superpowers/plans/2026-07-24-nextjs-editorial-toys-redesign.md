# virpo.io Next.js Editorial + Toys Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate virpo.io to a statically exported Next.js site with the approved Kaki-on-paper visual system, an MDX editorial blog, richer homepage writing previews, and three polished interactive Japan toys.

**Architecture:** Next.js App Router renders content and layout as static Server Components. Five small Client Components own browser-only behavior. MDX posts are discovered and validated at build time; the study scheduler remains a pure TypeScript module with a versioned localStorage adapter.

**Tech Stack:** Next.js 16.2.11, React 19.2.8, TypeScript, `@next/mdx`, `next-mdx-remote`, `gray-matter`, `zod`, Vitest 4.1.10, Testing Library, Playwright 1.61.1, plain CSS.

## Global Constraints

- Static export only: `output: "export"`, `trailingSlash: true`, no API runtime, Server Actions, authentication, database, ISR, or analytics.
- Visual palette: paper `#fff4df`, Kaki `#d76538`, brand red `#d0513e`, ink `#090909`, white `#ffffff`, Study yellow `#f4c84c`.
- Preserve homepage order: face → Sounds → Window Seat → Study on mobile.
- Blog posts are MDX-backed and each has one SEO-friendly route.
- Study order is randomized, progress persists and migrates from `virpo-study-v1`, Katakana unlocks at 80% stable Hiragana, Kanji starts at 80% stable Katakana, later Kanji buckets unlock at 75%.
- Window Seat does not zoom the YouTube iframe.
- Familiar Sounds contains both an audio-reactive waveform and separate play/pause.
- All controls remain keyboard accessible, mobile works at 390 px, and color contrast meets WCAG AA.

---

### Task 1: Next.js static-export foundation

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `tests/config/static-export.test.ts`
- Move: `assets/` → `public/assets/`
- Move: `audio/` → `public/audio/`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run build` static output in `dist/`, `npm test` Vitest runner, absolute `/assets/*` and `/audio/*` public URLs.

- [x] **Step 1: Write the failing static-export configuration test**

```ts
// tests/config/static-export.test.ts
import { describe, expect, it } from "vitest";
import config from "../../next.config";

describe("static export", () => {
  it("emits trailing-slash static HTML into dist", () => {
    expect(config.output).toBe("export");
    expect(config.trailingSlash).toBe(true);
    expect(config.distDir).toBe("dist");
    expect(config.images).toMatchObject({ unoptimized: true });
  });
});
```

- [x] **Step 2: Run the test and verify RED**

Run: `npx vitest run tests/config/static-export.test.ts`

Expected: FAIL because Next.js, Vitest, and `next.config.ts` do not exist.

- [x] **Step 3: Add the package and configuration**

```json
{
  "name": "virpo-io",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@mdx-js/react": "^3.1.1",
    "gray-matter": "4.0.3",
    "next": "16.2.11",
    "next-mdx-remote": "6.0.0",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "remark-gfm": "^4.0.1",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vitest": "4.1.10"
  }
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "dist",
  images: { unoptimized: true },
};

export default config;
```

- [x] **Step 4: Configure TypeScript and Vitest**

```ts
// vitest.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [x] **Step 5: Create the minimal App Router shell**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://virpo.io"),
  title: { default: "virpo · Peter Hraska", template: "%s · virpo" },
  description: "Peter Hraska makes useful things where product, design, and engineering meet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return <main><h1>virpo</h1></main>;
}
```

- [x] **Step 6: Move public assets and ignore local work artifacts**

Run:

```bash
mkdir -p public
git mv assets public/assets
git mv audio public/audio
```

Add to `.gitignore`:

```gitignore
node_modules/
dist/
.next/
.superpowers/
test-results/
playwright-report/
```

- [x] **Step 7: Install, test, and build**

Run:

```bash
npm install
npm test -- tests/config/static-export.test.ts
npm run build
```

Expected: configuration test passes and `dist/index.html` exists.

- [x] **Step 8: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json next-env.d.ts vitest.config.ts app public .gitignore tests/config tests/setup.ts
git commit -m "build: migrate virpo to nextjs static export"
```

---

### Task 2: Shared Kaki-on-paper shell and identity

**Files:**
- Create: `components/site/SiteShell.tsx`
- Create: `components/site/Masthead.tsx`
- Create: `components/site/BloomTicker.tsx`
- Create: `components/site/SiteFooter.tsx`
- Create: `components/site/BrandMark.tsx`
- Create: `lib/japan/bloom.ts`
- Create: `lib/japan/bloom-data.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Test: `tests/site/masthead.test.tsx`
- Test: `tests/japan/bloom.test.ts`

**Interfaces:**
- Produces: `<SiteShell current="home" | "blog" | "projects">`, pure `getBloomStatus(entries, now)`, Client Component `<BloomTicker />`.

- [x] **Step 1: Port bloom unit tests and add shell tests**

```tsx
// tests/site/masthead.test.tsx
import { render, screen } from "@testing-library/react";
import { Masthead } from "../../components/site/Masthead";

it("renders the shared virpo navigation and current route", () => {
  render(<Masthead current="blog" />);
  expect(screen.getByRole("link", { name: "Virpo home" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Projects" })).toBeVisible();
  expect(screen.getByRole("link", { name: "About" })).toBeVisible();
});
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/site/masthead.test.tsx tests/japan/bloom.test.ts`

Expected: FAIL because shared components and modules do not exist.

- [x] **Step 3: Implement the shell**

`Masthead` renders the red virpo tile, white route navigation, and
`BloomTicker`. `SiteShell` renders the black-gap wrapper and footer. Keep the
exact existing bloom disclosure interaction: hover/focus/click opens; leave,
outside click, and Escape close; Escape from Source returns focus without
reopening.

```tsx
export type CurrentRoute = "home" | "blog" | "projects";

export function SiteShell({
  current,
  children,
}: {
  current: CurrentRoute;
  children: React.ReactNode;
}) {
  return (
    <main className="siteShell">
      <Masthead current={current} />
      {children}
      <SiteFooter />
    </main>
  );
}
```

- [x] **Step 4: Add the approved tokens and responsive bento CSS**

```css
:root {
  --gap: 3px;
  --radius: 10px;
  --paper: #fff4df;
  --kaki: #d76538;
  --brand-red: #d0513e;
  --ink: #090909;
  --white: #ffffff;
  --yellow: #f4c84c;
  --peach: #f2a084;
  --focus: #17484a;
}
```

Copy the verified masthead sizing and mobile rules, replacing the rejected sky
field with paper and Kaki accents.

- [x] **Step 5: Run tests and browser smoke check**

Run:

```bash
npm test -- tests/site/masthead.test.tsx tests/japan/bloom.test.ts
npm run build
```

Expected: tests pass; static build contains one shared masthead.

- [x] **Step 6: Commit**

```bash
git add app components/site lib/japan tests/site tests/japan
git commit -m "feat: add kaki paper site shell"
```

---

### Task 3: MDX content system and editorial article routes

**Files:**
- Create: `content/blog/a-different-kind-of-hackathon.mdx`
- Create: `content/blog/weird-use-of-ai-1.mdx`
- Create: `content/blog/weird-use-of-ai-3.mdx`
- Create: `lib/content/posts.ts`
- Create: `lib/content/schema.ts`
- Create: `components/blog/ArticleLayout.tsx`
- Create: `components/blog/MdxImage.tsx`
- Create: `components/blog/ImagePair.tsx`
- Create: `components/blog/ArticleFooter.tsx`
- Create: `components/blog/mdx-components.tsx`
- Create: `app/blog/page.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Create: `app/rss.xml/route.ts`
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `tests/content/posts.test.ts`
- Create: `tests/content/seo.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `getPostSummaries(): PostSummary[]`, `getPost(slug): PostSource`, `getPostSlugs(): string[]`, statically generated blog/article/RSS/sitemap routes.

- [x] **Step 1: Write content discovery and SEO tests**

```ts
it("discovers three published posts in reverse chronological order", async () => {
  const posts = await getPostSummaries();
  expect(posts).toHaveLength(3);
  expect(posts.map((post) => post.slug)).toEqual([
    "weird-use-of-ai-3",
    "weird-use-of-ai-1",
    "a-different-kind-of-hackathon",
  ]);
});

it("rejects missing SEO frontmatter", () => {
  expect(() => parseFrontmatter({ title: "Only a title" })).toThrow();
});
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/content/posts.test.ts tests/content/seo.test.ts`

Expected: FAIL because content modules do not exist.

- [x] **Step 3: Implement validated post discovery**

```ts
// lib/content/schema.ts
export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(30).max(180),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string().min(1)).min(1),
  socialImage: z.string().startsWith("/").optional(),
  draft: z.boolean().default(false),
});
```

`posts.ts` reads `content/blog`, parses with `gray-matter`, validates with Zod,
calculates a word-count reading time, filters drafts in production, and sorts
newest first.

- [x] **Step 4: Migrate the three posts to MDX**

Use the approved final copy. Keep the first-euro sentence as:

```mdx
They did. The teams shipped working products, and one of them earned its first
euro within two weeks.
```

Use ordinary Markdown image syntax for single images and:

```mdx
<ImagePair
  left={{ src: "/assets/blog/pegboard-sketch.jpg", alt: "Peter's pegboard sketch" }}
  right={{ src: "/assets/blog/pegboard-finished.jpg", alt: "Oli playing with the finished pegboard toy" }}
/>
```

- [x] **Step 5: Build the editorial article layout**

Use Fraunces for title/headings and Source Serif 4 for article body. The route
header contains title, date, and tags. Article content uses
`max-width: 44rem`; images use their natural ratio inside `max-width: 52rem`.
No article image is viewport-width.

At the bottom render:

```tsx
<nav aria-label="Continue exploring" className="articleExits">
  <Link href="/blog/">More writing</Link>
  <Link href="/projects/">Projects</Link>
  <Link href="/#toys">Toys</Link>
</nav>
```

- [x] **Step 6: Build list and SEO routes**

`/blog/` renders a minimal list with date, title, description, tags, and reading
time. `[slug]/page.tsx` uses `generateStaticParams` and `generateMetadata`.
Render Article JSON-LD using `JSON.stringify` with `<` escaped.

- [x] **Step 7: Add RSS, sitemap, and robots**

Route handlers return static XML/text and include all three article URLs.

- [x] **Step 8: Test and build**

Run:

```bash
npm test -- tests/content
npm run build
```

Expected: three article directories, `blog/index.html`, `rss.xml`,
`sitemap.xml`, and `robots.txt` exist in `dist`.

- [x] **Step 9: Commit**

```bash
git add app/blog app/rss.xml app/sitemap.ts app/robots.ts components/blog content lib/content app/globals.css tests/content
git commit -m "feat: add editorial mdx blog"
```

---

### Task 4: Homepage and project archive migration

**Files:**
- Create: `components/home/FaceToy.tsx`
- Create: `components/home/Intro.tsx`
- Create: `components/home/WritingPreview.tsx`
- Create: `components/projects/ProjectCard.tsx`
- Create: `lib/projects.ts`
- Modify: `app/page.tsx`
- Create: `app/projects/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/home/homepage.test.tsx`
- Test: `tests/projects/projects.test.tsx`

**Interfaces:**
- Consumes: `getPostSummaries()`, typed `projects`.
- Produces: complete static homepage and project archive; `#toys` anchor.

- [x] **Step 1: Write homepage and project tests**

```tsx
it("renders richer writing previews rather than title-only rows", async () => {
  render(await HomePage());
  const links = screen.getAllByRole("link", { name: /read/i });
  expect(links).toHaveLength(3);
  expect(screen.getByText(/teams shipped working products/i)).toBeVisible();
});

it("renders all six typed project cards", () => {
  render(<ProjectsPage />);
  expect(screen.getAllByRole("link")).toEqual(expect.arrayContaining([
    expect.objectContaining({ textContent: expect.stringContaining("YouTLDR") }),
  ]));
});
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/home tests/projects`

Expected: FAIL because migrated pages/components do not exist.

- [x] **Step 3: Implement typed project data and page**

Move the six final titles, types, links, alt text, image dimensions, fit mode,
and deliberate identity emoji into `lib/projects.ts`. Render the existing 3/2/1
grid and 3:2 image ratio.

- [x] **Step 4: Implement the homepage**

Render the square Face Client Component, toy rail with `id="toys"`, short paper
introduction, and the latest three posts. Each writing preview includes date or
series, medium title, two-to-three-line description/excerpt, reading time, and
route arrow.

- [x] **Step 5: Add responsive CSS**

Desktop writing rows stretch with the toy rail. Mobile switches to content
height and preserves face → Sounds → Window Seat → Study → intro → writing.

- [x] **Step 6: Test, build, and commit**

Run:

```bash
npm test -- tests/home tests/projects
npm run build
git add app/page.tsx app/projects components/home components/projects lib/projects.ts app/globals.css tests/home tests/projects
git commit -m "feat: migrate homepage and projects"
```

---

### Task 5: Randomized progressive Study engine and compact component

**Files:**
- Create: `lib/study/types.ts`
- Create: `lib/study/decks.ts`
- Create: `lib/study/engine.ts`
- Create: `lib/study/storage.ts`
- Create: `components/toys/StudyToy.tsx`
- Create: `tests/study/engine.test.ts`
- Create: `tests/study/storage.test.ts`
- Create: `tests/toys/study-toy.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `createStudyState()`, `loadStudyState(raw)`, `getStudyProgress(state, now)`, `selectNextCard(state, now, rng)`, `scoreCard(state, id, correct, now)`, `STUDY_STORAGE_KEY = "virpo-study-v2"`.

- [x] **Step 1: Write failing engine tests**

Cover:

```ts
it("does not reveal cards in source or alphabetic order", () => {
  const state = createStudyState();
  const first = selectNextCard(state, 1_000, sequenceRng([0.72])).card;
  expect(first?.id).not.toBe("h-a");
});

it("avoids the immediately previous card when alternatives are due", () => {
  const state = { ...createStudyState(), recentCardIds: ["h-ka"] };
  expect(selectNextCard(state, 1_000, () => 0).card?.id).not.toBe("h-ka");
});

it("unlocks Katakana at 80 percent stable Hiragana", () => {
  const state = stableCards(createStudyState(), decks.hiragana.slice(0, 37));
  expect(getUnlockedGroups(state)).toContain("katakana");
});

it("unlocks the next Kanji bucket at 75 percent stable", () => {
  const state = stateWithStableKatakanaAndKanji(6);
  expect(getUnlockedGroups(state)).toContain("kanji-2");
});
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/study`

Expected: FAIL because the new engine does not exist.

- [x] **Step 3: Define decks and Kanji buckets**

Keep 46 Hiragana and 46 Katakana cards. Add four frozen Kanji vocabulary
buckets of eight cards. Cards expose:

```ts
type StudyCard = {
  id: string;
  group: "hiragana" | "katakana" | `kanji-${1 | 2 | 3 | 4}`;
  writing: string;
  reading: string;
  meaning: string;
};
```

- [x] **Step 4: Implement state migration and repair**

Version 2 state:

```ts
type StudyState = {
  version: 2;
  cards: Record<string, CardProgress>;
  recentCardIds: string[];
  unseenStreak: number;
};
```

If v2 is absent, read `virpo-study-v1`, copy matching card progress, derive
stages safely, write v2, and retain v1 without mutating it. Corrupt data falls
back to a fresh state.

- [x] **Step 5: Implement randomized weighted selection**

From active due cards:

- filter the last card if another exists;
- if `unseenStreak >= 2`, prefer seen cards when any are due;
- assign weight `max(1, 7 - stage) + min(4, overdueHours)`;
- choose by cumulative weight using injected `rng`;
- return `nextDueAt` when none are due.

Scoring schedules the existing intervals, updates recent IDs to the latest
three, and never mutates input.

- [x] **Step 6: Build the compact Study Client Component**

On mount load/migrate state. Persist after every score and reset. Kana hides
reading until reveal. Kanji shows Hiragana reading before reveal and English
meaning afterward. Buttons are compact 34–38 px pills. After rating, focus the
next card.

- [x] **Step 7: Run focused tests and browser-check persistence**

Run:

```bash
npm test -- tests/study tests/toys/study-toy.test.tsx
npm run build
```

In Playwright: rate cards, reload, confirm counts persist; seed 80% stable
Hiragana and verify mixed Katakana; seed 80% Katakana and verify Kanji bucket 1.

- [x] **Step 8: Commit**

```bash
git add lib/study components/toys/StudyToy.tsx tests/study tests/toys/study-toy.test.tsx app/globals.css
git commit -m "feat: add randomized progressive japanese study"
```

---

### Task 6: Audio-reactive Sounds and masked Window Seat

**Files:**
- Create: `components/toys/SoundsToy.tsx`
- Create: `components/toys/SoundWaveform.tsx`
- Create: `components/toys/WindowSeatToy.tsx`
- Create: `tests/toys/sounds-toy.test.tsx`
- Create: `tests/toys/window-seat.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Sounds with Web Audio analyser and separate play/pause; unzoomed YouTube no-cookie embed with UI masks.

- [x] **Step 1: Write failing component tests**

```tsx
it("shows both waveform and play pause controls", () => {
  render(<SoundsToy />);
  expect(screen.getByLabelText("Sound waveform")).toBeVisible();
  expect(screen.getByRole("button", { name: /play familymart/i })).toBeVisible();
});

it("keeps the train iframe unzoomed and hidden for reduced motion", () => {
  mockMatchMedia(true);
  render(<WindowSeatToy />);
  expect(screen.getByTitle(/Japanese train window/i)).toHaveAttribute("src", "about:blank");
  expect(screen.getByTestId("youtube-mask-top")).toBeVisible();
  expect(screen.getByTestId("youtube-mask-bottom")).toBeVisible();
});
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/toys/sounds-toy.test.tsx tests/toys/window-seat.test.tsx`

Expected: FAIL because components do not exist.

- [x] **Step 3: Implement audio-reactive waveform**

On the first play gesture:

1. create/resume `AudioContext`;
2. create one `MediaElementAudioSourceNode`;
3. connect `AnalyserNode` to destination;
4. render 24 frequency bars into canvas using
   `getByteFrequencyData`;
5. cancel animation on unmount.

Keep a separate circular play/pause button, title, previous, and next. Switching
while playing calls `audio.play()` after the source changes. Before play, draw a
quiet deterministic wave.

- [x] **Step 4: Implement Window Seat without zoom**

Use the existing no-cookie URL with `controls=0`, `modestbranding=1`, muted
autoplay, loop playlist, captions disabled, and keyboard disabled. Keep
`transform: none` and `pointer-events: none`. Render illustrated window above
the iframe and paper/gradient masks over the top and bottom YouTube chrome
regions. Reduced motion keeps `about:blank`.

- [x] **Step 5: Test and visually verify**

Run:

```bash
npm test -- tests/toys/sounds-toy.test.tsx tests/toys/window-seat.test.tsx
npm run build
```

Browser: play audio and confirm bars react; pause freezes to idle; next keeps
playing. Confirm no YouTube title/control text is visible at 1440 and 390.

- [x] **Step 6: Commit**

```bash
git add components/toys app/globals.css tests/toys
git commit -m "feat: polish japan sound and train toys"
```

---

### Task 7: Remove legacy static implementation and complete verification

**Files:**
- Delete: `index.html`
- Delete: `blog/index.html`
- Delete: `projects/index.html`
- Delete: `app.js`
- Delete: `study-engine.js`
- Delete: `japan-data.js`
- Delete: `styles.css`
- Delete or port: `tests/*.test.cjs`
- Create: `playwright.config.ts`
- Create: `tests/e2e/site.spec.ts`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-24-nextjs-editorial-toys-redesign.md`
- Replace: `output/playwright/final-*.png`
- Create: `output/playwright/final-article-*.png`

**Interfaces:**
- Produces: one authoritative Next.js implementation, complete static export, final visual evidence.

- [x] **Step 1: Add end-to-end tests**

`site.spec.ts` verifies:

- all routes and active navigation;
- bloom mouse/focus/click/Escape;
- square face and mobile order;
- waveform plus separate play/pause;
- Window Seat has no visible YouTube chrome and no zoom transform;
- Study selection is not source ordered, reload persists, and seeded state
  unlocks Katakana/Kanji;
- `/blog/` contains three minimal entries;
- each article has one H1, date, tags, canonical, JSON-LD, narrow copy, inline
  images, and three bottom exits;
- six projects render 3/2/1;
- no same-origin failures or horizontal overflow;
- reduced motion leaves train blank.

- [x] **Step 2: Run RED against incomplete migration**

Run: `npm run test:e2e`

Expected: any remaining route/content mismatch fails with an exact locator.

- [x] **Step 3: Remove legacy implementation**

Delete the old root HTML/CSS/JS and obsolete CJS source-regex tests only after
their behavior has equivalent Vitest/Playwright coverage.

- [x] **Step 4: Update README**

Document:

```md
npm install
npm run dev
npm test
npm run test:e2e
npm run build
```

Explain `content/blog/*.mdx`, static output in `dist/`, and the v1 → v2 Study
storage migration.

- [x] **Step 5: Run complete verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
git diff --check
```

Expected: all pass; `dist/` contains homepage, blog list, three articles,
projects, RSS, sitemap, robots, and 404.

- [x] **Step 6: Capture and inspect visuals**

Capture full-page desktop `1440 × 1000` and mobile `390 × 844` for home, blog,
projects, and every article. Open every image and inspect typography, inline
images, toy size, masks, and footer completion.

- [x] **Step 7: Mark plan complete and commit**

Change every finished checkbox to `[x]`.

```bash
git add README.md playwright.config.ts tests/e2e docs/superpowers/plans/2026-07-24-nextjs-editorial-toys-redesign.md output/playwright
git commit -m "test: verify nextjs virpo redesign"
```
