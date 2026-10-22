# Pocket World and Sidecar build brief

Two new homepage concepts for virpo.io, Peter Hraska's personal site, built as
production-quality experiments inside this Next.js app (static export, React 19,
CSS modules, three.js 0.182 already installed). They live next to the current
site and do not replace it yet.

## What Peter asked for (his words, condensed)

- "Build out 03 (Pocket Room) and 01 (Sidecar), production quality."
- Pocket Room: "make it super obvious on hover which things can be clicked."
  "Make it look like no other website." "Make it work on phones too." "Make
  the character look like me." "Make trains move and everything. Like a little
  world. An interactive one." "Make it super obvious it is a blog and list of
  projects too."
- "Build out a beautiful blog reading page too, with some toy on it that
  references this big one."
- "Make it count. Make it awesome."

Constraints he set earlier, which are hard rules:

1. A shared post is one column, top to bottom. Fun only in a side margin. On a
   phone the toy folds into a small strip, never over the text.
2. The landing page shows the 3 newest posts immediately, plus "All writing →".
   Nobody reads a blog that looks like a dollhouse, so the world must sit next
   to a plain, readable list, not replace it.
3. Posts get shared on Hacker News: credibility matters. Fast, readable without
   JavaScript, left-aligned, real dates, RSS, no scroll hijacking, links that
   look like links.
4. The existing Japan toys must stay quick to reach: Peter's face (follows your
   cursor), learn hiragana, the shinkansen window, Japan sounds, the flower
   bloom forecast. At most one click away.
5. Stay playful. He loves April Zhu's hand-inked isometric figures and the
   Teenage Engineering look.

## The two concepts

### 03 Pocket Room → route `/room/`

A little interactive world, the hero of the page. A cutaway isometric house
plus its surroundings: Peter's writing room upstairs, a workshop below, a
street with a vending machine and a tiny konbini, an elevated railway where a
white shinkansen and a local train actually run, Mount Fuji far away, clouds.
Target look: `docs/lab/refs/world-key-art.jpg` (ChatGPT key art, treat as
mood, not a spec). Earlier concept: `docs/lab/refs/pocket-room-mockup.jpg`
(a Teenage Engineering-style device whose screen shows the room; the device
frame is optional for this build: the world is the star, a bezel or none).

Things that move: trains on a loop with timetable-like regularity, Peter typing
at his desk (and reacting when you hover or click him), the 3D printer printing,
steam from a cup, a cat, clouds, leaves, a crossing barrier when a train passes.
Day/night following Tokyo time is a bonus.

The character is Peter and must be recognisable: short dark-brown hair with
faded short sides and a longer textured top swept up, fair skin, prominent ears,
big friendly grin, sage-green hoodie with drawstrings, dark jeans, white
sneakers. References: `docs/lab/refs/peter-photo.png`,
`docs/lab/refs/peter-character-ink.jpg`, `docs/lab/refs/peter-character-3d.jpg`.

Clickable objects (every one needs a hover state that is impossible to miss:
lift + outline/glow + color + a label tag that says what it is and where it
goes, plus a visible idle hint so people know before hovering, e.g. small
numbered "Fig." markers like April Zhu's figures. On touch devices markers are
always visible; first tap shows the label with an Open button, second tap or the
button opens):

| Object in the world | Opens |
|---|---|
| Desk / notebooks / bookshelf in the writing room | Writing (each of the 3 newest posts can be its own notebook or paper) |
| 3D printer printing a pegboard toy | Pegboard Toy project |
| Arcade cabinet | Levels |
| Poster or little stage | AI Build Week |
| Yellow footprint sign / detective cork board | Žltá stopa |
| Small TV | YouTLDR |
| Stream-deck-like box on the desk | CMUX Deck |
| Clay figure on a shelf | Prehistoriq |
| Old radio | Mood Radio |
| Window with the passing shinkansen | Shinkansen window toy |
| Mirror | Peter's face toy |
| Hiragana poster | Kana toy |
| Hydrangea pot / garden | Bloom forecast |
| Vending machine or konbini door | Japan sounds |
| Peter himself | About |

Toys open in place as a small panel or overlay next to the object (reuse the
logic of the existing toys, restyle the presentation). Projects open a card
with title, blurb and link. Writing items link to `/room/blog/<slug>/`.

Next to the world (side on desktop, below on phones) there must be plain,
server-rendered HTML: "Writing" with the 3 newest posts (title, date, one
line) and "All writing →" (`/room/writing/`), then "Projects" as a list, then a
short About. Hover links both ways: hovering a list item highlights its object
in the world; hovering an object highlights its list item.

### 01 Sidecar → route `/sidecar/`

One small Teenage Engineering-style device, shown at two sizes. Reference:
`docs/lab/refs/sidecar-mockup.jpg`, typography mood
`docs/lab/refs/field-guide-mockup.jpg`. On the landing page the device is big
(left), with an LCD and five keys: FACE, KANA, WINDOW, SOUND, BLOOM. WINDOW is
on by default and animated (pixel shinkansen window). Keys must feel physical:
press travel, shadow, an LED, keyboard shortcuts 1–5, optional click sound
after the first user interaction. Right side: Writing (3 newest + All writing
→ `/sidecar/writing/`), Projects list, About. Strict grid, small monospace
labels, one orange accent. Credible and quietly playful.

On a post page the same device docks into the right margin, smaller, sticky.
Its LED strip fills with reading progress, keys still work, and it never covers
the text. On phones it becomes a slim bar.

## Post pages (both concepts)

Routes `/room/blog/[slug]/` and `/sidecar/blog/[slug]/` plus a writing index
`/room/writing/` and `/sidecar/writing/`. Use `getPostSummaries`, `getPost`
from `lib/blog` and `compilePostMdx` from `components/blog/mdx-components`
(supports `ArticleImage` and `ImagePair`). Posts are short (150–190 words,
with images), so the page must look beautiful even when the text is brief:
generous type, title, date, reading time, tags, images that breathe,
previous/next post, back home. Readable with JavaScript disabled.

The toy in the margin references the big landing:

- Room: a small calm window into the same world, e.g. mini-Peter at his desk
  reading this post, turning a page as the reader scrolls, a train passing in
  the window behind him, waving when you reach the end. Sticky in the right
  margin on desktop, a small strip on phones. Must not compete with the text.
- Sidecar: the docked device described above.

Set `robots: { index: false }` and canonical `/blog/<slug>/` on the experiment
post pages so search engines don't index duplicates.

## Content and existing code to reuse

- Posts: `lib/blog` (`getPostSummaries`, `getPost`), MDX via
  `components/blog/mdx-components`.
- Projects and About copy: `lib/lab/catalog.ts` (`labProjects`, `labAbout`).
- Toys: `components/home/FaceToy.tsx` (`getFaceImageUrl`, images from
  face.virpo.sk), `components/toys/StudyToy.tsx` + `lib/study`,
  `components/toys/WindowSeatToy.tsx` + `public/assets/optimized/train-window*.webp`,
  `components/toys/SoundsToy.tsx` (`JAPAN_SOUNDS`) + `public/audio`,
  `lib/japan/bloom.ts` (`getBloomStatus`, `getTokyoParts`).
- Existing visual system for comparison: `app/v2/`, `app/globals.css`.

## File boundaries

- Pocket Room: `app/room/**`, `components/room/**`, `public/lab/room/**`,
  `tests/room/**`.
- Sidecar: `app/sidecar/**`, `components/sidecar/**`, `public/lab/sidecar/**`,
  `tests/sidecar/**`.
- Don't edit shared files (root `app/page.tsx`, `app/globals.css`, `lib/**`,
  existing components, package.json) unless something is genuinely broken.
  Three.js is installed; if you truly need another dependency, say why in your
  notes.
- Don't commit large source images. Optimise anything in `public/` (webp,
  sensible sizes).

## Quality bar

- Looks like no other website. Avoid the generic three.js demo look, generic
  gradients and stock UI.
- Smooth: 60 fps on a laptop, good on a mid-range phone. Pause rendering when
  the tab is hidden or the world is off screen. Cap device pixel ratio.
- The HTML lists render immediately (server components). The world loads
  after first paint (dynamic import), with a still fallback so nothing jumps.
- `prefers-reduced-motion`: no ambient motion, still everything clickable.
- No WebGL: a still image of the world with HTML hotspots, or a 2D fallback.
- Keyboard: every clickable object is reachable with Tab and opens with Enter;
  Escape closes panels. Real aria labels.
- Phones: the world fits the width (allow drag to pan if needed), tap targets
  are at least 44 px, lists come right after the world, no horizontal scroll.
- No console errors. `npm test` and `npm run build` pass. Add a few tests for
  your routes in your tests folder.

## Environment

- Node: run `export PATH=$HOME/.nvm/versions/node/v24.13.1/bin:$PATH` first and
  always call `command node`, `command npm`, `command npx` (the plain names are
  shell functions that break in this environment).
- If your worktree has no `node_modules`, clone it:
  `cp -cR /Users/hraska/Code/virpo.io/.worktrees/pocket-world/node_modules ./node_modules`.
- Dev server: `command npx next dev -p <your port>`. Stop it when done.
- Screenshots: `command node scripts/lab-shot.mjs <url> <outDir> --name <n>
  --hover "<selector>" ...` gives desktop, mobile, full-page and hover shots plus
  console errors. Look at every screenshot yourself (Read the PNG) and iterate.
  Do at least three look-and-fix rounds on the landing page and on a post page.
- ChatGPT image generation is available if you want generated textures or
  reference art: write the prompt to a file, then
  `zsh -ic "codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox - < prompt.txt"`
  where the prompt tells it to use its image generation tool, create ONE image
  and copy the PNG to an absolute path you choose. About 50 s per image. Attach
  references with `-i path.png` before the `-`. Anything that has to move or be
  clickable should be drawn in code, so generated images are best for
  textures, paper, backdrops or reference.

## Deliverable for each attempt

Commit your work on your branch. Write `docs/lab/<attempt-id>.md` with what you
built, the art direction, how interaction works on desktop and phones, known
gaps, and the paths of your final screenshots in `output/lab/<attempt-id>/`
(commit the final screenshots, at most about 12 PNGs).
