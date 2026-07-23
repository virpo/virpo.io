# Task 3 report

## Shipped

- Three validated, typed MDX posts using the exact legacy body copy and media.
- Stable same-date authored ordering without invented historical dates.
- Public blog API via `lib/blog.ts`.
- Minimal `/blog/` index and three static editorial article routes.
- Fraunces article titles, Source Serif 4 body, 44 rem copy measure, 52 rem inline media.
- Controlled single and paired MDX images plus bottom continuation links.
- Canonical, Open Graph, Twitter, Article JSON-LD, RSS, sitemap, and robots output.

## TDD evidence

- RED: content tests failed because `lib/content/posts` and `schema` did not exist.
- GREEN: post discovery, validation, reading time, ordering, and unknown slugs passed.
- RED: SEO tests failed because RSS, sitemap, robots, and footer did not exist.
- GREEN: feeds, crawler metadata, and continuation links passed.
- RED: static build showed `ImagePair` descriptors were removed by
  `next-mdx-remote` 6's default JavaScript-expression block.
- GREEN: controlled object props render from trusted repository MDX while
  dangerous calls remain blocked.

## Verification

- `npm test`
- `npm run build`
- Static files checked:
  - `dist/blog/index.html`
  - `dist/blog/a-different-kind-of-hackathon/index.html`
  - `dist/blog/weird-use-of-ai-1/index.html`
  - `dist/blog/weird-use-of-ai-3/index.html`
  - `dist/rss.xml`
  - `dist/sitemap.xml`
  - `dist/robots.txt`
- Exported HTML checked for canonical, OG, Twitter, JSON-LD, paired images, and
  continuation navigation.

## Concern

- The in-app browser was unavailable, so desktop/mobile rendered screenshots
  could not be checked in this task. Static markup and CSS were verified
  directly. `/projects/` and `/#toys` are intentional continuation targets for
  Task 4.
