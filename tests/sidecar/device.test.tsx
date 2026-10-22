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
  destroy: vi.fn(),
};

vi.mock("../../components/sidecar/lcd/engine", () => ({
  createEngine: vi.fn(() => engine),
}));

import { Device } from "../../components/sidecar/Device";
import { Instruments } from "../../components/sidecar/Instruments";
import { Framebuffer } from "../../components/sidecar/lcd/framebuffer";
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

  it("fills LED levels proportionally", () => {
    const levels = fillLeds(0.5);
    expect(levels).toHaveLength(12);
    expect(levels.filter((value) => value === 1)).toHaveLength(6);
  });
});
