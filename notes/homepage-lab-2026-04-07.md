# Virpo.io Homepage Lab

Date: 2026-04-07

## What the site needs to say

Peter is not "software engineer with projects."

Peter is:

- a design engineer with taste, not a generic builder
- a long-term product engineer from Slido who ships real things
- a playful maker with weird, delightful side projects
- a writer with thoughts worth sharing, not a "blog tab"
- a human with a face, a point of view, and a sense of humor

So the homepage should feel like:

- a toybox for serious work
- a portfolio that moves
- a writing home, not just a landing page
- a place with side doors and hidden treats

## Research takeaways

### From the references

- `toms.toys`: the strong part is not the pixel font. It is the strict container system. Black gutters, off-white cards, thick outlines, one or two accents, and clear scale hierarchy.
- `neal.fun`: projects first, explanations second. The work is the homepage.
- `simonwillison.net`, `mareksuppa.com`, `steipete.me`, `lucumr.pocoo.org/about/`: writing is visible immediately. No hiding posts behind a tiny nav item.
- `brm.sk`: side quests matter. Tiny links and strange little doors make the whole site feel alive.

### From public signals about Peter

- Slido is a core part of the story. Webstack still listed Peter Hraska as `Technical Lead at Slido` in 2023.
- There is real AI / NLP depth, not just surface-level AI play. ACL Anthology lists Peter Hraska on papers in 2023, 2024, and 2025.
- The maker side is real too: Product Hunt and Luma traces point to hackathons, no-code experiments, AI build sessions, and community-facing work.
- The old `virpo.sk` already had blog + portfolio energy. The new site should feel like an evolved version, not a personality transplant.

### Constraints

- Do not make it look like a startup landing page.
- Do not make it look like a Framer template with blobs.
- Do not add five gimmicks. One main interaction is enough.
- Do not let the writing feel bolted on.
- Do not copy Tom's Toys literally. Reuse the grammar, not the costume.

## My current recommendation

Use Tom's Toys as the layout grammar, not the brand skin.

- black or very dark seams / gutters
- warm off-white cards
- one tomato accent and one electric accent
- one expressive display type direction plus one sober reading type direction
- one main interaction in the hero area
- visible writing stream on the homepage

The homepage should feel like a grid of interesting rooms, not a linear marketing funnel.

## A. Fun Interaction Directions

### A1. Face That Notices You

Use your face experiment as the hero, but make it more composed.

- Start with one centered portrait tile inside a calm card.
- The face follows the cursor with subtle eye / head movement.
- On hover, the portrait can switch between 3-5 AI variants of you.
- On click, the card opens a short "about Peter" layer or throws one project card onto the page.

Why it fits:

- unmistakably human
- weird in a good way
- already rooted in your own experiment

Risk:

- can get uncanny fast if overdone

### A2. Toy Shelf in Perspective

Build a shallow 3D shelf of project objects or cards.

- The whole shelf tilts with cursor movement.
- Each project looks like a physical item on the shelf.
- Hovering an item reveals a thumbnail, tiny caption, and status.

Why it fits:

- shows "design engineer" more than "frontend engineer"
- can hold a lot of work without feeling like a grid dump

Risk:

- can get expensive technically if it becomes true 3D instead of fake depth

### A3. Mood Radio Dial

Turn the homepage into a station tuner.

- A chunky dial changes the site mood: calm, playful, night, writing, lab.
- Each mood changes accent colors, ambient texture, and which cards get priority.
- The dark mode toggle becomes part of this system instead of a separate switch.

Why it fits:

- directly tied to your radio idea
- creates a memorable identity

Risk:

- could become theme-switching for its own sake if the content does not change meaningfully

### A4. Stripe Curtain Reveal

Use interactive stripes or ribbons as the hero surface.

- Cursor movement bends or parts the stripes.
- Hidden behind the stripes are project snapshots, words, or your portrait.
- One stripe can be pulled farther to reveal an easter egg.

Why it fits:

- visually rich without screaming "game"
- can feel premium if motion is clean

Risk:

- needs excellent motion tuning or it becomes decorative noise

### A5. The Day Machine

A smaller but very sharp interactive object.

- The top-right card shows today's date, current obsession, location, weather, or "what I am making now."
- Flip it, drag it, or pull a tab to reveal one surprising fact or tiny toy.
- The state changes daily.

Why it fits:

- easier to maintain
- good Tom's Toys energy

Risk:

- more charming than unforgettable unless paired with a stronger hero

## B. Visual System Directions

### B1. Toybox Brutalism

The strongest fit if you want the Tom's Toys spirit.

- black seams
- warm paper cards
- thick graphite borders
- tomato red + bright blue accents
- rounded rectangles everywhere
- playful but disciplined

Mood:

- toy shelf
- graphic
- confident

### B2. Night Gallery

The site becomes a dark exhibition wall.

- deep charcoal background
- cream typography
- saturated artwork cards
- projects feel like posters or framed pieces
- interaction is mostly light and motion, not borders

Mood:

- more artful
- more grown-up
- slightly less toy-like

### B3. Museum Label Modern

The site feels like a design exhibition catalog.

- warm ivory background
- charcoal ink
- muted brick, moss, and cobalt accents
- lots of breathing room
- labels and captions are beautiful, not tiny admin text

Mood:

- tasteful
- editorial
- strong for writing

### B4. Transit Playground

Borrow from public signage and split-flap logic.

- dark ink background
- glowing rails and counters
- compact labels
- module titles feel like wayfinding
- very good for "now", dates, counts, and states

Mood:

- urban
- kinetic
- slightly more technical

Risk:

- can drift too geeky

### B5. Playroom Modernism

More colorful, more Pinterest, less black-heavy.

- cream base
- big geometric color blocks
- one or two bold display moments
- softer borders
- more poster energy than dashboard energy

Mood:

- joyful
- less severe
- better if you want "fun visual person" first

## C. Writing Index Directions

### C1. The Sharp Stream

The homepage and `/writing` show one clean stream with post types mixed together.

- essays
- notes
- links
- experiments

Each item gets:

- type
- date
- read time
- one-line hook

Why it works:

- Simon / Marek clarity
- low maintenance
- makes writing feel alive

### C2. The Card Drawer

Posts live in bento cards of different sizes.

- featured essay is large
- notes are tiny tickets
- links are short strips
- visual essays get image-led cards

Why it works:

- consistent with a toybox homepage
- better visual rhythm

Risk:

- harder to keep elegant once the archive gets large

### C3. The Timeline Rail

A vertical year rail on the left, posts on the right.

- years stay sticky
- major essays feel like markers
- small notes tuck between them

Why it works:

- gives a sense of long-term thinking
- good for "worked on this, learned this, changed my mind here"

### C4. The Topic Shelves

Group posts by recurring themes instead of only chronology.

- design engineering
- AI building
- product craft
- travel / places
- life

Why it works:

- turns writing into a map, not a feed
- helpful if you want evergreen discoverability

### C5. Broadcast Schedule

Posts look like a radio or TV schedule.

- essays are headline programs
- notes are short segments
- links are "signals"
- a current series can have its own lane

Why it works:

- very ownable
- nicely tied to the radio project

Risk:

- easy to over-theme

## D. Article Page Directions

### D1. Quiet Essay

The classic high-legibility essay page.

- strong headline
- short deck
- clean body
- big margins
- occasional image or pull quote

Best for:

- clarity
- shareability
- serious writing

### D2. Lab Notebook

The page keeps the essay readable but shows process.

- margin notes
- little screenshots
- sketch captions
- "what changed after publishing" block

Best for:

- design engineering posts
- build logs
- thought process

### D3. Slide Essay

Long-form writing is broken into large visual panels.

- each section has its own card or scene
- images and diagrams get real room
- quote moments can take over the full width

Best for:

- highly shareable essays
- visual storytelling

Risk:

- too much work for every post

### D4. Annotation Essay

Main column plus a smart side rail.

- links
- footnotes
- small code
- references
- reactions or updates

Best for:

- researched posts
- AI / tooling writeups
- compact but rich posts

### D5. Poster Intro, Essay Body

The article opens with a strong visual poster moment, then settles into a normal reading mode.

- title as artwork
- big image or object
- then switch to calm typography

Best for:

- memorable openings
- keeping normal writing cost low after the intro

## Strongest combinations

### Combo 1. Toybox Human

- `A1` Face That Notices You
- `B1` Toybox Brutalism
- `C2` The Card Drawer
- `D4` Annotation Essay

Why:

- most ownable
- most "Peter"
- balances personality, projects, and writing

### Combo 2. Quiet Killer

- `A4` Stripe Curtain Reveal
- `B3` Museum Label Modern
- `C1` The Sharp Stream
- `D1` Quiet Essay

Why:

- more mature
- still distinct
- safest route if you want longevity over spectacle

### Combo 3. Broadcast Mischief

- `A3` Mood Radio Dial
- `B5` Playroom Modernism
- `C5` Broadcast Schedule
- `D5` Poster Intro, Essay Body

Why:

- strongest brand idea
- most playful
- biggest chance to become iconic if executed with restraint

## My pick

If I had to choose one direction right now:

- `A1`
- `B1`
- `C2` on the homepage
- `C1` on `/writing`
- `D4` for article pages

Reason:

That gives you the human signature up front, the Tom's Toys container grammar you like, a fun project presentation, and a writing system that can mature without repainting the whole site in six months.

## Homepage skeleton I would prototype first

Top bar:

- wordmark
- tiny secret links
- dark / light switch
- date / now card

Row 1:

- intro card
- face interaction hero card
- short "what I make" card

Row 2:

- featured project card
- project shelf / latest work card
- latest writing card

Row 3:

- current obsession / travel / favorites card
- small toy / easter egg card
- archive / links / contact card

## Questions to answer by picking IDs

Reply with something like:

- `A1 + B1 + C2 + D4`
- `A4 + B3 + C1 + D1`
- `A3 + B5 + C5 + D5`

And if you want, add one sentence on what you want to feel more:

- more weird
- more elegant
- more human
- more editorial
- more playful
- more premium

## Sources used

- https://toms.toys/
- https://toybox.toms.toys/
- https://neal.fun/
- https://simonwillison.net/
- https://mareksuppa.com/
- https://brm.sk/
- https://brm.sk/stuff
- https://steipete.me/
- https://lucumr.pocoo.org/about/
- https://face.virpo.sk/
- https://virpo.sk/omne/
- https://virpo.sk/projects-portfolio/
- https://www.producthunt.com/@virpo
- https://luma.com/ai-build-day
- https://webstack.sk/
- https://aclanthology.org/people/peter-hraska/unverified/

Note:

LinkedIn was provided as a source, but its public page was not directly readable in this environment, so I used the public sources above plus the brief in your prompt.
