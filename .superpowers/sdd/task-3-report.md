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
- `npm run test:build` (runs the full static build and
  `scripts/assert-static-output.mjs`)
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

## Review fixes

- Replaced standalone Markdown images with allowlisted block-level
  `<ArticleImage>` components. Export checks reject `<p><figure>`,
  `</figure></p>`, and empty paragraphs.
- Removed the forced 3:4 crop from paired images; both pegboard photos retain
  their intrinsic dimensions and natural ratios.
- Changed 0.75 rem continuation-link text to ink on unchanged Kaki for a
  measured 5.51:1 contrast ratio.
- Added an AST allowlist for trusted, version-controlled repository MDX.
  Imports, exports, free expressions, raw HTML, uncontrolled Markdown images,
  inline JSX, unapproved components, and non-literal media props are rejected
  before compilation.
- Root-relative social images now reject protocol-relative `//` URLs.
- RSS and aggregate sitemap dates now use the maximum publish/update date
  across every post rather than relying on sorted position.
- Route tests now exercise `generateStaticParams`, `generateMetadata`, and
  Article JSON-LD. `scripts/assert-static-output.mjs` checks all blog routes,
  SEO markers, semantic figure output, RSS items, sitemap URLs, and robots.
- Local media validation rejects slash-plus-backslash protocol-relative forms
  such as `/\evil.example/image.png`.
- The exact JSON-LD serializer used by article routes is regression-tested with
  `<` in both title and description; emitted script text contains `\u003c` and
  no raw payload delimiter.
