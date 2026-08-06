# Site Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current pixel-bento homepage load dramatically faster without materially changing its appearance or interactions.

**Architecture:** Keep the Next.js static export. Generate display-sized WebP derivatives from the original PNG artwork, reference those derivatives in the live CSS and markup, and mount the YouTube iframe only after the page is loaded, the browser is idle, and the train toy is near the viewport. Add deterministic budgets and tests so asset weight and deferred third-party loading cannot regress.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, Sharp, Vitest, Testing Library, Playwright, Lighthouse.

## Global Constraints

- Preserve the current visual design at normal viewing sizes.
- Keep original PNG artwork as editable design sources.
- Initial homepage transfer before YouTube must be below 1 MB.
- Target Lighthouse mobile Performance 90+ and green Core Web Vitals.
- Do not migrate frameworks unless the optimized measurements identify Next.js as a remaining material bottleneck.

---

### Task 1: Optimized pixel-art delivery

**Files:**
- Create: `scripts/optimize-site-assets.mjs`
- Create: `tests/config/performance-assets.test.ts`
- Create: generated `.webp` files under `public/assets/optimized/`
- Modify: `app/v2/v2.module.css`
- Modify: `app/globals.css`
- Modify: `components/toys/WindowSeatToy.tsx`
- Modify: `docs/homepage-v2-assets.md`
- Modify: `package.json`

**Interfaces:**
- Produces: `optimize:assets` script and stable `/assets/optimized/*.webp` public URLs.
- Consumes: existing source PNG artwork in `public/assets/` and `public/assets/v2/`.

- [ ] **Step 1: Write the failing asset-budget test**

Assert that the optimized radio, study, train overlay, train still, and large bloom files exist, use WebP, stay within their byte budgets, and are referenced by the live styles/components.

- [ ] **Step 2: Run the focused test and verify missing optimized files fail it**

Run: `npm test -- tests/config/performance-assets.test.ts`

Expected: FAIL because `public/assets/optimized/` does not yet exist.

- [ ] **Step 3: Add the deterministic Sharp conversion script and generate assets**

Use nearest-neighbor resizing for pixel art, force the train overlay to the aspect ratio it already has after CSS layout, use lossless WebP for transparent pixel artwork, and high-quality WebP for the photographic still.

- [ ] **Step 4: Reference optimized assets and update documentation**

Point live CSS and markup at `/assets/optimized/*.webp`; retain source PNG paths only in the asset guide and optimization script.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- tests/config/performance-assets.test.ts tests/v2/homepage-v2-assets.test.ts tests/toys/window-seat.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/optimize-site-assets.mjs tests/config/performance-assets.test.ts app/v2/v2.module.css app/globals.css components/toys/WindowSeatToy.tsx docs/homepage-v2-assets.md public/assets/optimized
git commit -m "perf: optimize homepage artwork"
```

### Task 2: Deferred train embed

**Files:**
- Modify: `tests/toys/window-seat.test.tsx`
- Modify: `components/toys/WindowSeatToy.tsx`

**Interfaces:**
- Produces: iframe creation gated by page readiness, idle readiness, viewport proximity, and reduced-motion preference.
- Consumes: the existing YouTube embed URL and optimized train still.

- [ ] **Step 1: Write failing behavior tests**

Cover: no iframe source in initial HTML, visible toy loads after `load` plus idle callback, offscreen toy waits for IntersectionObserver, reduced motion never loads YouTube, and iframe cover behavior remains intact.

- [ ] **Step 2: Run the focused test and verify the current immediate iframe fails it**

Run: `npm test -- tests/toys/window-seat.test.tsx`

Expected: FAIL on the initial `about:blank` and readiness expectations.

- [ ] **Step 3: Implement the readiness gates**

Use `IntersectionObserver` with a generous root margin. After `window.load`, schedule readiness with `requestIdleCallback({ timeout: 2500 })`, falling back to a zero-delay timer. Set the YouTube URL only when the toy is near, the page is loaded, the browser has yielded, and reduced motion is false.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/toys/window-seat.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/toys/window-seat.test.tsx components/toys/WindowSeatToy.tsx
git commit -m "perf: defer train video until page idle"
```

### Task 3: Lighthouse correctness and budgets

**Files:**
- Modify: `tests/site/tokens.test.ts`
- Modify: `tests/site/masthead.test.tsx`
- Modify: `tests/toys/study-toy.test.tsx`
- Modify: `app/v2/v2.module.css`
- Modify: `components/site/BloomTicker.tsx`
- Modify: `components/toys/StudyToy.tsx`
- Create: `scripts/check-performance-budget.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: WCAG-compliant masthead contrast, accessible names containing visible copy, and `test:performance-budget`.
- Consumes: built `dist/` output and public optimized assets.

- [ ] **Step 1: Add failing tests for contrast, accessible names, and budgets**

Require at least 4.5:1 for small white-on-red text, visible bloom/study copy inside accessible names, and a static initial-asset budget below 1 MB excluding user-triggered audio and deferred YouTube.

- [ ] **Step 2: Run focused tests and confirm failures**

Run: `npm test -- tests/site/tokens.test.ts tests/site/masthead.test.tsx tests/toys/study-toy.test.tsx tests/config/performance-assets.test.ts`

Expected: FAIL for current red contrast and accessible labels.

- [ ] **Step 3: Apply non-material corrections**

Darken the masthead red minimally, include visible text in bloom/study accessible names, and add the deterministic budget command.

- [ ] **Step 4: Run focused tests and static build validation**

Run: `npm test -- tests/site/tokens.test.ts tests/site/masthead.test.tsx tests/toys/study-toy.test.tsx tests/config/performance-assets.test.ts && npm run test:build && npm run test:performance-budget`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/site/tokens.test.ts tests/site/masthead.test.tsx tests/toys/study-toy.test.tsx tests/config/performance-assets.test.ts app/v2/v2.module.css components/site/BloomTicker.tsx components/toys/StudyToy.tsx scripts/check-performance-budget.mjs package.json
git commit -m "perf: enforce homepage quality budgets"
```

### Task 4: Visual and Lighthouse verification

**Files:**
- Modify only if verification exposes a regression.

**Interfaces:**
- Produces: measured before/after numbers and screenshots at desktop and mobile widths.
- Consumes: production static build.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test && npm run test:build && npm run test:e2e && npm run test:performance-budget`

Expected: all commands exit 0.

- [ ] **Step 2: Capture desktop and mobile screenshots**

Compare hero, toys, bloom popover, train loading still, and interactive states against the approved production design.

- [ ] **Step 3: Run Lighthouse mobile and desktop against the production server**

Record Performance, Accessibility, Best Practices, SEO, LCP, TBT, CLS, request count, and transferred bytes. Investigate any regression or category below the agreed targets.

- [ ] **Step 4: Review the final diff and worktree state**

Run: `git diff main...HEAD --stat && git status --short`

Expected: only intentional tracked changes plus the pre-existing untracked screenshot artifacts.

