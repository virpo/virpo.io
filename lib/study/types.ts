export type StudyGroup =
  | "hiragana"
  | "katakana"
  | `kanji-${1 | 2 | 3 | 4}`;

export type StudyCard = {
  id: string;
  group: StudyGroup;
  writing: string;
  reading: string;
  meaning: string;
};

export type CardProgress = {
  stage: number;
  dueAt: number;
  correct: number;
  wrong: number;
};

export type StudyState = {
  version: 2;
  cards: Record<string, CardProgress>;
  unlockedGroups: StudyGroup[];
  recentCardIds: string[];
  unseenStreak: number;
};

export type StudyProgress = {
  stable: number;
  total: number;
  due: number;
  unlockedGroups: StudyGroup[];
};

export type StudySelection = {
  card: StudyCard | null;
  nextDueAt: number;
};
