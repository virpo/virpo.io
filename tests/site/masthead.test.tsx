import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Masthead } from "../../components/site/Masthead";
import { SiteShell } from "../../components/site/SiteShell";
import { BloomTicker } from "../../components/site/BloomTicker";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("renders the shared virpo navigation and current route", () => {
  render(<Masthead current="blog" />);

  expect(screen.getByRole("link", { name: "Virpo home" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Projects" })).toBeVisible();
  expect(screen.getByRole("link", { name: "About" })).toBeVisible();
});

it("wraps page content with the shared masthead and footer", () => {
  const { container } = render(
    <SiteShell current="projects">
      <h1>Projects</h1>
    </SiteShell>,
  );

  expect(screen.getByRole("heading", { name: "Projects" })).toBeVisible();
  expect(screen.getByRole("contentinfo")).toHaveTextContent("Peter Hraska · Slovakia");
  const shell = container.querySelector(".siteShell");
  expect(shell?.children[0]?.tagName).toBe("HEADER");
  expect(shell?.children[1]?.tagName).toBe("MAIN");
  expect(shell?.children[2]?.tagName).toBe("FOOTER");
  expect(screen.getByRole("main")).toContainElement(
    screen.getByRole("heading", { name: "Projects" }),
  );
});

describe("bloom disclosure", () => {
  it("includes the visible bloom summary in the trigger's accessible name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T00:00:00Z"));
    render(<Masthead current="home" />);

    const trigger = screen.getByRole("button", {
      name: /Open Japan bloom details/i,
    });
    expect(trigger).not.toHaveAttribute("aria-label");
    expect(trigger).toHaveAccessibleName(
      /Blooming (now|next).*Lotus.*Open Japan bloom details/i,
    );
  });

  it("does not build the seasonal image list until bloom details open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T00:00:00Z"));
    const { container } = render(<BloomTicker showSeasonList pixelArt />);

    expect(container.querySelector(".bloomSeasonList")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /Open Japan bloom details/i }),
    );
    expect(container.querySelector(".bloomSeasonList")).toBeInTheDocument();
  });

  it("uses the cohesive pixel flower set when requested", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T00:00:00Z"));
    const { container } = render(<Masthead current="home" />);

    expect(container.querySelector(".bloomEmoji img")).not.toBeInTheDocument();
  });

  it("opens on mouse hover and closes shortly after the pointer leaves", () => {
    vi.useFakeTimers();
    render(<Masthead current="home" />);
    const module = screen.getByLabelText("Tokyo time and seasonal bloom");
    const trigger = screen.getByRole("button", { name: /Open Japan bloom details/i });
    const pointerOver = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(pointerOver, "pointerType", { value: "mouse" });

    fireEvent(trigger, pointerOver);
    act(() => vi.advanceTimersByTime(140));
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Japan bloom details" })).toBeVisible();

    const pointerOut = new MouseEvent("pointerout", { bubbles: true });
    Object.defineProperty(pointerOut, "pointerType", { value: "mouse" });
    fireEvent(module, pointerOut);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    act(() => vi.advanceTimersByTime(160));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open while the pointer crosses the gap into bloom details", () => {
    vi.useFakeTimers();
    render(<Masthead current="home" />);
    const module = screen.getByLabelText("Tokyo time and seasonal bloom");
    const trigger = screen.getByRole("button", { name: /Open Japan bloom details/i });
    const pointerOver = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(pointerOver, "pointerType", { value: "mouse" });

    fireEvent(trigger, pointerOver);
    act(() => vi.advanceTimersByTime(140));

    const pointerOut = new MouseEvent("pointerout", { bubbles: true });
    Object.defineProperty(pointerOut, "pointerType", { value: "mouse" });
    fireEvent(module, pointerOut);
    act(() => vi.advanceTimersByTime(80));

    const pointerBack = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(pointerBack, "pointerType", { value: "mouse" });
    fireEvent(screen.getByRole("dialog", { name: "Japan bloom details" }), pointerBack);
    act(() => vi.advanceTimersByTime(160));

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape from Source and returns focus without reopening", () => {
    render(<Masthead current="home" />);
    const trigger = screen.getByRole("button", { name: /Open Japan bloom details/i });

    fireEvent.focus(trigger);
    const source = screen.getByRole("link", { name: "Source" });
    source.focus();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Source" })).not.toBeInTheDocument();
  });

  it("toggles on click and closes on an outside pointer press", () => {
    render(
      <div>
        <Masthead current="projects" />
        <button type="button">Outside</button>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /Open Japan bloom details/i });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
