import type { StudyCard, StudyGroup } from "./types";

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
] as const;

function freezeCards(cards: StudyCard[]) {
  return Object.freeze(cards.map((card) => Object.freeze(card)));
}

function kanaDeck(
  prefix: "h" | "k",
  group: "hiragana" | "katakana",
  writingIndex: 1 | 2,
) {
  return freezeCards(
    kanaRows.map((row) => ({
      id: `${prefix}-${row[0]}`,
      group,
      writing: row[writingIndex],
      reading: row[0],
      meaning: "",
    })),
  );
}

function kanjiDeck(
  bucket: 1 | 2 | 3 | 4,
  rows: ReadonlyArray<
    readonly [id: string, writing: string, reading: string, meaning: string]
  >,
) {
  const group = `kanji-${bucket}` as StudyGroup;

  return freezeCards(
    rows.map(([id, writing, reading, meaning]) => ({
      id: `v-${id}`,
      group,
      writing,
      reading,
      meaning,
    })),
  );
}

const hiragana = kanaDeck("h", "hiragana", 1);
const katakana = kanaDeck("k", "katakana", 2);

const kanji1 = kanjiDeck(1, [
  ["mizu", "水", "みず", "water"],
  ["yama", "山", "やま", "mountain"],
  ["kawa", "川", "かわ", "river"],
  ["umi", "海", "うみ", "sea"],
  ["sora", "空", "そら", "sky"],
  ["ame", "雨", "あめ", "rain"],
  ["ki", "木", "き", "tree"],
  ["mori", "森", "もり", "forest"],
]);

const kanji2 = kanjiDeck(2, [
  ["hito", "人", "ひと", "person"],
  ["tomodachi", "友達", "ともだち", "friend"],
  ["sensei", "先生", "せんせい", "teacher"],
  ["gakusei", "学生", "がくせい", "student"],
  ["ookii", "大きい", "おおきい", "big"],
  ["chiisai", "小さい", "ちいさい", "small"],
  ["ue", "上", "うえ", "above"],
  ["shita", "下", "した", "below"],
]);

const kanji3 = kanjiDeck(3, [
  ["asa", "朝", "あさ", "morning"],
  ["yoru", "夜", "よる", "night"],
  ["ryokou", "旅行", "りょこう", "travel"],
  ["deguchi", "出口", "でぐち", "exit"],
  ["iriguchi", "入口", "いりぐち", "entrance"],
  ["iku", "行く", "いく", "go"],
  ["kuru", "来る", "くる", "come"],
  ["kaeru", "帰る", "かえる", "return"],
]);

const kanji4 = kanjiDeck(4, [
  ["eki", "駅", "えき", "station"],
  ["densha", "電車", "でんしゃ", "train"],
  ["tabemono", "食べ物", "たべもの", "food"],
  ["nomimono", "飲み物", "のみもの", "drink"],
  ["mise", "店", "みせ", "shop"],
  ["gakkou", "学校", "がっこう", "school"],
  ["hon", "本", "ほん", "book"],
  ["kissa", "喫茶店", "きっさてん", "coffee shop"],
]);

export const decks = Object.freeze({
  hiragana,
  katakana,
  kanji1,
  kanji2,
  kanji3,
  kanji4,
});

export const allStudyCards = Object.freeze([
  ...hiragana,
  ...katakana,
  ...kanji1,
  ...kanji2,
  ...kanji3,
  ...kanji4,
]);

export const studyCardsById = new Map(
  allStudyCards.map((card) => [card.id, card]),
);
