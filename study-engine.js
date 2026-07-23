(function createVirpoStudy(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VirpoStudy = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildVirpoStudy() {
  const levels = ["hiragana", "katakana", "kanji"];
  const intervalsMs = [
    0,
    45 * 1000,
    5 * 60 * 1000,
    45 * 60 * 1000,
    12 * 60 * 60 * 1000,
    2 * 24 * 60 * 60 * 1000,
    5 * 24 * 60 * 60 * 1000,
  ];
  const retryMs = 25 * 1000;

  const kanaRows = [
    ["a", "あ", "ア"],
    ["i", "い", "イ"],
    ["u", "う", "ウ"],
    ["e", "え", "エ"],
    ["o", "お", "オ"],
    ["ka", "か", "カ"],
    ["ki", "き", "キ"],
    ["ku", "く", "ク"],
    ["ke", "け", "ケ"],
    ["ko", "こ", "コ"],
    ["sa", "さ", "サ"],
    ["shi", "し", "シ"],
    ["su", "す", "ス"],
    ["se", "せ", "セ"],
    ["so", "そ", "ソ"],
    ["ta", "た", "タ"],
    ["chi", "ち", "チ"],
    ["tsu", "つ", "ツ"],
    ["te", "て", "テ"],
    ["to", "と", "ト"],
    ["na", "な", "ナ"],
    ["ni", "に", "ニ"],
    ["nu", "ぬ", "ヌ"],
    ["ne", "ね", "ネ"],
    ["no", "の", "ノ"],
    ["ha", "は", "ハ"],
    ["hi", "ひ", "ヒ"],
    ["fu", "ふ", "フ"],
    ["he", "へ", "ヘ"],
    ["ho", "ほ", "ホ"],
    ["ma", "ま", "マ"],
    ["mi", "み", "ミ"],
    ["mu", "む", "ム"],
    ["me", "め", "メ"],
    ["mo", "も", "モ"],
    ["ya", "や", "ヤ"],
    ["yu", "ゆ", "ユ"],
    ["yo", "よ", "ヨ"],
    ["ra", "ら", "ラ"],
    ["ri", "り", "リ"],
    ["ru", "る", "ル"],
    ["re", "れ", "レ"],
    ["ro", "ろ", "ロ"],
    ["wa", "わ", "ワ"],
    ["wo", "を", "ヲ"],
    ["n", "ん", "ン"],
  ];

  const hiragana = kanaRows.map(([romaji, glyph]) => ({
    id: `h-${romaji}`,
    level: "hiragana",
    writing: glyph,
    reading: romaji,
    meaning: "",
  }));
  const katakana = kanaRows.map(([romaji, , glyph]) => ({
    id: `k-${romaji}`,
    level: "katakana",
    writing: glyph,
    reading: romaji,
    meaning: "",
  }));
  const kanji = [
    ["densha", "電車", "でんしゃ", "train"],
    ["eki", "駅", "えき", "station"],
    ["kuruma", "車", "くるま", "car"],
    ["jitensha", "自転車", "じてんしゃ", "bicycle"],
    ["mizu", "水", "みず", "water"],
    ["yama", "山", "やま", "mountain"],
    ["kawa", "川", "かわ", "river"],
    ["umi", "海", "うみ", "sea"],
    ["sora", "空", "そら", "sky"],
    ["ame", "雨", "あめ", "rain"],
    ["asa", "朝", "あさ", "morning"],
    ["yoru", "夜", "よる", "night"],
    ["tomodachi", "友達", "ともだち", "friend"],
    ["sensei", "先生", "せんせい", "teacher"],
    ["gakkou", "学校", "がっこう", "school"],
    ["gakusei", "学生", "がくせい", "student"],
    ["eiga", "映画", "えいが", "movie"],
    ["ongaku", "音楽", "おんがく", "music"],
    ["ryokou", "旅行", "りょこう", "travel"],
    ["mise", "店", "みせ", "shop"],
    ["deguchi", "出口", "でぐち", "exit"],
    ["iriguchi", "入口", "いりぐち", "entrance"],
    ["kaimono", "買い物", "かいもの", "shopping"],
    ["toshokan", "図書館", "としょかん", "library"],
    ["raamen", "ラーメン", "ラーメン", "ramen"],
    ["koohii", "コーヒー", "コーヒー", "coffee"],
    ["kissa", "喫茶店", "きっさてん", "coffee shop"],
  ].map(([id, writing, reading, meaning]) => ({
    id: `v-${id}`,
    level: "kanji",
    writing,
    reading,
    meaning,
  }));

  const decks = { hiragana, katakana, kanji };
  const allCards = levels.flatMap((level) => decks[level]);
  const cardsById = new Map(allCards.map((card) => [card.id, card]));

  function blankEntry() {
    return { stage: 0, dueAt: 0, correct: 0, wrong: 0 };
  }

  function createStudyState() {
    return {
      version: 1,
      level: "hiragana",
      cards: Object.fromEntries(allCards.map((card) => [card.id, blankEntry()])),
    };
  }

  function sanitizeCount(value, maximum = Number.MAX_SAFE_INTEGER) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return 0;
    return Math.min(Math.floor(number), maximum);
  }

  function levelComplete(state, level) {
    return decks[level].every((card) => state.cards[card.id].correct >= 2);
  }

  function highestUnlockedLevel(state) {
    if (!levelComplete(state, "hiragana")) return "hiragana";
    if (!levelComplete(state, "katakana")) return "katakana";
    return "kanji";
  }

  function loadStudyState(raw) {
    const state = createStudyState();
    let parsed;

    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return state;
    }

    if (!parsed || typeof parsed !== "object") return state;

    for (const card of allCards) {
      const saved = parsed.cards?.[card.id];
      if (!saved || typeof saved !== "object") continue;

      state.cards[card.id] = {
        stage: sanitizeCount(saved.stage, intervalsMs.length - 1),
        dueAt: sanitizeCount(saved.dueAt),
        correct: sanitizeCount(saved.correct),
        wrong: sanitizeCount(saved.wrong),
      };
    }

    const unlocked = highestUnlockedLevel(state);
    const savedLevelIndex = levels.indexOf(parsed.level);
    const unlockedLevelIndex = levels.indexOf(unlocked);
    state.level =
      savedLevelIndex >= 0 && savedLevelIndex <= unlockedLevelIndex
        ? parsed.level
        : unlocked;

    return state;
  }

  function getStudyProgress(state, now = Date.now()) {
    const cards = decks[state.level];

    return {
      level: state.level,
      total: cards.length,
      mastered: cards.filter((card) => state.cards[card.id].correct >= 2).length,
      due: cards.filter((card) => state.cards[card.id].dueAt <= now).length,
    };
  }

  function getNextStudyCard(state, now = Date.now()) {
    const cards = decks[state.level];
    const due = cards
      .filter((card) => state.cards[card.id].dueAt <= now)
      .sort((left, right) => {
        const dueDelta =
          state.cards[left.id].dueAt - state.cards[right.id].dueAt;
        return dueDelta || left.id.localeCompare(right.id);
      });

    if (due.length > 0) return { card: due[0], nextDueAt: now };

    return {
      card: null,
      nextDueAt: Math.min(
        ...cards.map((card) => state.cards[card.id].dueAt),
      ),
    };
  }

  function scoreStudyCard(state, cardId, correct, now = Date.now()) {
    const next = loadStudyState(state);
    const card = cardsById.get(cardId);
    if (!card || card.level !== next.level) return next;

    const entry = next.cards[cardId];
    if (correct) {
      entry.correct += 1;
      entry.stage = Math.min(entry.stage + 1, intervalsMs.length - 1);
      entry.dueAt = now + intervalsMs[entry.stage];
    } else {
      entry.wrong += 1;
      entry.dueAt = now + retryMs;
    }

    const currentIndex = levels.indexOf(next.level);
    if (
      levelComplete(next, next.level) &&
      currentIndex < levels.length - 1
    ) {
      next.level = levels[currentIndex + 1];
    }

    return next;
  }

  return {
    levels,
    decks,
    createStudyState,
    loadStudyState,
    getStudyProgress,
    getNextStudyCard,
    scoreStudyCard,
  };
});
