// Shared metadata for the Sidecar pages. Next.js replaces a layout's
// `alternates` when a page sets its own canonical, so every page spreads this
// in to keep RSS autodiscovery (<link rel="alternate" type="application/rss+xml">).

export const rssAlternates = {
  "application/rss+xml": [{ url: "/rss.xml", title: "virpo · Writing" }],
};
