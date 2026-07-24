import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudyToy } from "../../components/toys/StudyToy";
import { allStudyCards, decks } from "../../lib/study/decks";
import { createStudyState } from "../../lib/study/engine";
import {
  LEGACY_STUDY_STORAGE_KEY,
  STUDY_STORAGE_KEY,
} from "../../lib/study/storage";

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.27);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeStable(state: ReturnType<typeof createStudyState>, ids: string[]) {
  for (const id of ids) {
    state.cards[id] = {
      stage: 2,
      dueAt: 0,
      correct: 2,
      wrong: 0,
    };
  }
}

describe("StudyToy", () => {
  it("loads a randomized Kana card with its answer hidden", async () => {
    render(<StudyToy />);

    const card = await screen.findByRole("button", { name: /reveal answer/i });
    const selected = decks.hiragana.find(
      ({ writing }) => writing === card.querySelector("strong")?.textContent,
    );
    expect(card).toBeVisible();
    expect(selected).toBeDefined();
    expect(card.textContent).not.toContain("あ");
    expect(within(card).getByText(selected?.reading ?? "")).not.toBeVisible();
    expect(screen.getByText(/0 \/ 46 stable/i)).toBeVisible();
    expect(screen.queryByRole("group", { name: /rate this answer/i })).toBeNull();
  });

  it("reveals Kana reading, persists a score, and focuses the next card", async () => {
    render(<StudyToy />);
    const card = await screen.findByRole("button", { name: /reveal answer/i });

    fireEvent.click(card);
    const actions = screen.getByRole("group", { name: /rate this answer/i });
    expect(actions).toBeVisible();
    expect(screen.getByText("su")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reveal answer/i })).toHaveFocus();
    });
    const persisted = JSON.parse(
      localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}",
    );
    expect(
      Object.values<{ correct: number }>(persisted.cards).filter(
        (progress) => progress.correct === 1,
      ),
    ).toHaveLength(1);
    expect(screen.queryByRole("group", { name: /rate this answer/i })).toBeNull();
  });

  it("shows a Kanji reading before reveal and its meaning afterward", async () => {
    const state = createStudyState();
    makeStable(
      state,
      decks.hiragana.slice(0, 37).map((card) => card.id),
    );
    makeStable(
      state,
      decks.katakana.slice(0, 37).map((card) => card.id),
    );
    for (const card of allStudyCards) {
      state.cards[card.id].dueAt = Date.now() + 100_000;
    }
    const target = decks.kanji1[0];
    state.cards[target.id].dueAt = 0;
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state));

    render(<StudyToy />);

    const card = await screen.findByRole("button", { name: /reveal answer/i });
    expect(screen.getByText(target.writing)).toBeVisible();
    expect(screen.getByText(target.reading)).toBeVisible();
    expect(screen.getByText(target.meaning)).not.toBeVisible();

    fireEvent.click(card);

    expect(screen.getByText(target.meaning)).toBeVisible();
  });

  it("migrates v1 progress on mount and retains it across remounts", async () => {
    const legacy = JSON.stringify({
      version: 1,
      cards: {
        "h-a": { stage: 2, dueAt: 0, correct: 2, wrong: 1 },
      },
    });
    localStorage.setItem(LEGACY_STUDY_STORAGE_KEY, legacy);

    const first = render(<StudyToy />);
    expect(await screen.findByText(/1 \/ 46 stable/i)).toBeVisible();
    expect(localStorage.getItem(LEGACY_STUDY_STORAGE_KEY)).toBe(legacy);
    first.unmount();

    render(<StudyToy />);
    expect(await screen.findByText(/1 \/ 46 stable/i)).toBeVisible();
  });

  it("resets and persists fresh progress", async () => {
    const state = createStudyState();
    state.cards["h-a"] = {
      stage: 2,
      dueAt: 0,
      correct: 2,
      wrong: 0,
    };
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<StudyToy />);
    expect(await screen.findByText(/1 \/ 46 stable/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /reset progress/i }));

    expect(await screen.findByText(/0 \/ 46 stable/i)).toBeVisible();
    expect(
      JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}").cards["h-a"],
    ).toEqual({ stage: 0, dueAt: 0, correct: 0, wrong: 0 });
  });

  it("keeps future-version bytes through scoring and reports tab-only progress", async () => {
    const raw = '{"version":3,"cards":{},"opaque":"keep"}';
    localStorage.setItem(STUDY_STORAGE_KEY, raw);
    render(<StudyToy />);

    fireEvent.click(
      await screen.findByRole("button", { name: /reveal answer/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(await screen.findByText("Saved for this tab only.")).toBeVisible();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(raw);
  });

  it("keeps future-version bytes through reset and reports tab-only progress", async () => {
    const raw = '{"version":4,"cards":{},"opaque":"keep"}';
    localStorage.setItem(STUDY_STORAGE_KEY, raw);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<StudyToy />);
    await screen.findByRole("button", { name: /reveal answer/i });

    fireEvent.click(screen.getByRole("button", { name: /reset progress/i }));

    expect(await screen.findByText("Saved for this tab only.")).toBeVisible();
    expect(screen.queryByText("Progress reset.")).toBeNull();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(raw);
  });

  it("does not replace a storage failure warning with reset success copy", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Storage blocked", "QuotaExceededError");
      });
    render(<StudyToy />);
    await screen.findByRole("button", { name: /reveal answer/i });

    fireEvent.click(screen.getByRole("button", { name: /reset progress/i }));

    expect(await screen.findByText("Saved for this tab only.")).toBeVisible();
    expect(screen.queryByText("Progress reset.")).toBeNull();
    expect(setItem).toHaveBeenCalled();
  });

  it("keeps Study microtype readable with compact, clear action focus", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(
      /\.studyCard small\s*\{[^}]*font-size:\s*0\.75rem;[^}]*font-weight:\s*700;/s,
    );
    expect(css).toMatch(
      /\.studyProgress,\s*\.studyFooter\s*\{[^}]*font-size:\s*0\.75rem;/s,
    );
    expect(css).toMatch(
      /\.studyActions button\s*\{[^}]*font-size:\s*0\.75rem;/s,
    );
    expect(css).toMatch(
      /\.studyReset\s*\{[^}]*min-height:\s*34px;[^}]*border:\s*1\.5px solid[^}]*border-radius:\s*999px;/s,
    );
    expect(css).toMatch(
      /\.studyActions button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\);[^}]*box-shadow:\s*none;/s,
    );
  });
});
