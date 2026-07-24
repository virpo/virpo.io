import { beforeEach, describe, expect, it } from "vitest";
import { createStudyState } from "../../lib/study/engine";
import {
  LEGACY_STUDY_STORAGE_KEY,
  STUDY_STORAGE_KEY,
  loadStoredStudyState,
  saveStudyState,
} from "../../lib/study/storage";

describe("study storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses the v2 key", () => {
    expect(STUDY_STORAGE_KEY).toBe("virpo-study-v2");
  });

  it("loads v2 data when present", () => {
    const state = createStudyState();
    state.cards["h-a"].correct = 2;
    state.cards["h-a"].stage = 2;
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(
      LEGACY_STUDY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        cards: { "h-a": { correct: 9, stage: 6, dueAt: 1, wrong: 0 } },
      }),
    );

    expect(loadStoredStudyState(localStorage).cards["h-a"].correct).toBe(2);
  });

  it("migrates matching legacy progress without changing the v1 value", () => {
    const legacy = JSON.stringify({
      version: 1,
      level: "katakana",
      cards: {
        "h-a": { stage: 2, dueAt: 55_000, correct: 2, wrong: 1 },
        "k-a": { stage: 1, dueAt: 44_000, correct: 1, wrong: 3 },
        "v-mizu": { stage: 4, dueAt: 88_000, correct: 6, wrong: 2 },
        "removed-card": { stage: 5, dueAt: 9, correct: 7, wrong: 1 },
      },
    });
    localStorage.setItem(LEGACY_STUDY_STORAGE_KEY, legacy);

    const migrated = loadStoredStudyState(localStorage);

    expect(migrated.cards["h-a"]).toEqual({
      stage: 2,
      dueAt: 55_000,
      correct: 2,
      wrong: 1,
    });
    expect(migrated.cards["k-a"]).toEqual({
      stage: 1,
      dueAt: 44_000,
      correct: 1,
      wrong: 3,
    });
    expect(migrated.cards["v-mizu"]).toEqual({
      stage: 4,
      dueAt: 88_000,
      correct: 6,
      wrong: 2,
    });
    expect(migrated.cards).not.toHaveProperty("removed-card");
    expect(localStorage.getItem(LEGACY_STUDY_STORAGE_KEY)).toBe(legacy);
    expect(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual(
      migrated,
    );
  });

  it("derives a safe stage from legacy correct ratings when stage is missing", () => {
    localStorage.setItem(
      LEGACY_STUDY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        cards: {
          "h-a": { dueAt: 10, correct: 3, wrong: 1 },
          "h-i": { stage: "bad", dueAt: 20, correct: 99, wrong: 0 },
        },
      }),
    );

    const migrated = loadStoredStudyState(localStorage);

    expect(migrated.cards["h-a"].stage).toBe(3);
    expect(migrated.cards["h-i"].stage).toBe(6);
  });

  it("repairs corrupt v2 data instead of mutating legacy state", () => {
    const legacy = JSON.stringify({
      version: 1,
      cards: { "h-a": { stage: 2, dueAt: 10, correct: 2, wrong: 0 } },
    });
    localStorage.setItem(STUDY_STORAGE_KEY, "{broken");
    localStorage.setItem(LEGACY_STUDY_STORAGE_KEY, legacy);

    expect(loadStoredStudyState(localStorage)).toEqual(createStudyState());
    expect(localStorage.getItem(LEGACY_STUDY_STORAGE_KEY)).toBe(legacy);
  });

  it("persists a repaired v2 snapshot", () => {
    const state = createStudyState();
    state.cards["h-a"].correct = 1;

    saveStudyState(state, localStorage);

    expect(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual(
      state,
    );
  });
});
