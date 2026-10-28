// One place for what the whole site says about itself: search engines, link previews, AI answer
// engines (llms.txt) and structured data all read from here.

export const SITE_URL = "https://virpo.io";
export const SITE_NAME = "virpo";
export const AUTHOR = "Peter Hraska";
export const SITE_TITLE = "Peter Hraska";
// the home page's own title, for tabs and search results (other pages read "<page> · Peter Hraska")
export const HOME_TITLE = "Peter Hraska (virpo): AI, design and odd little tools";
export const SITE_DESCRIPTION =
  "Peter Hraska builds AI products, odd little tools, physical objects and events. His site is a tiny painted room you can poke at.";

export const OG_IMAGE = { url: "/og/og-image.png", width: 1200, height: 630, type: "image/png", alt: "The Pocket Room: a little grey handheld whose screen shows Peter's painted room" };
// og:video is not resolved against metadataBase by Next, so it is absolute here. X ignores it (it
// only plays videos uploaded to a post); Discord, Telegram and some chat apps play it inline.
export const OG_VIDEO = { url: `${SITE_URL}/og/pocket-device.mp4`, secureUrl: `${SITE_URL}/og/pocket-device.mp4`, width: 1280, height: 720, type: "video/mp4" };

// the RSS feed, linked from every page's <head> (a page's own alternates replace the layout's)
export const RSS_ALTERNATE = { "application/rss+xml": [{ url: "/rss.xml", title: "Peter Hraska (virpo): writing" }] };

export const SAME_AS = [
  "https://x.com/virpo",
  "https://github.com/virpo",
  "https://www.linkedin.com/in/hraska/",
  "https://www.instagram.com/virpo.san/",
];

export const absolute = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Title, description, canonical and the link-preview tags for one page, all agreeing. Next
 * replaces (does not merge) a page's openGraph and twitter objects, so each page sets them whole.
 */
export function pageMeta({ title, description, path, type = "website" }: { title: string; description: string; path: string; type?: "website" | "article" | "profile" }) {
  const full = `${title} · ${SITE_TITLE}`;
  return {
    title,
    description,
    alternates: { canonical: path, types: RSS_ALTERNATE },
    openGraph: { type, url: path, siteName: SITE_NAME, locale: "en_US", title: full, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image" as const, site: "@virpo", creator: "@virpo", title: full, description, images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }] },
  };
}

/** JSON-LD for a <script type="application/ld+json">, safe to inline. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export const PERSON = {
  "@type": "Person",
  "@id": `${SITE_URL}/#peter`,
  name: AUTHOR,
  alternateName: "virpo",
  givenName: "Peter",
  familyName: "Hraska",
  url: `${SITE_URL}/`,
  // the X avatar, so engines show the same face people know from X
  image: { "@type": "ImageObject", url: absolute("/og/peter.jpg"), width: 400, height: 400 },
  description:
    "Peter Hraska (virpo) has worked at Slido (part of Cisco) for over ten years, between product, design and engineering. He builds AI products, agent tools, physical objects and events, and writes about making real things with AI agents.",
  email: "mailto:peter@hraska.sk",
  knowsAbout: ["AI agents", "Claude Code", "Product design", "Prompting", "Gacha prompting", "3D printing", "Hackathons"],
  jobTitle: "Machine Learning Engineering Technical Leader",
  worksFor: { "@type": "Organization", name: "Slido (part of Cisco)", url: "https://www.slido.com/" },
  sameAs: SAME_AS,
};
