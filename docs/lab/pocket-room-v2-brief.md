# Pocket Room v2 brief

This replaces the Pocket Room part of `pocket-world-brief.md`. Everything in
that brief about posts, HN credibility, accessibility, file boundaries, the
environment and the deliverable still applies. Where the two disagree, this
file wins.

## Why there is a v2

v1 built a 3D vinyl-toy diorama of a whole house and street inside a thin case.
Peter rejected it: "Looks nothing like the agreed pocket room design." The
agreed design is `docs/lab/refs/pocket-room-mockup.jpg`, and v1 ignored it. v2
must look like that mockup. This is the single most important requirement. A
build that is clever but does not look like the mockup loses.

## The agreed design (study the mockup, then study it again)

Concept text Peter picked (Series 02, No. 03, "06 × 08"):

> A Teenage Engineering-style device whose screen is a hand-drawn isometric
> room with a tiny you inside, doing what you're doing right now.
> The device sits on the left. On screen, mini-Peter is writing, printing or
> traveling. The 3 newest posts are on the right.
> On a post, the device docks in the margin. Mini-Peter sits reading the same
> post and turns a page as you scroll. When you reach the end, he looks up and
> waves.
> The room's objects are the toys: the window opens the shinkansen view, the
> radio plays sounds, the poster teaches kana, the hydrangea shows the bloom
> forecast, and the mirror opens your face tracker. One click each.

What the mockup shows, and what the landing must therefore look like:

1. **Page:** warm off-white, a lot of calm empty space, no busy chrome. Two
   columns: the device on the left (about 55% of the width), a quiet text
   column on the right.
2. **The device:** a squarish handheld in warm grey anodised aluminium with
   rounded corners and a slightly darker side band. A thick black bezel around
   a 4:3 screen. Under the screen: a four-way d-pad on the left, a small round
   button and a two-part pill button in the middle, a speaker grille of dots,
   and a big knurled orange knob on the right. A small orange button on the
   left side, an orange braided lanyard looped from the left edge, a kickstand
   behind, a soft contact shadow under it. Teenage Engineering, not a toy
   phone. It must feel physical: real highlights, bevels, press travel.
3. **The screen:** a hand-drawn illustration of one room, seen from above at
   three-quarters (isometric-ish), in ink line and soft watercolor, warm wood
   floor, like April Zhu's colorfigures or a cozy Japanese illustration. It is
   NOT 3D-rendered, NOT vinyl, NOT a house with a street. One room, filling the
   screen edge to edge.
   - Mini-Peter at a wooden desk by the window, typing on a laptop, seen from
     behind or three-quarters. He must look like Peter: short dark-brown hair
     with faded sides and a swept-up top, prominent ears, sage-green hoodie,
     dark jeans, white sneakers (refs: `peter-photo.png`,
     `peter-character-ink.jpg`).
   - A big window with hills, poles and wires outside and an elevated track
     where a white-and-blue shinkansen passes.
   - A hiragana poster (あいうえお…), a framed Fuji print, a shelf with a radio
     and a small lucky cat, a pegboard with tools, a 3D printer printing a
     small orange part, plants, a hydrangea pot by the window, a bookshelf,
     boxes, a rug, a bed with a blue check blanket in the corner.
   - Also needed for the project mapping, drawn so they fit the room
     naturally: a mirror (face toy), a small arcade or handheld game on a shelf
     (Levels), a tiny TV (YouTLDR), a stream-deck box on the desk (CMUX Deck), a
     clay figure on the shelf (Prehistoriq), a cork board with a yellow
     footprint note (Žltá stopa), an AI Build Week poster or badge, and
     notebooks on the desk (the writing).
4. **The right column:** "Peter Hraska" big, in a clean grotesk. Then the 3
   newest posts: title, then date in grey, separated by hairlines. Then
   "All writing →" in orange. That is all that is above the fold. Projects and
   a short About come below, just as plain.

## Life on the screen (calm, slow, a little world)

- The shinkansen passes the window on a regular timetable (every 15–25 s),
  with a local train in between. The view outside is a proper little landscape
  (hills, poles, wires, a few houses), with soft parallax if you like.
- Peter types, sometimes leans back, sips from a mug with steam, glances at the
  window when the train passes.
- The 3D printer head moves and the orange part grows slowly.
- Plants and the hydrangea sway a tiny bit, the curtain moves, a cat may wander
  in and sleep on the bed. Light shifts with Tokyo time (morning, day, evening,
  night with the desk lamp on) — a bonus, not a must.
- Reduced motion: everything still, everything still clickable.

## Interaction: super obvious what can be clicked

- Idle hint: small numbered "Fig." tags (like April Zhu's figures) on the
  clickable objects, or a gentle periodic shimmer across them. On touch, tags
  are always visible.
- Hover on the screen: the object lifts out (scale or offset), gets a crisp
  ink-and-color outline or glow, the rest of the room dims slightly, and a
  label tag appears on the screen: what it is and where it goes
  ("Fig. 07 · Arcade → Levels"). The cursor becomes a pointer.
- The device controls work: the d-pad moves a selection cursor from object to
  object like a game, the round or pill button opens the selected object, the
  knob scrolls through objects (and/or time of day). Arrow keys and Enter do
  the same, Escape goes back. This makes clickability obvious even without a
  mouse.
- Opening something happens on the device screen, like switching apps: the
  window opens the shinkansen view, the mirror shows the face tracker, the
  poster becomes kana flashcards, the radio plays sounds, the hydrangea shows
  the bloom forecast, a project shows its card with a link, a notebook goes to
  the post. A back control (and Escape) returns to the room. Reuse the logic of
  the existing toys (see the main brief) and restyle it for the screen.
- Hover links both ways between the right-hand list and the room: hovering a
  post title highlights its notebook, hovering a notebook highlights the post.
- Touch: the first tap selects and shows the label with an Open action, the
  second tap opens. Targets are at least 44 px.

## Post page

One readable column, top to bottom (see the main brief). The same device,
smaller, docks sticky in the right margin. On its screen mini-Peter sits
reading this post, turns a page as the reader scrolls, a train passes the
window now and then, and at the end he looks up and waves. A thin progress
indicator on the device fills as you read. On phones the device becomes a slim
strip above the article and never covers text.

## Writing index

`/room/writing/`: a plain, beautiful list of every post, with a small touch of
the device language. No dollhouse.

## Phones

The device goes full width at the top, sized so that at least the first post
title is visible on a 390×844 screen without scrolling. The list follows
right after. No horizontal scroll.

## Technique

Any technique is allowed, as long as the result looks like the mockup. Painted
art (ChatGPT image generation, see the main brief) is allowed and encouraged
for the room illustration; the mockup itself is ChatGPT art. Split it into
layers so things can move and be highlighted: a background plate, separate
sprites for objects that move or can be clicked, Peter's poses, the train and
the view outside. Use the mockup and the character refs as `-i` references so
every layer shares one style. Keep source images out of git; ship optimised
WebP at sensible sizes.

## Replacing v1

v1 lives in `app/room/**`, `components/room/**`, `public/lab/room/**` and
`tests/room/**` on this branch. Replace it entirely: delete what you don't
reuse. The old version is kept in git on `final/room`. Don't touch
`app/sidecar/**` or `components/sidecar/**`, but you may read the Sidecar
device code for technique, and copy what you need into `components/room/`.

## Acceptance gate

Before you return, put your landing screenshot next to
`docs/lab/refs/pocket-room-mockup.jpg` (for example, make one side-by-side PNG
with a small script) and Read it. If a stranger would not say "that's the same
design", keep working. Commit the side-by-side as
`output/lab/<attempt-id>/00-vs-mockup.png`.
