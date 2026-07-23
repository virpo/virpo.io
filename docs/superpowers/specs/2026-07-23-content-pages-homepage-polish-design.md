# Virpo Content Pages and Homepage Polish Design

**Date:** 2026-07-23
**Status:** Approved by Peter on 2026-07-23
**Identity:** 🔻

## Goal

Turn the current single-page experiment into a small personal site with three
clear surfaces:

- `/` is the landing page and playful introduction.
- `/blog/` is a feed of very short posts.
- `/projects/` is the complete visual project archive.

The site remains framework-free and keeps the approved black-gutter,
Tom's-Toys-inspired bento system.

## Principles

- Articles are one or two direct paragraphs.
- Titles are plain or lightly funny, never manufactured suspense.
- Real photos, screenshots and objects carry more weight than explanatory copy.
- The homepage stays playful but every toy must be understandable and useful.
- No CMS, account, cloud progress or client-side router.
- Existing experimental lab files remain separate from the public pages.

## Information Architecture

### Shared masthead

All three pages use the same masthead:

- `virpo` links to `/`.
- `Blog` links to `/blog/`.
- `Projects` links to `/projects/`.
- `About` links to `/#about`.
- The right side retains Tokyo time and the next-bloom interaction.

The current menu-driven DOM reordering is removed. Navigation becomes ordinary,
predictable page navigation with a visible active state.

### Landing page

The homepage keeps:

- masthead;
- square interactive face;
- short introduction;
- Familiar Japanese Sounds;
- Window Seat;
- Japanese Study;
- three latest post blocks;
- compact footer.

The six-project grid moves off the homepage. Project discovery happens through
the masthead and a small Projects link near the latest posts, not through a
duplicate project gallery.

### Blog

`/blog/` is one chronological short-post feed. Every post has:

- title;
- optional series label and number;
- one strong image or paired image;
- one or two paragraphs;
- stable anchor ID.

Homepage post blocks link to `/blog/#post-slug`. Individual article pages are
deliberately deferred until a post grows beyond the short format.

### Projects

`/projects/` contains every selected project. Each entry has exactly:

- real screenshot or photo;
- title;
- project type;
- destination URL.

A description is not required. The page may contain any number of projects and
uses the same three-column desktop, two-column tablet and one-column mobile
rhythm as the current project grid.

## First Three Posts

### A different kind of hackathon

This is a factual two-paragraph story, not an event recap.

It explains:

- older hackathons usually needed several days;
- AI Build Day tested whether similar results could happen in twelve hours;
- participants were placed into teams of two or three;
- larger teams often spend more time communicating than building;
- the teams shipped real work;
- one team earned its first euro within two weeks of the event.

The verified elapsed time for that first euro is within two weeks.
The post uses a real AI Build Day group photo.

### Weird use of AI #1: A toy for my son

This post starts with Peter wondering whether abundant agent capacity could
produce something physical rather than another screen.

It explains:

- Peter wanted to make a pegboard toy for Oli;
- he gave an agent an ugly sketch and physical dimensions;
- the agent produced printable parts within minutes;
- the printer began making pieces for the board Peter and Oli hand-drilled;
- doing the same modelling manually in Fusion 360 would have taken much longer.

The post uses the rough sketch and finished toy or printing photo as a paired
image. It does not imply that the agent used Fusion 360.

### Weird use of AI #3: Detective skills for journalists

Number two is intentionally reserved for the gym-registration automation story.

This post explains:

- a hackathon brought together journalists who needed more research capacity
  and builders with agent tools;
- the result was not another SaaS product;
- the team prepared cleaned public datasets and reusable agent skills;
- journalists can apply those skills to repetitive investigative work;
- the speed claim is treated with a joke rather than a fake benchmark:
  `10×, 100×—pick your favourite AI multiplier.`

The post uses the real Open Data Heroes or Žltá stopa visual.

## Identity and Introduction

### Brand and favicon

- Remove the puzzle emoji from the visible `virpo` brand.
- Replace the current emoji favicon with a red square containing a simple white
  downward triangle that reads as a `V`.
- Use the same mark for favicon and touch-icon assets.
- Keep the written brand as plain `virpo`.

### Introduction

Keep the headline:

> Product engineer from Slovakia. I make useful things where product, design,
> and engineering meet.

Replace the supporting copy with:

> I work at Slido, now part of Cisco. I love building products, small tools,
> and occasionally something weirdly useful.

The introduction background becomes a more saturated green with similar visual
confidence to the red brand tile. Contrast must remain AA-readable.

The only profile links are:

- LinkedIn;
- GitHub.

They use recognizable icon-only controls with accessible names, visible focus
states and tooltips. Old portfolio and face-experiment links are removed.

The face tile has no hover label.

## Tokyo Bloom Interaction

- Remove the detached question-mark badge.
- Treat the bloom summary itself as the information control.
- Hover, keyboard focus and tap all open the same popover.
- A second tap, Escape or outside click closes it.
- The popover contains place, approximate bloom window and source.
- The visible bloom content remains concise: flower, name and countdown.
- Desktop and touch behavior must be verified in a real browser.

## Familiar Japanese Sounds

- Rename the tile to `Familiar Japanese Sounds`.
- Remove the separate `Japan in 8 sec` subtitle.
- The central audio control contains a recognizable play icon.
- It becomes a pause icon while sound is playing.
- Previous and next remain available.
- Audio never starts before a user presses play.

## Window Seat

- Remove the visible pause/run control.
- Remove the related homepage toggle state and JavaScript.
- Keep the train muted, looping and continuously moving.
- Honour `prefers-reduced-motion` without adding another visible control.
- Reframe the iframe and decorative window overlay so more landscape is
  visible on desktop and mobile.

## Japanese Study

The homepage study tile becomes a real local spaced-repetition tool. It reuses
the deck, scheduling and persistence concepts already proven in
`module-lab.js`.

### Levels

1. Hiragana
2. Katakana
3. Kanji vocabulary

The next level unlocks after every card in the current level has been answered
correctly twice.

### Card behavior

Hiragana and Katakana cards:

- show one character;
- reveal its romanized reading;
- offer `Again` and `Got it`.

Vocabulary cards:

- always show the word in Kanji and its Hiragana reading;
- initially hide only the English meaning;
- reveal the meaning on press;
- offer `Again` and `Got it`.

`Again` returns a card soon. `Got it` advances it through progressively longer
intervals. The tile shows current level, progress and due-card count.

### Persistence

- Save deck stages, due times, current level and progress in local storage.
- Recover safely from missing or malformed saved data.
- Provide a deliberate reset action away from the primary card control.
- No login, synchronization or remote analytics.

The study engine is extracted into a focused module so its scheduling can be
tested without a browser DOM.

## Project Content Workflow

Start with the six current projects, then expand without changing layout
architecture.

For each project:

1. Confirm title.
2. Confirm project type.
3. Confirm destination URL.
4. Capture a fresh screenshot or select a real photo.
5. Crop to the shared display ratio without hiding important content.
6. Let Peter review the image and metadata.

Live software uses fresh screenshots. Physical work uses real photos. Generated
mockups are not accepted as final project images.

## Responsive Behavior

- Desktop preserves the face/toy rail and large writing area.
- Mobile keeps the square face, then the vertical toys and introduction/feed.
- Masthead links remain readable at 390 px.
- Bloom details fit without horizontal overflow.
- Study actions remain usable by touch.
- Blog and project images retain meaningful crops.

## Verification

Automated checks cover:

- all three routes and shared navigation;
- active masthead state;
- three homepage post blocks;
- blog anchor IDs;
- project data completeness;
- no old project grid on the homepage;
- no puzzle icon, face label or train toggle;
- study scheduling, level unlocking and corrupted persistence;
- bloom calendar logic.

Browser verification covers:

- desktop and 390 px mobile screenshots for all three pages;
- bloom hover, focus, tap and close behavior;
- sound play/pause and queue controls;
- continuously moving train and improved crop;
- a complete study review, level progress and reload persistence;
- keyboard navigation;
- zero horizontal overflow and zero console errors.

## Delivery Order

1. Shared routing, masthead and identity.
2. Homepage copy and toy polish.
3. Blog feed and first three posts.
4. Study engine and compact learning UI.
5. Projects page with current assets.
6. Content screenshot review and final browser verification.

No deployment or push is included without Peter explicitly requesting it.
