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
    expect(styles).toMatch(
      /\.masthead\s+:global\(\.bloomTicker\)\s*{[^}]*grid-column:\s*auto/s,
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
    expect(styles).toMatch(
      /\.radio\s+:global\(\.soundsToy\)\s*{[^}]*--radio-screen-x:\s*44\.1%[^}]*--radio-screen-y:\s*37%[^}]*--radio-screen-width:\s*31\.4%/s,
    );
    expect(styles).toMatch(
      /\.radio\s+:global\(\.soundDisplay\)\s*{[^}]*top:\s*var\(--radio-screen-y\)[^}]*left:\s*var\(--radio-screen-x\)[^}]*width:\s*var\(--radio-screen-width\)/s,
    );
    expect(styles).toMatch(
      /\.radio\s+:global\(\.soundDisplay \.soundWaveform\)\s*{[^}]*inset:[^}]*width:\s*100%/s,
    );
    expect(styles).toMatch(
      /\.window\s+:global\(\.windowSeatVideo\)\s*{[^}]*top:\s*57\.5%[^}]*height:\s*136%/s,
    );
    expect(styles).toMatch(
      /\.window\s+:global\(\.windowSeatScene\)\s*{[^}]*position:\s*absolute[^}]*top:\s*50%[^}]*left:\s*50%[^}]*width:\s*122%[^}]*height:\s*100%[^}]*aspect-ratio:\s*auto[^}]*transform:\s*translate\(-50%,\s*-50%\)/s,
    );
    expect(styles).toMatch(
      /\.window\s+:global\(\.windowSeatArt\)\s*{[^}]*object-fit:\s*fill/s,
    );
    expect(styles).toMatch(
      /\.window\s+:global\(\.windowSeatCompassMask\)\s*{[^}]*background-size:\s*100%\s+100%/s,
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
    const sounds = within(
      screen.getByRole("region", { name: "Small Japan toys" }),
    ).getByRole("region", { name: "Japan Sounds" });
    const display = sounds.querySelector("[data-sound-display]");
    expect(display).toContainElement(
      within(sounds).getByRole("img", { name: "Sound waveform" }),
    );
    expect(display).not.toContainElement(
      within(sounds).getByRole("button", { name: "Next sound" }),
    );
    expect(within(screen.getByRole("region", { name: "Small Japan toys" })).getByText("Click me")).toBeVisible();
  });

  it("frames each toy outside the artwork with its own accent", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "app/v2/v2.module.css"),
      "utf8",
    );

    expect(styles).toMatch(
      /\.radio,\s*\.window,\s*\.study\s*{[^}]*padding:\s*0[^}]*overflow:\s*hidden[^}]*border:\s*3px solid[^}]*border-radius:\s*calc\(var\(--v2-radius\) \+ 3px\)/s,
    );
    expect(styles).toMatch(
      /\.radio\s*{[^}]*border-color:\s*var\(--v2-radio-border\)/s,
    );
    expect(styles).toMatch(
      /\.window\s*{[^}]*border-color:\s*var\(--v2-window-border\)/s,
    );
    expect(styles).toMatch(
      /\.study\s*{[^}]*border-color:\s*var\(--v2-study-border\)/s,
    );
    expect(styles).toMatch(
      /\.radio\s+:global\(\.soundsToy\),\s*\.study\s+:global\(\.studyToy\),\s*\.window\s+:global\(\.windowSeatToy\)\s*{[^}]*border-radius:\s*0/s,
    );
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
      /\.study\s+:global\(\.studyBack\)\s*{[^}]*border:\s*2px\s+solid\s+var\(--v2-ink\)[^}]*border-radius:\s*50%/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyBack span\)\s*{[^}]*background:\s*url\("\/assets\/v2\/back-pixel\.svg"\)/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyToy\)\s*{[^}]*--study-page-x:\s*7%[^}]*--study-page-y:\s*13%[^}]*--study-page-width:\s*70%[^}]*--study-page-height:\s*65%/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyCard\)\s*{[^}]*top:\s*var\(--study-page-y\)[^}]*left:\s*var\(--study-page-x\)[^}]*width:\s*var\(--study-page-width\)[^}]*height:\s*var\(--study-page-height\)/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyCard > strong\)\s*{[^}]*18cqw/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyCard\[aria-expanded="true"\]\)\s*{[^}]*row-gap:\s*clamp\(0\.45rem,\s*1\.1cqw,\s*0\.8rem\)/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyReading\)\s*{[^}]*font-size:\s*clamp\(0\.82rem,\s*1\.3vw,\s*1\.05rem\)[^}]*line-height:\s*1\.15/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyActions\)\s*{[^}]*top:\s*64%/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyStatusLine\)\s*{[^}]*left:\s*12\.5%[^}]*width:\s*47%/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyStatusLine progress::-webkit-progress-bar\)\s*{[^}]*background:\s*#f8e2a3/s,
    );
    expect(styles).toMatch(
      /\.study\s+:global\(\.studyCard:hover\)\s*{[^}]*background:\s*transparent/s,
    );
    expect(styles).toMatch(/\.intro\s*{[^}]*height:\s*460px/s);
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*820px\)[\s\S]*?\.intro\s*{[^}]*height:\s*auto/s,
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
    const bloomImages = Array.from(
      list.querySelectorAll<HTMLImageElement>(".bloomSeasonEmoji img"),
    );
    expect(bloomImages).toHaveLength(4);
    expect(
      bloomImages.every((image) =>
        image.getAttribute("src")?.startsWith("/assets/v2/blooms/"),
      ),
    ).toBe(true);
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
      writing.querySelector('[data-v2-writing-featured="true"]'),
    ).toContainElement(articles[0]);
    expect(within(articles[0]).getByText("Newest")).toBeVisible();
    expect(writing.querySelector("img")).not.toBeInTheDocument();
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

  it("shows Peter's social links as accessible icons in the intended order", () => {
    render(<HomePageV2 />);

    const elsewhere = screen.getByLabelText("Peter elsewhere");
    const links = within(elsewhere).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "GitHub",
      "Instagram",
      "LinkedIn",
      "X",
      "Email",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://github.com/virpo",
      "https://www.instagram.com/virpo.san/",
      "https://www.linkedin.com/in/hraska/",
      "https://x.com/virpo",
      "mailto:peter@hraska.sk",
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("title", link.getAttribute("aria-label"));
      expect(link).toHaveTextContent("");
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
  });
});
