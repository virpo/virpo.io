import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildRss, GET as getRss } from "../../app/rss.xml/route";
import robots, { dynamic as robotsDynamic } from "../../app/robots";
import sitemap, {
  buildSitemap,
  dynamic as sitemapDynamic,
} from "../../app/sitemap";
import { ArticleFooter } from "../../components/blog/ArticleFooter";
import { compilePostMdx } from "../../components/blog/mdx-components";
import { getPost, getPostSummaries } from "../../lib/content/posts";
import { parseFrontmatter } from "../../lib/content/schema";

describe("post frontmatter", () => {
  it("rejects missing SEO frontmatter", () => {
    expect(() => parseFrontmatter({ title: "Only a title" })).toThrow();
  });

  it("coerces dates and applies the published default", () => {
    const frontmatter = parseFrontmatter({
      title: "A complete post",
      description: "A concrete description long enough for a useful search result.",
      publishedAt: "2026-07-23",
      tags: ["Making"],
    });

    expect(frontmatter.publishedAt).toBeInstanceOf(Date);
    expect(frontmatter.draft).toBe(false);
  });

  it.each([
    "https://example.com/image.png",
    "//example.com/image.png",
    "/\\evil.example/image.png",
  ])(
    "rejects non-local social image %s",
    (socialImage) => {
      expect(() =>
        parseFrontmatter({
          title: "A complete post",
          description: "A concrete description long enough for a useful search result.",
          publishedAt: "2026-07-23",
          tags: ["Making"],
          socialImage,
        }),
      ).toThrow();
    },
  );
});

describe("article discovery", () => {
  it("renders the three quiet continuation links", () => {
    render(ArticleFooter());

    expect(screen.getByRole("link", { name: "More writing" })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "Toys" })).toHaveAttribute("href", "/#toys");
  });

  it("publishes every article in RSS and the sitemap", async () => {
    const rss = await (await getRss()).text();
    const urls = sitemap().map((entry) => entry.url);

    for (const slug of [
      "weird-use-of-ai-3",
      "weird-use-of-ai-1",
      "a-different-kind-of-hackathon",
    ]) {
      const url = `https://virpo.io/blog/${slug}/`;
      expect(rss).toContain(url);
      expect(urls).toContain(url);
    }
  });

  it("uses the newest publish or update date across all posts for aggregate feeds", () => {
    const [first, second] = getPostSummaries();
    const posts = [
      {
        ...first,
        publishedAt: new Date("2026-07-24T00:00:00.000Z"),
        updatedAt: undefined,
      },
      {
        ...second,
        publishedAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-08-10T00:00:00.000Z"),
      },
    ];
    const newest = new Date("2026-08-10T00:00:00.000Z");
    const aggregateEntries = buildSitemap(posts).filter(({ url }) =>
      ["/", "/blog/"].some((pathname) => url === `https://virpo.io${pathname}`),
    );

    expect(buildRss(posts)).toContain(
      `<lastBuildDate>${newest.toUTCString()}</lastBuildDate>`,
    );
    expect(aggregateEntries).toHaveLength(2);
    expect(
      aggregateEntries.every(
        ({ lastModified }) => new Date(lastModified ?? 0).getTime() === newest.getTime(),
      ),
    ).toBe(true);
  });

  it("allows indexing and points crawlers to the sitemap", () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://virpo.io/sitemap.xml",
    });
  });

  it("marks generated metadata routes as static-export compatible", () => {
    expect(robotsDynamic).toBe("force-static");
    expect(sitemapDynamic).toBe("force-static");
  });

  it("keeps controlled object props on paired MDX images", async () => {
    const { content } = await compilePostMdx(getPost("weird-use-of-ai-1").source);
    render(content);

    expect(screen.getByAltText("Peter's rough pegboard toy sketch")).toHaveAttribute(
      "src",
      "/assets/blog/pegboard-sketch.jpg",
    );
    expect(screen.getByAltText("Oli playing with the finished colorful pegboard toy")).toBeVisible();
  });
});
