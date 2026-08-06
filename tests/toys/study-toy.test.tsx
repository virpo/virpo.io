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
  it("accepts a v2 arcade prompt without changing the default deck", async () => {
    render(<StudyToy promptLabel="Click me" />);

    expect(await screen.findByText("Click me")).toBeVisible();
    expect(screen.getByRole("button", { name: /reveal answer/i })).toHaveAccessibleName(
      /Click me/i,
    );
  });

  it("loads a randomized Kana card with its answer hidden", async () => {
    const { container } = render(<StudyToy />);

    const card = await screen.findByRole("button", { name: /reveal answer/i });
    const selected = decks.hiragana.find(
      ({ writing }) => writing === card.querySelector("strong")?.textContent,
    );
    expect(card).toBeVisible();
    expect(selected).toBeDefined();
    expect(card.textContent).not.toContain("あ");
    expect(within(card).getByText(selected?.reading ?? "")).not.toBeVisible();
    expect(screen.getByLabelText("0 of 46 stable")).toBeVisible();
    expect(screen.getByLabelText("46 due")).toBeVisible();
    expect(document.querySelector(".studyConsole")).toBeVisible();
    expect(document.querySelector(".studyStatusLine")).toBeVisible();
    expect(document.querySelector(".studyStats")).toBeNull();
    expect(document.querySelector(".studyStat")).toBeNull();
    expect(document.querySelector(".studyProgressTrack")).toBeNull();
    expect(container.querySelector(".studyHeading .studyBack")).toBeNull();
    expect(container.querySelector(".studyFooter")).toBeNull();
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
    expect(card).toHaveClass("studyCardKanji");
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
    expect(await screen.findByLabelText("1 of 46 stable")).toBeVisible();
    expect(localStorage.getItem(LEGACY_STUDY_STORAGE_KEY)).toBe(legacy);
    first.unmount();

    render(<StudyToy />);
    expect(await screen.findByLabelText("1 of 46 stable")).toBeVisible();
  });

  it("returns from the answer to the same card without resetting progress", async () => {
    const state = createStudyState();
    state.cards["h-a"] = {
      stage: 2,
      dueAt: 0,
      correct: 2,
      wrong: 0,
    };
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state));
    render(<StudyToy />);
    expect(await screen.findByLabelText("1 of 46 stable")).toBeVisible();
    const card = screen.getByRole("button", { name: /reveal answer/i });
    const writing = card.querySelector("strong")?.textContent;

    fireEvent.click(card);
    const back = screen.getByRole("button", { name: "Back to question" });
    expect(back).toBeVisible();
    fireEvent.click(back);

    expect(screen.getByRole("button", { name: /reveal answer/i })).toHaveTextContent(
      writing ?? "",
    );
    expect(screen.queryByRole("group", { name: /rate this answer/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Back to question" })).toBeNull();
    expect(screen.getByLabelText("1 of 46 stable")).toBeVisible();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(JSON.stringify(state));
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
    expect(document.querySelector(".studyNotice")).toBeVisible();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(raw);
  });

  it("uses one compact console with readable controls and no Arial fallback", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    const start = css.indexOf(".studyToy");
    const end = css.indexOf(".homeEditorial", start);
    const studyCss = css.slice(start, end);
    const consoleCss =
      studyCss.match(/\.studyConsole\s*\{([^}]*)}/s)?.[1] ?? "";

    expect(consoleCss).toContain("background: var(--yellow)");
    expect(studyCss).toMatch(
      /\.studyStatusLine\s*\{[^}]*background:\s*transparent;/s,
    );
    expect(studyCss).toMatch(
      /\.studyCard\s*\{[^}]*min-height:\s*44px;[^}]*border:\s*3px solid var\(--ink\);[^}]*background:\s*var\(--paper\);/s,
    );
    expect(studyCss).toMatch(
      /\.studyActions button\s*\{[^}]*min-height:\s*44px;/s,
    );
    expect(studyCss).toMatch(
      /\.studyBack\s*\{[^}]*width:\s*44px;[^}]*min-height:\s*44px;[^}]*border:\s*0;/s,
    );
    expect(studyCss).toMatch(
      /\.studyBack::before\s*\{[^}]*inset:\s*4px;[^}]*border:\s*2px solid var\(--ink\);/s,
    );
    expect(studyCss).toMatch(
      /\.studyActions button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\);[^}]*box-shadow:\s*none;/s,
    );
    expect(studyCss).not.toMatch(/Arial|Helvetica/);
  });
});
