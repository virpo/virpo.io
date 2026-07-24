import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WindowSeatToy } from "../../components/toys/WindowSeatToy";

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WindowSeatToy", () => {
  it("keeps the train unloaded behind a still illustration for reduced motion", async () => {
    mockMatchMedia(true);
    render(<WindowSeatToy />);

    const frame = screen.getByTitle(/Japanese train window/i);
    await waitFor(() => expect(frame).toHaveAttribute("src", "about:blank"));
    expect(screen.getByTestId("window-seat-still")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-top")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-bottom")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-left")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-right")).toBeVisible();
    expect(screen.queryByTestId("youtube-startup-cover")).toBeNull();
  });

  it("loads a private, autonomous, non-interactive YouTube embed without zoom", async () => {
    mockMatchMedia(false);
    render(<WindowSeatToy />);

    const frame = screen.getByTitle(/Japanese train window/i);
    await waitFor(() =>
      expect(frame.getAttribute("src")).toContain(
        "youtube-nocookie.com/embed/RMpM2Qu3QC8",
      ),
    );
    const src = new URL(frame.getAttribute("src") ?? "");

    for (const [key, value] of [
      ["autoplay", "1"],
      ["mute", "1"],
      ["loop", "1"],
      ["playlist", "RMpM2Qu3QC8"],
      ["controls", "0"],
      ["modestbranding", "1"],
      ["rel", "0"],
      ["fs", "0"],
      ["disablekb", "1"],
      ["cc_load_policy", "0"],
    ]) {
      expect(src.searchParams.get(key)).toBe(value);
    }
    expect(frame).toHaveStyle({
      pointerEvents: "none",
      transform: "none",
    });
    expect(screen.getByTestId("youtube-startup-cover")).toBeVisible();
  });

  it("keeps Window Seat CSS free of scale and zoom while preserving all masks", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const start = css.indexOf(".windowSeatToy");
    const end = css.indexOf(".studyToy", start);
    const windowSeatCss = css.slice(start, end);

    expect(windowSeatCss).toMatch(
      /\.windowSeatVideo\s*\{[^}]*pointer-events:\s*none;[^}]*transform:\s*none;/s,
    );
    expect(windowSeatCss).toMatch(/\.windowSeatMask--top/s);
    expect(windowSeatCss).toMatch(/\.windowSeatMask--bottom/s);
    expect(windowSeatCss).toMatch(/\.windowSeatMask--left/s);
    expect(windowSeatCss).toMatch(/\.windowSeatMask--right/s);
    expect(windowSeatCss).toMatch(
      /\.windowSeatStartupCover\s*\{[^}]*animation:\s*windowSeatStartupReveal 4\.2s steps\(1,\s*end\) forwards;/s,
    );
    expect(windowSeatCss).toMatch(
      /\.windowSeatToy\[data-reduced-motion="true"\] \.windowSeatVideo\s*\{[^}]*visibility:\s*hidden;/s,
    );
    expect(windowSeatCss).not.toMatch(/\bscale\s*\(|\bzoom\s*:/);
  });
});
