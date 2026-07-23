const test = require("node:test");
const assert = require("node:assert/strict");
const {
  levels,
  decks,
  createStudyState,
  loadStudyState,
  getStudyProgress,
  getNextStudyCard,
  scoreStudyCard,
} = require("../study-engine.js");

test("starts in Hiragana with every card due", () => {
  const state = createStudyState();
  const progress = getStudyProgress(state, 1_000);

  assert.deepEqual(levels, ["hiragana", "katakana", "kanji"]);
  assert.equal(state.version, 1);
  assert.equal(state.level, "hiragana");
  assert.equal(Object.keys(state.cards).length, Object.values(decks).flat().length);
  assert.equal(progress.total, decks.hiragana.length);
  assert.equal(progress.mastered, 0);
  assert.equal(progress.due, decks.hiragana.length);
});

test("freezes exported deck configuration against consumer mutation", () => {
  assert.equal(Object.isFrozen(levels), true);
  assert.equal(Object.isFrozen(decks), true);

  for (const deck of Object.values(decks)) {
    assert.equal(Object.isFrozen(deck), true);
    for (const card of deck) assert.equal(Object.isFrozen(card), true);
  }

  const first = decks.hiragana[0];
  const originalLength = decks.hiragana.length;
  assert.equal(Reflect.set(levels, 0, "broken"), false);
  assert.equal(Reflect.set(decks, "hiragana", []), false);
  assert.equal(Reflect.set(first, "reading", "broken"), false);
  assert.throws(() => decks.hiragana.push({ id: "broken" }), TypeError);

  const state = createStudyState();
  assert.equal(decks.hiragana.length, originalLength);
  assert.equal(getStudyProgress(state, 1_000).total, originalLength);
  assert.equal(getNextStudyCard(state, 1_000).card.reading, "a");
});

test("Got it advances a card and Again returns it soon without mutating input", () => {
  const now = 1_000;
  const initial = createStudyState();
  const card = getNextStudyCard(initial, now).card;

  const advanced = scoreStudyCard(initial, card.id, true, now);
  assert.notStrictEqual(advanced, initial);
  assert.notStrictEqual(advanced.cards, initial.cards);
  assert.deepEqual(initial.cards[card.id], {
    stage: 0,
    dueAt: 0,
    correct: 0,
    wrong: 0,
  });
  assert.equal(advanced.cards[card.id].correct, 1);
  assert.equal(advanced.cards[card.id].stage, 1);
  assert.equal(advanced.cards[card.id].dueAt, now + 45_000);

  const retried = scoreStudyCard(advanced, card.id, false, now + 1);
  assert.deepEqual(advanced.cards[card.id], {
    stage: 1,
    dueAt: now + 45_000,
    correct: 1,
    wrong: 0,
  });
  assert.equal(retried.cards[card.id].wrong, 1);
  assert.equal(retried.cards[card.id].stage, 1);
  assert.equal(retried.cards[card.id].dueAt, now + 1 + 25_000);
});

test("ignores unknown and locked-level cards while returning a normalized clone", () => {
  const initial = createStudyState();

  const unknown = scoreStudyCard(initial, "not-a-card", true, 1_000);
  const locked = scoreStudyCard(initial, decks.katakana[0].id, true, 1_000);

  assert.deepEqual(unknown, initial);
  assert.deepEqual(locked, initial);
  assert.notStrictEqual(unknown, initial);
  assert.notStrictEqual(locked, initial);
});

test("unlocks Katakana only after every Hiragana card is correct twice", () => {
  let state = createStudyState();

  for (const card of decks.hiragana) {
    state = scoreStudyCard(state, card.id, true, 1_000);
    state = scoreStudyCard(state, card.id, true, 50_000);
  }

  assert.equal(state.level, "katakana");

  let nearlyComplete = createStudyState();
  for (const card of decks.hiragana) {
    nearlyComplete = scoreStudyCard(nearlyComplete, card.id, true, 1_000);
  }
  for (const card of decks.hiragana.slice(0, -1)) {
    nearlyComplete = scoreStudyCard(nearlyComplete, card.id, true, 50_000);
  }

  assert.equal(nearlyComplete.level, "hiragana");
});

test("unlocks Kanji only after every Katakana card is correct twice", () => {
  let state = createStudyState();

  for (const level of ["hiragana", "katakana"]) {
    for (const card of decks[level]) {
      state = scoreStudyCard(state, card.id, true, 1_000);
      state = scoreStudyCard(state, card.id, true, 50_000);
    }
  }

  assert.equal(state.level, "kanji");
});

test("loads valid progress but repairs malformed and partial persistence", () => {
  assert.deepEqual(loadStudyState("{not-json"), createStudyState());
  assert.deepEqual(loadStudyState(null), createStudyState());

  const raw = {
    version: 9,
    level: "katakana",
    cards: {
      [decks.hiragana[0].id]: {
        stage: 2.9,
        dueAt: 99_000.8,
        correct: 2.7,
        wrong: 1.2,
      },
      unknown: { stage: 4, dueAt: 5, correct: 6, wrong: 7 },
    },
  };
  const snapshot = structuredClone(raw);
  const loaded = loadStudyState(raw);

  assert.deepEqual(raw, snapshot);
  assert.equal(loaded.version, 1);
  assert.equal(loaded.level, "hiragana");
  assert.deepEqual(loaded.cards[decks.hiragana[0].id], {
    stage: 2,
    dueAt: 99_000,
    correct: 2,
    wrong: 1,
  });
  assert.deepEqual(loaded.cards[decks.hiragana[1].id], {
    stage: 0,
    dueAt: 0,
    correct: 0,
    wrong: 0,
  });
  assert.equal(Object.hasOwn(loaded.cards, "unknown"), false);
});

test("clamps saved stages and repairs invalid counters", () => {
  const first = decks.hiragana[0];
  const second = decks.hiragana[1];
  const loaded = loadStudyState({
    level: "hiragana",
    cards: {
      [first.id]: {
        stage: Number.MAX_SAFE_INTEGER,
        dueAt: Infinity,
        correct: -4,
        wrong: "3.9",
      },
      [second.id]: {
        stage: -1,
        dueAt: -10,
        correct: "not-a-number",
        wrong: NaN,
      },
    },
  });

  assert.deepEqual(loaded.cards[first.id], {
    stage: 6,
    dueAt: 0,
    correct: 0,
    wrong: 3,
  });
  assert.deepEqual(loaded.cards[second.id], {
    stage: 0,
    dueAt: 0,
    correct: 0,
    wrong: 0,
  });
});

test("repairs invalid and prematurely selected saved levels", () => {
  const initial = createStudyState();

  assert.equal(loadStudyState({ ...initial, level: "not-a-level" }).level, "hiragana");
  assert.equal(loadStudyState({ ...initial, level: "kanji" }).level, "hiragana");

  for (const card of decks.hiragana) {
    initial.cards[card.id].correct = 2;
  }
  assert.equal(loadStudyState({ ...initial, level: "kanji" }).level, "katakana");
});

test("selects due cards by earliest due time and then stable card id", () => {
  const state = createStudyState();
  for (const card of decks.hiragana) state.cards[card.id].dueAt = 10_000;

  state.cards["h-o"].dueAt = 2_000;
  state.cards["h-i"].dueAt = 2_000;
  state.cards["h-a"].dueAt = 3_000;

  assert.equal(getNextStudyCard(state, 2_500).card.id, "h-i");
});

test("returns the earliest future due time when no card is due", () => {
  const state = createStudyState();
  for (const card of decks.hiragana) state.cards[card.id].dueAt = 10_000;
  state.cards["h-a"].dueAt = 4_000;

  assert.deepEqual(getNextStudyCard(state, 3_000), {
    card: null,
    nextDueAt: 4_000,
  });
});

test("caps scoring stages at the longest interval", () => {
  const card = decks.hiragana[0];
  const state = createStudyState();
  state.cards[card.id].stage = 6;

  const scored = scoreStudyCard(state, card.id, true, 1_000);

  assert.equal(scored.cards[card.id].stage, 6);
  assert.equal(scored.cards[card.id].dueAt, 1_000 + 5 * 24 * 60 * 60 * 1_000);
});

test("progress counts only the active level", () => {
  const state = createStudyState();
  state.cards[decks.hiragana[0].id].correct = 2;
  state.cards[decks.hiragana[0].id].dueAt = 10_000;
  state.cards[decks.katakana[0].id].correct = 2;

  assert.deepEqual(getStudyProgress(state, 5_000), {
    level: "hiragana",
    total: decks.hiragana.length,
    mastered: 1,
    due: decks.hiragana.length - 1,
  });
});

test("every Kanji card separates Kanji writing, Hiragana reading, and English meaning", () => {
  for (const card of decks.kanji) {
    assert.match(card.writing, /\p{Script=Han}/u, `${card.id} needs Kanji`);
    assert.match(
      card.reading,
      /^[\p{Script=Hiragana}ー]+$/u,
      `${card.id} needs a Hiragana reading`,
    );
    assert.match(card.meaning, /^[a-z][a-z ]*$/, `${card.id} needs English`);
    assert.notEqual(card.writing, card.reading, `${card.id} writing and reading`);
    assert.notEqual(card.writing, card.meaning, `${card.id} writing and meaning`);
    assert.notEqual(card.reading, card.meaning, `${card.id} reading and meaning`);
  }
});
