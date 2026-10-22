import { getStudyProgress, scoreCard, selectNextCard } from "../../../../lib/study/engine";
import { loadStoredStudyState, saveStudyState } from "../../../../lib/study/storage";
import type { StudyGroup, StudySelection, StudyState } from "../../../../lib/study/types";
import { lcdSafe } from "../font";
import type { Framebuffer } from "../framebuffer";
import { fillLeds, type Scene, type SceneContext } from "../types";

// KANA: the same spaced-repetition deck as the main site, on a 1-bit card.

const JP_FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Noto Sans CJK JP", sans-serif';

const groupLabels: Record<StudyGroup, string> = {
  hiragana: "HIRAGANA",
  katakana: "KATAKANA",
  "kanji-1": "KANJI 1",
  "kanji-2": "KANJI 2",
  "kanji-3": "KANJI 3",
  "kanji-4": "KANJI 4",
};

type Bitmap = { w: number; h: number; bits: Uint8Array };
const glyphCache = new Map<string, Bitmap>();

/** Rasterise Japanese text with the system font, then threshold to crisp pixels. */
function rasterise(text: string, size: number, maxWidth: number): Bitmap {
  const key = `${text}:${size}:${maxWidth}`;
  const cached = glyphCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { w: 0, h: 0, bits: new Uint8Array() };
  let fontSize = size;
  context.font = `600 ${fontSize}px ${JP_FONT}`;
  while (context.measureText(text).width > maxWidth && fontSize > 9) {
    fontSize -= 2;
    context.font = `600 ${fontSize}px ${JP_FONT}`;
  }
  const w = Math.min(maxWidth, Math.ceil(context.measureText(text).width) + 2);
  const h = Math.ceil(fontSize * 1.25);
  canvas.width = w;
  canvas.height = h;
  context.font = `600 ${fontSize}px ${JP_FONT}`;
  context.textBaseline = "middle";
  context.fillStyle = "#000";
  context.fillText(text, 1, h / 2);
  const { data } = context.getImageData(0, 0, w, h);
  const bits = new Uint8Array(w * h);
  for (let i = 0; i < bits.length; i += 1) bits[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  const bitmap = { w, h, bits };
  glyphCache.set(key, bitmap);
  return bitmap;
}

function stamp(fb: Framebuffer, bitmap: Bitmap, cx: number, cy: number) {
  const x0 = Math.round(cx - bitmap.w / 2);
  const y0 = Math.round(cy - bitmap.h / 2);
  for (let y = 0; y < bitmap.h; y += 1) {
    for (let x = 0; x < bitmap.w; x += 1) if (bitmap.bits[y * bitmap.w + x]) fb.px(x0 + x, y0 + y, 3);
  }
}

export function createKanaScene(): Scene {
  let state: StudyState | null = null;
  let selection: StudySelection | null = null;
  let revealed = false;
  let flash = 0;

  function ensure() {
    if (state) return;
    try {
      state = loadStoredStudyState();
    } catch {
      state = null;
    }
    if (state) selection = selectNextCard(state);
  }

  function rate(context: SceneContext, correct: boolean) {
    if (!state || !selection?.card) return;
    state = scoreCard(state, selection.card.id, correct, Date.now());
    try {
      saveStudyState(state);
    } catch {
      // Keep the in-memory state when storage is unavailable.
    }
    selection = selectNextCard(state);
    revealed = false;
    flash = correct ? 1 : -1;
    context.announce(`${correct ? "Got it." : "Again soon."} ${describeCard()}`);
  }

  function describeCard() {
    if (!selection?.card) return "All cards done for now.";
    return `Card: ${selection.card.writing}. Press reveal.`;
  }

  return {
    id: "kana",
    enter(context) {
      ensure();
      if (state && !selection?.card) selection = selectNextCard(state);
      context.announce(`Kana flashcards. ${describeCard()}`);
    },
    draw(fb, context) {
      ensure();
      fb.clear(0);
      const card = selection?.card ?? null;
      const progress = state ? getStudyProgress(state) : null;

      fb.text("KANA", 3, 3, 3);
      fb.text(card ? groupLabels[card.group] : "STUDY", 24, 3, 2);
      if (progress) fb.text(`${progress.stable}/${progress.total} KNOWN`, 157, 3, 2, { align: "right" });
      fb.hline(0, 159, 10, 2);

      if (!card) {
        fb.text("ALL CAUGHT UP", 80, 40, 3, { font: "m", align: "center" });
        const minutes = selection ? Math.max(1, Math.ceil((selection.nextDueAt - Date.now()) / 60_000)) : 1;
        fb.text(`NEXT CARD IN ${minutes} MIN`, 80, 54, 2, { align: "center" });
      } else if (!revealed) {
        // A paper card with a soft shadow.
        fb.rect(47, 17, 68, 66, 2);
        fb.rect(45, 15, 68, 66, 0);
        fb.frame(45, 15, 68, 66, 3);
        stamp(fb, rasterise(card.writing, 50, 62), 79, 48);
        fb.text("WHAT IS IT?", 80, 88, 2, { align: "center" });
      } else {
        fb.rect(8, 17, 58, 66, 2);
        fb.rect(6, 15, 58, 66, 0);
        fb.frame(6, 15, 58, 66, 3);
        stamp(fb, rasterise(card.writing, 40, 52), 35, 48);
        fb.text("READING", 72, 17, 2);
        const answer = lcdSafe(card.group.startsWith("kanji") ? card.meaning : card.reading);
        fb.text(answer, 72, 25, 3, { font: "m", scale: answer.length > 7 ? 1 : 2 });
        if (card.group.startsWith("kanji")) {
          const reading = rasterise(card.reading, 13, 84);
          stamp(fb, reading, 72 + reading.w / 2, 49);
          fb.text(lcdSafe(card.id.replace(/^v-/, "")), 72, 62, 2);
        } else {
          fb.text(card.group === "hiragana" ? "HIRAGANA" : "KATAKANA", 72, 47, 2);
          fb.text(`SOUNDS LIKE '${lcdSafe(card.reading)}'`, 72, 54, 2);
        }
        fb.text("◀ AGAIN", 72, 88, 3);
        fb.text("GOT IT ▶", 157, 88, 3, { align: "right" });
      }

      if (flash !== 0 && !context.reduced) {
        const level = Math.round(Math.abs(flash) * 6);
        if (flash > 0) fb.ditherRect(0, 11, 160, 89, level, 0);
        flash = flash > 0 ? Math.max(0, flash - context.dt * 3) : Math.min(0, flash + context.dt * 3);
      }
    },
    action(context) {
      if (!selection?.card) {
        if (state) selection = selectNextCard(state);
        context.announce(describeCard());
        return;
      }
      revealed = !revealed;
      const card = selection.card;
      context.announce(revealed ? `${card.writing} reads ${card.reading}${card.meaning ? `, meaning ${card.meaning}` : ""}.` : describeCard());
    },
    prev(context) {
      if (!revealed) return this.action?.(context);
      rate(context, false);
    },
    next(context) {
      if (!revealed) return this.action?.(context);
      rate(context, true);
    },
    leds() {
      if (!state) return fillLeds(0);
      const progress = getStudyProgress(state);
      return fillLeds(progress.total ? Math.max(progress.stable / progress.total, 0.04) : 0);
    },
    describe() {
      return `Kana flashcards. ${describeCard()}`;
    },
    softkeys() {
      return revealed ? ["Again", "Hide", "Got it"] : ["Show", "Show", "Show"];
    },
  };
}
