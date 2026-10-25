---
name: pocket-room-art
description: How every generated image of the Pocket Room (/room/) was made, the decisions on its look, and the playbook for changing or adding art so it matches. Use for ANY image work on the room or its pages - the painted room and its objects, a new project object (e.g. "replace the cat with a new project"), app-screen card art, a Peter pose, the plate, trains or view, the Projects cards under the room (a new project card, repainting one, the pencil versions, logos), the favicon or X avatar - or when touching components/room/tools/ (build.py, cut.py, cards.py, fixes.py, projects.py, brand.py, paint.sh).
---

# Pocket Room art

The room on `/room/` is one hand-painted ink-and-watercolour plate with every clickable thing cut
out of it as its own layer, plus sprites (Peter, notebooks, cat, trains) painted on magenta and
keyed. Everything is ChatGPT image generation driven through `codex exec`, then cut by Python.
Background reading: `docs/lab/v2-layers.md` (what the room does and why). Every painting, its
prompt and its references are in the repo, so any image can be redone or extended the same way.

## Look and feel: decisions to keep

These were chosen by Peter after side-by-side comparisons (October 2026). Follow them; don't
re-explore a rejected direction unless he asks.

- **The room** is cozy Japanese manga in ink and watercolour (fine confident black outlines, soft
  warm washes, paper texture), seen from above at three-quarters. The agreed mockup
  (`docs/lab/refs/pocket-room-mockup.jpg`, screen crop `art/mock-screen.png`) is the spec.
- **The window always shows daylight.** Time in Tokyo shows only as the "TOKYO 20:41" print on the
  bezel and the desk lamp at night. No dark night sky, no darkened room.
- **App-screen cards** (what opens on the device's screen): a large, clean repaint of the same
  object, on magenta, keyed. Never the blurry cut from the plate.
- **Project cards** (the Projects section under the room):
  - ONE clean thing per project, isolated on plain paper, everything around it left out. It must
    say what the project does at first sight, like the YouTube thumbnail -> "No." for YouTLDR.
  - "Medium" manga strength: hand-drawn, layout and text kept, people recognisable. Not the
    barely-traced version, not full manga, not a whole web page repainted.
  - Photos stay true to the real thing: same real people, nobody added or removed.
  - All painted text in English, even when the source is Slovak.
  - The project's own logo sits in the bottom-left corner as real HTML, never painted.
  - At rest a pencil-on-paper version; on hover the colour eases in (about 240 ms in, 360 ms out,
    plain cross-fade). No shader, ripple or ink-drop reveal: those were tried and felt
    distracting.
  - Under each card: title, two tags and the years ("Game · Agents · 2026"). No blurb.
- **Hover labels in the room** say only what you get ("Fig. 07 · Face tracker"), never the object's
  name. Projects whose name explains nothing get their two tags in grey after it.
- **Favicon**: mini-Peter shouting under the Fushimi Inari torii, on torii orange, matching his X
  avatar (a shouting selfie at the torii).
- Anatomy: check that each arm comes from its own shoulder, and ask Peter how the pose should read.
  The wave pose took three tries: the lap hand grew out of the waving shoulder, the first fix
  removed the lap hand, the second moved the wave to the wrong arm, and a bump on the back still
  read as an elbow. He sits twisted towards the camera, so both hands are right of his head and
  nothing sticks out on the left.
- Rejected along the way: a riso/halftone two-ink print look, "live trick" HTML illustrations,
  screenshots on mini devices, scrapbook field notes, full-page manga repaints, and the room going
  dark at night.

## Every generated image

| What | Ships as | Painting (source of truth) | Prompt | Attached references | Made into the shipped files by |
|---|---|---|---|---|---|
| The room plate | `public/lab/room/plate.webp`, `plate-800.webp`, every `obj-*.webp`, `glass-mask.png` | `art/plate-b.png` (`plate-a.png` was the first try) | `prompts/plate.txt`, `prompts/plate-b.txt` | `art/mock-screen.png`, `art/plate-a.png` | `build.py` (objects cut from the plate) |
| View through the window | `view.webp` | `art/view.png` | `prompts/view.txt` | `mock-screen.png`, `plate-a.png` | `build.py` |
| Trains | `train-shinkansen.webp`, `train-local.webp` | `art/trains.png` (on magenta) | `prompts/trains.txt` | `mock-screen.png` | `build.py` |
| Peter's six poses | `peter-*.webp` | `art/peter-sheet.png` (on magenta) | `prompts/peter.txt` | `mock-screen.png`, `art/peter-character-ink.jpg`, `art/peter-photo.png` | `build.py` |
| Peter's wave, arms fixed (twisted towards the camera, both hands right of his head: waving beside his face, the other on his lap; combined from `peter-wave-fix.png` and `peter-wave-fix-2.png`, see `fixes.py`) | `peter-wave.webp` | `art/fixes/peter-wave-fix-4.png` | `prompts/peter-wave-fix.txt`, `-fix-2.txt`, `-fix-4.txt` | `art/fixes/peter-wave-crop.png` | `fixes.py` (inside `build.py`) |
| Notebooks, cat, mug, printed part | `notebook-*.webp`, `cat.webp`, `part.webp` | `art/props.png` (on magenta) | `prompts/props.txt` | `art/plate-b.png` | `build.py` |
| App-screen object cards | `card-<id>.webp` | `art/cards/<id>.png` (on magenta) | `prompts/card-<id>.txt` | plate crop (`cards.py refs`), `plate-b.png` | `cards.py` |
| Project cards | `projects/<slug>.webp` and `projects/<slug>-pencil.webp` | `art/projects/<slug>.png` (on paper) | `prompts/project-<slug>.txt` | the real screenshot or photo in `art/projects/refs/` (+ `art/plate-b.png` as the style) | `projects.py` |
| Favicon and X avatar | `brand/icon-{16,32,48,64}.png`, `brand/apple-touch-icon.png`, `output/lab/brand/x-avatar-400.jpg` | `art/brand/favicon-art.png` | `prompts/favicon.txt` | `art/brand/x-avatar.jpg` (the real X avatar), the `peter-wave` sprite | `brand.py` |
| Margin toys beside a post (hydrangea is the one shown; shiba asleep/awake, walking shiba, strap charm, crane, lucky cat are previews via `?margin=`) | `public/lab/room/margin/*.webp`, positions in `components/room/margin/art.json` | `art/margin/<name>.png` (on magenta; `hydrangea-heads-2.png` supplies one even violet head because head 6 of the first was split blue/violet) | `prompts/margin-<name>.txt` | `art/plate-b.png` + the concept sketch in `art/margin/concepts/` | `margin.py` (bud positions and the cat's coin slot are placed by eye in it) |
| The handheld's wrist strap (braided cord, aluminium cord lock, thin cord; hangs behind the case) | `public/lab/room/strap.webp`, placed in `components/room/Lanyard.tsx` | `art/strap/strap.png` (on magenta) | `prompts/strap.txt` | `art/strap/strap-now-ref.png` (the vector strap it replaced) | `strap.py` |

Not generated: the project logos in `public/lab/room/projects/logos/` are the real marks from each
project's site, recoloured to ink (`#2a2118`); their originals are in `art/projects/logos/` and
`art/projects/slushd-logo.svg` (co-branded; only the part left of the "x" is used).

In every prompt, "style.png" means `art/plate-b.png` and file names like `refs/...` are relative to
`art/projects/`. `<art dir>` means `components/room/tools/art`.

## Style and references

- Style words that work (keep them in every prompt): "cozy Japanese manga illustration, fine
  confident black ink outlines, soft warm watercolor washes, subtle paper texture, warm afternoon
  light from the upper left. Not 3D, not vinyl, not pixel art, not a photo." The plate prompt also
  says "April Zhu colorfigures".
- Camera: seen from above at three-quarters (isometric-ish), the desk running up and to the right.
- Always attach the room itself as a reference: `components/room/tools/art/plate-b.png`. For a
  single object, also attach a crop of it from the plate (`cards.py refs` writes them).
- Peter: `art/peter-character-ink.jpg`, `art/peter-photo.png` and `art/peter-sheet.png` (short
  dark-brown hair with faded sides and a swept-up top, prominent ears, big grin, sage-green hoodie,
  dark jeans, white sneakers, on a slatted wooden chair).
- Anything that is not the plate is painted on perfectly flat **#FF00FF magenta** with "no cast
  shadow and no contact shadow on the background", then keyed. Say it explicitly, or you get a
  shadow blob.

## Painting: `paint.sh` (wraps `codex exec`)

```sh
components/room/tools/paint.sh <prompt.txt> <out.png> [ref.png ...]
```

It runs, with the prompt on stdin:

```sh
zsh -ic "codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox -i ref1.png -i ref2.png - < prompt.txt"
```

Quirks:
- Every `-i` must come before the lone `-`, and the prompt goes on stdin.
- The prompt must say "Use your image generation tool to create ONE image (do not draw it with
  code), then copy the resulting PNG to <absolute path>". `paint.sh` replaces `<out>` in the prompt
  with the absolute output path and prepends that sentence if it is missing.
- One image takes about 50 s. Run several in parallel (one `paint.sh` per image, in the
  background, then `wait`). The codex log goes to `$TMPDIR/paint-<name>.log`.
- Sizes it accepts: 1024x1024, 1536x1024, 1024x1536. Ask for one in the prompt.
- Always look at every result yourself (Read the PNG) and retry when it is off. Paint into a
  scratch folder with `-1`, `-2` suffixes, then copy the keeper into `art/`.
- For an EDIT (fix one thing, keep the rest), send the crop itself, upscaled to an accepted size,
  and say "EDIT this exact image ... keep EVERYTHING ELSE pixel-identical, same size, same framing".
  Then composite only the repaired region back (see fixes below): GPT never keeps the rest exactly.

## Where things live

| What | Where |
|---|---|
| Prompts | `components/room/tools/prompts/*.txt` (`plate-b`, `view`, `trains`, `peter`, `props`, `card-<id>`, `project-<slug>`, `peter-wave-fix-2`, `favicon`) |
| Source paintings | `components/room/tools/art/` (`plate-b.png` is THE room; `peter-sheet.png`, `props.png`, `trains.png`, `view.png`; `brand/` favicon) |
| Card sources | `components/room/tools/art/cards/<id>.png` (one object on magenta, 1024-1536 px) |
| Repairs | `components/room/tools/art/fixes/<name>.png` (GPT edit of a crop) + the polygon in `fixes.py` |
| Scratch output | `components/room/tools/art/work/` (git-ignored: previews, `composite.png`, reference crops) |
| Shipped layers | `public/lab/room/*.webp` (`obj-*` cut from the plate, `peter-*`, `notebook-*`, `cat`, `train-*`, `card-*`) |
| Layer positions | `components/room/scene/layers.ts` (generated by build.py: boxes, sprites, hulls) |
| Card sizes | `components/room/screens/cards.ts` (generated by cards.py) |

## Rebuilding

```sh
python3 components/room/tools/build.py     # plate, objects, Peter, props, trains, view, layers.ts
python3 components/room/tools/cards.py     # card-<id>.webp for the app screens + cards.ts
python3 components/room/tools/cards.py tv  # one card
python3 components/room/tools/cards.py refs  # plate crops to attach to card prompts
python3 components/room/tools/fixes.py     # before | mask | after check images of each repair
python3 components/room/tools/projects.py  # project cards: colour + pencil WebP for every slug
python3 components/room/tools/brand.py     # favicon sizes, touch icon, X avatar
```

Needs numpy, scipy, scikit-image and Pillow. `build.py` is deterministic: with unchanged sources it
rewrites byte-identical files, so after a change `git status` shows exactly what moved. Check that
`layers.ts` did not change unless you meant it to (boxes and hulls drive the hit areas).

- **build.py** crops the 3:2 plate to 4:3 (`CROP_X = 104`), so plate-b pixel x = layer x + 104.
  `OBJECTS` lists each object's box (in the cropped plate) and options: `clip` polygon, `minus`
  (subtract what stands in front), `keep: "all"`, `noglass`. Inside the box, what the ink encloses
  is the object; the hole under it is inpainted. Peter's six poses are boxes in `POSES` on
  `peter-sheet.png`, aligned on the chair (`PETER` x/bottom/scale). `PROPS` places the notebooks and
  the cat.
- **cut.py** has the shared pieces: `object_mask`, `magenta_alpha` (key + despill), `inpaint`.
- **fixes.py** applies repairs before keying: each entry is a GPT edit of one crop, scaled back
  and composited only inside a feathered polygon, so the sprite keeps its size and alignment.
- **cards.py** keys a card (only background magenta: regions touching the edge or holding pure
  #FF00FF; ids in `PINK` keep their own pink paint, others key every magenta tint), unmixes the edge
  colour, trims, scales to fit 580 x 700 (2x the largest art column, about 285 x 346 CSS px on a
  2560 desktop), and saves WebP under 120 KB. `GROUNDED` ids get a contact shadow on the card.

## Playbook: add a new project to the room (or replace an object with one)

1. **Pick the spot** on `plate-b.png` (or the object to replace, e.g. the cat on the bed). Note its
   box in plate-b pixels.
2. **Repaint that region of the plate.** Crop a generous region around the spot (keep the crop's
   aspect at an accepted size, upscale to it), and run a GPT edit with the crop and the full plate
   attached: "EDIT this exact image: on the shelf, paint <object> in the same style ... keep
   everything else pixel-identical". Save the prompt as `prompts/plate-<thing>.txt`.
3. **Composite only the masked region back** into `plate-b.png`: downscale the edit to the crop
   size, check alignment (`skimage.registration.phase_cross_correlation`, should be ~0), and blend
   it inside a feathered polygon around the new object. Either add an entry to `fixes.py` (keeps
   the original plate untouched and the repair re-runnable; then also call `apply_fixes("plate-b",
   ...)` where build.py loads the plate) or write the result into `plate-b.png` and keep the edit in
   `art/fixes/`. Look at the result at 2x before going on.
4. **Re-run the cut**: add the object to `OBJECTS` in `build.py` with its box (in the cropped plate:
   plate-b x - 104), run `build.py`, and open `art/work/o-<id>.png` (checkerboard preview) to see
   that the mask has the object and nothing else. Adjust `clip`/`minus` until it does. If an object
   is being replaced, remove the old one (sprite or `OBJECTS` entry) the same way.
5. **Make it clickable**: add it to `ROOM_OBJECTS` in `components/room/scene/objects.ts` (next Fig.
   number, `kind: "project"`, `projectSlug`, `layer: "obj-<id>"`, `box: obj("<id>")`, `hull:
   hull("<id>")`), and give it a cut polygon in the `CUT` map in
   `components/room/scene/RoomScene.tsx` (the lifted outline, in % of its box) and, if the default
   is off, a Fig. tag position in `TAG_AT`.
6. **Card art**: add the box to `CARDS` in `cards.py` (and to `PINK`/`GROUNDED` if needed), run
   `cards.py refs`, write `prompts/card-<id>.txt` (copy an existing one and change the description
   paragraph), paint it with `paint.sh prompts/card-<id>.txt <scratch>/<id>-1.png
   art/work/card-refs/crop-<id>.png art/plate-b.png`, look at it, copy the keeper to
   `art/cards/<id>.png`, run `cards.py <id>`. `ProjectApp` in `components/room/screens/Apps.tsx`
   picks it up from `cards.ts` by the layer name.
7. **Icon**: add a monochrome animated pictogram for the slug in
   `components/room/icons/ProjectIcon.tsx` (`ICONS` + `SLUG_CLASS`; 32-unit grid, 1.6 stroke, round
   caps, motion in `icons.module.css` when `[data-icon-play]` is hovered or `data-playing`).
8. **Catalog**: add the project to `lib/lab/catalog.ts` (`labProjects`, or `lib/projects.ts` plus
   a blurb in `blurbs`). The slug must match `projectSlug`.
9. **Tests**: update `tests/room/room.test.tsx` ("maps the objects the brief asks for" gets the new
   object, the asset test covers `obj-<id>.webp` via `LAYERS.objects` and the card via
   `CARD_ART`).

Other agents may be editing `Device.tsx`, `objects.ts` or the page at the same time; check with
the user before touching files outside the art pipeline.

## Verifying

- Look at every painting, every `art/work/*-check.png` and `o-<id>.png`, and the shipped WebP on a
  light, dark and green background: no magenta fringe, no leftover wall or desk, crisp at 2x.
- `node components/room/tools/shots.mjs http://localhost:<port> output/lab/<dir> after` takes
  screenshots of every card at 1440 and 2560 wide, Peter waving in the room, the About screen and
  the end of a post, and prints each card's displayed CSS size (ship about 2x the largest). Run
  `next dev -p <port>` first (pick a free port; the dev server and `npm run build` share `dist`).
  Turbopack refuses a `node_modules` symlink that points outside the worktree; use an APFS clone
  (`cp -cR`) instead.
- `npm test` and `npm run build` must pass.

## Playbook: a new project card (or repaint one)

1. **Find the one clean thing** that says what the project does at first sight (the "No." of
   YouTLDR, the flagged contract of Žltá stopa, the Stream Deck alone). For an event or a team, use
   the real group photo.
2. **Save the real reference** (a screenshot via Playwright, or the photo Peter gives you) in
   `art/projects/refs/<slug>-<what>.jpg`.
3. **Write `prompts/project-<slug>.txt`** by copying a close one (`project-cmux-deck.txt` for an
   object, `project-ai-build-week.txt` for a group photo). Keep these parts:
   - "Show ONLY this one thing, centred, filling about 70% of the frame, on a plain empty warm
     off-white watercolor paper background (#F1EADF) with a soft natural shadow under it. Nothing
     else from the page: no navigation, no other text, no buttons, no logos, no background UI."
   - For people: "Keep every real person where they are, with the same faces, hair, clothes and
     poses; do not add, remove or invent anyone."
   - Every word that should be painted, spelled out, in English.
   - The style paragraph: "Style: exactly the attached room illustration (style.png): cozy Japanese
     manga illustration, fine confident black ink outlines, soft warm watercolor washes, subtle
     paper texture. Full colour. Not 3D, not vinyl, not a photo, not pixel art." and
     "Landscape 1536x1024. No border, no frame."
4. **Paint**: `paint.sh prompts/project-<slug>.txt <scratch>/<slug>-1.png art/plate-b.png
   art/projects/refs/<file>`. Look at it next to the reference: right people, right words, nothing
   invented, nothing extra. Retry with a sharper prompt if not. Copy the keeper to
   `art/projects/<slug>.png`.
5. **Wire it up**: add the slug to `SLUGS` in `projects.py` (and to `SOFT` if it is a photo of
   people or a dark object, which get a lighter pencil without outlines, or faces turn eerie), its
   two tags and years to `PROJECT_META` in `components/room/projects.ts`, and its logo to
   `components/room/ProjectLogo.tsx` (an SVG or PNG in `public/lab/room/projects/logos/`, or a
   wordmark). A project that isn't in `lib/lab/catalog.ts` is added on the page itself
   (`app/room/page.tsx`, like `SLUSHD` and `ADVENT`).
6. **Ship**: `python3 components/room/tools/projects.py`, then look at the Projects section at
   1440 and 900 wide, at rest (pencil) and on hover (colour). Nine cards fill three columns; with
   two columns a GitHub tile rounds off the last row.

## Playbook: the favicon

Repaint `art/brand/favicon-art.png` with `prompts/favicon.txt` (attach the X avatar photo and the
`peter-wave` sprite; it must read at 32 px: big head, few details, thick outlines), then run
`brand.py`. If the head moves, adjust `TIGHT` (the crop used for 16 to 64 px). The icons are wired in
`app/room/layout.tsx`.
