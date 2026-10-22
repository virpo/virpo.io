# Pocket Room: "room-toy" attempt (03, `/room/`)

A miniature vinyl-toy diorama built in three.js. It sits in a thin Teenage
Engineering-style aluminium display case, next to a plain, server-rendered
blog and project list.

## What's built

| Route | What it is |
|---|---|
| `/room/` | The landing page: the diorama (left on desktop, top on phones) plus Writing (3 newest posts + All writing → + RSS), Projects (8), Japan toys (5, each opens in one click), About. |
| `/room/blog/<slug>/` | The post page for every post: one column, a margin toy (mini Pocket Room), prev/next, back home. `robots: noindex`, canonical `/blog/<slug>/`. |
| `/room/writing/` | The writing index: a CSS bookshelf of post spines (Fig. 05 in the room), then a plain year-grouped list. Canonical `/blog/`. |

## Art direction

- **A vinyl toy diorama, not a three.js demo.** Every object is rounded, bevelled geometry made in code (`RoundedBoxGeometry`, lathes, pucks, capsules) in matte vinyl and painted-resin materials. Warm key light with soft PCF shadows, a fake contact-AO blob under each object, a `RoomEnvironment` for soft reflections, Neutral tone mapping.
- **Tilt-shift miniature.** A custom single-pass "scatter-as-gather" bokeh DOF (`components/room/world/post.ts`) with a tilt band, rendered from a half-float target, so lamps and the distant town lights bloom into real bokeh discs at dusk and night. **The focus plane snaps to whatever you hover**, the same effect as prehistoriq.com.
- **The world.** A cutaway machiya-ish house: Peter's writing room on a loft at the back, a double-height workshop in front (3D printer printing a pegboard, clay figure on a turntable, arcade, CRT, cork board, tiny AI Build Week stage), a konbini, a vending machine, a cat, street lamps, a utility pole, a river, sakura petals, a toy Mount Fuji (forced perspective) and toy clouds. A double-track loop runs around the plinth: at street level in front (a station where the local train stops on a timetable, two level crossings whose barriers drop and blink when a train is near) and up onto a viaduct behind the house, so the shinkansen glides past the upstairs window.
- **Peter** is a chibi vinyl figure (`world/peter.ts`): big head with a painted face texture (wide open grin with teeth, brown eyes, raised brows, cheeks), swept-up dark-brown quiff with faded sides, prominent ears, sage hoodie with drawstrings and pocket, dark jeans, white sneakers. He types; when you hover him, he stops and turns to look at you; when you open About, he waves.
- **Day / dusk / night** follow Tokyo time by default (TE-style segmented switch to override, remembered per viewer). Dusk and night light the windows, lamps, vending machine and konbini.
- **Type**: Schibsted Grotesk (UI and headings), Martian Mono (TE labels), Newsreader (reading). Three accents carry meaning everywhere: **orange = writing, blue = projects, green = toys**, the same in the world outlines, the markers, the legend and the lists.

## Interaction

**Desktop.** Every clickable object has a numbered "Fig." marker (a gentle ping sweeps across them every ~9 s as an idle hint). On hover (object or marker) the object springs up on its base, gets a crisp kind-coloured screen-space outline plus a fresnel rim glow, the focal plane snaps to it, and a black label chip says what it is and where it goes ("Fig. 12 · 3D printer — Project Pegboard Toy ↗ · Click to open"). Click: posts and the bookshelf navigate; projects open a card (image, blurb, Visit link); toys open in place next to the object (kana cards, the shinkansen window, Japan sounds, bloom forecast, Peter's face in the mirror); Peter opens About. The camera eases a little towards the open object. Drag to turn the diorama (limited), and the camera has a small pointer parallax.

**Lists ↔ world.** Hovering or focusing a list row highlights its object in the world (and shows its chip); hovering an object lights its list row (`data-lit`). Toy rows open the toy directly (one click).

**Phones.** The world fits the width at a portrait framing of the house; vertical swipes scroll the page, horizontal swipes turn the diorama. Markers are always visible. First tap shows the label chip with an **Open** button; tap Open, the chip, or the object again to open. Panels become a bottom sheet. The canvas owns taps (raycast, then snap to the nearest marker within 34 px), so small or overlapping objects stay tappable.

**Keyboard.** Markers are real links in fig order (aria-label "Fig. 12, 3D printer: Pegboard Toy · project"). Tab highlights the object like hover, Enter opens, Escape closes and returns focus.

**Post page toy.** A sticky "PR-03" mini device in the right margin: the same room in miniature, Peter at his desk with this post open in front of him (notebook colour matches its notebook in the room). A page turns every eighth of the article, a shinkansen slides past the window behind him every ~11 s (clipped to the window with a scissor pass), a 12-LED strip fills with reading progress, and at the end he looks up and waves. On phones it folds into a 128 px strip above the article, never over the text.

## Robustness and performance

- Lists, posts and the writing index are server-rendered and readable without JavaScript. The world ships a still WebP of the exact default camera for each lighting and viewport (`public/lab/room/`, ~35–55 KB each) so nothing jumps; three.js is dynamically imported after idle and fades in over it.
- No WebGL (or `?still`): the still image stays, with HTML markers at pre-computed positions (`components/room/still-anchors.ts`) that still open every panel.
- Rendering pauses when the tab is hidden or the world scrolls off screen. DPR capped at 1.75 desktop / 1.6 mobile, with an adaptive drop if frames run slow. Static meshes are merged by material at build time to cut draw calls.
- `prefers-reduced-motion`: trains, printer, clouds, petals, steam and Peter's typing stop; the world renders on demand; hover and panels still work.
- Measured: ~120 fps (vsync-capped, median 8.3 ms) at 1.75 DPR on an M4 Pro in Chromium. No console errors on `/room/`, posts or the index in the static export.
- Tests: `tests/room/room.test.tsx` (landing lists, project and toy coverage, markers, noindex, hotspot numbering and brief coverage, post metadata/canonical/body/neighbours, writing index, still assets, lazy three.js).
- Stills are regenerated with `node scripts/room-stills.mjs http://localhost:<port>` against a running dev or static server.

## Known gaps

- Performance on a real mid-range phone was not measured; only desktop Chromium and emulated iPhone viewports were tested. The adaptive DPR fallback is there but untested on real hardware.
- The Shinkansen window toy reuses the existing YouTube embed, so it needs network and loads a third-party iframe once opened.
- The likeness is a stylised chibi; hair and faded sides are approximations made from primitives, not a sculpt.
- The level crossings and station are visual only (no crossing sound). Japan sounds play only from the vending machine panel.
- Touch drag-to-turn only takes horizontal swipes; there is no pinch-zoom.
- Next.js warns about `scroll-behavior: smooth` on `<html>` (from the shared `app/globals.css`) during client navigations, and about unused preloaded fonts from the root layout on room pages. Both come from shared files this attempt was told not to touch.
- A canvas-hover needs at least one real pointer move over the canvas; a pointer that lands on a marker highlights through the marker instead (same result).

## Final screenshots

`output/lab/room-toy/`:

- `01-landing-dusk.png`, `01-landing-day.png`, `01-landing-night.png`: the landing in each lighting
- `02-hover-printer-list-lit.png`: hovering the 3D printer (lift, outline, focus, chip)
- `04-panel-kana.png`: a toy opened in place from the list
- `05-peter-closeup.png`: Peter, hovered (turns to look at you)
- `06-post-desktop.png`, `07-post-end-waving.png`: post page, top and end (meter full, Peter waving)
- `08-writing-index.png`: the writing index
- `09-mobile-landing.png`, `11-mobile-sheet.png`, `12-mobile-post.png`: phones
