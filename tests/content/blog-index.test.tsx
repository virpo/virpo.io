import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import BlogPage from "../../app/blog/page";

afterEach(cleanup);

describe("blog index", () => {
  it("makes every complete post row one link without nested links", () => {
    render(<BlogPage />);

    const posts = screen.getAllByRole("article");
    expect(posts).toHaveLength(3);

    for (const post of posts) {
      const link = post.closest("a");
      expect(link).toHaveClass("blogListLink");
      expect(link).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/blog\/[^/]+\/?$/),
      );
      expect(within(post).queryByRole("link")).toBeNull();
      expect(within(post).getByRole("heading", { level: 2 })).toBeVisible();
      expect(within(post).getByRole("list")).toBeVisible();
    }
  });
});
