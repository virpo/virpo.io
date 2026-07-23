# virpo.io Next.js Editorial + Toys Redesign

Date: 2026-07-24

## Goal

Turn the current static prototype into a durable, statically exported Next.js
site that keeps the playful bento homepage, adds a genuinely pleasant
Markdown-first blog, and makes the three Japan toys feel intentional and
useful.

The site remains a personal corner of the internet rather than a generic
portfolio. Red, black, and white remain identity anchors. The rejected green
and blue fields are removed.

## Product Shape

The public site has four route families:

- `/` — face, short introduction, three Japan toys, and three richer writing
  previews;
- `/blog/` — a minimal chronological list of writing;
- `/blog/<slug>/` — one editorial article per SEO-friendly route;
- `/projects/` — the extensible bento project archive.

Every project keeps a deliberate identity emoji in its metadata where one is
appropriate, but the interface does not scatter unexplained emoji decoration.

## Visual System

The approved direction is **Kaki on paper**.

### Color roles

- `paper`: `#fff4df` — primary page and article field;
- `kaki`: `#d76538` — links, labels, rules, selected states, and compact
  interactive surfaces;
- `brand-red`: `#d0513e` — the virpo brand tile;
- `ink`: `#090909` — type, bento gaps, outlines;
- `white`: `#ffffff` — navigation and quiet tiles;
- `yellow`: `#f4c84c` — Study;
- `peach`: `#f2a084` — occasional secondary warmth, not another large field.

Kaki is emphasis rather than wall paint. Large homepage and page-introduction
fields use paper. The palette should feel warm and graphic without becoming an
undifferentiated orange/yellow surface.

All text/background pairs meet WCAG AA. Focus indicators remain at least 3:1
against adjacent colors.

### Typography

- Righteous remains the site/toy display face.
- Fraunces is used for article titles and editorial headings.
- Source Serif 4 is used for article copy.
- System sans-serif is reserved for compact metadata or controls where the
  display face harms legibility.

Fonts are self-hosted through `next/font` in the static output.

### Bento versus editorial

The masthead, homepage, toys, and project archive retain the black-gap bento
language. Individual article content becomes calm and editorial inside that
shell:

- centered title, publish date, and tags;
- a narrow reading column;
- generous vertical rhythm;
- inline images between paragraphs, never a giant full-width hero;
- optional captions;
- restrained Kaki links, rules, code accents, and tags;
- a quiet article footer linking to More writing, Projects, and Toys.

## Homepage

### Structure

The homepage keeps:

1. virpo/menu/bloom masthead;
2. square interactive face;
3. Familiar Japanese Sounds;
4. Window Seat;
5. Japanese Study;
6. short introduction;
7. three writing previews.

Mobile order remains face → Sounds → Window Seat → Study → introduction →
writing.

### Introduction

The introduction is short and uses the paper field. Kaki highlights only the
important phrase. LinkedIn and GitHub remain the only profile links.

### Writing previews

The writing area uses its height for information rather than oversized titles.
Each preview contains:

- date or series label;
- medium title;
- a real two- or three-line excerpt;
- reading time;
- clear route affordance.

The three rows may stretch on desktop to align with the toy rail. Mobile rows
return to their content height.

## Blog and MDX Content

Posts live under `content/blog/*.mdx`.

Each post has validated frontmatter:

```yaml
title:
description:
publishedAt:
updatedAt:
tags:
socialImage:
draft:
```

The first three posts are migrated from the current prototype. Inline images
and paired images are represented with controlled MDX components rather than
raw, unrestricted JSX.

### Blog index

`/blog/` is a minimal chronological list, not an article and not a giant
landing hero. Each entry shows date, title, description, tags, and reading
time.

### Article routes

`/blog/<slug>/` renders one article. Each route includes:

- canonical URL;
- title and description metadata;
- Open Graph and Twitter metadata;
- Article JSON-LD;
- publish and updated dates;
- tags;
- social image when supplied.

RSS, sitemap, and robots output are generated during the build.

## Next.js Architecture

Use the App Router with TypeScript.

The site is a static export:

```ts
{
  output: "export",
  trailingSlash: true
}
```

The output requires no Next.js server. Dynamic article routes use
`generateStaticParams()`. Browser-only APIs are isolated in Client Components.

### Main boundaries

- `app/layout.tsx` — fonts, metadata defaults, global shell;
- `app/page.tsx` — homepage;
- `app/blog/page.tsx` — minimal blog list;
- `app/blog/[slug]/page.tsx` — MDX article route;
- `app/projects/page.tsx` — project archive;
- `components/site/*` — masthead, bloom, footer, navigation;
- `components/toys/*` — Face, Sounds, Window Seat, Study;
- `components/blog/*` — index rows, article header/body/footer, MDX mappings;
- `lib/content/*` — frontmatter parsing, post discovery, reading time, SEO;
- `lib/study/*` — pure scheduler, decks, migration, progress;
- `content/blog/*` — MDX source;
- `public/*` — current images, audio, and static assets.

Static Server Components render all layout and content. Only Bloom, Face,
Sounds, Window Seat, and Study use `"use client"`.

## Japanese Study

### User experience

Study becomes smaller and cuter:

- compact heading and progress strip;
- a shorter card area;
- one large glyph/word;
- reading and meaning reveal rules preserved;
- small pill-like Again and Got it buttons;
- reset remains secondary;
- keyboard focus returns to the next card after rating.

The complete tile should be materially shorter than the current version.

### Random selection

Cards never follow source, alphabetic, or kana-row order.

The pure scheduler accepts an injectable random function for deterministic
tests. From the currently due pool it:

1. excludes the most recent card when alternatives exist;
2. shuffles eligible cards;
3. biases toward weaker/overdue cards;
4. prevents more than two unseen cards in a row;
5. returns the next due time when no card is ready.

Progress is independent from random presentation order.

### Progression

All learned and weak cards remain eligible after later material unlocks.

- Start with Hiragana.
- Unlock and mix Katakana when at least 80% of Hiragana cards are stable.
- Unlock Kanji bucket 1 when at least 80% of Katakana cards are stable.
- Unlock the next Kanji bucket when at least 75% of the current bucket is
  stable.

A stable card has at least two correct ratings and has reached scheduler stage
2 or higher.

### Kanji buckets

Use four initial buckets of eight practical vocabulary cards. Each card teaches
a written form, one natural Hiragana reading in the taught vocabulary, and an
English meaning.

1. elements and landscape;
2. people, size, and position;
3. time, movement, and entrances/exits;
4. everyday Japan: station, train, food, drink, shop, and school.

Buckets grow later without changing persisted state shape.

### Persistence

State is stored under a versioned localStorage key. It includes:

- per-card stage, due time, correct count, and wrong count;
- unlocked kana/kanji groups;
- recent card IDs needed to avoid repetition;
- version.

Existing `virpo-study-v1` progress migrates into the new version without losing
per-card results. Missing, malformed, future, or partial data repairs safely.

## Familiar Japanese Sounds

Sounds shows both:

- a real audio-reactive waveform/equalizer;
- a separate visible play/pause control.

The waveform uses Web Audio `AnalyserNode` data after the first user gesture.
Until then it renders an idle waveform. Previous and next remain compact.
Changing sound while playing continues playback. No audio starts without an
explicit user action.

The component handles suspended AudioContext, play rejection, unavailable
audio, and reduced motion. With reduced motion, bars update without decorative
easing.

## Window Seat

Keep the YouTube no-cookie embed without zooming.

- autoplay muted, looped, controls disabled;
- pointer interaction disabled;
- illustrated window frame remains above the iframe;
- opaque/gradient masks cover the title and control regions at the top and
  bottom;
- no custom play/pause control;
- reduced motion leaves the iframe unloaded.

This hides standard YouTube chrome without cropping the underlying video. A
complete guarantee against a central YouTube error message would require a
licensed local video asset and is outside this iteration.

## Projects

Keep six current projects, 3/2/1 responsive columns, shared 3:2 card ratio,
clean screenshots/photos, and title/type only. Project data moves to a typed
data module so more cards do not require editing page markup.

## SEO and Compatibility

- Site URL: `https://virpo.io`.
- Preserve trailing-slash routes in static output.
- Homepage writing links change from hash anchors to article routes.
- The blog index retains matching legacy IDs so old `/blog/#slug` links land
  near the corresponding entry.
- Generate `robots.txt`, `sitemap.xml`, and `rss.xml`.
- Include favicon, Apple icon, theme color, canonical metadata, and social
  metadata.
- No tracking or analytics is added.

## Testing

### Unit

- study state migration and repair;
- random selection avoids predictable ordering and immediate repetition;
- progression thresholds;
- Kanji bucket unlocks;
- scheduler timing and scoring;
- content frontmatter validation and post sorting.

### Component

- Study reveal/rate/focus/persistence;
- Sounds play/pause/waveform/next behavior;
- Bloom hover/focus/click/Escape;
- Window Seat reduced-motion behavior;
- article metadata and bottom navigation.

### Build

- `next build` succeeds as a static export;
- every expected HTML route exists;
- sitemap, RSS, robots, and social metadata are present;
- no missing same-origin asset references.

### Browser and visual

Verify desktop `1440 × 1000` and mobile `390 × 844`:

- no horizontal overflow;
- square face;
- toy order and compact Study;
- waveform plus play/pause;
- hidden YouTube chrome;
- randomized Study and persisted reload;
- blog list and each individual article;
- inline article images and readable measure;
- projects grid;
- keyboard focus and reduced motion;
- zero uncaught product errors.

Refresh six route overview screenshots plus one complete screenshot for each
article.

## Non-goals

- database, CMS, authentication, comments, likes, search, analytics;
- Next.js server runtime, Server Actions, ISR, or API routes;
- downloading or self-hosting the YouTube train video;
- a comprehensive Japanese curriculum beyond the initial Kanji buckets;
- dark mode in this iteration.

## Approved assumptions

Peter authorized best-effort completion without additional stopping points.
The following decisions are therefore treated as approved:

- Next.js static export rather than Astro or a custom compiler;
- Kaki-on-paper visual system;
- gradual 80% kana and 75% Kanji-bucket unlock thresholds;
- minimal blog index plus one MDX-backed article per route;
- article bottom links to More writing, Projects, and Toys;
- masks rather than iframe zoom for Window Seat.
