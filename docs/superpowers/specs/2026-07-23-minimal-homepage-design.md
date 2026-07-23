# 🧩 Minimal virpo.io Homepage Design

Date: 2026-07-23
Status: Approved visual direction

## Summary

virpo.io becomes one compact personal homepage: Peter's square interactive face, a short introduction and writing, three small Japan toys, and six projects.

The page uses the visual grammar of Tom's Toys: a black canvas as the gutter system, white rounded modules, 3 px gaps, small internal header rules, and Righteous typography. The result should feel playful and specific without becoming a generic portfolio grid or a dashboard.

## Goals

- Explain who Peter is in one short paragraph.
- Make the first screen memorable through his face and a few working toys.
- Keep writing as the largest content block.
- Show six real projects in a visual 3 × 2 grid.
- Let visitors switch focus between Writing, Projects, and About without navigating away.
- Reuse the working face, sound, train, study, and seasonal-date code already in the repo.
- Stay legible and intentional on mobile.

## Non-goals

- No theme, font, palette, or corner-radius configurator.
- No large collection of unrelated homepage widgets.
- No weather in the masthead toy.
- No account, CMS, search, newsletter, or project-detail system in this version.
- No invented project or article content.

## Identity and visual system

- Project emoji: `🧩`
- Canvas: black.
- Module surface: white.
- Structural gap: `3px`.
- Module radius: `10px`.
- Primary accent: warm red, currently `#d0513e`.
- Primary type: Righteous, with a local/system fallback.
- Module titles sit in a short header row separated by a light gray rule.
- Color belongs inside selected toy content areas; module shells stay mostly white.
- Avoid extra borders, cards inside cards, shadows, and decorative wrappers.

## Desktop layout

### Masthead

The masthead is one row with three modules:

1. `virpo` logo.
2. `Writing`, `Projects`, and `About` menu immediately beside the logo.
3. One wide Japan module occupying the remaining top-right space.

There is no filler copy between the menu and the Japan module.

### Main field

The main field has two columns:

- Left rail: roughly 35%.
- Writing block: roughly 65%.

The left rail contains:

1. Peter's face in an undistorted square.
2. Familiar Sounds.
3. Window Seat / running train.
4. Japanese Study.

The writing block contains:

1. A short personal introduction.
2. The current or featured essay.
3. Two or three additional writing rows.

### Projects

Six project modules form a 3 × 2 grid below the main field. Each module uses a real visual, project name, and one short concrete descriptor.

Initial project set can reuse YouTLDR, Žltá stopa, and Mood Radio. The remaining three must use real projects and assets selected during implementation.

## Mobile layout

- The masthead wraps into two rows without shrinking the menu or Japan module into illegibility.
- First row: `virpo` and the compact menu.
- Second row: the full-width Tokyo / next-bloom module.
- The content becomes one column in this order:
  1. Square face.
  2. Short introduction and writing.
  3. Familiar Sounds.
  4. Running train.
  5. Japanese Study.
  6. Projects.
- Projects use two columns when usable content width permits and one column on narrow phones.
- Black gaps remain structural; mobile spacing must not become a thick frame around the usable content.

## Components and behavior

### Interactive face

- Keep the current pointer-following face asset system.
- The image must remain square and use `object-fit: cover`.
- Touch devices show the neutral centered frame.
- If the remote face asset fails, show the neutral centered frame or a quiet solid-color fallback without collapsing the tile.

### Top-right Tokyo and bloom module

Resting state:

- Tokyo label.
- Live Tokyo time.
- The next bloom's emoji or small mark.
- A compact countdown such as `in 5 days`.

Reveal state:

- Hover and keyboard focus on desktop.
- Tap toggles on touch devices.
- A small anchored popover explains:
  - bloom name;
  - specific place;
  - broader region;
  - expected bloom window;
  - countdown or days remaining;
  - source link.

The reveal must not resize the masthead or push the page. It floats above the content and closes on outside click, `Escape`, or a second tap.

If the current Tokyo date is inside a bloom window, the compact state changes from `in N days` to `now`, and the reveal shows days remaining.

### Bloom data

`module-lab.js` already contains a `seasonalMoments` collection and date-window calculation inside `initializeTokyoNow()`. Reuse and normalize this source rather than creating a second unrelated calendar.

The current collection mixes flowers and non-flower events and lacks locations. The homepage bloom source needs entries with:

- stable ID;
- display name;
- emoji or mark;
- start month and day;
- end month and day or window length;
- specific place;
- region or prefecture;
- source URL;
- optional short note.

Only flower entries participate in the `next bloom` result. Non-flower seasonal events may remain available to other experiments but must not appear in this masthead module.

Date calculations use the Tokyo calendar date, not the visitor's local date. Approximate source windows display approximate countdowns rather than false precision.

### Familiar Sounds

- First toy below the face.
- Default sound: FamilyMart entrance.
- Show current sound, a small waveform, and an obvious play/pause control.
- Allow previous/next familiar sounds without expanding into a full player.
- Audio never autoplays.
- Reuse the existing local audio assets and Japan Sounds queue.

### Window Seat / running train

- Second toy below the face.
- The train view is visibly moving at rest, muted.
- Reuse the existing Window Seat visual/video path.
- Provide pause/play.
- Respect `prefers-reduced-motion`; use a still image when motion is reduced.
- Lazy-load video or heavy media after the first page content is stable.

### Japanese Study

- Third toy below the face.
- Reuse the existing kana and vocabulary decks.
- The compact default may show kanji, reading, or hiragana; the interaction reveals or checks the answer.
- Preserve the existing local progress behavior where practical.
- The toy must remain understandable without requiring an account.

### Writing

- Keep the whole writing block as one large module.
- The introduction belongs inside this block, not in the masthead.
- Approved short introduction:

  > Peter Hraska. Product engineer from Slovakia. I make useful things where product, design, and engineering meet.

- Article rows use real titles and honest states such as `Drafting now`, `Essay`, or `Note`.
- Article descriptions are optional; titles and state should carry the first version.

### Menu focus

- `Writing` is the default state.
- `Projects` animates the six-project grid directly below the masthead and moves the main field below it.
- `About` keeps the face visible and brings the introduction into the primary reading position.
- Use the existing FLIP-style reordering behavior where possible.
- The selected state must be unmistakable.
- Respect `prefers-reduced-motion` by reordering without animation.
- The browser history and URL do not need separate routes for this version.

### Projects

- Six real projects, two rows of three on desktop.
- Each tile contains a real image, project name, and one short descriptor.
- Entire tile is clickable.
- Hover/focus can reveal one additional sentence, but must not obscure the project name.
- External links use clear focus states and appropriate `target` behavior.

## Data flow

- Tokyo time is derived client-side with `Intl.DateTimeFormat` and the `Asia/Tokyo` timezone.
- Bloom state is derived from the normalized local seasonal data and Tokyo date.
- Sounds and study content use existing local assets and data.
- Study progress remains in `localStorage`.
- Project and writing content should have one local source of truth rather than duplicated HTML across experiments.
- No runtime network request is required for the bloom result.

## Error and empty states

- Missing bloom data: show Tokyo time and `Seasonal guide unavailable`; do not show a broken popover.
- Invalid or incomplete bloom entry: skip it and log one concise warning in development.
- Failed face image: keep the square tile and use the neutral fallback.
- Failed train media: show the existing train-window still.
- Failed sound asset: keep controls visible but disabled and label the sound unavailable.
- Corrupt study progress: reset only the study data to a valid local default.
- Missing project image: show the project name on a deliberate solid-color tile.

## Accessibility

- All menu items and toy controls are real buttons or links.
- The bloom reveal works with hover, focus, tap, `Escape`, and outside click.
- Do not communicate bloom state by emoji or color alone.
- Audio has visible play/pause state.
- Motion can be paused and respects reduced-motion preferences.
- Focus rings remain visible against white, colored, and black surfaces.
- Module text maintains readable contrast in dark mode and low-contrast displays.
- Decorative Japanese text is not used as the only label for a control.

## Verification

### Functional

- Tokyo time remains correct across local timezone and date-boundary changes.
- Bloom calculation covers:
  - before a window;
  - first day;
  - inside the window;
  - last day;
  - year rollover;
  - approximate windows;
  - malformed entries.
- Bloom popover opens and closes through mouse, keyboard, and touch.
- Sounds play only after user action.
- Train pause and reduced-motion fallback work.
- Study answer/reveal and local progress work.
- Menu focus reorders Writing, Projects, and About without losing focus.
- All six projects link to their intended destinations.

### Visual

- Inspect the rendered homepage at desktop, tablet, and narrow mobile widths.
- Confirm the face remains square at every breakpoint.
- Confirm the top-right bloom reveal stays on-screen and does not resize the masthead.
- Confirm toy order is Familiar Sounds, Window Seat, Japanese Study.
- Confirm the project layout is 3 × 2 on desktop and does not create unusable narrow cards on mobile.
- Confirm black gutters remain 3 px and do not turn into accidental padding.
- Confirm long article and project titles do not break module rhythm.

### Performance

- No layout shift when the face, train, or project images load.
- Heavy train media is lazy-loaded.
- Audio is metadata-only until requested.
- The first screen remains useful if JavaScript or external media fails.
