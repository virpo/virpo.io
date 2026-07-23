import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GET as getRss } from "../../app/rss.xml/route";
import robots, { dynamic as robotsDynamic } from "../../app/robots";
import sitemap, { dynamic as sitemapDynamic } from "../../app/sitemap";
import { ArticleFooter } from "../../components/blog/ArticleFooter";
import { compilePostMdx } from "../../components/blog/mdx-components";
import { getPost } from "../../lib/content/posts";
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

  it("requires local social images", () => {
    expect(() =>
      parseFrontmatter({
        title: "A complete post",
        description: "A concrete description long enough for a useful search result.",
        publishedAt: "2026-07-23",
        tags: ["Making"],
        socialImage: "https://example.com/image.png",
      }),
    ).toThrow();
  });
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
