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

function mockLoadingSignals() {
  let intersectionCallback: IntersectionObserverCallback | undefined;
  let idleCallback: IdleRequestCallback | undefined;
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "600px 0px";
    readonly thresholds = [0];

    constructor(callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
    }

    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
    unobserve = vi.fn();
  }
  const observer = new MockIntersectionObserver(() => undefined);

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  vi.stubGlobal(
    "requestIdleCallback",
    vi.fn((callback: IdleRequestCallback) => {
      idleCallback = callback;
      return 1;
    }),
  );
  vi.stubGlobal("cancelIdleCallback", vi.fn());

  return {
    setNearViewport(isIntersecting: boolean) {
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting } as IntersectionObserverEntry],
          observer,
        );
      });
    },
    runIdle() {
      act(() => {
        idleCallback?.({
          didTimeout: false,
          timeRemaining: () => 50,
        });
      });
    },
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("WindowSeatToy", () => {
  it("keeps the train unloaded behind a still illustration for reduced motion", async () => {
    mockMatchMedia(true);
    const loading = mockLoadingSignals();
    render(<WindowSeatToy />);

    loading.setNearViewport(true);
    loading.runIdle();

    await waitFor(() =>
      expect(screen.queryByTitle(/Japanese train window/i)).toBeNull(),
    );
    expect(screen.getByTestId("window-seat-still")).toBeVisible();
    expect(screen.queryByTestId("youtube-startup-cover")).toBeNull();
    expect(screen.queryByText("Still journey")).toBeNull();
  });

  it("keeps YouTube out of the initial page and loads it when the visible toy reaches idle", async () => {
    mockMatchMedia(false);
    const loading = mockLoadingSignals();
    render(<WindowSeatToy />);

    expect(screen.queryByTitle(/Japanese train window/i)).toBeNull();
    loading.setNearViewport(true);
    expect(screen.queryByTitle(/Japanese train window/i)).toBeNull();
    loading.runIdle();
    expect(screen.queryByTitle(/Japanese train window/i)).toBeNull();
    fireEvent.pointerMove(window);

    expect(await screen.findByTitle(/Japanese train window/i)).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/RMpM2Qu3QC8"),
    );
  });

  it("waits to load YouTube until an offscreen toy approaches the viewport", () => {
    mockMatchMedia(false);
    const loading = mockLoadingSignals();
    render(<WindowSeatToy />);

    loading.setNearViewport(false);
    loading.runIdle();
    fireEvent.pointerMove(window);
    expect(screen.queryByTitle(/Japanese train window/i)).toBeNull();

    loading.setNearViewport(true);
    expect(screen.getByTitle(/Japanese train window/i)).toBeInTheDocument();
  });

  it("loads a passive visible train only after the initial page has settled", () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    const loading = mockLoadingSignals();
    render(<WindowSeatToy />);

    loading.setNearViewport(true);
    loading.runIdle();
    act(() => vi.advanceTimersByTime(5_999));
    expect(screen.queryByTitle(/Japanese train window/i)).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTitle(/Japanese train window/i)).toBeInTheDocument();
  });

  it("uses supported embed parameters without overstating branding or caption control", async () => {
    mockMatchMedia(false);
    const loading = mockLoadingSignals();
    render(<WindowSeatToy />);
    loading.setNearViewport(true);
    loading.runIdle();
    fireEvent.pointerMove(window);

    const frame = await screen.findByTitle(/Japanese train window/i);
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
    expect(frame).toHaveStyle({ pointerEvents: "none" });
    expect(screen.queryByText("Ambient loop")).toBeNull();
  });

  it("keeps the startup cover through YouTube's startup chrome", async () => {
    vi.useFakeTimers();
    mockMatchMedia(false);
    const loading = mockLoadingSignals();
    render(<WindowSeatToy />);
    loading.setNearViewport(true);
    loading.runIdle();
    fireEvent.pointerMove(window);
    const frame = screen.getByTitle(/Japanese train window/i);

    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByTestId("youtube-startup-cover")).toBeVisible();

    fireEvent.load(frame);
    act(() => vi.advanceTimersByTime(3_999));
    expect(screen.getByTestId("youtube-startup-cover")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId("youtube-startup-cover")).toBeNull();
  });

  it("fills Window Seat by height and stays free of overlay masks", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const start = css.indexOf(".windowSeatToy");
    const end = css.indexOf(".studyToy", start);
    const windowSeatCss = css.slice(start, end);

    mockMatchMedia(false);
    mockLoadingSignals();
    render(<WindowSeatToy />);
    expect(screen.queryByTestId("youtube-mask-top")).toBeNull();
    expect(screen.queryByTestId("youtube-mask-bottom")).toBeNull();
    expect(screen.queryByTestId("youtube-mask-left")).toBeNull();
    expect(screen.queryByTestId("youtube-mask-right")).toBeNull();
    expect(screen.queryByTestId("youtube-subtitle-mask")).toBeNull();
    expect(screen.getByTestId("youtube-compass-mask")).toBeVisible();
    expect(windowSeatCss).toMatch(
      /\.windowSeatVideo\s*\{[^}]*position:\s*absolute;[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*width:\s*auto;[^}]*min-width:\s*100%;[^}]*height:\s*100%;[^}]*aspect-ratio:\s*16\s*\/\s*9;[^}]*pointer-events:\s*none;[^}]*transform:\s*translate\(-50%,\s*-50%\);/s,
    );
    expect(windowSeatCss).not.toMatch(/\.windowSeatMask/);
    expect(windowSeatCss).not.toMatch(/\.windowSeatSubtitleMask/);
    expect(windowSeatCss).toMatch(
      /\.windowSeatCompassMask\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*10;[^}]*background:\s*url\("\/assets\/optimized\/train-window\.webp"\)[^;]*;[^}]*mask-image:\s*radial-gradient\(/s,
    );
    expect(windowSeatCss).not.toMatch(
      /data-reduced-motion="true"[^}]*windowSeatCompassMask[^}]*display:\s*none/s,
    );
    expect(windowSeatCss).not.toMatch(/windowSeatStartupReveal/);
    expect(windowSeatCss).not.toMatch(/\bzoom\s*:/);
  });

  it("uses a local frame from the train video while the embed loads", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const still = css.match(/\.windowSeatStill\s*\{([^}]*)}/s)?.[1] ?? "";
    const startup =
      css.match(/\.windowSeatStartupCover\s*\{([^}]*)}/s)?.[1] ?? "";

    for (const rule of [still, startup]) {
      expect(rule).toMatch(
        /background:\s*url\("\/assets\/optimized\/train-window-still\.webp"\)\s+center\s*\/\s*cover\s+no-repeat/,
      );
      expect(rule).not.toContain("linear-gradient");
    }

    expect(
      readFileSync(
        resolve(
          process.cwd(),
          "public/assets/optimized/train-window-still.webp",
        ),
      ).byteLength,
    ).toBeGreaterThan(0);
  });
});
