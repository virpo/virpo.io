import type { Mode } from "./lcd/types";

export const MODE_EVENT = "sidecar:mode";
export const MODE_CHANGED_EVENT = "sidecar:mode-changed";

export const DEVICE_KEYS: ReadonlyArray<{
  mode: Mode;
  label: string;
  title: string;
  /** A sentence for lists, aria labels and the readout. */
  hint: string;
  /** A few words that fit on the bezel at any size. */
  short: string;
}> = [
  { mode: "face", label: "FACE", title: "Face", hint: "My face on the LCD. It follows your cursor.", short: "Follows your cursor" },
  { mode: "kana", label: "KANA", title: "Kana", hint: "Learn hiragana, one flashcard at a time.", short: "Hiragana flashcards" },
  { mode: "window", label: "WINDOW", title: "Window", hint: "A window seat on the shinkansen, Tokyo to Osaka.", short: "Shinkansen window" },
  { mode: "sound", label: "SOUND", title: "Sound", hint: "Ten small sounds of Japan, with a live waveform.", short: "Sounds of Japan" },
  { mode: "bloom", label: "BLOOM", title: "Bloom", hint: "What flowers next in Japan, and how many days to go.", short: "Next flower in Japan" },
];

export function requestMode(mode: Mode) {
  window.dispatchEvent(new CustomEvent(MODE_EVENT, { detail: mode }));
}
