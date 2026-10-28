import {
  getLatestPostDate,
  getPostSummaries,
  type PostSummary,
} from "../../lib/blog";

const SITE_URL = "https://virpo.io";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const dynamic = "force-static";

export function buildRss(posts: PostSummary[]) {
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}/`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(post.description)}</description>`,
        `      <pubDate>${post.publishedAt.toUTCString()}</pubDate>`,
        "      <dc:creator>Peter Hraska</dc:creator>",
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const latestPostDate = getLatestPostDate(posts);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    "    <title>Peter Hraska (virpo): writing</title>",
    `    <link>${SITE_URL}/blog/</link>`,
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
    "    <description>Short notes from Peter Hraska about making real things.</description>",
    ...(latestPostDate
      ? [`    <lastBuildDate>${latestPostDate.toUTCString()}</lastBuildDate>`]
      : []),
    "    <language>en</language>",
    `    <image><url>${SITE_URL}/og/peter.jpg</url><title>Peter Hraska (virpo): writing</title><link>${SITE_URL}/blog/</link></image>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export function GET() {
  return new Response(buildRss(getPostSummaries()), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
