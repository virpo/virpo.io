import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
  vi.useRealTimers();
});

describe("WindowSeatToy", () => {
  it("keeps the train unloaded behind a still illustration for reduced motion", async () => {
    mockMatchMedia(true);
    render(<WindowSeatToy />);

    const frame = screen.getByTitle(/Japanese train window/i);
    await waitFor(() => expect(frame).toHaveAttribute("src", "about:blank"));
    expect(screen.getByTestId("window-seat-still")).toBeVisible();
    expect(screen.queryByTestId("youtube-startup-cover")).toBeNull();
  });

  it("uses supported embed parameters without overstating branding or caption control", async () => {
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
      ["rel", "0"],
      ["fs", "0"],
      ["disablekb", "1"],
    ]) {
      expect(src.searchParams.get(key)).toBe(value);
    }
    expect(src.searchParams.has("modestbranding")).toBe(false);
    expect(src.searchParams.has("cc_load_policy")).toBe(false);
    expect(frame).toHaveStyle({
      pointerEvents: "none",
      transform: "none",
    });
  });

  it("keeps the startup cover until iframe load plus its release buffer", async () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    render(<WindowSeatToy />);
    await act(async () => undefined);
    const frame = screen.getByTitle(/Japanese train window/i);

    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByTestId("youtube-startup-cover")).toBeVisible();

    fireEvent.load(frame);
    act(() => vi.advanceTimersByTime(1_199));
    expect(screen.getByTestId("youtube-startup-cover")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId("youtube-startup-cover")).toBeNull();
  });

  it("keeps Window Seat unzoomed with chrome and subtitle masks", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const start = css.indexOf(".windowSeatToy");
    const end = css.indexOf(".studyToy", start);
    const windowSeatCss = css.slice(start, end);

    mockMatchMedia(false);
    render(<WindowSeatToy />);
    expect(screen.getByTestId("youtube-mask-top")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-bottom")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-left")).toBeVisible();
    expect(screen.getByTestId("youtube-mask-right")).toBeVisible();
    expect(screen.getByTestId("youtube-subtitle-mask")).toBeVisible();
    expect(windowSeatCss).toMatch(
      /\.windowSeatVideo\s*\{[^}]*pointer-events:\s*none;[^}]*transform:\s*none;/s,
    );
    expect(windowSeatCss).toMatch(
      /\.windowSeatSubtitleMask\s*\{[^}]*inset:\s*auto 6% 0;[^}]*height:\s*34%;/s,
    );
    expect(windowSeatCss).not.toMatch(/windowSeatStartupReveal/);
    expect(windowSeatCss).not.toMatch(/\bscale\s*\(|\bzoom\s*:/);
  });
});
