"use client";

import { useEffect, useRef, useState } from "react";
import {
  createStudyState,
  getStudyProgress,
  scoreCard,
  selectNextCard,
} from "../../lib/study/engine";
import {
  loadStoredStudyState,
  saveStudyState,
} from "../../lib/study/storage";
import type {
  StudyGroup,
  StudySelection,
  StudyState,
} from "../../lib/study/types";

const groupLabels: Record<StudyGroup, string> = {
  hiragana: "Hiragana",
  katakana: "Katakana",
  "kanji-1": "Kanji · landscape",
  "kanji-2": "Kanji · people",
  "kanji-3": "Kanji · movement",
  "kanji-4": "Kanji · everyday",
};

function select(state: StudyState) {
  return selectNextCard(state, Date.now(), Math.random);
}

function formatWait(nextDueAt: number) {
  const minutes = Math.max(1, Math.ceil((nextDueAt - Date.now()) / 60_000));
  return `Next card in ${minutes} min`;
}

export function StudyToy({ promptLabel = "Tap to reveal" }: { promptLabel?: string }) {
  const [state, setState] = useState<StudyState | null>(null);
  const [selection, setSelection] = useState<StudySelection | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState("");
  const cardButtonRef = useRef<HTMLButtonElement>(null);
  const focusNextCard = useRef(false);

  useEffect(() => {
    const loaded = loadStoredStudyState();
    persist(loaded);
    setState(loaded);
    setSelection(select(loaded));
  }, []);

  useEffect(() => {
    if (!state || selection?.card || !selection) return;
    const wait = Math.max(
      1_000,
      Math.min(60_000, selection.nextDueAt - Date.now()),
    );
    const timer = window.setTimeout(() => setSelection(select(state)), wait);
    return () => window.clearTimeout(timer);
  }, [selection, state]);

  useEffect(() => {
    if (!focusNextCard.current || !selection?.card || revealed) return;
    focusNextCard.current = false;
    cardButtonRef.current?.focus();
  }, [revealed, selection]);

  if (!state || !selection) {
    return (
      <section
        className="tile studyToy"
        data-study-toy
        aria-label="Japanese Study"
      >
        <header className="toyHeading">
          <h2>Japanese Study</h2>
          <span>Loading deck…</span>
        </header>
        <div className="studyLoading" aria-live="polite">
          べんきょう
        </div>
      </section>
    );
  }

  const progress = getStudyProgress(state);
  const currentGroup =
    selection.card?.group ?? progress.unlockedGroups.at(-1) ?? "hiragana";
  const isKanji = selection.card?.group.startsWith("kanji-") ?? false;

  function persist(next: StudyState) {
    try {
      if (!saveStudyState(next)) {
        setNotice("Saved for this tab only.");
        return false;
      }
      setNotice("");
      return true;
    } catch {
      setNotice("Saved for this tab only.");
      return false;
    }
  }

  function rate(correct: boolean) {
    if (!selection?.card || !state) return;
    const next = scoreCard(state, selection.card.id, correct, Date.now());
    persist(next);
    focusNextCard.current = true;
    setState(next);
    setRevealed(false);
    setSelection(select(next));
  }

  function reset() {
    if (!window.confirm("Reset all Japanese Study progress?")) return;
    const next = createStudyState();
    const saved = persist(next);
    setState(next);
    setRevealed(false);
    setSelection(select(next));
    if (saved) setNotice("Progress reset.");
  }

  return (
    <section
      className="tile studyToy"
      data-study-toy
      aria-label="Japanese Study"
    >
      <header className="toyHeading studyHeading">
        <h2>Japanese Study</h2>
        <div className="studyHeadingTools">
          <span>{groupLabels[currentGroup]}</span>
          <button
            className="studyReset"
            type="button"
            aria-label="Reset progress"
            onClick={reset}
          >
            <span aria-hidden="true">↺</span>
          </button>
        </div>
      </header>

      <div className="studyConsole">
        <div className="studyStatusLine" aria-label="Study progress">
          <span
            className="studyStatusValue"
            aria-label={`${progress.stable} of ${progress.total} stable`}
          >
            <span className="studyStatIcon" aria-hidden="true">
              {progress.stable > 0 ? "★" : "☆"}
            </span>
            <strong>
              {progress.stable}
              <i aria-hidden="true">/{progress.total}</i>
            </strong>
            <small>stable</small>
          </span>
          <progress
            aria-label={`${progress.stable} of ${progress.total} cards stable`}
            max={progress.total}
            value={progress.stable}
          />
          <span className="studyStatusValue" aria-label={`${progress.due} due`}>
            <span className="studyStatIcon" aria-hidden="true">
              ↻
            </span>
            <strong>{progress.due}</strong>
            <small>due</small>
          </span>
        </div>

        {selection.card ? (
          <>
            <button
              ref={cardButtonRef}
              className="studyCard"
              type="button"
              aria-expanded={revealed}
              aria-label={
                revealed
                  ? `${selection.card.writing}, ${selection.card.reading}${
                      selection.card.meaning
                        ? `, ${selection.card.meaning}`
                        : ""
                    }`
                  : `${selection.card.writing}${
                      isKanji ? `, ${selection.card.reading}` : ""
                    }. Reveal answer`
              }
              onClick={() => setRevealed(true)}
            >
              <strong lang="ja">{selection.card.writing}</strong>
              <span
                className="studyReading"
                lang={isKanji ? "ja" : "en"}
                hidden={!isKanji && !revealed}
              >
                {selection.card.reading}
              </span>
              <span className="studyMeaning" hidden={!isKanji || !revealed}>
                {selection.card.meaning}
              </span>
              <small className={revealed ? undefined : "studyPrompt"}>
                {revealed ? "How did it go?" : promptLabel}
              </small>
            </button>

            {revealed ? (
              <div
                className="studyActions"
                role="group"
                aria-label="Rate this answer"
              >
                <button type="button" onClick={() => rate(false)}>
                  Again
                </button>
                <button
                  className="studyGotIt"
                  type="button"
                  onClick={() => rate(true)}
                >
                  Got it
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="studyRest" aria-live="polite">
            <strong aria-hidden="true">✓</strong>
            <span>{formatWait(selection.nextDueAt)}</span>
          </div>
        )}

        {notice ? (
          <p className="studyNotice" aria-live="polite">
            {notice}
          </p>
        ) : null}
      </div>
    </section>
  );
}
