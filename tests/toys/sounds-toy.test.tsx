import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { StrictMode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JAPAN_SOUNDS,
  SoundsToy,
} from "../../components/toys/SoundsToy";

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
let latestContext: MockAudioContext;

class MockAudioContext {
  state: AudioContextState = "suspended";
  destination = destination;
  createMediaElementSource = createMediaElementSource;
  createAnalyser = createAnalyser;
  close = close;

  constructor() {
    latestContext = this;
  }

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
  it("uses the agreed longer, cleaner Japan nostalgia sequence", () => {
    expect(JAPAN_SOUNDS.map(({ title }) => title)).toEqual([
      "FamilyMart welcome",
      "Closed crossing",
      "Yamanote approaching",
      "Park crows",
      "Departure melody",
      "Tennoji announcement",
      "Fare gate",
      "Railway crossing",
      "Cuckoo crossing",
      "Minminzemi",
    ]);
    expect(JAPAN_SOUNDS.map(({ src }) => src)).toEqual([
      "/audio/japan-familymart-welcome.mp3",
      "/audio/japan-closed-crossing.mp3",
      "/audio/japan-yamanote-approaching.mp3",
      "/audio/japan-park-crows.mp3",
      "/audio/japan-departure-melody.mp3",
      "/audio/japan-tennoji-announcement.mp3",
      "/audio/japan-faregate-chime.mp3",
      "/audio/japan-railway-crossing-long.mp3",
      "/audio/japan-crosswalk-cuckoo.mp3",
      "/audio/japan-minminzemi.mp3",
    ]);
    expect(JAPAN_SOUNDS.map(({ title }) => title).join(" ")).not.toMatch(
      /Don Quijote|Shinkansen|Fūrin/,
    );

    for (const sound of JAPAN_SOUNDS) {
      expect(sound.endAt - sound.startAt).toBeGreaterThanOrEqual(7);
      expect(sound.endAt - sound.startAt).toBeLessThanOrEqual(8);
    }
    const totalSeconds = JAPAN_SOUNDS.reduce(
      (total, sound) => total + sound.endAt - sound.startAt,
      0,
    );
    expect(totalSeconds).toBeGreaterThanOrEqual(70);
    expect(totalSeconds).toBeLessThanOrEqual(80);
  });

  it("shows one audio element, an idle waveform, and distinct playback controls", () => {
    const { container } = render(<SoundsToy />);

    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-waveform-state",
      "idle",
    );
    expect(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    ).toBeVisible();
    expect(screen.getByText("01 / 10")).toBeVisible();
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    await screen.findByRole("button", { name: /pause familymart welcome/i });

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
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(createAnalyser).not.toHaveBeenCalled();
    expect(createMediaElementSource).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("falls back to native audio when AudioContext construction fails", async () => {
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("AudioContext unavailable");
        }
      },
    );
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );

    expect(await screen.findByText(/playing.+waveform unavailable/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /pause familymart welcome/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
  });

  it("falls back to native audio when analyser creation fails before source capture", async () => {
    createAnalyser.mockImplementationOnce(() => {
      throw new Error("analyser unavailable");
    });
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));
    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));

    expect(screen.getByText("Yamanote approaching")).toBeVisible();
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
      await screen.findByRole("button", { name: /pause yamanote approaching/i }),
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next sound" }));
    first.reject(new Error("interrupted"));
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2),
    );
    second.resolve();

    expect(
      await screen.findByRole("button", { name: /pause closed crossing/i }),
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
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    expect(await screen.findByText("Couldn’t play this sound")).toBeVisible();
    expect(screen.queryByText(/audio still plays/i)).toBeNull();

    fireEvent.error(container.querySelector("audio") as HTMLAudioElement);
    expect(screen.getByText("Sound unavailable")).toBeVisible();
  });

  it("reports audio unavailable without playing when a captured graph cannot resume", async () => {
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    await screen.findByRole("button", { name: /pause familymart welcome/i });
    fireEvent.click(
      screen.getByRole("button", { name: /pause familymart welcome/i }),
    );
    latestContext.state = "suspended";
    resume.mockRejectedValueOnce(new Error("resume rejected"));

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );

    expect(await screen.findByText("Audio unavailable")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/^Playing/)).toBeNull();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("restores its mounted guard across StrictMode effect replay", async () => {
    render(
      <StrictMode>
        <SoundsToy />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );

    expect(
      await screen.findByRole("button", { name: /pause familymart welcome/i }),
    ).toBeVisible();
    expect(screen.getByText("Playing")).toBeVisible();
  });

  it("shows a pressed pause control while start is pending and lets it cancel", async () => {
    const pendingPlay = deferred();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementationOnce(
      () => pendingPlay.promise,
    );
    render(<SoundsToy />);

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );

    const pendingButton = screen.getByRole("button", {
      name: /pause familymart welcome/i,
    });
    expect(pendingButton).toHaveAttribute("aria-pressed", "true");
    expect(pendingButton.querySelector("path")).toHaveAttribute(
      "d",
      "M6 5h4v14H6V5Zm8 0h4v14h-4V5Z",
    );

    fireEvent.click(pendingButton);
    expect(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Paused · press play")).toBeVisible();
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce(),
    );
    pendingPlay.resolve();
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled(),
    );
    expect(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the live waveform as reduced-motion safe", () => {
    mockMatchMedia(true);
    render(<SoundsToy />);

    expect(screen.getByLabelText("Sound waveform")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("automatically advances at a segment boundary and keeps playing", async () => {
    const { container } = render(<SoundsToy />);
    const audio = container.querySelector("audio") as HTMLAudioElement;

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    await screen.findByRole("button", { name: /pause familymart welcome/i });

    audio.currentTime = 7.5;
    fireEvent.timeUpdate(audio);

    expect(await screen.findByText("Closed crossing")).toBeVisible();
    expect(screen.getByText("02 / 10")).toBeVisible();
    expect(
      await screen.findByRole("button", { name: /pause closed crossing/i }),
    ).toBeVisible();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it("stops after Minminzemi and restarts the sequence on the next play", async () => {
    const { container } = render(<SoundsToy />);
    const audio = container.querySelector("audio") as HTMLAudioElement;

    fireEvent.click(screen.getByRole("button", { name: "Previous sound" }));
    expect(await screen.findByText("Minminzemi")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /play minminzemi/i }));
    await screen.findByRole("button", { name: /pause minminzemi/i });

    audio.currentTime = 7.5;
    fireEvent.timeUpdate(audio);

    expect(await screen.findByText("FamilyMart welcome")).toBeVisible();
    expect(screen.getByText("01 / 10")).toBeVisible();
    expect(screen.getByText("Press play")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: /play familymart welcome/i }),
    );
    expect(
      await screen.findByRole("button", { name: /pause familymart welcome/i }),
    ).toBeVisible();
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
