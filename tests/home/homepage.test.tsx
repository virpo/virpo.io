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
      "Familiar Japanese Sounds",
      "Window Seat",
      "Japanese Study",
      "About Peter",
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
    const intro = screen.getByRole("region", { name: "About Peter" });

    expect(within(intro).getByText(/product engineer from Slovakia/i)).toBeVisible();
    expect(within(intro).getByText(/Slido was acquired by Cisco/i)).toBeVisible();
    expect(within(intro).getByText(/products and small tools/i)).toBeVisible();
    expect(within(intro).getAllByRole("link").map((link) => link.getAttribute("aria-label"))).toEqual([
      "LinkedIn",
      "GitHub",
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
      expect(within(preview).getByRole("link", { name: /read/i })).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/blog\/[^#]+\/?$/),
      );
      expect(within(preview).getByTestId("writing-excerpt").textContent?.length).toBeGreaterThan(70);
    }
  });

  it("keeps projects on their own page behind a compact writing link", () => {
    const { container } = render(<HomePage />);
    const writing = screen.getByRole("region", { name: "Latest writing" });

    expect(container.querySelectorAll(".projectCard")).toHaveLength(0);
    expect(within(writing).getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/projects\/?$/),
    );
  });

  it("preserves the finished toy order", () => {
    const { container } = render(<HomePage />);
    const toyRail = container.querySelector(".toyRail");

    expect(container.querySelector("[data-sounds-toy]")).toBeVisible();
    expect(container.querySelector("[data-window-seat-toy]")).toBeVisible();
    expect(container.querySelector("[data-study-toy]")).toBeVisible();
    expect(
      Array.from(toyRail?.children ?? [], (child) =>
        child.getAttribute("aria-label"),
      ),
    ).toEqual([
      "Peter's interactive face",
      "Familiar Japanese Sounds",
      "Window Seat",
      "Japanese Study",
    ]);
  });

  it("renders the finished media toys", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/page.tsx"),
      "utf8",
    );

    expect(source).toContain("<SoundsToy />");
    expect(source).toContain("<WindowSeatToy />");
  });
});
