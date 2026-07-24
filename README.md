# virpo.io 🌱

Peter Hraska’s statically exported personal site: a Kaki-on-paper homepage,
an MDX blog, project archive, and a few small Japan toys.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests and static export

```bash
npm test
npm run test:e2e
npm run build
```

- `npm test` runs the Vitest unit, component, content, and build-contract suite.
- `npm run test:e2e` builds the site, serves the production `dist/` export on
  `http://127.0.0.1:4187`, and runs Playwright against that static output.
- `npm run build` creates the deployable static site in `dist/`.
- `npm run test:build` builds and verifies every required route, metadata file,
  article SEO marker, and same-origin asset contract.

To inspect the already-built export manually:

```bash
python3 -m http.server 4187 --bind 127.0.0.1 --directory dist
```

## Writing

Posts live in `content/blog/*.mdx`. Add a file with validated frontmatter:

```yaml
---
title:
description:
publishedAt:
updatedAt:
tags:
socialImage:
draft: false
---
```

Use ordinary MDX prose plus the controlled `ArticleImage` and `ImagePair`
components already used by the existing posts. Their media URLs must be
canonical paths inside `/assets/blog/`; traversal and encoded traversal are
rejected. `npm run test:build` catches invalid frontmatter, unsupported MDX,
missing same-origin files or routes, and incomplete article metadata before
deployment.

## Japanese Study storage

Study progress is stored in `localStorage` as `virpo-study-v2`. On first load,
an existing `virpo-study-v1` record is repaired and copied into v2 without
modifying or deleting the v1 value. Current-version data is normalized and
upgraded without losing card progress. Earned groups are persisted
monotonically, so later deck growth cannot relock them.

If a newer storage version is present, this build leaves its exact bytes
untouched. Study remains usable for the current tab and reports
`Saved for this tab only.`; scoring and reset never overwrite the newer data.

## Window Seat limitation

Window Seat uses an unzoomed, masked YouTube no-cookie iframe. The masks cover
the verified title, control, compass, and subtitle regions, but CSS outside a
cross-origin iframe cannot guarantee that YouTube will never inject a central
consent, policy, playback, or error overlay. An absolute guarantee requires a
licensed local video asset.
