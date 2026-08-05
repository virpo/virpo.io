import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "../../app/page";

afterEach(cleanup);

describe("homepage", () => {
  it("keeps the required mobile content order in the document", () => {
    const { container } = render(<HomePage />);
    const orderedLabels = [
      "Peter's interactive face",
      "About Peter",
      "Japan Sounds",
      "Window Seat",
      "Japanese Study",
      "Latest writing",
    ];

    const sections = orderedLabels.map((label) =>
      container.querySelector(`[aria-label="${label}"]`),
    );

    expect(sections.every(Boolean)).toBe(true);
    for (let index = 1; index < sections.length; index += 1) {
      expect(
        sections[index - 1]?.compareDocumentPosition(sections[index] as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("renders the accurate short introduction and only profile icon links", () => {
    render(<HomePage />);
    const intro = screen.getByLabelText("About Peter");

    expect(
      within(intro).getByText(
        /I like living somewhere between product, design, and engineering/i,
      ),
    ).toBeVisible();
    expect(
      within(intro).getByText(
        /I’ve been doing that at Slido for 10\+ years\. Since 2021, we’ve been part of Cisco\. Sometimes it’s a product, sometimes a tool, sometimes a toy\./i,
      ),
    ).toBeVisible();
    expect(within(intro).getAllByRole("link").map((link) => link.getAttribute("aria-label"))).toEqual([
      "GitHub",
      "Instagram",
      "LinkedIn",
      "X",
      "Email",
    ]);
  });

  it("renders three rich writing previews with real excerpts and article routes", () => {
    render(<HomePage />);
    const writing = screen.getByRole("region", { name: "Latest writing" });
    const previews = within(writing).getAllByRole("article");

    expect(previews).toHaveLength(3);
    expect(within(writing).getByText(/teams shipped working products/i)).toBeVisible();
    for (const preview of previews) {
      expect(within(preview).getByText(/min read/i)).toBeVisible();
      expect(preview.closest("a")).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/blog\/[^#]+\/?$/),
      );
      expect(within(preview).queryByRole("link")).toBeNull();
      expect(within(preview).queryByText(/^Read$/)).toBeNull();
      expect(within(preview).getByTestId("v2-writing-excerpt").textContent?.length).toBeGreaterThan(70);
    }
  });

  it("uses the playful display face throughout homepage content", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const homepageCss = css.slice(0, css.indexOf(".blogIndex"));

    expect(homepageCss).not.toMatch(/font-family:\s*Arial,\s*Helvetica/);
    expect(homepageCss).not.toMatch(/font-family:\s*var\(--font-(?:fraunces|source-serif)\)/);
  });

  it("keeps projects on their own page behind a compact writing link", () => {
    const { container } = render(<HomePage />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });

    expect(container.querySelectorAll(".projectCard")).toHaveLength(0);
    expect(within(primaryNav).getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/projects\/?$/),
    );
  });

  it("preserves the finished toy order", () => {
    const { container } = render(<HomePage />);
    const toys = container.querySelector("[data-v2-toys]");

    expect(container.querySelector("[data-sounds-toy]")).toBeVisible();
    expect(container.querySelector("[data-window-seat-toy]")).toBeVisible();
    expect(container.querySelector("[data-study-toy]")).toBeVisible();
    expect(
      Array.from(toys?.querySelectorAll("[data-v2-toy]") ?? [], (toy) =>
        toy.getAttribute("data-v2-toy"),
      ),
    ).toEqual([
      "radio",
      "window-seat",
      "study",
    ]);
  });

  it("renders the finished media toys", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/page.tsx"),
      "utf8",
    );

    expect(source).toContain('from "./v2/page"');
  });
});
