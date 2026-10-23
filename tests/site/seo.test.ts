import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));

import { metadata as rootMetadata } from "../../app/layout";
import { GET as llms } from "../../app/llms.txt/route";
import { metadata as projectsMetadata } from "../../app/projects/page";
import { buildSitemap } from "../../app/sitemap";
import { metadata as v2Metadata } from "../../app/v2/page";
import { getPostSummaries } from "../../lib/blog";
import { OG_VIDEO, pageMeta } from "../../lib/site";

describe("site-wide SEO", () => {
  it("names the site after Peter, with a large preview image and the torii favicon", () => {
    expect(rootMetadata.metadataBase?.toString()).toBe("https://virpo.io/");
    expect(rootMetadata.title).toMatchObject({ default: "Peter Hraska", template: "%s · Peter Hraska" });
    expect(rootMetadata.twitter).toMatchObject({ card: "summary_large_image", creator: "@virpo" });
    expect(JSON.stringify(rootMetadata.icons)).toContain("/lab/room/brand/icon-32.png");
    // URL-specific tags belong to each page, not the root
    expect(rootMetadata.alternates?.canonical).toBeUndefined();
  });

  it("gives every page matching preview tags", () => {
    const meta = pageMeta({ title: "Writing", description: "d", path: "/blog/" });
    expect(meta.openGraph).toMatchObject({ url: "/blog/", title: "Writing · Peter Hraska" });
    expect(meta.twitter).toMatchObject({ title: "Writing · Peter Hraska", card: "summary_large_image" });
    expect(OG_VIDEO.url).toMatch(/^https:\/\/virpo\.io\//);
  });

  it("keeps the old URLs working as redirects whose canonical is the home page", () => {
    for (const meta of [projectsMetadata, v2Metadata]) {
      // no noindex next to a canonical: Google reads the pair as contradictory
      expect(meta.robots).toBeUndefined();
      expect(meta.alternates?.canonical).toBe("/");
    }
  });

  it("lists the live pages in the sitemap, not the redirects", () => {
    const urls = buildSitemap(getPostSummaries()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining(["https://virpo.io/", "https://virpo.io/blog/", "https://virpo.io/skills/", "https://virpo.io/levels/"]));
    expect(urls).not.toContain("https://virpo.io/projects/");
  });

  it("serves llms.txt for answer engines, with every post and project", async () => {
    const text = await llms().text();
    expect(text).toMatch(/^# Peter Hraska/);
    for (const post of getPostSummaries()) expect(text).toContain(`https://virpo.io/blog/${post.slug}/`);
    expect(text).toContain("https://virpo.io/levels/");
    expect(text).toContain("Bratislava Slush’D");
  });
});
