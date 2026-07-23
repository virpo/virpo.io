const test = require("node:test");
const assert = require("node:assert/strict");
const { getBloomState, getTokyoParts } = require("../japan-data.js");

const bloom = {
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

test("returns the next bloom before its window", () => {
  const state = getBloomState({ year: 2026, month: 7, day: 23 }, [bloom]);
  assert.equal(state.status, "upcoming");
  assert.equal(state.days, 4);
  assert.equal(state.bloom.id, "sunflower");
});

test("returns active bloom and remaining days inside its window", () => {
  const state = getBloomState({ year: 2026, month: 8, day: 1 }, [bloom]);
  assert.equal(state.status, "active");
  assert.equal(state.days, 14);
});

test("rolls the next bloom into the following year", () => {
  const state = getBloomState({ year: 2026, month: 12, day: 31 }, [bloom]);
  assert.equal(state.status, "upcoming");
  assert.equal(state.bloom.id, "sunflower");
});

test("skips malformed entries", () => {
  const state = getBloomState({ year: 2026, month: 7, day: 23 }, [{ name: "Broken" }]);
  assert.equal(state.status, "unavailable");
});

test("formats a supplied instant in Tokyo", () => {
  const parts = getTokyoParts(new Date("2026-07-23T12:34:00Z"));
  assert.deepEqual(
    { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute },
    { year: 2026, month: 7, day: 23, hour: 21, minute: 34 },
  );
  assert.equal(parts.label, "21:34");
});
