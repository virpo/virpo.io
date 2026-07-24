import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProjectsPage from "../../app/projects/page";
import { projects } from "../../lib/projects";

afterEach(cleanup);

function readImageDimensions(filename: string) {
  const data = readFileSync(filename);

  if (data.subarray(1, 4).toString("ascii") === "PNG") {
    return {
      width: data.readUInt32BE(16),
      height: data.readUInt32BE(20),
    };
  }

  expect(data.readUInt16BE(0)).toBe(0xffd8);
  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1];
    const segmentLength = data.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) {
      return {
        width: data.readUInt16BE(offset + 7),
        height: data.readUInt16BE(offset + 5),
      };
    }
    offset += 2 + segmentLength;
  }

  throw new Error(`No image dimensions found in ${filename}`);
}

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
        alt: expect.stringMatching(/\S/),
        width: expect.any(Number),
        height: expect.any(Number),
        fit: expect.stringMatching(/^(cover|contain)$/),
      });
      expect(
        readImageDimensions(resolve(process.cwd(), "public", project.image.src.slice(1))),
      ).toEqual({
        width: project.image.width,
        height: project.image.height,
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
      expect(image?.getAttribute("alt")?.trim()).not.toBe("");
      expect(image).toHaveAttribute("loading", index === 0 ? "eager" : "lazy");
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

  it("keeps the project archive at three, two, then one column", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(
      /\.projectGrid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*760px\)[\s\S]*?\.projectGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*440px\)[\s\S]*?\.projectGrid\s*\{[^}]*grid-template-columns:\s*1fr/,
    );
  });
});
