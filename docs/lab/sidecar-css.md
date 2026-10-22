# Sidecar (attempt `sidecar-css`)

Concept 01, route `/sidecar/`. A Teenage Engineering-style handheld, built
only with HTML, CSS and SVG, next to a plain, credible blog index.

## What was built

- `/sidecar/`: the landing page. The device is large on the left (sticky on
  desktop). On the right are Writing (the 3 newest posts with number, title,
  date and one line, plus "All writing →"), Instruments (the five toys as a
  plain list, one click each), Projects (all 8 from `labProjects`) and About.
  An orange BLOG tag and the numbered field-guide headings make it obvious
  that this is a blog.
- `/sidecar/blog/[slug]/`: one page per post. It is a single left-aligned
  column with breadcrumb, title, standfirst, a meta strip (published date,
  reading time and word count, tags), serif body, images wider than the
  measure, an end mark, RSS and reply links, previous/next and back links.
  The same device is docked in the right margin. It is `noindex` and the
  canonical points at `/blog/<slug>/`.
- `/sidecar/writing/`: the archive, grouped by year, with the device docked.
- Everything outside the LCD is server-rendered HTML, so the pages read
  without JavaScript and the LCD shows a still poster frame
  (`public/lab/sidecar/lcd-window.png`).

## Art direction

- **The device** (`components/sidecar/Device.tsx`, `device.module.css`): warm
  light-grey plastic made from layered gradients, an SVG turbulence grain, an
  inner chamfered face plate, four Phillips screws, two side buttons, a black
  glass bezel, a speaker grille, a slide switch ("Key click") and a knurled
  orange knob on the right edge. Every size is in `cqw`, so one stylesheet
  renders the hero (about 540 px) and the docked rail (about 290 px).
- **Keys**: five square caps sit in recessed wells. The visible side wall is a
  shadow tied to a `--travel` value. Hover lifts the cap and turns the label
  orange. Pressing it drops the cap to the floor of the well. The active mode
  stays latched half-down with its LED lit. There are three round soft keys
  (prev, action, next) whose labels change per mode, and a 12-segment LED
  meter.
- **LCD**: a 160×100 `<canvas>` in a four-tone reflective-LCD palette, scaled
  with `image-rendering: pixelated`. It has a faint per-pixel grid, a glass
  reflection and a recess shadow. All drawing goes through a palette-index
  framebuffer with Bayer dithering and two hand-made bitmap fonts (3×5 and
  5×7).
- **Page**: IBM Plex Mono for structure, the Source Serif 4 the site already
  loads for reading, warm paper `#f1efe9`, strict 1 px rules, one orange
  accent `#ff5a1f`. Links are underlined.

## The five modes (keys 1–5)

| Key | Mode | On the LCD | Soft keys |
|---|---|---|---|
| 1 | FACE | Peter's gaze photos from face.virpo.sk, dithered to 1 bit (Atkinson + CLAHE) in an 11×11 sprite. The face follows the cursor anywhere on the page. On touch you drag on the screen. When idle he looks around by himself. A small gaze radar shows X/Y. | look left / negative / look right |
| 2 | KANA | A flashcard from `lib/study` (same spaced repetition and the same localStorage progress as the main site). The glyph is rasterised and thresholded to pixels. Reveal shows the reading and the meaning. | again / reveal / got it |
| 3 | WINDOW (default) | A procedural shinkansen window. Sky, drifting clouds, Mount Fuji, hills, town, guard rail, poles and sagging catenary wires scroll in parallax. A white train passes every 41 s and a tunnel comes every 67 s. A coffee steams on the sill. A HUD shows "TOKYO → OSAKA, 286 KM/H" and a route strip. Day or night follows Tokyo time. | slower / day-night / faster |
| 4 | SOUND | The ten `JAPAN_SOUNDS` with a live oscilloscope (AnalyserNode with auto-gain), a spectrum, a transport bar and the track number. | prev / play-pause / next |
| 5 | BLOOM | `getBloomTimeline`: the next flower, with the site's pixel art re-posterised to four tones on a specimen card, a big day countdown, the place, and Tokyo time. | earlier / petals / later |

**The toy on the post page**: the docked device keeps all five modes. Its
LEDs fill with reading progress ("READ 42%"). In WINDOW mode the trip *is*
the reading: the train leaves Tokyo at the first line, the HUD shows the next
station, and at the end it slows to a stop, "ARRIVED SHIN-OSAKA".

## Interaction

- **Desktop**: click the keys, the soft keys or the knob. Keys `1`–`5` work
  anywhere (ignored with modifiers or while typing), and ← → work while focus
  is inside the device. Clicking the LCD is the action key. After the first
  user gesture each press plays a synthesized click (WebAudio, never on
  load), which the slide switch mutes (stored in localStorage). Hovering a key
  prints its description on the bezel.
- **Keyboard**: everything is a real `<button>`. Mode keys have
  `aria-pressed` and `aria-keyshortcuts`, the switch has `role="switch"`, and
  a polite live region announces what the LCD shows. There are no panels, so
  Escape has nothing to close.
- **Phones**: on the landing page the hero sheds its top and bottom rows and
  shrinks to 284 px, so the writing list follows straight after it. On post
  pages the dock becomes a slim bar fixed to the bottom: a mini LCD, five
  keys (49×57 px targets), and a 3 px reading-progress strip along its top
  edge. Tap the LCD for the action key. The bar tucks away while you scroll
  down, comes back when you scroll up or reach the end, and the page reserves
  space below the text so the bar never hides the last lines.
- **Performance**: the engine (`components/sidecar/lcd/*`) is dynamically
  imported after hydration. It renders at 30 fps on a 16 000-pixel buffer,
  pauses when the tab is hidden or the canvas is off screen
  (IntersectionObserver), and redraws only on change when
  `prefers-reduced-motion` is set (no trains, tunnels, steam, sway or idle
  gaze; live audio is the exception). The face sprite (90 KB, 1-bit PNG)
  loads only when FACE is first opened.

## Files

- `app/sidecar/{layout,page}.tsx`, `app/sidecar/writing/page.tsx`,
  `app/sidecar/blog/[slug]/page.tsx`, `app/sidecar/sidecar.module.css`
- `components/sidecar/{Device,Instruments,Chrome}.tsx`, `device.module.css`,
  `clicks.ts`, `modes.ts`
- `components/sidecar/lcd/{engine,framebuffer,font,types}.ts`, `scenes/*.ts`
- `components/sidecar/tools/build-face-sprite.mjs` regenerates
  `public/lab/sidecar/face-sprite.png` from face.virpo.sk. That host sends no
  CORS headers, so the browser cannot dither the photos itself.
- `tests/sidecar/routes.test.tsx`, `tests/sidecar/device.test.tsx`
- No new dependencies. Shared files are untouched.

## Known gaps

- The LCD poster (shown without JavaScript and before the engine boots) is a
  fixed daytime frame. When Tokyo is at night, the live LCD switches to night
  a moment after load.
- On a 390×664 viewport (the iPhone 13 profile in the screenshot script) the
  first two posts are above the fold, and the third needs a short scroll. On
  taller phones all three are visible.
- On the mobile post page the bar is fixed to the bottom edge. It tucks away
  while you read down and the page reserves space for it, but while it is
  showing it does sit over the bottom 80 px of the viewport.
- The face is recognisable but busy at 96 px and 1 bit, because the source
  photos are lit hard and have a torii background.
- Sound playback, audio levels and click sounds were checked by script, not
  listened to. Headless Chromium has no audio device, so the scope there was
  verified against the analyser data only.
- The Japanese glyphs depend on a system CJK font (Hiragino or Noto). On a
  system without one, KANA falls back to whatever sans the browser has.

## Final screenshots

`output/lab/sidecar-css/`:
01-landing-desktop, 02-landing-mobile, 03-landing-key-hover, 04-mode-face,
05-mode-kana, 06-mode-sound, 07-mode-bloom, 08-post-desktop,
09-post-mobile-bar, 10-post-arrived, 11-mobile-bar-kana, 12-writing-index.
