# Site Performance Design

## Goal

Make `virpo.io` feel immediate without materially changing its appearance or interactions.

## Success criteria

- Preserve the current visual design pixel-for-pixel at normal viewing sizes.
- Keep the existing Next.js static export unless measurement shows framework JavaScript is still a meaningful bottleneck after media optimization.
- Reduce the homepage initial transfer from roughly 9 MB to below 1 MB before the train video begins loading.
- Target Lighthouse mobile scores of 90+ for Performance and 100 where practical for Accessibility, Best Practices, and SEO.
- Target Core Web Vitals of LCP <= 2.5 s, INP <= 200 ms, and CLS <= 0.1.
- Treat 250 ms as a typical cached TTFB target, not a promise that the complete page renders in 250 ms on every connection.

## Asset delivery

Create visually equivalent WebP versions of the radio, study-paper, train-window, train still, and large bloom artwork. Preserve transparent edges, pixel alignment, and the current compositions. Keep source PNGs available as design sources, but serve the optimized files on the site.

Generate only the dimensions the UI actually needs. Avoid delivering multi-megapixel images into roughly 600 px cards. Use lossless or near-lossless encoding where lossy compression changes pixel-art edges or colors.

## Train loading

Render the optimized still immediately so the toy never appears blank or noisy.

Do not put a YouTube iframe in the initial HTML. After the window `load` event, schedule iframe creation during idle time. Prioritize it when the train toy is already visible; otherwise wait until an IntersectionObserver reports that it is approaching the viewport. Preserve reduced-motion behavior and the existing four-second cover transition after the iframe loads.

## Application work

Keep the current Next.js architecture. Audit client-component boundaries and remove client JavaScript only when it is unnecessary; interactive face, sounds, study progress, bloom details, and train playback remain interactive.

Keep Next-managed local font files and `font-display: swap`. Do not preload non-critical artwork or third-party assets.

Fix the existing non-visual Lighthouse issues: accessible names must include visible labels, small white-on-red text must meet WCAG AA contrast, and image intrinsic dimensions must match the rendered train composition.

## Hosting and caching

First measure the optimized GitHub Pages build. GitHub Pages' short cache headers may keep the Lighthouse cache-policy audit from turning green even when first-load performance is excellent.

Treat a move to Cloudflare Pages as a separate delivery step. Use it only if the optimized site still misses the TTFB or cache-policy targets. The public domain, URLs, generated static site, and visual result remain unchanged.

## Verification

- Unit tests for deferred iframe creation, visibility priority, reduced motion, and accessible names.
- Static build and reference validation.
- Playwright screenshots at desktop and mobile sizes for visual comparison.
- Lighthouse mobile and desktop runs against a production server, recorded before and after.
- A repeatable performance-budget check for initial bytes, image sizes, and Lighthouse category floors.

