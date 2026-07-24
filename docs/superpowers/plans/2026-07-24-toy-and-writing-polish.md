# Toy and Writing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Sounds into a 35–40 second automatic nostalgia sequence, remove the Window Seat masks, make Study a compact bento game, use playful type across the homepage, and make homepage and blog-list cards fully clickable.

**Architecture:** Keep each existing component responsible for its own behavior. Add segment timing metadata to the sound playlist and use the single existing audio element's `timeupdate` event to advance. The other changes are semantic markup and scoped CSS, preserving the existing learning engine and static-export architecture.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, CSS, Vitest, Testing Library, Playwright.

## Global Constraints

- Keep virpo's red, black, white, yellow, and kaki identity.
- Add no copyrighted city-pop tracks.
- Preserve Study randomisation, local-storage progress, and Hiragana → Katakana → Kanji progression.
- Keep Window Seat unzoomed, muted, looping, non-interactive, and without visible controls.
- Keep sound playback within 30–45 seconds.
- Preserve reduced-motion and audio-fallback behavior.
- Use playful display type throughout the homepage but preserve the readable serif treatment inside individual articles.

---

### Task 1: Automatic Nostalgia Sequence

**Files:**
- Modify: `components/toys/SoundsToy.tsx`
- Modify: `tests/toys/sounds-toy.test.tsx`

**Interfaces:**
- Produces: exported `JAPAN_SOUNDS` entries with `title`, `src`, `startAt`, and `endAt`.
- Produces: `handleTimeUpdate()` and `handleEnded()` behavior on the existing audio element.

- [ ] **Step 1: Write failing sequence tests**

Add tests that assert the first title is `Departure melody`, the header reads `01 / 09`, playback seeks to `startAt`, `timeupdate` advances to the next title while continuing playback, pause/resume retains the current title, manual next preserves playback intent, and the ninth segment stops before restarting from segment one.

```tsx
const audio = container.querySelector("audio")!;
fireEvent.click(screen.getByRole("button", { name: /play departure melody/i }));
Object.defineProperty(audio, "currentTime", { configurable: true, writable: true, value: 5 });
fireEvent.timeUpdate(audio);
expect(await screen.findByText("Station announcement")).toBeVisible();
expect(screen.getByText("02 / 09")).toBeVisible();
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- tests/toys/sounds-toy.test.tsx`

Expected: FAIL because the current first sound is FamilyMart, the counter copy is absent, and `timeupdate` does not advance.

- [ ] **Step 3: Add segment metadata and deterministic advancement**

Replace the seven-item list with:

```ts
export const JAPAN_SOUNDS = [
  { title: "Departure melody", src: "/audio/aratana.mp3", startAt: 0, endAt: 4.6 },
  { title: "Station announcement", src: "/audio/japan-station-announce.mp3", startAt: 0, endAt: 4.5 },
  { title: "Fare gate", src: "/audio/japan-faregate-chime.mp3", startAt: 0, endAt: 3.4 },
  { title: "Railway crossing", src: "/audio/japan-rail-crossing.mp3", startAt: 3.5, endAt: 8 },
  { title: "Cuckoo crossing", src: "/audio/japan-crosswalk-cuckoo.mp3", startAt: 0, endAt: 4 },
  { title: "FamilyMart entrance", src: "/audio/japan-familymart.mp3", startAt: 0, endAt: 4.6 },
  { title: "Shinkansen passing", src: "/audio/japan-shinkansen-pass.mp3", startAt: 1, endAt: 5.5 },
  { title: "Summer cicadas", src: "/audio/japan-summer-crickets.mp3", startAt: 0.5, endAt: 5 },
  { title: "Fūrin", src: "/audio/wind-chime.ogg", startAt: 1, endAt: 5.5 },
] as const;
```

Create one selection helper that pauses, assigns `src`, seeks after `loadedmetadata`, and resumes only when `desiredPlayingRef.current` is true. Use it from manual navigation and automatic advancement. At the final `endAt`, pause, reset the index to zero, load the first segment, and show `Press play`.

Render the counter as:

```tsx
<span>{String(index + 1).padStart(2, "0")} / {String(JAPAN_SOUNDS.length).padStart(2, "0")}</span>
```

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- tests/toys/sounds-toy.test.tsx`

Expected: all SoundsToy tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/toys/SoundsToy.tsx tests/toys/sounds-toy.test.tsx
git commit -m "feat: add automatic Japan sound sequence"
```

### Task 2: Unobstructed Window Seat

**Files:**
- Modify: `components/toys/WindowSeatToy.tsx`
- Modify: `app/globals.css`
- Modify: `tests/toys/window-seat.test.tsx`

**Interfaces:**
- Preserves: `data-window-seat-toy`, reduced-motion still, startup cover, and the existing YouTube URL.
- Removes: all `youtube-mask-*` and `youtube-subtitle-mask` elements and CSS.

- [ ] **Step 1: Replace the mask contract test**

Assert no gradient mask test IDs render, the startup cover still renders until its timer ends, `.windowSeatVideo` remains unzoomed and non-interactive, and the CSS contains no `.windowSeatMask` or `.windowSeatSubtitleMask`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/toys/window-seat.test.tsx`

Expected: FAIL because five mask elements and their CSS still exist.

- [ ] **Step 3: Remove mask markup and CSS**

Delete the five mask spans from `WindowSeatToy.tsx`, delete `.windowSeatMask`, all directional mask rules, `.windowSeatSubtitleMask`, and the reduced-motion mask rule. Keep `.windowSeatStartupCover`, `.windowSeatGlass`, and `.windowSeatCompassMask`.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- tests/toys/window-seat.test.tsx`

Expected: all WindowSeatToy tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/toys/WindowSeatToy.tsx app/globals.css tests/toys/window-seat.test.tsx
git commit -m "fix: uncover the train window"
```

### Task 3: Compact Bento Study Game

**Files:**
- Modify: `components/toys/StudyToy.tsx`
- Modify: `app/globals.css`
- Modify: `tests/toys/study-toy.test.tsx`

**Interfaces:**
- Preserves: all calls into `lib/study`, storage keys, scoring buttons, accessible names, and status copy.
- Produces: `.studyBoard`, `.studyStat`, and inset module markup for styling.

- [ ] **Step 1: Write failing structure and accessibility tests**

Assert that Study renders one `.studyBoard`, two `.studyStat` modules for stable and due counts, a reveal card, 44px minimum interactive controls in the scoped CSS, and no Arial font inside the Study block.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- tests/toys/study-toy.test.tsx`

Expected: FAIL because the bento modules do not exist and Study still uses Arial.

- [ ] **Step 3: Add the compact module structure**

Wrap progress, card, actions, and footer in `.studyBoard`. Split progress copy into two `.studyStat` items:

```tsx
<div className="studyStats" aria-label="Study progress">
  <span className="studyStat"><strong>{summary.stable}</strong> stable</span>
  <progress aria-label="Stable cards" value={summary.stable} max={summary.total} />
  <span className="studyStat"><strong>{summary.due}</strong> due</span>
</div>
```

Keep all existing behavior and feedback copy.

- [ ] **Step 4: Restyle only the Study block**

Use a yellow outer shell, black 3px board gaps, cream inset modules, 14–18px module radii, the existing Righteous display face for English utility labels, and a Japanese system stack (`"Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif`) for glyphs. Cap the main glyph near 4rem, keep visible controls visually compact but at least 44px high, and give focus a 3px `var(--focus)` outline.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- tests/toys/study-toy.test.tsx tests/study`

Expected: all Study component, engine, and storage tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/toys/StudyToy.tsx app/globals.css tests/toys/study-toy.test.tsx
git commit -m "style: turn study into a compact bento game"
```

### Task 4: Fully Clickable Bento Writing Cards

**Files:**
- Modify: `components/home/WritingPreview.tsx`
- Modify: `app/globals.css`
- Modify: `tests/home/homepage.test.tsx`

**Interfaces:**
- Produces: one outer Next.js link per preview with `.writingPreviewLink`.
- Preserves: `.writingPreview` article, title, excerpt, tag, date, and reading time.

- [ ] **Step 1: Write the failing link contract test**

For each preview, assert the article is contained by one route link, the link has a blog `href`, and there is no nested `Read` link.

```tsx
const preview = previews[0];
const cardLink = preview.closest("a");
expect(cardLink).toHaveAttribute("href", expect.stringMatching(/^\/blog\/[^/]+\/$/));
expect(within(preview).queryByText(/^Read$/)).toBeNull();
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/home/homepage.test.tsx`

Expected: FAIL because only the small Read label is linked.

- [ ] **Step 3: Wrap each article in one semantic link**

Return:

```tsx
<Link className="writingPreviewLink" href={`/blog/${post.slug}/`}>
  <article className="writingPreview">
    {/* existing metadata, title, and excerpt */}
    <div className="writingRoute">
      <span>{post.readingTime.label}</span>
      <span aria-hidden="true">↗</span>
    </div>
  </article>
</Link>
```

- [ ] **Step 4: Add bento card styling**

Give `.writingList` a black background and compact gap. Give `.writingPreviewLink` a white background, black border, rounded corners, and visible hover/focus/active states. Use Righteous for titles, excerpts, metadata, and routing copy. Preserve mobile stacking and remove the old row-divider styling.

Add a `.homeFlow` typography rule that applies `var(--font-righteous)` to homepage UI descendants. Keep the Japanese glyph stack as a more-specific Study override. Do not alter `.articleBody`, `.articleHeader`, or other article-page serif rules.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- tests/home/homepage.test.tsx tests/app/home-page.test.tsx`

Expected: all homepage tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/home/WritingPreview.tsx app/globals.css tests/home/homepage.test.tsx
git commit -m "fix: make writing previews clickable bento cards"
```

### Task 5: Fully Clickable Minimal Blog List

**Files:**
- Modify: `app/blog/page.tsx`
- Modify: `app/globals.css`
- Create: `tests/content/blog-index.test.tsx`
- Modify: `tests/e2e/site.spec.ts`

**Interfaces:**
- Produces: one `.blogListLink` Next.js link around each blog list article.
- Preserves: the minimal list layout and readable editorial typography.

- [ ] **Step 1: Write the failing blog-list link test**

Render `BlogPage`, find the three articles, and assert each article's closest anchor has a `/blog/<slug>/` route, includes the description and tags, and contains no nested anchor.

```tsx
const posts = screen.getAllByRole("article");
for (const post of posts) {
  const link = post.closest("a");
  expect(link).toHaveAttribute("href", expect.stringMatching(/^\/blog\/[^/]+\/$/));
  expect(post.querySelectorAll("a")).toHaveLength(0);
}
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/content/blog-index.test.tsx`

Expected: FAIL because each article currently contains only a title link.

- [ ] **Step 3: Wrap the complete list item**

Replace the title-only `Link` with:

```tsx
<li id={post.slug} key={post.slug}>
  <Link className="blogListLink" href={`/blog/${post.slug}/`}>
    <article>{/* metadata, title, description, and tags */}</article>
  </Link>
</li>
```

- [ ] **Step 4: Style the whole-list interaction**

Move padding to `.blogListLink`, make it `display: block`, and add background/color transitions plus a visible focus state around the complete row. Keep Fraunces list titles and existing article Source Serif rules unchanged.

- [ ] **Step 5: Update and run blog tests**

Update the Playwright contract from `h2 a` to `:scope > a.blogListLink`. Run:

`npm test -- tests/content/blog-index.test.tsx && npm run test:e2e -- --grep "blog index"`

Expected: unit and focused Playwright tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/blog/page.tsx app/globals.css tests/content/blog-index.test.tsx tests/e2e/site.spec.ts
git commit -m "fix: make blog list rows clickable"
```

### Task 6: End-to-End Verification and Visual Polish

**Files:**
- Modify if needed: `app/globals.css`
- Modify if needed: affected test files

**Interfaces:**
- Consumes all four completed changes.
- Produces a verified static export and desktop/mobile screenshots.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run test:build
npm run test:e2e -- --reporter=line
git diff --check
```

Expected: 0 failures, 11 exported routes, 19 Playwright tests passing, and no whitespace errors.

- [ ] **Step 2: Verify the real preview**

Serve `dist` on an unused localhost port. In Chromium, verify:

- Sounds plays all nine excerpts automatically and updates counter/title.
- Pause/resume and previous/next work during the sequence.
- Window Seat contains no overlay gradients after its startup cover clears.
- Study looks like a compact white-on-yellow bento game before and after reveal.
- Every writing card is clickable and has visible keyboard focus.
- Homepage interface copy consistently uses the playful display font.
- Every `/blog/` list row is clickable while article bodies retain readable serif type.

- [ ] **Step 3: Capture desktop and mobile screenshots**

Capture the homepage at 1440×1000 and 390×844. Also capture Study after reveal and Sounds mid-sequence. Inspect content width, clipping, alignment, contrast, and touch targets.

- [ ] **Step 4: Apply and verify only evidence-backed polish**

If screenshots expose spacing, clipping, or contrast problems, adjust the scoped CSS and rerun the relevant focused test plus Playwright.

- [ ] **Step 5: Commit final polish if files changed**

```bash
git add app/globals.css tests
git commit -m "style: polish homepage toy details"
```
