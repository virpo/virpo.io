import { allStudyCards, decks, studyCardsById } from "./decks";
import type {
  CardProgress,
  StudyCard,
  StudyGroup,
  StudyProgress,
  StudySelection,
  StudyState,
} from "./types";

const HOUR = 60 * 60 * 1_000;
const RETRY_MS = 25 * 1_000;
const INTERVALS_MS = Object.freeze([
  0,
  45 * 1_000,
  5 * 60 * 1_000,
  45 * 60 * 1_000,
  12 * HOUR,
  2 * 24 * HOUR,
  5 * 24 * HOUR,
]);
const STUDY_GROUPS: readonly StudyGroup[] = Object.freeze([
  "hiragana",
  "katakana",
  "kanji-1",
  "kanji-2",
  "kanji-3",
  "kanji-4",
]);

function blankProgress(): CardProgress {
  return { stage: 0, dueAt: 0, correct: 0, wrong: 0 };
}

function sanitizeCount(value: unknown, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(Math.floor(number), maximum);
}

function sanitizeProgress(saved: Record<string, unknown>): CardProgress {
  return {
    stage: sanitizeCount(saved.stage, INTERVALS_MS.length - 1),
    dueAt: sanitizeCount(saved.dueAt),
    correct: sanitizeCount(saved.correct),
    wrong: sanitizeCount(saved.wrong),
  };
}

function parseRawState(raw: unknown): Record<string, unknown> | null {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function createStudyState(): StudyState {
  return {
    version: 2,
    cards: Object.fromEntries(
      allStudyCards.map((card) => [card.id, blankProgress()]),
    ),
    unlockedGroups: ["hiragana"],
    recentCardIds: [],
    unseenStreak: 0,
  };
}

export function loadStudyState(raw: unknown): StudyState {
  const parsed = parseRawState(raw);
  const fresh = createStudyState();
  if (!parsed || parsed.version !== 2) return fresh;

  const savedCards =
    parsed.cards &&
    typeof parsed.cards === "object" &&
    !Array.isArray(parsed.cards)
      ? (parsed.cards as Record<string, unknown>)
      : {};

  fresh.cards = Object.fromEntries([
    ...Object.entries(fresh.cards),
    ...Object.entries(savedCards)
      .filter(
        (entry): entry is [string, Record<string, unknown>] =>
          Boolean(entry[1]) &&
          typeof entry[1] === "object" &&
          !Array.isArray(entry[1]),
      )
      .map(([id, saved]) => [id, sanitizeProgress(saved)] as const),
  ]);

  const recent = Array.isArray(parsed.recentCardIds)
    ? parsed.recentCardIds
    : [];
  fresh.recentCardIds = recent
    .filter(
      (id, index, ids): id is string =>
        typeof id === "string" &&
        studyCardsById.has(id) &&
        ids.indexOf(id) === index,
    )
    .slice(0, 3);
  fresh.unseenStreak = sanitizeCount(parsed.unseenStreak);
  fresh.unlockedGroups = mergeUnlockedGroups(
    sanitizeUnlockedGroups(parsed.unlockedGroups),
    deriveEarnedGroups(fresh),
  );

  return fresh;
}

export function isStableCard(progress: CardProgress) {
  return progress.correct >= 2 && progress.stage >= 2;
}

function stableCount(state: StudyState, cards: readonly StudyCard[]) {
  return cards.filter((card) => isStableCard(state.cards[card.id])).length;
}

function stableThreshold(cards: readonly StudyCard[], ratio: number) {
  return Math.ceil(cards.length * ratio);
}

function deriveEarnedGroups(state: StudyState): StudyGroup[] {
  const groups: StudyGroup[] = ["hiragana"];
  if (
    stableCount(state, decks.hiragana) <
    stableThreshold(decks.hiragana, 0.8)
  ) {
    return groups;
  }

  groups.push("katakana");
  if (
    stableCount(state, decks.katakana) <
    stableThreshold(decks.katakana, 0.8)
  ) {
    return groups;
  }

  groups.push("kanji-1");
  if (stableCount(state, decks.kanji1) < stableThreshold(decks.kanji1, 0.75)) {
    return groups;
  }

  groups.push("kanji-2");
  if (stableCount(state, decks.kanji2) < stableThreshold(decks.kanji2, 0.75)) {
    return groups;
  }

  groups.push("kanji-3");
  if (stableCount(state, decks.kanji3) < stableThreshold(decks.kanji3, 0.75)) {
    return groups;
  }

  groups.push("kanji-4");
  return groups;
}

function sanitizeUnlockedGroups(value: unknown): StudyGroup[] {
  if (!Array.isArray(value)) return ["hiragana"];

  const highest = value.reduce(
    (index, group) =>
      typeof group === "string"
        ? Math.max(index, STUDY_GROUPS.indexOf(group as StudyGroup))
        : index,
    0,
  );
  return STUDY_GROUPS.slice(0, highest + 1);
}

function mergeUnlockedGroups(
  persisted: readonly StudyGroup[],
  earned: readonly StudyGroup[],
): StudyGroup[] {
  const highest = Math.max(
    STUDY_GROUPS.indexOf(persisted.at(-1) ?? "hiragana"),
    STUDY_GROUPS.indexOf(earned.at(-1) ?? "hiragana"),
  );
  return STUDY_GROUPS.slice(0, highest + 1);
}

export function getUnlockedGroups(state: StudyState): StudyGroup[] {
  return mergeUnlockedGroups(
    sanitizeUnlockedGroups(state.unlockedGroups),
    deriveEarnedGroups(state),
  );
}

function getActiveCards(state: StudyState) {
  const unlocked = new Set(getUnlockedGroups(state));
  return allStudyCards.filter((card) => unlocked.has(card.group));
}

export function getStudyProgress(
  state: StudyState,
  now = Date.now(),
): StudyProgress {
  const unlockedGroups = getUnlockedGroups(state);
  const active = getActiveCards(state);

  return {
    stable: stableCount(state, active),
    total: active.length,
    due: active.filter((card) => state.cards[card.id].dueAt <= now).length,
    unlockedGroups,
  };
}

function isUnseen(progress: CardProgress) {
  return (
    progress.stage === 0 &&
    progress.correct === 0 &&
    progress.wrong === 0 &&
    progress.dueAt === 0
  );
}

function cardWeight(state: StudyState, card: StudyCard, now: number) {
  const progress = state.cards[card.id];
  const overdueHours = Math.max(0, (now - progress.dueAt) / HOUR);
  return Math.max(1, 7 - progress.stage) + Math.min(4, overdueHours);
}

export function selectNextCard(
  state: StudyState,
  now = Date.now(),
  rng: () => number = Math.random,
): StudySelection {
  const active = getActiveCards(state);
  let eligible = active.filter((card) => state.cards[card.id].dueAt <= now);

  if (eligible.length === 0) {
    return {
      card: null,
      nextDueAt: Math.min(...active.map((card) => state.cards[card.id].dueAt)),
    };
  }

  const previous = state.recentCardIds[0];
  if (previous && eligible.length > 1) {
    const withoutPrevious = eligible.filter((card) => card.id !== previous);
    if (withoutPrevious.length > 0) eligible = withoutPrevious;
  }

  if (state.unseenStreak >= 2) {
    const seen = eligible.filter((card) => !isUnseen(state.cards[card.id]));
    if (seen.length > 0) eligible = seen;
  }

  const weighted = eligible.map((card) => ({
    card,
    weight: cardWeight(state, card, now),
  }));
  const totalWeight = weighted.reduce((total, item) => total + item.weight, 0);
  const random = Math.max(0, Math.min(0.999999999999, rng()));
  let target = random * totalWeight;

  for (const item of weighted) {
    target -= item.weight;
    if (target < 0) return { card: item.card, nextDueAt: now };
  }

  return { card: weighted.at(-1)?.card ?? null, nextDueAt: now };
}

export function scoreCard(
  state: StudyState,
  id: string,
  correct: boolean,
  now = Date.now(),
): StudyState {
  const next = loadStudyState(state);
  const card = studyCardsById.get(id);
  if (!card || !getUnlockedGroups(next).includes(card.group)) return next;

  const progress = next.cards[id];
  const wasUnseen = isUnseen(progress);
  if (correct) {
    progress.correct += 1;
    progress.stage = Math.min(
      progress.stage + 1,
      INTERVALS_MS.length - 1,
    );
    progress.dueAt = now + INTERVALS_MS[progress.stage];
  } else {
    progress.wrong += 1;
    progress.dueAt = now + RETRY_MS;
  }

  next.recentCardIds = [
    id,
    ...next.recentCardIds.filter((recentId) => recentId !== id),
  ].slice(0, 3);
  next.unseenStreak = wasUnseen ? next.unseenStreak + 1 : 0;
  next.unlockedGroups = getUnlockedGroups(next);

  return next;
}
