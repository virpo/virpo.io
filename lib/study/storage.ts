import { createStudyState, loadStudyState } from "./engine";
import type { StudyState } from "./types";

export const STUDY_STORAGE_KEY = "virpo-study-v2";
export const LEGACY_STUDY_STORAGE_KEY = "virpo-study-v1";

function sanitizeCount(value: unknown, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(Math.floor(number), maximum);
}

function migrateLegacyStudyState(raw: string): StudyState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return createStudyState();
  }
  if (!parsed || typeof parsed !== "object") return createStudyState();

  const legacy = parsed as Record<string, unknown>;
  const savedCards =
    legacy.cards &&
    typeof legacy.cards === "object" &&
    !Array.isArray(legacy.cards)
      ? (legacy.cards as Record<string, unknown>)
      : {};
  const cards: Record<string, unknown> = {};

  for (const [id, saved] of Object.entries(savedCards)) {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) continue;
    const progress = saved as Record<string, unknown>;
    const correct = sanitizeCount(progress.correct);
    const numericStage = Number(progress.stage);
    const stage = Number.isFinite(numericStage) && numericStage >= 0
      ? sanitizeCount(numericStage, 6)
      : Math.min(correct, 6);
    cards[id] = {
      stage,
      dueAt: sanitizeCount(progress.dueAt),
      correct,
      wrong: sanitizeCount(progress.wrong),
    };
  }

  return loadStudyState({
    version: 2,
    cards,
    recentCardIds: [],
    unseenStreak: 0,
  });
}

export function saveStudyState(
  state: StudyState,
  storage: Storage = window.localStorage,
) {
  storage.setItem(STUDY_STORAGE_KEY, JSON.stringify(loadStudyState(state)));
}

export function loadStoredStudyState(
  storage: Storage = window.localStorage,
): StudyState {
  try {
    const current = storage.getItem(STUDY_STORAGE_KEY);
    if (current !== null) {
      const state = loadStudyState(current);
      try {
        saveStudyState(state, storage);
      } catch {
        // Keep the repaired in-memory state when storage is read-only.
      }
      return state;
    }

    const legacy = storage.getItem(LEGACY_STUDY_STORAGE_KEY);
    const state =
      legacy === null ? createStudyState() : migrateLegacyStudyState(legacy);
    try {
      saveStudyState(state, storage);
    } catch {
      // Migration still succeeds for this tab when storage is read-only.
    }
    return state;
  } catch {
    return createStudyState();
  }
}
