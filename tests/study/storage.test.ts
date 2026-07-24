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

  it("migrates active and retired legacy progress without changing the v1 value", () => {
    const retiredProgress = {
      "v-kuruma": { stage: 1, dueAt: 11_000, correct: 1, wrong: 0 },
      "v-jitensha": { stage: 2, dueAt: 22_000, correct: 2, wrong: 1 },
      "v-eiga": { stage: 3, dueAt: 33_000, correct: 3, wrong: 2 },
      "v-ongaku": { stage: 4, dueAt: 44_000, correct: 4, wrong: 3 },
      "v-kaimono": { stage: 5, dueAt: 55_000, correct: 5, wrong: 4 },
      "v-toshokan": { stage: 6, dueAt: 66_000, correct: 6, wrong: 5 },
    };
    const legacy = JSON.stringify({
      version: 1,
      level: "katakana",
      cards: {
        "h-a": { stage: 2, dueAt: 55_000, correct: 2, wrong: 1 },
        "k-a": { stage: 1, dueAt: 44_000, correct: 1, wrong: 3 },
        "v-mizu": { stage: 4, dueAt: 88_000, correct: 6, wrong: 2 },
        ...retiredProgress,
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
    for (const [id, progress] of Object.entries(retiredProgress)) {
      expect(migrated.cards[id]).toEqual(progress);
    }
    expect(localStorage.getItem(LEGACY_STUDY_STORAGE_KEY)).toBe(legacy);
    expect(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual(
      migrated,
    );

    saveStudyState(migrated, localStorage);
    expect(loadStoredStudyState(localStorage)).toEqual(migrated);
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

    const repaired = loadStoredStudyState(localStorage);

    expect(repaired).toEqual(createStudyState());
    expect(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual(
      repaired,
    );
    expect(localStorage.getItem(LEGACY_STUDY_STORAGE_KEY)).toBe(legacy);
  });

  it.each([
    ["partial", JSON.stringify({ version: 2, cards: { "h-a": { correct: 2 } } })],
    ["future", JSON.stringify({ version: 9, cards: {} })],
  ])("rewrites %s v2 data as its normalized repair", (_kind, raw) => {
    localStorage.setItem(STUDY_STORAGE_KEY, raw);

    const repaired = loadStoredStudyState(localStorage);
    const persisted = localStorage.getItem(STUDY_STORAGE_KEY);

    expect(persisted).not.toBe(raw);
    expect(JSON.parse(persisted ?? "{}")).toEqual(repaired);
    expect(loadStoredStudyState(localStorage)).toEqual(repaired);
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
