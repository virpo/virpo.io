# Sidecar: final build

Concept 01, route `/sidecar/`. This is the winning `sidecar-css` attempt
finished to production quality, with the best ideas from `sidecar-3d` added.
The attempt notes are still in `docs/lab/sidecar-css.md`.

## What it is

A Teenage Engineering-style handheld, built only from HTML, CSS and SVG (no
WebGL), next to a plain and credible blog index.

- **`/sidecar/`**: the device is big on the left. It has a 160×100
  four-tone LCD plus one orange accent segment, five mode keys (FACE, KANA,
  WINDOW, SOUND, BLOOM; keys 1–5 work anywhere), three soft keys whose labels
  change per mode, an orange action knob, a 12-LED meter and a key-click
  switch. On the right is a server-rendered column: Writing (the 3 newest
  notes, numbered 003/002/001, with an orange BLOG tag and "All writing →"),
  Instruments (the five toys as a list, one click each), Projects and About.
  A readout under the device says in plain words what the LCD is showing
  (`aria-live`).
- **`/sidecar/blog/[slug]/`**: a single left-aligned reading column (IBM
  Plex Mono for the structure, Source Serif for the text, a drop cap, images
  wider than the measure). On wide screens there is a field-guide rail on the
  left (No., Published, Length, Filed under). The post ends with an "End of
  note 003" divider with orange dots and an author card: a dithered LCD
  portrait of Peter, Write back, RSS, and a link to the original. Then
  previous and next notes. The device docks in the right margin.
- **`/sidecar/writing/`**: the archive, grouped by year, with the same rail
  and the docked device.

## How it works

- **Device** (`components/sidecar/Device.tsx`, `device.module.css`). Every
  size is in `cqw`, so one component renders the hero (540 px), the desktop
  dock (280 px) and the phone strip. Keys have real press travel (a
  `--travel` shadow), the active key latches with its LED lit, and hover
  lifts the cap and turns its label orange. On desktop the hero tilts a few
  degrees towards the cursor (CSS perspective, off with reduced motion). The
  LCD gets an orange ring on hover, and the bezel names what a click does
  ("Click the screen: Night").
- **LCD engine** (`components/sidecar/lcd/`). It is dynamically imported after
  hydration. It draws into a palette-indexed framebuffer at 30 fps with Bayer
  dithering and two bitmap fonts, and pauses when the tab is hidden or the
  canvas is off screen. With `prefers-reduced-motion` it redraws only on
  change. One scene per mode in `lcd/scenes/`. Tone 4 is the orange accent,
  used sparingly: the BLOOM countdown and T-minus clock, the FACE "sees you"
  dot, the SOUND playing dot, the ticker bullet and the station board.
- **Ticker**: any element with `data-lcd-ticker="…"` scrolls that text along
  the bottom of the LCD while it is hovered or focused. Post rows, project rows,
  archive rows and the previous/next links use it. That is what ties the list
  to the toy.
- **FACE**: `components/sidecar/tools/build-face-sprite.mjs` bakes Peter's 121
  gaze photos from face.virpo.sk into one same-origin greyscale sheet
  (`public/lab/sidecar/face-sheet.webp`, 150 KB). It uses CLAHE for local
  contrast, fades the torii out only outside the face, and adds a vignette.
  It also writes the 80 px author avatar (`peter-lcd.png`, 1 KB). The sheet
  loads only when FACE first opens and is ordered-dithered to the four LCD
  tones at draw time. The face follows the cursor anywhere on the page, or a
  finger dragged on the screen, and looks around on its own when idle.
- **Reading trip**: on post pages the LEDs fill with reading progress. In
  WINDOW mode the HUD shows the next station (`lcd/route.ts`). A caption under
  the dock reads "42% read · next stop Nagoya". At the end the train stops and
  a SHIN-OSAKA / THANKS FOR READING board rises into the window.
- **Posters**: before the engine boots, and without JavaScript, the LCD shows
  a still frame. There are two: `lcd-window.png` and `lcd-window-night.png`.
  The site is a static export, so the poster cannot be picked on the server.
  Instead the night poster fades in over the day one on mount when Tokyo is
  dark, and the live canvas then fades in over both. To regenerate them, start
  the dev server and run `node components/sidecar/tools/build-posters.mjs`.
- **Phones**: the hero sheds its top and bottom rows and is 300 px wide (284
  px on short screens). On a 390×664 screen all three newest posts are above
  the fold (their rows end at 514, 579 and 638 px). On post pages the dock is
  an **in-flow strip above the article**: a mini LCD, the LED meter, three
  soft keys, five big labelled keys and the trip caption. It never floats, so
  no text is ever under it. This was verified by scrolling the whole page in
  120 px steps. On the writing index the strip comes after the list. Every
  link and control is at least 44×44 px (checked by script). There is no
  horizontal scroll.
- **RSS** autodiscovery is on every Sidecar page. A page that sets its own
  canonical replaces the layout's `alternates`, so each page spreads
  `rssAlternates` from `components/sidecar/meta.ts` into its own.
- **Accessibility**: all controls are real buttons. Mode keys have
  `aria-pressed` and `aria-keyshortcuts`, the switch has `role="switch"`, and
  ← → work while focus is in the device. Focus rings use `outline-offset`,
  and the knob's ring hugs only its visible part. Polite live regions announce
  what the LCD shows.

## How to add things

- **A post**: add an `.mdx` file to `content/blog/` (front matter: `title`,
  `description`, `publishedAt`, `tags`, optional `socialImage`). It appears
  on the landing if it is among the 3 newest, in `/sidecar/writing/` and in
  RSS, and it gets its own `/sidecar/blog/<slug>/` page. Note numbers come
  from its position, newest = highest. Nothing in the Sidecar code changes.
- **A project**: add it to `lib/projects.ts` (or to the extra list in
  `lib/lab/catalog.ts`) with a one-line blurb in `catalog.ts`. It shows in
  Projects, and hovering it scrolls "Title → host" across the LCD.
- **A new LCD mode**: add a scene in `components/sidecar/lcd/scenes/`
  implementing `Scene` (`draw`, `softkeys`, `leds`, `describe`, optional
  `action/prev/next`). Register it in `lcd/engine.ts` and `lcd/types.ts`
  (`MODES`), and add a key to `DEVICE_KEYS` in `components/sidecar/modes.ts`.
  Keep soft-key labels to 7 characters or fewer so they fit on phones.
- **Something on the ticker**: put `data-lcd-ticker="text"` on any link.

## Checks

- `npm test`: 262 tests pass, 27 of them in `tests/sidecar/`. They cover
  routes, metadata (noindex, canonical, RSS), the no-JS HTML, the device
  shortcuts, the ticker, the trip caption, the T-minus clock, the accent
  surviving invert, and asset sizes.
- `npm run build` passes (static export).
- Playwright passes on desktop (1440×900) and phone (iPhone 13, 390×664),
  plus 768, 900, 1024, 1040 and 1280 px widths. They found no console
  errors, no horizontal scroll, no tap target under 44 px, and no overlap
  between the dock and the text. The reduced-motion LCD is identical 1.5 s
  apart, and the post page reads fully without JavaScript.

## Known gaps

- Sound and click audio were checked by script only. Headless Chromium has no
  audio output.
- KANA draws glyphs with a system CJK font (Hiragino or Noto). Without one it
  falls back to the browser's sans.
- The first paint before hydration always shows the day poster, and the night
  one fades in about half a second later. Without JavaScript it stays day.
- On phones the reading progress lives in the strip at the top of the post,
  so it scrolls away while you read. That is the price of never covering the
  text. The end of the post still says where you are.
- The face frames come from one photo session with a big open-mouthed grin.
  At 96 px and four tones it is clearly Peter, but it is a caricature more
  than a portrait.
- There is no WebGL, so there is no WebGL fallback to need. The device is
  plain DOM and works everywhere CSS container units do (all evergreen
  browsers).

## Final screenshots

`output/lab/sidecar-final/`: 01-landing-desktop (ticker on hover),
02-landing-phone (three posts above the fold), 03-mode-face, 04-mode-kana,
05-mode-sound, 06-mode-bloom, 07-key-hover, 08-post-desktop,
09-post-arrived-ticker, 10-post-phone-strip, 11-post-phone-reading,
12-writing-desktop.
