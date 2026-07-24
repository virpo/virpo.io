import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProjectsPage from "../../app/projects/page";
import { projects } from "../../lib/projects";

afterEach(cleanup);

describe("projects archive", () => {
  it("keeps all six real projects in typed data", () => {
    expect(projects).toHaveLength(6);
    expect(projects.map((project) => project.title)).toEqual([
      "YouTLDR",
      "Žltá stopa",
      "Mood Radio",
      "Pegboard Toy",
      "AI Build Week",
      "CMUX Deck",
    ]);

    for (const project of projects) {
      expect(project.href).toMatch(/^https:\/\//);
      expect(project.emoji).toMatch(/\S/u);
      expect(project.image).toMatchObject({
        src: expect.stringMatching(/^\/assets\/projects\//),
        alt: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
        fit: expect.stringMatching(/^(cover|contain)$/),
      });
    }
  });

  it("renders six linked cards with natural image dimensions and title/type only", () => {
    render(<ProjectsPage />);
    const cards = screen.getAllByTestId("project-card");

    expect(cards).toHaveLength(6);
    for (const [index, card] of cards.entries()) {
      const project = projects[index];
      const image = card.querySelector("img");

      expect(card).toHaveAttribute("href", project.href);
      expect(image).toHaveAttribute("src", project.image.src);
      expect(image).toHaveAttribute("width", String(project.image.width));
      expect(image).toHaveAttribute("height", String(project.image.height));
      expect(image).toHaveAttribute("alt", project.image.alt);
      expect(card.querySelector(".projectCopy")?.children).toHaveLength(2);
      expect(card).toHaveTextContent(project.title);
      expect(card).toHaveTextContent(project.type);
    }
  });

  it("identifies the projects route as current", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
