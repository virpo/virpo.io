// Copied from components/sidecar/clicks.ts (the Sidecar device): synthesized key clicks.
// Tiny synthesized key clicks. The AudioContext is created on the first real
// user gesture only, so nothing ever plays on page load.

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ensure() {
  if (context) return context;
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    context = new AudioContextClass();
    noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.03), context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
  } catch {
    context = null;
  }
  return context;
}

export function playClick(kind: "down" | "up" | "knob" = "down") {
  const audio = ensure();
  if (!audio || !noise) return;
  if (audio.state === "suspended") void audio.resume().catch(() => undefined);
  const now = audio.currentTime;

  const source = audio.createBufferSource();
  source.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = kind === "up" ? 5200 : kind === "knob" ? 2400 : 3600;
  filter.Q.value = 1.4;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(kind === "up" ? 0.12 : 0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(now);

  if (kind !== "up") {
    const tone = audio.createOscillator();
    tone.type = "square";
    tone.frequency.setValueAtTime(kind === "knob" ? 880 : 1760, now);
    const toneGain = audio.createGain();
    toneGain.gain.setValueAtTime(0.025, now);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    tone.connect(toneGain).connect(audio.destination);
    tone.start(now);
    tone.stop(now + 0.02);
  }
}

/** The shared context, for the margin toys' little bells and coins. Null until it exists. */
export function roomAudio() {
  const audio = ensure();
  if (audio?.state === "suspended") void audio.resume().catch(() => undefined);
  return audio?.state === "running" ? { audio, noise } : null;
}
