import { roomAudio } from "../clicks";

// Synthesized like the key clicks: a few sine partials with a fast decay. They only sound once the
// page has had a click or a key press (browsers keep audio asleep until then), which suits a margin.

function ring(partials: number[], decay: number, level: number, delay = 0) {
  const room = roomAudio();
  if (!room) return;
  const { audio } = room;
  const start = audio.currentTime + delay;
  for (const [i, frequency] of partials.entries()) {
    const tone = audio.createOscillator();
    tone.frequency.value = frequency;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(level / (i + 1), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay / (1 + i * 0.4));
    tone.connect(gain).connect(audio.destination);
    tone.start(start);
    tone.stop(start + decay);
  }
}

/** The little gold bell on the strap. */
export function playBell() {
  ring([2650, 3980, 5310], 0.28, 0.035);
  ring([2710, 4070], 0.22, 0.02, 0.045);
}

/** A 5-yen coin dropping into the cat. */
export function playCoin() {
  ring([3150, 4720, 6260, 7900], 0.6, 0.05);
  ring([3150, 4720], 0.3, 0.02, 0.09);
}

/** A soft paper fold. */
export function playFold() {
  const room = roomAudio();
  if (!room?.noise) return;
  const { audio, noise } = room;
  const source = audio.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = 0.45;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1500;
  filter.Q.value = 0.7;
  const gain = audio.createGain();
  gain.gain.value = 0.22;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}
