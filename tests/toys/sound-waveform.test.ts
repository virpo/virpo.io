import { describe, expect, it } from "vitest";
import { symmetricFrequencyBin } from "../../components/toys/SoundWaveform";

describe("sound waveform geometry", () => {
  it("mirrors frequency energy around the center of the radio display", () => {
    const bins = Array.from({ length: 24 }, (_, index) =>
      symmetricFrequencyBin(index, 24, 32),
    );

    expect(bins).toEqual([...bins].reverse());
    expect(bins[11]).toBe(0);
    expect(bins[0]).toBeGreaterThan(bins[6]);
  });
});
