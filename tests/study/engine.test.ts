import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { allStudyCards, decks } from "../../lib/study/decks";
import {
  createStudyState,
  getStudyProgress,
  getUnlockedGroups,
  isStableCard,
  loadStudyState,
  scoreCard,
  selectNextCard,
} from "../../lib/study/engine";
import type { StudyCard, StudyState } from "../../lib/study/types";

const MINUTE = 60_000;

function sequenceRng(values: number[]) {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

function withStableCards(state: StudyState, cards: readonly StudyCard[]) {
  const next = structuredClone(state);
  for (const card of cards) {
    next.cards[card.id] = {
      stage: 2,
      dueAt: 0,
      correct: 2,
      wrong: 0,
    };
  }
  return next;
}

function unlockedThroughKatakana() {
  return withStableCards(
    withStableCards(createStudyState(), decks.hiragana.slice(0, 37)),
    decks.katakana.slice(0, 37),
  );
}

describe("study decks", () => {
  it("keeps 46 cards in each kana deck and four frozen Kanji buckets of eight", () => {
    expect(decks.hiragana).toHaveLength(46);
    expect(decks.katakana).toHaveLength(46);
    expect(decks.kanji1).toHaveLength(8);
    expect(decks.kanji2).toHaveLength(8);
    expect(decks.kanji3).toHaveLength(8);
    expect(decks.kanji4).toHaveLength(8);
    expect(Object.isFrozen(decks)).toBe(true);
    for (const deck of Object.values(decks)) {
      expect(Object.isFrozen(deck)).toBe(true);
      expect(deck.every(Object.isFrozen)).toBe(true);
    }
  });

  it("separates Kanji writing, Hiragana reading, and English meaning", () => {
    for (const card of [
      ...decks.kanji1,
      ...decks.kanji2,
      ...decks.kanji3,
      ...decks.kanji4,
    ]) {
      expect(card.writing).toMatch(/\p{Script=Han}/u);
      expect(card.reading).toMatch(/^[\p{Script=Hiragana}ー]+$/u);
      expect(card.meaning).toMatch(/^[a-z][a-z ]*$/);
      expect(card.writing).not.toBe(card.reading);
      expect(card.reading).not.toBe(card.meaning);
    }
  });

  it("freezes the exact four practical Kanji vocabulary buckets", () => {
    const vocabulary = (cards: readonly StudyCard[]) =>
      cards.map(({ id, writing, reading, meaning }) => [
        id,
        writing,
        reading,
        meaning,
      ]);

    expect(vocabulary(decks.kanji1)).toEqual([
      ["v-mizu", "水", "みず", "water"],
      ["v-yama", "山", "やま", "mountain"],
      ["v-kawa", "川", "かわ", "river"],
      ["v-umi", "海", "うみ", "sea"],
      ["v-sora", "空", "そら", "sky"],
      ["v-ame", "雨", "あめ", "rain"],
      ["v-ki", "木", "き", "tree"],
      ["v-mori", "森", "もり", "forest"],
    ]);
    expect(vocabulary(decks.kanji2)).toEqual([
      ["v-hito", "人", "ひと", "person"],
      ["v-tomodachi", "友達", "ともだち", "friend"],
      ["v-sensei", "先生", "せんせい", "teacher"],
      ["v-gakusei", "学生", "がくせい", "student"],
      ["v-ookii", "大きい", "おおきい", "big"],
      ["v-chiisai", "小さい", "ちいさい", "small"],
      ["v-ue", "上", "うえ", "above"],
      ["v-shita", "下", "した", "below"],
    ]);
    expect(vocabulary(decks.kanji3)).toEqual([
      ["v-asa", "朝", "あさ", "morning"],
      ["v-yoru", "夜", "よる", "night"],
      ["v-ryokou", "旅行", "りょこう", "travel"],
      ["v-deguchi", "出口", "でぐち", "exit"],
      ["v-iriguchi", "入口", "いりぐち", "entrance"],
      ["v-iku", "行く", "いく", "go"],
      ["v-kuru", "来る", "くる", "come"],
      ["v-kaeru", "帰る", "かえる", "return"],
    ]);
    expect(vocabulary(decks.kanji4)).toEqual([
      ["v-eki", "駅", "えき", "station"],
      ["v-densha", "電車", "でんしゃ", "train"],
      ["v-tabemono", "食べ物", "たべもの", "food"],
      ["v-nomimono", "飲み物", "のみもの", "drink"],
      ["v-mise", "店", "みせ", "shop"],
      ["v-gakkou", "学校", "がっこう", "school"],
      ["v-hon", "本", "ほん", "book"],
      ["v-kissa", "喫茶店", "きっさてん", "coffee shop"],
    ]);
  });
});

describe("study state", () => {
  it("starts with independent blank progress for every card", () => {
    const state = createStudyState();

    expect(state).toMatchObject({
      version: 2,
      unlockedGroups: ["hiragana"],
      recentCardIds: [],
      unseenStreak: 0,
    });
    expect(Object.keys(state.cards)).toHaveLength(allStudyCards.length);
    expect(state.cards["h-a"]).toEqual({
      stage: 0,
      dueAt: 0,
      correct: 0,
      wrong: 0,
    });
  });

  it("repairs malformed and partial v2 data without mutating it", () => {
    const raw = {
      version: 2,
      cards: {
        "h-a": { stage: 99, dueAt: 12.8, correct: 2.9, wrong: "3.4" },
        "h-i": { stage: -3, dueAt: -1, correct: "bad", wrong: Infinity },
        unknown: { stage: 4, dueAt: 5, correct: 6, wrong: 7 },
      },
      recentCardIds: ["unknown", "h-a", "h-i", "h-a", "h-u"],
      unseenStreak: 2.9,
    };
    const snapshot = structuredClone(raw);
    const loaded = loadStudyState(raw);

    expect(raw).toEqual(snapshot);
    expect(loaded.cards["h-a"]).toEqual({
      stage: 6,
      dueAt: 12,
      correct: 2,
      wrong: 3,
    });
    expect(loaded.cards["h-i"]).toEqual({
      stage: 0,
      dueAt: 0,
      correct: 0,
      wrong: 0,
    });
    expect(loaded.cards["h-u"]).toEqual({
      stage: 0,
      dueAt: 0,
      correct: 0,
      wrong: 0,
    });
    expect(loaded.recentCardIds).toEqual(["h-a", "h-i", "h-u"]);
    expect(loaded.unseenStreak).toBe(2);
    expect(loaded.cards.unknown).toEqual({
      stage: 4,
      dueAt: 5,
      correct: 6,
      wrong: 7,
    });
  });

  it("sanitizes and round-trips orphaned card progress without activating it", () => {
    const raw = {
      version: 2,
      cards: {
        "retired-card": {
          stage: 99,
          dueAt: 12.8,
          correct: "4.9",
          wrong: -3,
        },
      },
      recentCardIds: ["retired-card"],
      unseenStreak: 0,
    };

    const loaded = loadStudyState(raw);
    expect(loaded.cards["retired-card"]).toEqual({
      stage: 6,
      dueAt: 12,
      correct: 4,
      wrong: 0,
    });
    expect(loadStudyState(JSON.stringify(loaded))).toEqual(loaded);
    expect(getStudyProgress(loaded, 1_000).total).toBe(46);
    expect(loaded.recentCardIds).toEqual([]);
  });

  it("rejects array-shaped v2 card containers instead of persisting numeric ids", () => {
    const loaded = loadStudyState({
      version: 2,
      cards: [{ stage: 4, dueAt: 5, correct: 6, wrong: 7 }],
      recentCardIds: [],
      unseenStreak: 0,
    });

    expect(loaded.cards).not.toHaveProperty("0");
    expect(Object.keys(loaded.cards)).toHaveLength(allStudyCards.length);
  });

  it("falls back to a fresh state for corrupt and future data", () => {
    expect(loadStudyState("{not-json")).toEqual(createStudyState());
    expect(loadStudyState({ version: 3, cards: {} })).toEqual(
      createStudyState(),
    );
  });

  it("upgrades v2 data without unlockedGroups by deriving earned groups", () => {
    const legacyV2 = withStableCards(
      withStableCards(createStudyState(), decks.hiragana.slice(0, 37)),
      decks.katakana.slice(0, 37),
    ) as StudyState & { unlockedGroups?: StudyState["unlockedGroups"] };
    delete legacyV2.unlockedGroups;

    const loaded = loadStudyState(legacyV2);

    expect(loaded.unlockedGroups).toEqual([
      "hiragana",
      "katakana",
      "kanji-1",
    ]);
    expect(loaded.cards["h-a"].correct).toBe(2);
  });

  it("sanitizes persisted unlocks into a monotonic group prefix", () => {
    const loaded = loadStudyState({
      ...createStudyState(),
      unlockedGroups: ["kanji-3", "unknown", "kanji-3"],
    });

    expect(loaded.unlockedGroups).toEqual([
      "hiragana",
      "katakana",
      "kanji-1",
      "kanji-2",
      "kanji-3",
    ]);
  });
});

describe("progressive unlocks", () => {
  it("requires two correct ratings and stage two for a stable card", () => {
    expect(isStableCard({ stage: 1, dueAt: 0, correct: 2, wrong: 0 })).toBe(
      false,
    );
    expect(isStableCard({ stage: 2, dueAt: 0, correct: 1, wrong: 0 })).toBe(
      false,
    );
    expect(isStableCard({ stage: 2, dueAt: 0, correct: 2, wrong: 4 })).toBe(
      true,
    );
  });

  it("unlocks Katakana at 80 percent stable Hiragana", () => {
    const below = withStableCards(
      createStudyState(),
      decks.hiragana.slice(0, 36),
    );
    const threshold = withStableCards(
      createStudyState(),
      decks.hiragana.slice(0, 37),
    );

    expect(getUnlockedGroups(below)).toEqual(["hiragana"]);
    expect(getUnlockedGroups(threshold)).toContain("katakana");
  });

  it("unlocks Kanji bucket one at 80 percent stable Katakana", () => {
    const below = withStableCards(
      withStableCards(createStudyState(), decks.hiragana.slice(0, 37)),
      decks.katakana.slice(0, 36),
    );

    expect(getUnlockedGroups(below)).not.toContain("kanji-1");
    expect(getUnlockedGroups(unlockedThroughKatakana())).toContain("kanji-1");
  });

  it("unlocks each next Kanji bucket at 75 percent stable in the current one", () => {
    let state = unlockedThroughKatakana();

    state = withStableCards(state, decks.kanji1.slice(0, 5));
    expect(getUnlockedGroups(state)).not.toContain("kanji-2");
    state = withStableCards(state, decks.kanji1.slice(0, 6));
    expect(getUnlockedGroups(state)).toContain("kanji-2");

    state = withStableCards(state, decks.kanji2.slice(0, 6));
    expect(getUnlockedGroups(state)).toContain("kanji-3");
    state = withStableCards(state, decks.kanji3.slice(0, 6));
    expect(getUnlockedGroups(state)).toContain("kanji-4");
  });

  it("uses deck-size-derived kana and Kanji thresholds", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/study/engine.ts"),
      "utf8",
    );

    expect(source).toContain("Math.ceil(cards.length * ratio)");
    expect(source).not.toMatch(/stableCount\([^)]*\)\s*<\s*(37|6)\b/);
  });

  it("never relocks a persisted group when a deck later grows", () => {
    const loaded = loadStudyState({
      ...createStudyState(),
      unlockedGroups: ["hiragana", "katakana"],
    });

    expect(getUnlockedGroups(loaded)).toEqual(["hiragana", "katakana"]);
    expect(getStudyProgress(loaded).total).toBe(
      decks.hiragana.length + decks.katakana.length,
    );
  });

  it("reports progress across every unlocked group", () => {
    const state = withStableCards(
      createStudyState(),
      decks.hiragana.slice(0, 37),
    );

    expect(getStudyProgress(state, 1_000)).toMatchObject({
      stable: 37,
      total: 92,
      due: 92,
      unlockedGroups: ["hiragana", "katakana"],
    });
  });
});

describe("randomized weighted selection", () => {
  it("does not reveal cards in source or alphabetic order", () => {
    const state = createStudyState();
    const first = selectNextCard(state, 1_000, sequenceRng([0.72])).card;

    expect(first?.id).not.toBe("h-a");
  });

  it("avoids the immediately previous card when alternatives are due", () => {
    const state = { ...createStudyState(), recentCardIds: ["h-ka"] };

    expect(selectNextCard(state, 1_000, () => 0).card?.id).not.toBe("h-ka");
  });

  it("prefers a seen due card after two unseen cards", () => {
    const state = createStudyState();
    state.unseenStreak = 2;
    state.cards["h-o"].correct = 1;

    expect(selectNextCard(state, 1_000, () => 0.99).card?.id).toBe("h-o");
  });

  it("uses the specified weakness and overdue weights", () => {
    const state = createStudyState();
    for (const card of decks.hiragana) state.cards[card.id].dueAt = 20_000;
    state.cards["h-a"] = {
      stage: 6,
      dueAt: 1_000 - 4 * 60 * MINUTE,
      correct: 2,
      wrong: 0,
    };
    state.cards["h-i"] = {
      stage: 6,
      dueAt: 1_000,
      correct: 2,
      wrong: 0,
    };

    expect(selectNextCard(state, 1_000, () => 0.74).card?.id).toBe("h-a");
    expect(selectNextCard(state, 1_000, () => 0.9).card?.id).toBe("h-i");
  });

  it("keeps prior groups mixed after later material unlocks", () => {
    const state = unlockedThroughKatakana();
    for (const card of allStudyCards) state.cards[card.id].dueAt = 20_000;
    state.cards["h-a"].dueAt = 0;
    state.cards["k-a"].dueAt = 0;
    state.cards[decks.kanji1[0].id].dueAt = 0;

    expect(selectNextCard(state, 1_000, () => 0)?.card?.group).toBe(
      "hiragana",
    );
    expect(selectNextCard(state, 1_000, () => 0.5)?.card?.group).toBe(
      "katakana",
    );
    expect(selectNextCard(state, 1_000, () => 0.99)?.card?.group).toBe(
      "kanji-1",
    );
  });

  it("returns the earliest active due time when no card is ready", () => {
    const state = createStudyState();
    for (const card of decks.hiragana) state.cards[card.id].dueAt = 10_000;
    state.cards["h-a"].dueAt = 4_000;

    expect(selectNextCard(state, 3_000, () => 0)).toEqual({
      card: null,
      nextDueAt: 4_000,
    });
  });
});

describe("scoring", () => {
  it("uses the existing intervals, tracks recency, and never mutates input", () => {
    const initial = createStudyState();
    const advanced = scoreCard(initial, "h-a", true, 1_000);

    expect(initial.cards["h-a"]).toEqual({
      stage: 0,
      dueAt: 0,
      correct: 0,
      wrong: 0,
    });
    expect(advanced).not.toBe(initial);
    expect(advanced.cards).not.toBe(initial.cards);
    expect(advanced.cards["h-a"]).toEqual({
      stage: 1,
      dueAt: 46_000,
      correct: 1,
      wrong: 0,
    });
    expect(advanced.recentCardIds).toEqual(["h-a"]);
    expect(advanced.unseenStreak).toBe(1);

    const retried = scoreCard(advanced, "h-i", false, 2_000);
    expect(retried.cards["h-i"]).toEqual({
      stage: 0,
      dueAt: 27_000,
      correct: 0,
      wrong: 1,
    });
    expect(retried.recentCardIds).toEqual(["h-i", "h-a"]);
    expect(retried.unseenStreak).toBe(2);
  });

  it("resets the unseen streak for a previously seen card and keeps three recent ids", () => {
    let state = createStudyState();
    state = scoreCard(state, "h-a", true, 1_000);
    state = scoreCard(state, "h-i", true, 1_000);
    state = scoreCard(state, "h-u", true, 1_000);
    state = scoreCard(state, "h-e", true, 1_000);
    state = scoreCard(state, "h-a", false, 1_000);

    expect(state.recentCardIds).toEqual(["h-a", "h-e", "h-u"]);
    expect(state.unseenStreak).toBe(0);
  });

  it("persists a newly earned unlock while scoring its threshold card", () => {
    const state = withStableCards(
      createStudyState(),
      decks.hiragana.slice(0, Math.ceil(decks.hiragana.length * 0.8) - 1),
    );
    const thresholdCard =
      decks.hiragana[Math.ceil(decks.hiragana.length * 0.8) - 1];
    state.cards[thresholdCard.id] = {
      stage: 1,
      dueAt: 0,
      correct: 1,
      wrong: 0,
    };

    const advanced = scoreCard(state, thresholdCard.id, true, 1_000);

    expect(advanced.unlockedGroups).toContain("katakana");
    expect(loadStudyState(JSON.stringify(advanced)).unlockedGroups).toContain(
      "katakana",
    );
  });

  it("ignores unknown and locked cards while returning a normalized clone", () => {
    const state = createStudyState();

    expect(scoreCard(state, "not-a-card", true, 1_000)).toEqual(state);
    expect(scoreCard(state, "k-a", true, 1_000)).toEqual(state);
    expect(scoreCard(state, "k-a", true, 1_000)).not.toBe(state);
  });
});
