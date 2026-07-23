import { describe, expect, it } from "vitest";
import { getBloomStatus, getTokyoParts, type BloomEntry } from "../../lib/japan/bloom";

const sunflower: BloomEntry = {
  id: "sunflower",
  name: "Sunflowers",
  emoji: "🌻",
  startMonth: 7,
  startDay: 27,
  endMonth: 8,
  endDay: 15,
  place: "Hokuryu Sunflower Village",
  region: "Hokkaido",
  sourceUrl: "https://www.japan.travel/en/spot/1882/",
};

describe("getBloomStatus", () => {
  it("returns the next bloom before its window", () => {
    const state = getBloomStatus([sunflower], new Date("2026-07-22T15:00:00Z"));

    expect(state).toMatchObject({
      status: "upcoming",
      days: 4,
      bloom: { id: "sunflower" },
      label: "in 4 days",
    });
  });

  it("returns an active bloom and remaining days inside its window", () => {
    const state = getBloomStatus([sunflower], new Date("2026-07-31T15:00:00Z"));

    expect(state).toMatchObject({
      status: "active",
      days: 14,
      bloom: { id: "sunflower" },
      label: "now · 14 days left",
    });
  });

  it("rolls the next bloom into the following year", () => {
    const state = getBloomStatus([sunflower], new Date("2026-12-31T03:00:00Z"));

    expect(state).toMatchObject({
      status: "upcoming",
      bloom: { id: "sunflower" },
    });
  });

  it("skips malformed entries", () => {
    const state = getBloomStatus(
      [{ name: "Broken" } as unknown as BloomEntry],
      new Date("2026-07-22T15:00:00Z"),
    );

    expect(state).toEqual({
      status: "unavailable",
      bloom: null,
      days: null,
      label: "Seasonal guide unavailable",
    });
  });
});

it("formats a supplied instant in Tokyo", () => {
  const parts = getTokyoParts(new Date("2026-07-23T12:34:00Z"));

  expect(parts).toMatchObject({
    year: 2026,
    month: 7,
    day: 23,
    hour: 21,
    minute: 34,
    label: "21:34",
  });
});
