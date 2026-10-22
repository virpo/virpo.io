import type { Mode } from "./lcd/types";

export const MODE_EVENT = "sidecar:mode";
export const MODE_CHANGED_EVENT = "sidecar:mode-changed";

export const DEVICE_KEYS: ReadonlyArray<{
  mode: Mode;
  label: string;
  title: string;
  hint: string;
}> = [
  { mode: "face", label: "FACE", title: "Face", hint: "My face, dithered to one bit. It follows your cursor." },
  { mode: "kana", label: "KANA", title: "Kana", hint: "Learn hiragana, one flashcard at a time." },
  { mode: "window", label: "WINDOW", title: "Window", hint: "A window seat on the shinkansen, Tokyo to Osaka." },
  { mode: "sound", label: "SOUND", title: "Sound", hint: "Ten small sounds of Japan, with a live waveform." },
  { mode: "bloom", label: "BLOOM", title: "Bloom", hint: "What flowers next in Japan, and how many days to go." },
];

export function requestMode(mode: Mode) {
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: mode }));
}
