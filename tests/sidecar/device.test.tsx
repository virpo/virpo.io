import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const engine = {
  setMode: vi.fn(),
  action: vi.fn(),
  prev: vi.fn(),
  next: vi.fn(),
  setProgress: vi.fn(),
  setReducedMotion: vi.fn(),
  setGaze: vi.fn(),
  setTicker: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("../../components/sidecar/lcd/engine", () => ({
  createEngine: vi.fn(() => engine),
}));

import { Device } from "../../components/sidecar/Device";
import { Instruments } from "../../components/sidecar/Instruments";
import { ACCENT, Framebuffer } from "../../components/sidecar/lcd/framebuffer";
import { nextStation, tripCaption } from "../../components/sidecar/lcd/route";
import { tMinus } from "../../components/sidecar/lcd/scenes/bloom";
import { lcdSafe, measure } from "../../components/sidecar/lcd/font";
import { fillLeds } from "../../components/sidecar/lcd/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

describe("Sidecar device", () => {
  it("starts on WINDOW and switches modes with keys 1 to 5", async () => {
    render(<Device />);
    await flush();
    expect(screen.getByRole("button", { name: /^Window\./ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByRole("button", { name: /^Face\./ })).toHaveAttribute("aria-pressed", "true");
    expect(engine.setMode).toHaveBeenCalledWith("face");

    fireEvent.keyDown(window, { key: "5" });
    expect(screen.getByRole("button", { name: /^Bloom\./ })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores shortcuts with modifiers", async () => {
    render(<Device />);
    await flush();
    fireEvent.keyDown(window, { key: "2", metaKey: true });
    expect(screen.getByRole("button", { name: /^Window\./ })).toHaveAttribute("aria-pressed", "true");
  });

  it("routes the soft keys and knob to the engine", async () => {
    render(<Device />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Slower" }));
    fireEvent.click(screen.getByRole("button", { name: "Faster" }));
    fireEvent.click(screen.getByRole("button", { name: /^Action/ }));
    expect(engine.prev).toHaveBeenCalledTimes(1);
    expect(engine.next).toHaveBeenCalledTimes(1);
    expect(engine.action).toHaveBeenCalledTimes(1);
  });

  it("lets the instrument list drive the device", async () => {
    render(
      <>
        <Device />
        <Instruments />
      </>,
    );
    await flush();
    fireEvent.click(screen.getByRole("button", { name: /^02\s*KANA/ }));
    expect(screen.getByRole("button", { name: /^Kana\./ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^02\s*KANA/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("scrolls a hovered post title across the LCD", async () => {
    render(
      <>
        <Device />
        <a href="/sidecar/blog/x/" data-lcd-ticker="Note 003: Detective skills">
          Detective skills
        </a>
      </>,
    );
    await flush();
    const link = screen.getByRole("link", { name: "Detective skills" });
    fireEvent.pointerOver(link);
    expect(engine.setTicker).toHaveBeenLastCalledWith("Note 003: Detective skills");
    fireEvent.pointerOut(link, { relatedTarget: document.body });
    expect(engine.setTicker).toHaveBeenLastCalledWith(null);
    fireEvent.focusIn(link);
    expect(engine.setTicker).toHaveBeenLastCalledWith("Note 003: Detective skills");
  });

  it("says what the LCD shows under the hero, and the trip under the dock", async () => {
    const { unmount } = render(<Device />);
    await flush();
    expect(screen.getByText(/shinkansen, Tokyo to Osaka/)).toBeInTheDocument();
    unmount();
    render(
      <div data-article style={{ height: 2000 }}>
        <Device variant="dock" progressTarget="[data-article]" />
      </div>,
    );
    await flush();
    expect(screen.getByText(/% read · /)).toBeInTheDocument();
  });

  it("gives the soft keys short labels that fit on a phone", async () => {
    render(<Device />);
    await flush();
    for (const name of ["Slower", "Night", "Faster"]) {
      expect(name.length).toBeLessThanOrEqual(7);
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("toggles the key click switch", async () => {
    render(<Device />);
    await flush();
    const toggle = screen.getByRole("switch", { name: /key click/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});

describe("LCD primitives", () => {
  it("draws pixel text into the framebuffer", () => {
    const fb = new Framebuffer();
    fb.clear(0);
    const width = fb.text("FUJI", 0, 0, 3);
    expect(width).toBe(measure("FUJI"));
    expect(fb.pixels.some((tone) => tone === 3)).toBe(true);
  });

  it("strips diacritics for the LCD font", () => {
    expect(lcdSafe("Žltá stopa")).toBe("ZLTA STOPA");
  });

  it("keeps the orange accent when inverting", () => {
    const fb = new Framebuffer();
    fb.clear(0);
    fb.px(1, 1, ACCENT);
    fb.invert();
    expect(fb.get(0, 0)).toBe(3);
    expect(fb.get(1, 1)).toBe(ACCENT);
  });

  it("turns reading progress into a trip caption", () => {
    expect(tripCaption(0)).toBe("0% read · next stop Shinagawa");
    expect(tripCaption(0.4)).toBe("40% read · next stop Nagoya");
    expect(tripCaption(1)).toBe("100% read · arrived at Shin-Osaka");
    expect(nextStation(0.9).name).toBe("SHIN-OSAKA");
  });

  it("counts down to Tokyo midnight for the bloom clock", () => {
    // 23:40 in Tokyo, three days to go: 2 days, 20 minutes.
    expect(tMinus(new Date("2026-10-22T14:40:00Z"), 3)).toBe("T-2D 00:20:00");
    expect(tMinus(new Date("2026-10-22T14:40:00Z"), 0)).toBe("T-0D 00:00:00");
  });

  it("fills LED levels proportionally", () => {
    const levels = fillLeds(0.5);
    expect(levels).toHaveLength(12);
    expect(levels.filter((value) => value === 1)).toHaveLength(6);
  });
});
