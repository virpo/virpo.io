import { JAPAN_SOUNDS } from "../../../toys/SoundsToy";
import { lcdSafe, measure } from "../font";
import { ACCENT, type Framebuffer } from "../framebuffer";
import { fillLeds, type Scene, type SceneContext } from "../types";

// SOUND: the ten Japan sounds from the main site, with a live oscilloscope.

type Graph = { context: AudioContext; analyser: AnalyserNode | null };

function audioContextConstructor() {
  return (
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function createSoundScene(): Scene {
  let audio: HTMLAudioElement | null = null;
  let graph: Graph | null = null;
  let index = 0;
  let playing = false;
  let wanted = false;
  let error = "";
  let level = 0;
  let peak = 0.2;
  const wave = new Uint8Array(512);
  const spectrum = new Uint8Array(256);
  let notify: (() => void) | null = null;

  const segment = () => JAPAN_SOUNDS[index];

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "auto";
    audio.src = segment().src;
    audio.addEventListener("timeupdate", () => {
      if (audio && wanted && audio.currentTime >= segment().endAt) advance();
    });
    audio.addEventListener("ended", () => {
      if (wanted) advance();
    });
    audio.addEventListener("pause", () => {
      playing = false;
      notify?.();
    });
    audio.addEventListener("playing", () => {
      playing = true;
      notify?.();
    });
    return audio;
  }

  function ensureGraph() {
    if (graph || !audio) return;
    const AudioContextClass = audioContextConstructor();
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      const source = context.createMediaElementSource(audio);
      try {
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyser.connect(context.destination);
        graph = { context, analyser };
      } catch {
        source.connect(context.destination);
        graph = { context, analyser: null };
      }
    } catch {
      graph = null;
    }
  }

  function play(context: SceneContext) {
    const element = ensureAudio();
    ensureGraph();
    wanted = true;
    error = "";
    void graph?.context.resume?.().catch(() => undefined);
    if (element.currentTime < segment().startAt || element.currentTime >= segment().endAt) {
      element.currentTime = segment().startAt;
    }
    element.play().then(
      () => context.invalidate(),
      () => {
        wanted = false;
        playing = false;
        error = "PRESS ● TO PLAY";
        context.invalidate();
      },
    );
  }

  function pause() {
    wanted = false;
    audio?.pause();
    playing = false;
  }

  function select(context: SceneContext, next: number) {
    index = (next + JAPAN_SOUNDS.length) % JAPAN_SOUNDS.length;
    if (audio) {
      audio.pause();
      audio.src = segment().src;
      audio.currentTime = segment().startAt;
    }
    if (wanted) play(context);
    context.announce(`Sound ${index + 1} of ${JAPAN_SOUNDS.length}: ${segment().title}.`);
  }

  function advance() {
    if (index === JAPAN_SOUNDS.length - 1) {
      pause();
      index = 0;
      if (audio) {
        audio.src = segment().src;
        audio.currentTime = segment().startAt;
      }
      notify?.();
      return;
    }
    index += 1;
    if (audio) {
      audio.src = segment().src;
      audio.currentTime = segment().startAt;
      void audio.play().catch(() => undefined);
    }
    notify?.();
  }

  return {
    id: "sound",
    enter(context) {
      notify = () => context.invalidate();
      play(context);
      context.announce(`Japan sounds. Playing ${segment().title}.`);
    },
    leave() {
      pause();
    },
    live() {
      return playing;
    },
    draw(fb: Framebuffer, context) {
      fb.clear(0);
      const current = segment();
      fb.text("SOUND", 3, 3, 3);
      fb.text("JAPAN", 26, 3, 2);
      fb.text(`${String(index + 1).padStart(2, "0")}/${JAPAN_SOUNDS.length}`, 157, 3, 3, { align: "right" });

      const title = lcdSafe(current.title);
      const width = measure(title, "m");
      const overflow = Math.max(0, width - 152);
      const scroll = overflow && !context.reduced ? Math.round(((Math.sin(context.t * 0.6) + 1) / 2) * overflow) : 0;
      fb.text(title, 4 - scroll, 11, 3, { font: "m" });

      const analyser = graph?.analyser ?? null;
      const live = playing && analyser;
      if (live) {
        analyser.getByteTimeDomainData(wave);
        analyser.getByteFrequencyData(spectrum);
      }

      // Scope grid.
      const top = 22;
      const bottom = 69;
      const mid = Math.round((top + bottom) / 2);
      for (let x = 4; x < 156; x += 4) fb.px(x, mid, 1);
      for (let y = top; y <= bottom; y += 4) {
        fb.px(4, y, 1);
        fb.px(155, y, 1);
      }

      // Automatic gain, so quiet chimes still fill the scope.
      if (live) {
        let max = 0;
        for (let i = 0; i < wave.length; i += 1) max = Math.max(max, Math.abs(wave[i] - 128) / 128);
        peak = Math.max(max, peak * 0.96, 0.04);
      }
      const gain = Math.min(8, 0.92 / peak);
      let sum = 0;
      let previous = mid;
      for (let x = 4; x < 156; x += 1) {
        let value = 0;
        if (live) {
          value = ((wave[Math.floor(((x - 4) / 152) * wave.length)] - 128) / 128) * gain;
        } else if (playing && !context.reduced) {
          value = Math.sin(x * 0.4 + context.t * 9) * 0.2 * Math.sin(x * 0.05 + context.t);
        }
        sum += value * value;
        const y = Math.round(mid + Math.max(-1, Math.min(1, value)) * (bottom - mid));
        const a = Math.min(mid, y);
        const b = Math.max(mid, y);
        for (let yy = a; yy <= b; yy += 1) if (fb.dither(x, yy, 5)) fb.px(x, yy, 1);
        fb.vline(x, previous, y, 3);
        previous = y;
      }
      level = playing ? Math.min(1, (Math.sqrt(sum / 152) / gain) * 5) : 0;

      // Spectrum.
      for (let bar = 0; bar < 38; bar += 1) {
        const value = live ? Math.min(1, (spectrum[Math.floor(Math.pow(bar / 38, 1.6) * 160)] / 255) * 1.3) : 0;
        const h = Math.max(1, Math.round(value * 8));
        fb.rect(4 + bar * 4, 81 - h, 3, h, bar % 2 ? 2 : 3);
      }

      // Transport.
      const length = current.endAt - current.startAt;
      const elapsed = audio ? Math.max(0, Math.min(length, audio.currentTime - current.startAt)) : 0;
      fb.frame(4, 85, 108, 5, 3);
      fb.rect(5, 86, Math.round((elapsed / length) * 106), 3, 3);
      fb.text(`${time(elapsed)}/${time(length)}`, 157, 85, 3, { align: "right" });
      if (playing) fb.rect(4, 94, 3, 3, ACCENT);
      fb.text(error || (playing ? "PLAYING" : wanted ? "● LOADING" : "‖ PAUSED"), playing ? 9 : 4, 93, error ? 3 : 2);
      fb.text("◀ ▶ TRACK", 157, 93, 2, { align: "right" });
    },
    action(context) {
      if (wanted) {
        pause();
        context.announce("Paused.");
      } else {
        play(context);
        context.announce(`Playing ${segment().title}.`);
      }
    },
    prev(context) {
      select(context, index - 1);
    },
    next(context) {
      select(context, index + 1);
    },
    leds() {
      return fillLeds(level);
    },
    describe() {
      return `Japan sounds, ${index + 1} of ${JAPAN_SOUNDS.length}: ${segment().title}${playing ? ", playing" : ", paused"}.`;
    },
    softkeys() {
      return ["Prev", wanted ? "Pause" : "Play", "Next"];
    },
  };
}
