import { describe, expect, it } from "vitest";
import { getPost, getPostSlugs, getPostSummaries } from "../../lib/content/posts";

describe("blog posts", () => {
  it("discovers three published posts in stable reverse authored order", async () => {
    const posts = await getPostSummaries();

    expect(posts).toHaveLength(3);
    expect(posts.map((post) => post.slug)).toEqual([
      "weird-use-of-ai-3",
      "weird-use-of-ai-1",
      "a-different-kind-of-hackathon",
    ]);
    expect(getPostSlugs()).toEqual(posts.map((post) => post.slug));
  });

  it("returns validated source and a useful reading time", async () => {
    const post = await getPost("a-different-kind-of-hackathon");

    expect(post.frontmatter.title).toBe("A different kind of hackathon");
    expect(post.frontmatter.publishedAt).toBeInstanceOf(Date);
    expect(post.readingTime.minutes).toBeGreaterThanOrEqual(1);
    expect(post.source).toContain("earned its first\neuro within two weeks");
  });

  it("rejects unknown slugs", () => {
    expect(() => getPost("not-a-post")).toThrow(/not found/i);
  });
});
