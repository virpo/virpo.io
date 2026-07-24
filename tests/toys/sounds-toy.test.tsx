import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundsToy } from "../../components/toys/SoundsToy";

const resume = vi.fn().mockResolvedValue(undefined);
const sourceConnect = vi.fn();
const analyserConnect = vi.fn();
const getByteFrequencyData = vi.fn((data: Uint8Array) => data.fill(96));
const createMediaElementSource = vi.fn(() => ({ connect: sourceConnect }));
const createAnalyser = vi.fn(() => ({
  connect: analyserConnect,
  fftSize: 64,
  frequencyBinCount: 32,
  getByteFrequencyData,
  smoothingTimeConstant: 0,
}));
const close = vi.fn().mockResolvedValue(undefined);

class MockAudioContext {
  state = "suspended";
  destination = {};
  resume = resume;
  createMediaElementSource = createMediaElementSource;
  createAnalyser = createAnalyser;
  close = close;
}

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

beforeEach(() => {
  mockMatchMedia(false);
  vi.stubGlobal("AudioContext", MockAudioContext);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resume.mockClear();
  sourceConnect.mockClear();
  analyserConnect.mockClear();
  getByteFrequencyData.mockClear();
  createMediaElementSource.mockClear();
  createAnalyser.mockClear();
  close.mockClear();
});

describe("SoundsToy", () => {
  it("shows one audio element, an idle waveform, and distinct playback controls", () => {
    const { container } = render(<SoundsToy />);

    expect(screen.getByLabelText("Sound waveform")).toBeVisible();
    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-waveform-state",
      "idle",
    );
    expect(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous sound" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next sound" })).toBeVisible();
    expect(container.querySelectorAll("audio")).toHaveLength(1);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("creates one analyser graph on the first gesture and reuses it", async () => {
    render(<SoundsToy />);
    const play = screen.getByRole("button", {
      name: /play familymart entrance/i,
    });

    fireEvent.click(play);
    await waitFor(() => expect(resume).toHaveBeenCalledOnce());

    expect(createMediaElementSource).toHaveBeenCalledOnce();
    expect(createAnalyser).toHaveBeenCalledOnce();
    expect(sourceConnect).toHaveBeenCalledOnce();
    expect(analyserConnect).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /pause familymart/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-waveform-state",
      "live",
    );

    fireEvent.click(screen.getByRole("button", { name: /pause familymart/i }));
    fireEvent.click(screen.getByRole("button", { name: /play familymart/i }));
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
    expect(createMediaElementSource).toHaveBeenCalledOnce();
  });

  it("keeps playing through the current Japan sound queue and resets the wave on pause", async () => {
    render(<SoundsToy />);
    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );
    await screen.findByRole("button", { name: /pause familymart entrance/i });

    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));
    await waitFor(() =>
      expect(screen.getByText("Door chime")).toBeVisible(),
    );
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /pause door chime/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /pause door chime/i }));
    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-waveform-state",
      "idle",
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous sound" }));
    expect(screen.getByText("FamilyMart entrance")).toBeVisible();
  });

  it("keeps audio usable and explains when Web Audio is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    expect(
      await screen.findByText(/live waveform unavailable.+audio still plays/i),
    ).toBeVisible();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("does not retry graph wiring after Web Audio rejects the media element", async () => {
    createMediaElementSource.mockImplementationOnce(() => {
      throw new Error("media element already connected");
    });
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );
    await screen.findByRole("button", { name: /pause familymart entrance/i });
    fireEvent.click(
      screen.getByRole("button", { name: /pause familymart entrance/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
    expect(createMediaElementSource).toHaveBeenCalledOnce();
    expect(
      screen.getByText(/live waveform unavailable.+audio still plays/i),
    ).toBeVisible();
  });

  it("marks the live waveform as reduced-motion safe", () => {
    mockMatchMedia(true);
    render(<SoundsToy />);

    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("keeps media source changes under one owner so next can continue playing", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/toys/SoundsToy.tsx"),
      "utf8",
    );

    expect(source).not.toContain("src={current.src}");
    expect(source).toContain("audio.src = JAPAN_SOUNDS[normalized].src");
  });
});
