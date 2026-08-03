import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePageV2 from "../../app/v2/page";
import { V2Masthead } from "../../components/v2/V2Masthead";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("homepage v2", () => {
  it("lives on a separate route without replacing the original homepage", () => {
    const original = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");

    expect(original).toContain('className="homeBento"');
    expect(existsSync(resolve(process.cwd(), "app/v2/page.tsx"))).toBe(true);
  });

  it("lays the three toys out as one desktop row beneath the hero", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "app/v2/v2.module.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /\.toyGrid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(styles).toMatch(
      /\.toys\s*{[^}]*padding:\s*var\(--v2-gap\)\s+0\s+0[^}]*border-radius:\s*var\(--v2-radius\)/s,
    );
    expect(styles).toMatch(
      /\.writing\s*{[^}]*border-radius:\s*var\(--v2-radius\)[^}]*overflow:\s*hidden/s,
    );
  });

  it("keeps compact toy labels inside their generated artwork", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "app/v2/v2.module.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /\.study\s+:global\(\.studyHeading h2\)\s*{[^}]*display:\s*none/s,
    );
    expect(styles).toContain("font-size: clamp(0.42rem, 0.6vw, 0.58rem)");
    expect(styles).toMatch(
      /\.radio\s+:global\(\.soundMeta\)\s*{[^}]*top:\s*34%/s,
    );
    expect(styles).toMatch(
      /\.radio\s+:global\(\.soundWaveform\)\s*{[^}]*top:\s*43%/s,
    );
    expect(styles).toMatch(
      /\.window\s+:global\(\.windowSeatVideo\)\s*{[^}]*top:\s*57\.5%[^}]*height:\s*136%/s,
    );
  });

  it("starts directly with the toys, removes the Window Seat caption, and aligns radio controls", () => {
    const { container } = render(<HomePageV2 />);
    const styles = readFileSync(
      resolve(process.cwd(), "app/v2/v2.module.css"),
      "utf8",
    );

    expect(container.querySelector("[data-v2-daruma]")).not.toBeInTheDocument();
    expect(screen.queryByText("Small Japan toys")).not.toBeInTheDocument();
    expect(styles).toMatch(
      /\.toys\s*{[^}]*padding:\s*var\(--v2-gap\)\s+0\s+0/s,
    );
    expect(styles).toMatch(
      /\.window\s+:global\(\.windowSeatHeading\)\s*{[^}]*display:\s*none/s,
    );
    expect(styles).toContain("top: 60.7%");
    expect(styles).toContain("left: 10%");
    expect(within(screen.getByRole("region", { name: "Small Japan toys" })).getByText("Click me")).toBeVisible();
  });

  it("keeps the Study chrome quiet and the desktop hero tiles equal-height", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "app/v2/v2.module.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /\.study\s+:global\(\.studyHeadingTools\s*>\s*span\)\s*{[^}]*display:\s*none/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyReset\)\s*{[^}]*border:\s*2px\s+solid\s+var\(--v2-ink\)[^}]*border-radius:\s*50%/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyReset span\)\s*{[^}]*background:\s*url\("\/assets\/v2\/reset-pixel\.svg"\)/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyCard:hover\)\s*{[^}]*background:\s*transparent/s,
    );
    expect(styles).toMatch(/\.intro\s*{[^}]*height:\s*460px/s);
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*980px\)[\s\S]*?\.intro\s*{[^}]*height:\s*auto/s,
    );
  });

  it("shows a fuller bloom list in the v2 disclosure", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T00:00:00Z"));
    render(<V2Masthead />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open Japan bloom details" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Japan bloom details" });
    const list = within(dialog).getByRole("list", {
      name: "What is blooming in Japan",
    });

    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(within(list).getByText("Sunflowers")).toBeVisible();
    expect(within(list).getByText("Cosmos")).toBeVisible();
  });

  it("makes Peter, the Japan toys, and worthwhile writing obvious", () => {
    const { container } = render(<HomePageV2 />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /product engineer from Slovakia\. I make products and small tools/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/Working at Slido for 10\+ years now/i),
    ).toBeVisible();

    const hero = container.querySelector("[data-v2-hero]");
    expect(hero).toBeVisible();
    expect(
      hero?.querySelector('[aria-label="Peter\'s interactive face"]'),
    ).toBeVisible();

    const toys = screen.getByRole("region", { name: "Small Japan toys" });
    expect(
      Array.from(toys.querySelectorAll("[data-v2-toy]"), (toy) =>
        toy.getAttribute("data-v2-toy"),
      ),
    ).toEqual(["radio", "window-seat", "study"]);
    expect(within(toys).getByRole("button", { name: /Play FamilyMart welcome/i })).toBeVisible();
    expect(within(toys).getByRole("button", { name: /Reveal answer/i })).toBeVisible();

    const writing = screen.getByRole("region", { name: "Latest writing" });
    const articles = within(writing).getAllByRole("article");
    expect(articles).toHaveLength(3);
    expect(
      within(writing).getByRole("heading", {
        name: /Detective skills for journalists/i,
      }),
    ).toBeVisible();
    for (const article of articles) {
      expect(article.closest("a")).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/blog\/[^#]+\/?$/),
      );
      expect(within(article).getByTestId("v2-writing-excerpt")).toBeVisible();
    }
  });
});
