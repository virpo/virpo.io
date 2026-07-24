# Window, Study, and Japan Sounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Window Seat fill its illustrated aperture, unify Japanese Study into one console, and rebuild the Japan sound sequence around the exact supplied nostalgia clips.

**Architecture:** Keep the existing React components and learning/audio engines. Add four short local MP3 excerpts derived from the supplied TikTok, update the declarative `JAPAN_SOUNDS` queue, and make presentation-only JSX/CSS changes to Window Seat and Study. No new runtime dependency is introduced.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Vitest, Testing Library, Playwright, ffmpeg.

## Global Constraints

- Keep the existing bento layout, warm palette, playful homepage typography, and readable blog typography.
- The sound run stays automatic, audio-reactive, pauseable, navigable, and roughly 30–45 seconds.
- TikTok is a build-time source only; the shipped page has no TikTok runtime dependency.
- Keep randomized study selection, local-storage progress, and staged Hiragana → Katakana → Kanji unlocking unchanged.
- Preserve reduced-motion behavior and 44px primary touch targets.

---

### Task 1: Exact nostalgia sound sequence

**Files:**
- Create: `public/audio/japan-closed-crossing.mp3`
- Create: `public/audio/japan-yamanote-approaching.mp3`
- Create: `public/audio/japan-park-crows.mp3`
- Create: `public/audio/japan-familymart-welcome.mp3`
- Modify: `components/toys/SoundsToy.tsx`
- Modify: `notes/japan-sounds-sources.md`
- Test: `tests/toys/sounds-toy.test.tsx`

**Interfaces:**
- Consumes: the existing `JAPAN_SOUNDS` array and segment-based player.
- Produces: ten ordered `JAPAN_SOUNDS` entries with a total duration between 30 and 45 seconds.

- [ ] **Step 1: Write the failing playlist contract**

Assert this title order:

```ts
[
  "Closed crossing",
  "Yamanote approaching",
  "Park crows",
  "FamilyMart welcome",
  "Departure melody",
  "Station announcement",
  "Fare gate",
  "Railway crossing",
  "Cuckoo crossing",
  "Summer cicadas",
]
```

Also assert the first four local paths, absence of `Shinkansen`, `Fūrin`, and
`Don Quijote`, and a total segment duration in `[30, 45]`.

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
npm test -- --run tests/toys/sounds-toy.test.tsx
```

Expected: failure showing the old nine-entry playlist.

- [ ] **Step 3: Extract the exact supplied moments**

Download the supplied TikTok to a temporary directory, then run:

```bash
ffmpeg -ss 0 -t 3.116667 -i reference.mp4 -vn -ac 2 -ar 44100 -b:a 160k public/audio/japan-closed-crossing.mp3
ffmpeg -ss 6.85 -t 3.216667 -i reference.mp4 -vn -ac 2 -ar 44100 -b:a 160k public/audio/japan-yamanote-approaching.mp3
ffmpeg -ss 15.25 -t 2.533333 -i reference.mp4 -vn -ac 2 -ar 44100 -b:a 160k public/audio/japan-park-crows.mp3
ffmpeg -ss 17.783333 -t 4.948662 -i reference.mp4 -vn -ac 2 -ar 44100 -b:a 160k public/audio/japan-familymart-welcome.mp3
```

Use `startAt: 0` and each file's full duration for these four entries. Keep the
existing six clips and their current strongest segment boundaries.

- [ ] **Step 4: Update source notes**

Record the TikTok URL, title `These sounds make me miss Japan`, the four
excerpt boundaries, the local filenames, and that the clips were added at
Peter's request.

- [ ] **Step 5: Run the focused test**

Run:

```bash
npm test -- --run tests/toys/sounds-toy.test.tsx
```

Expected: all sound-toy tests pass.

- [ ] **Step 6: Commit**

```bash
git add public/audio components/toys/SoundsToy.tsx notes/japan-sounds-sources.md tests/toys/sounds-toy.test.tsx
git commit -m "feat: rebuild Japan nostalgia sequence"
```

### Task 2: Full-bleed Window Seat

**Files:**
- Modify: `components/toys/WindowSeatToy.tsx`
- Modify: `app/globals.css`
- Test: `tests/toys/window-seat.test.tsx`
- Test: `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: the existing YouTube iframe, frame artwork, startup cover, and reduced-motion state.
- Produces: a centered 16:9 iframe sized by aperture height and cropped horizontally.

- [ ] **Step 1: Write failing layout and copy tests**

Assert that the header contains only `Window Seat`, with neither `Ambient loop`
nor `Still journey`. Replace the unzoomed CSS contract with:

```css
.windowSeatVideo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: auto;
  min-width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  transform: translate(-50%, -50%);
}
```

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
npm test -- --run tests/toys/window-seat.test.tsx
```

Expected: old label and `transform: none` assertions fail.

- [ ] **Step 3: Implement the full-bleed iframe**

Remove the header meta `<span>`, remove the inline `transform: none`, and apply
the cover CSS above. Keep `pointer-events: none`, the startup cover, and the
reduced-motion branch.

- [ ] **Step 4: Update the browser contract**

Assert the computed transform is not `none`, the iframe height matches the
aperture height, and its rendered width is wider than the aperture.

- [ ] **Step 5: Run focused tests**

```bash
npm test -- --run tests/toys/window-seat.test.tsx
npm run test:e2e -- --grep "Window Seat"
```

Expected: component and Window Seat browser tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/toys/WindowSeatToy.tsx app/globals.css tests/toys/window-seat.test.tsx tests/e2e/site.spec.ts
git commit -m "fix: fill the train window"
```

### Task 3: One-piece Japanese Study console

**Files:**
- Modify: `components/toys/StudyToy.tsx`
- Modify: `app/globals.css`
- Test: `tests/toys/study-toy.test.tsx`
- Test: `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: unchanged study state, selection, reveal, rate, reset, persistence, and progress calculations.
- Produces: a unified yellow console with one progress line and one outlined cream screen.

- [ ] **Step 1: Write failing composition tests**

Assert a `.studyConsole` body, one `.studyStatusLine`, one `.studyCard`, a reset
button inside the header, and no `.studyStats`, `.studyStat`, or
`.studyProgressTrack` wrappers.

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
npm test -- --run tests/toys/study-toy.test.tsx
```

Expected: the new console/status selectors are missing.

- [ ] **Step 3: Recompose the progress JSX**

Use one semantic status line:

```tsx
<div className="studyStatusLine" aria-label="Study progress">
  <span aria-label={`${progress.stable} of ${progress.total} stable`}>
    <strong>{progress.stable}</strong>/{progress.total} stable
  </span>
  <progress
    aria-label={`${progress.stable} of ${progress.total} cards stable`}
    max={progress.total}
    value={progress.stable}
  />
  <span aria-label={`${progress.due} due`}>
    <strong>{progress.due}</strong> due
  </span>
</div>
```

Wrap the status, card/rest state, actions, and notice in `.studyConsole`.

- [ ] **Step 4: Replace panel CSS with one console**

Use a yellow body without black gutters, transparent status cells, a single
3px-outlined cream card, a 36px visual reset control inside a 44px hit area,
and attached rating controls. Keep the card at roughly the existing compact
height.

- [ ] **Step 5: Run focused component and browser tests**

```bash
npm test -- --run tests/toys/study-toy.test.tsx
npm run test:e2e -- --grep "Study"
```

Expected: study behavior and persistence remain green with the new
composition.

- [ ] **Step 6: Commit**

```bash
git add components/toys/StudyToy.tsx app/globals.css tests/toys/study-toy.test.tsx tests/e2e/site.spec.ts
git commit -m "style: unify the Japanese study console"
```

### Task 4: Full verification and previews

**Files:**
- Modify: `output/playwright/polish-desktop.png`
- Modify: `output/playwright/polish-mobile.png`
- Modify: `output/playwright/polish-study-revealed.png`
- Create: `output/playwright/polish-sounds-sequence.png`

**Interfaces:**
- Consumes: the final static export.
- Produces: exact visual artifacts and a verified clean branch.

- [ ] **Step 1: Run all unit tests**

```bash
npm test
```

Expected: zero failures.

- [ ] **Step 2: Run the production export**

```bash
npm run test:build
```

Expected: eleven static routes and a passing static-output assertion.

- [ ] **Step 3: Run all browser tests**

```bash
npm run test:e2e -- --reporter=line
```

Expected: nineteen browser tests pass.

- [ ] **Step 4: Capture and inspect the exact build**

Serve `dist` on port `4187`. Capture desktop, mobile, revealed Study, and
playing-sounds screenshots in `output/playwright/`. Check Window Seat at both
widths for full aperture coverage and check Study for one continuous console.

- [ ] **Step 5: Commit preview artifacts**

```bash
git add output/playwright
git commit -m "test: capture final toy previews"
```

- [ ] **Step 6: Final repository checks**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and a clean worktree.
