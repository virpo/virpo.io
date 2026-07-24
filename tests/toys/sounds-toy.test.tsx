import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundsToy } from "../../components/toys/SoundsToy";

const destination = { kind: "destination" };
const resume = vi.fn();
const close = vi.fn();
const sourceConnect = vi.fn();
const sourceDisconnect = vi.fn();
const analyserConnect = vi.fn();
const analyserDisconnect = vi.fn();
const getByteFrequencyData = vi.fn((data: Uint8Array) => data.fill(96));
const sourceNode = {
  connect: sourceConnect,
  disconnect: sourceDisconnect,
};
const analyserNode = {
  connect: analyserConnect,
  disconnect: analyserDisconnect,
  fftSize: 64,
  frequencyBinCount: 32,
  getByteFrequencyData,
  smoothingTimeConstant: 0,
};
const createMediaElementSource = vi.fn(() => sourceNode);
const createAnalyser = vi.fn(() => analyserNode);

class MockAudioContext {
  state: AudioContextState = "suspended";
  destination = destination;
  createMediaElementSource = createMediaElementSource;
  createAnalyser = createAnalyser;
  close = close;

  async resume() {
    await resume();
    this.state = "running";
  }
}

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, reject, resolve };
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
  for (const mock of [
    resume,
    close,
    sourceConnect,
    sourceDisconnect,
    analyserConnect,
    analyserDisconnect,
    getByteFrequencyData,
    createMediaElementSource,
    createAnalyser,
  ]) {
    mock.mockReset();
  }
  resume.mockResolvedValue(undefined);
  close.mockResolvedValue(undefined);
  sourceConnect.mockReturnValue(undefined);
  sourceDisconnect.mockReturnValue(undefined);
  analyserConnect.mockReturnValue(undefined);
  analyserDisconnect.mockReturnValue(undefined);
  getByteFrequencyData.mockImplementation((data: Uint8Array) => data.fill(96));
  createMediaElementSource.mockReturnValue(sourceNode);
  createAnalyser.mockReturnValue(analyserNode);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SoundsToy", () => {
  it("shows one audio element, an idle waveform, and distinct playback controls", () => {
    const { container } = render(<SoundsToy />);

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

  it("resumes and creates the analyser before capturing the media element", async () => {
    const order: string[] = [];
    resume.mockImplementation(async () => {
      order.push("resume");
    });
    createAnalyser.mockImplementation(() => {
      order.push("create analyser");
      return analyserNode;
    });
    createMediaElementSource.mockImplementation(() => {
      order.push("capture source");
      return sourceNode;
    });
    sourceConnect.mockImplementation(() => {
      order.push("source to analyser");
    });
    analyserConnect.mockImplementation(() => {
      order.push("analyser to destination");
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async () => {
      order.push("play");
    });
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );
    await screen.findByRole("button", { name: /pause familymart entrance/i });

    expect(order).toEqual([
      "resume",
      "create analyser",
      "capture source",
      "source to analyser",
      "analyser to destination",
      "play",
    ]);
    expect(createMediaElementSource).toHaveBeenCalledOnce();
    expect(createAnalyser).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-waveform-state",
      "live",
    );
  });

  it("falls back to native audio when resume fails before source capture", async () => {
    resume.mockRejectedValueOnce(new Error("resume blocked"));
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(createAnalyser).not.toHaveBeenCalled();
    expect(createMediaElementSource).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("falls back to native audio when analyser creation fails before source capture", async () => {
    createAnalyser.mockImplementationOnce(() => {
      throw new Error("analyser unavailable");
    });
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(createMediaElementSource).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  it("falls back to native audio when media source capture fails", async () => {
    createMediaElementSource.mockImplementationOnce(() => {
      throw new Error("source capture failed");
    });
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(close).toHaveBeenCalledOnce();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("keeps a captured source audible through a direct route when source connect fails", async () => {
    sourceConnect
      .mockImplementationOnce(() => {
        throw new Error("analyser route failed");
      })
      .mockImplementationOnce(() => undefined);
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(sourceConnect).toHaveBeenNthCalledWith(1, analyserNode);
    expect(sourceConnect).toHaveBeenNthCalledWith(2, destination);
    expect(close).not.toHaveBeenCalled();
  });

  it("keeps a captured source audible through a direct route when analyser connect fails", async () => {
    analyserConnect.mockImplementationOnce(() => {
      throw new Error("destination route failed");
    });
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(sourceDisconnect).toHaveBeenCalledOnce();
    expect(sourceConnect).toHaveBeenNthCalledWith(1, analyserNode);
    expect(sourceConnect).toHaveBeenNthCalledWith(2, destination);
    expect(close).not.toHaveBeenCalled();
  });

  it("serializes rapid Play, Next, Next and ends on the latest playing sound", async () => {
    const first = deferred();
    const second = deferred();
    const third = deferred();
    vi.spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)
      .mockImplementationOnce(() => third.promise);
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));
    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));

    expect(screen.getByText("Cuckoo crossing")).toBeVisible();
    expect(screen.getByRole("group", { name: "Sound navigation" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
    first.resolve();
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
    second.resolve();
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(3),
    );
    third.resolve();

    expect(
      await screen.findByRole("button", { name: /pause cuckoo crossing/i }),
    ).toBeVisible();
    expect(screen.getByText("Playing")).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("group", { name: "Sound navigation" }),
      ).toHaveAttribute("aria-busy", "false"),
    );
  });

  it("ignores a stale play rejection after a newer sound intent", async () => {
    const first = deferred();
    const second = deferred();
    vi.spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));
    first.reject(new Error("interrupted"));
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
    second.resolve();

    expect(
      await screen.findByRole("button", { name: /pause door chime/i }),
    ).toBeVisible();
    expect(screen.queryByText(/couldn’t play/i)).toBeNull();
  });

  it("keeps playback errors above waveform fallback status", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValueOnce(
      new Error("decode failed"),
    );
    const { container } = render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart entrance/i }),
    );
    expect(await screen.findByText("Couldn’t play this sound")).toBeVisible();
    expect(screen.queryByText(/audio still plays/i)).toBeNull();

    fireEvent.error(container.querySelector("audio") as HTMLAudioElement);
    expect(screen.getByText("Sound unavailable")).toBeVisible();
  });

  it("marks the live waveform as reduced-motion safe", () => {
    mockMatchMedia(true);
    render(<SoundsToy />);

    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("keeps media source changes under one owner", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/toys/SoundsToy.tsx"),
      "utf8",
    );

    expect(source).not.toContain("src={current.src}");
    expect(source).toContain("audio.src = JAPAN_SOUNDS[normalized].src");
  });
});
