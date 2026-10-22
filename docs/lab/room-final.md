# Pocket Room, final (03, `/room/`)

The production pass on the winning "room-toy" attempt. It is a vinyl capsule-toy diorama of Peter's
house in a Teenage Engineering-style display case (PR-03), set next to a plain, server-rendered blog and
project list. Spec: `docs/lab/pocket-world-brief.md`. Original attempt notes: `docs/lab/room-toy.md`.

## What it is

| Route | What it is |
|---|---|
| `/room/` | The landing page. The diorama (left on desktop, top on phones) sits beside Writing (3 newest posts, real dates, All writing →, RSS), Projects (8), Japan toys (5, one click each) and About. |
| `/room/blog/<slug>/` | One readable column. The margin toy is the same room in miniature, in the same light as the landing: Peter reads this post, turns a page as you scroll, a shinkansen passes, and he waves at the end. Below it sits a Fig. legend that links back into the room. `noindex`, canonical `/blog/<slug>/`. |
| `/room/writing/` | The writing index: the bookshelf (Fig. 05) with short spine labels, then a plain year-grouped list. |

The world: a cutaway machiya with Peter's writing loft over a workshop. Outside are a konbini, a vending
machine, a river, a toy Fuji and clouds. A double-track loop carries a shinkansen and a local train on a
timetable; the local train stops at the station. Level-crossing barriers drop and blink, and two kei
cars wait at the crossings while a train passes. A neighbour walks a dog along the pavement, the 3D
printer prints a pegboard, steam rises from the mug, the cat's tail swishes, petals drift, and day,
dusk and night follow Tokyo time.

## What changed in this pass

- **Peter looks like Peter.** He has been rebuilt:
  - a painted, stippled skin fade under a low-poly, swept-up textured quiff
  - prominent ears that stick out
  - white eyes with brown irises, thick raised brows, and a wide open grin with upper teeth
  - a real neck, and the sage hoodie with drawstrings
  The whole desk set (desk, chair, Peter, laptop, notebooks, deck, mug, lamp) is one group, turned
  three-quarters to the camera like the key art and scaled 1.2×. His body is no longer hidden. The loft
  railing is lower, and the tie beam that crossed his chest is gone. When you hover something in the
  writing room, he glances at it; when you hover him, he turns to you; when you open About, he waves.
- **Peter is easy to hover and tap.** An invisible capsule around his head and shoulders wins over the
  furniture around him, but never over another clickable object in front. Marker 01 sits beside his
  head, not on it.
- **Hover is stable.** These fix the flicker and the missed first hover:
  - Raycasting also runs on `pointerenter`.
  - Hysteresis keeps a hovered object hovered while the cursor is over its resting footprint, so a
    lifted object no longer flickers as it springs out from under the cursor.
  - Markers become click-through while the canvas hovers an object, so a marker riding up with its
    object can't steal the pointer.
  - The pointer parallax is gone, so objects stay exactly under the cursor.
  - Sparse objects (printer, stage, clay, radio, deck, notebooks) get invisible box hulls.
- **List highlighting never goes stale.** Every change clears all `[data-lit]` rows and lights only
  the current object, whatever the source: hover, focus, touch, list, deep link or open panel.
- **Phones:**
  - Markers are 44 px targets (32 px for a mouse, so they don't cover neighbours). A tap resolves to
    the nearest marker centre.
  - The three notebooks share one `02–04` marker. It opens a chip listing the three newest posts, each
    one tap away.
  - Touch chips have a × button. The first tap shows the chip, and Open (or a second tap) opens it.
  - Panels are a real bottom sheet: fixed to the viewport, at most 64svh, with a drag handle
    (drag down to close) and safe-area padding. The page scrolls so the object stays visible above it.
  - The header is one row, so the world starts at about 164 px.
- **No-JS / loading:** markers render server-side at the still's anchors (CSS vars `--sx/--sy`
  for desktop and `--mx/--my` for phones), so the still keeps all 18 hotspots without JavaScript and
  before WebGL boots. With JavaScript but no WebGL (`?still`), the same markers show chips and open panels.
- **One lighting for the whole room:** an inline boot script in `app/room/layout.tsx` resolves
  `?time=`, the saved choice (`virpo-room-lighting`) or the Tokyo clock before first paint. It also
  shows the matching still: day, dusk or night, with hidden layers never downloaded. The post-page
  mini room uses the same choice (`components/room/lighting.ts`), with its own lighting presets, window
  views and stills.
- **The phone strip is filled.** The mini room is wider (5.4 units) and has the sideboard, radio,
  hydrangea and bookshelf from the big room. The wide camera frames all of it, so the blank right third
  is gone.
- **The post footer ends in real cards.** Where a neighbour would be, the newest post shows "Back to
  the Pocket Room" (`/room/?spot=post-0#world` lights that notebook) and the oldest shows the bookshelf.
  The notebook kicker and the margin legend link into the room the same way (`?spot=<id>`).
- **Spines:** `components/room/spines.ts` turns "Weird use of AI #3: Detective skills…" into
  `#3 Detective`. The shelf sits beside the title on desktop.
- **Project cards without a picture** (Levels, Prehistoriq) show their object rendered from the room
  (`obj-arcade.webp`, `obj-clay.webp`, about 15 KB each).
- **The shinkansen window toy** (`components/room/panels/RoomWindow.tsx`) is now a local, code-drawn
  ride past Fuji inside the pixel-art window frame. It follows the lighting and is still under reduced
  motion. YouTube loads only after "▶ Play the real ride".
- **Performance:**
  - **Draw calls:** about 265 per frame instead of about 1,040, with these changes:
    - The shadow map is frozen and re-renders only for lighting changes, hover springs, resize or the wave.
    - Moving things don't cast into it (trains carry contact blobs instead).
    - Every animated group merges its rigid parts.
    - Static meshes merge into vertex-coloured buckets by material properties rather than per colour.
    - The town lights are one instanced draw.
    - Outline and glow shells are hidden unless something is hovered.
  - **Frame cap:** 60 fps while you interact. When the pointer is elsewhere and nothing is settling it
    drops to 30, which matters because the desktop world is sticky beside the lists. Rendering pauses
    off-screen or in a hidden tab.
  - **Quality ladder:** frames slower than 1.55× the cap first cut the bokeh taps from 44 to 24, then
    the DPR in 0.25 steps down to 1. This was tested with a simulated slow GPU (`?slow=40`).
  - **Phones:** DPR is capped at 1.6 and phones start at 28 taps.
  - **Mini room:** frozen shadows, capped at 30 fps.
- **Reduced motion** is fully static: easing snaps, so no frames render while idle. Panels and chips
  still work.

## How it works

- `components/room/hotspots.ts` is the single source of truth for clickable things. Each entry has an
  id, a Fig. number, the object, what it opens, a kind (colour) and a zone. Server lists tag rows with
  `data-room-target`, the world registers objects with `ctx.spot(id, object, options)`, and markers,
  chips and panels all read the same list.
- `components/room/RoomStage.tsx` is the client shell. It holds the still layers, the markers (SSR
  positions, then per-frame transforms from the engine), the hover/touch chip, the desk chip, panels
  and the bottom sheet, the list↔world linking, the lighting switch and `?spot=` deep links. three.js
  is imported dynamically after idle.
- `components/room/world/` holds the code that renders it:
  - `engine.ts`: renderer, camera fit, picking with hysteresis and Peter's proxy, the frame loop with
    cap and quality ladder, and debug hooks.
  - `world.ts`: spots, outlines, merging, lighting.
  - `house.ts`, `peter.ts`, `railway.ts`, `scenery.ts`, `street.ts`: the content.
  - `post.ts`: the tilt-shift bokeh pass and outline shaders.
  - `mini.ts`: the post-page room.
- Debug: `/room/?debug` exposes `window.__room` with `stats()`, `screenOf(id)`, `pickAt(x, y)`,
  `frameSpot(id)` and `debugCamera()`. `&nodof` turns off depth of field, `&hulls` shows hover hulls,
  `&slow=40` simulates a slow GPU, `&still` forces the no-WebGL path, and `&time=day|dusk|night`
  forces the lighting.
- `scripts/room-stills.mjs <baseUrl>` regenerates the landing stills, `still-anchors.ts`, the mini
  stills and the object thumbnails from the running world (`--only landing,mini,objects`). Run it after
  moving anything in the world.

## How to add a post or a project to the world

- **A new post** needs nothing in the world. The three notebooks on the desk always show the three
  newest posts from `lib/blog`; the list, the desk chip, the post pages and the writing index follow
  automatically. Its spine label comes from `spineLabel()`, so check it reads well. Very long
  single-word titles get an ellipsis.
- **A new project:**
  1. Add it to `lib/lab/catalog.ts` (`labProjects`).
  2. Add a hotspot to `components/room/hotspots.ts` with a new `id`, `projectSlug` and `zone`. Fig.
     numbers follow the array order.
  3. Build the object in the right builder (e.g. `buildWorkshop` in `house.ts`) and register it with
     `ctx.spot("<id>", group, { lift, pop, hull: true })`. Use `hull` for open or sparse shapes.
  4. Run `node scripts/room-stills.mjs http://localhost:<port>` so the stills and marker anchors
     include it. If it has no image, add its id to the `objects` list in that script to render a card
     picture.
  5. `npm test`: the hotspot tests check numbering, brief coverage and still anchors for every spot.

## Checks

- `npm test`: 250+ tests pass, including `tests/room/room.test.tsx`: lists, SSR markers at still
  anchors, desk marker, colour-key links, lighting boot script, post cards and legend, spine labels,
  the window toy loading YouTube only on Play, and assets.
- `npm run build` (static export) passes.
- Playwright interaction pass (desktop 1440×900 and iPhone 13), 34/34. It covers:
  - first hover on Peter, and his chest picking Peter
  - every one of the 18 objects found by the picker and by a real mouse
  - 60/30 fps cap, frozen shadows while idle, draws under 320
  - Tab/Shift+Tab with no stale lit rows, Enter/Escape and focus return
  - window toy, Levels card, list→world hover, `?spot=` deep link, the world moving
  - the slow-GPU quality ladder
  - phones: 44 px markers, no horizontal scroll, desk chip and its ×, chip then Open, bottom sheet
    pinned to the viewport, drag-to-close, tapping Peter on the canvas
  - no-JS: all 18 markers on the still
  - no-WebGL: chips and panels
  - reduced motion: static, panels work
  - phone post with no scroll and the shared lighting, and the wave at the end
  There were no console errors.

## Known gaps

- Performance was measured in headless Chromium (desktop and emulated iPhone, plus the simulated slow
  GPU), not on a real mid-range phone.
- At the default desktop framing the three notebooks are small (about 18 px wide), and their markers
  cover their tops. Hovering a marker highlights its notebook, so this works, but the notebooks
  themselves are small targets.
- On phones the margin toy is a strip at the top of the post. It doesn't follow you down, so you only
  see the wave if you scroll back up (the LED meter and status still update).
- The likeness is a stylised chibi made from primitives and a painted texture, not a sculpt.
- Next.js still warns about `scroll-behavior: smooth` on `<html>` during client navigations. That
  comes from the shared `app/globals.css`, which this work did not touch.
- The level crossings have no sound. Japan sounds play only from the vending machine panel.

## Final screenshots (`output/lab/room-final/`)

1. `01-landing-dusk.png`: the landing at dusk.
2. `02-landing-night.png`: the landing at night.
3. `03-hover-printer.png`: hover state (lift, outline, focus pull, chip).
4. `04-hover-peter.png`: Peter hovered, with the About rows lit.
5. `05-window-toy.png`: the local shinkansen window toy.
6. `06-post-desktop.png`: post page.
7. `07-post-end-night-waving.png`: end of a post at night, with the room card.
8. `08-writing-index.png`: the writing index with short spine labels.
9. `09-phone-landing-night.png`: phone landing at night, with the shared `02–04` marker.
10. `10-phone-desk-chip.png`: the notebooks chip.
11. `11-phone-sheet.png`: the bottom sheet (Levels).
12. `12-phone-post-dusk.png`: phone post at dusk, with the wide mini strip.
