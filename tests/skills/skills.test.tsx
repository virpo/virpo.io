import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SkillsPage, { metadata } from "../../app/(room)/skills/page";
import RoomPage from "../../app/(room)/page";
import { installCommand, skills, sourceUrl } from "../../lib/skills";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("skills page", () => {
  it("keeps the skills in one data list", () => {
    expect(skills.map((skill) => skill.name)).toEqual([
      "Sell My Stuff",
      "Look Hard",
      "Blast Radius Buddy",
    ]);
    expect(installCommand(skills[1])).toBe(
      "npx skills add virpo/agent-skills --skill look-hard",
    );
    expect(sourceUrl(skills[2])).toBe(
      "https://github.com/virpo/agent-skills/tree/main/skills/blast-radius-buddy",
    );
  });

  it("uses plain copy without em dashes", () => {
    const text = JSON.stringify(skills) + String(metadata.description);
    expect(text).not.toMatch(/[—–]/);
  });

  it("renders each skill with an install command, copy button, and GitHub link", () => {
    render(<SkillsPage />);
    const items = screen.getAllByTestId("skill");

    expect(items).toHaveLength(skills.length);
    for (const [index, item] of items.entries()) {
      const skill = skills[index];
      expect(item).toHaveTextContent(skill.emoji);
      expect(item).toHaveTextContent(skill.name);
      expect(item).toHaveTextContent(skill.summary);
      expect(item.querySelector("code")).toHaveTextContent(installCommand(skill));
      expect(
        screen.getByRole("button", { name: `Copy ${skill.name} install command` }),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: `GitHub source for ${skill.name}` }),
      ).toHaveAttribute("href", sourceUrl(skill));
    }
    expect(screen.getByText("Sold €1,059 of my stuff so far.")).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("copies the install command", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<SkillsPage />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy Look Hard install command" }),
      );
    });

    expect(writeText).toHaveBeenCalledWith(
      "npx skills add virpo/agent-skills --skill look-hard",
    );
    expect(
      screen.getByRole("button", { name: "Copied Look Hard install command" }),
    ).toHaveTextContent("Copied");
  });

  it("is linked from the About section of the home page", () => {
    render(<RoomPage />);
    expect(screen.getByRole("link", { name: "Agent skills" })).toHaveAttribute("href", expect.stringMatching(/^\/skills\/?$/));
  });
});
