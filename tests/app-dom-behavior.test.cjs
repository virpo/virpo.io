const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const app = fs.readFileSync("app.js", "utf8");

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    event.target ||= this;
    event.currentTarget = this;
    for (const listener of this.listeners.get(event.type) || []) listener(event);
    return true;
  }
}

class FakeElement extends FakeEventTarget {
  constructor(document, root = null) {
    super();
    this.document = document;
    this.root = root;
    this.attributes = new Map();
    this.classList = { toggle() {} };
    this.dataset = {};
    this.disabled = false;
    this.hidden = false;
    this.href = "";
    this.textContent = "";
    this.queries = new Map();
  }

  querySelector(selector) {
    return this.queries.get(selector) || null;
  }

  contains(element) {
    return element === this || element?.root === this;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  click() {
    this.dispatchEvent({ type: "click", target: this });
  }

  focus() {
    const previous = this.document.activeElement;
    if (previous?.root) {
      previous.root.dispatchEvent({
        type: "focusout",
        target: previous,
        relatedTarget: this,
      });
    }
    this.document.activeElement = this;
    if (this.root) {
      this.root.dispatchEvent({
        type: "focusin",
        target: this,
        relatedTarget: previous,
      });
    }
  }
}

class FakeDocument extends FakeEventTarget {
  constructor() {
    super();
    this.activeElement = null;
    this.queries = new Map();
  }

  querySelector(selector) {
    return this.queries.get(selector) || null;
  }

  querySelectorAll() {
    return [];
  }
}

function addElements(document, root, selectors) {
  const elements = {};
  for (const selector of selectors) {
    const element = new FakeElement(document, root);
    root.queries.set(selector, element);
    elements[selector] = element;
  }
  return elements;
}

function runApp({ bloom = false, study = false } = {}) {
  const document = new FakeDocument();
  let bloomElements = null;
  let studyElements = null;

  if (bloom) {
    const root = new FakeElement(document);
    bloomElements = addElements(document, root, [
      "[data-bloom-trigger]",
      "[data-bloom-popover]",
      "[data-tokyo-time]",
      "[data-bloom-emoji]",
      "[data-bloom-name]",
      "[data-bloom-countdown]",
      "[data-bloom-place]",
      "[data-bloom-window]",
      "[data-bloom-source]",
    ]);
    bloomElements.root = root;
    bloomElements["[data-bloom-trigger]"].setAttribute("aria-expanded", "false");
    bloomElements["[data-bloom-popover]"].hidden = true;
    document.queries.set("[data-bloom-module]", root);
  }

  if (study) {
    const root = new FakeElement(document);
    studyElements = addElements(document, root, [
      "[data-study-level]",
      "[data-study-progress]",
      "[data-study-due]",
      "[data-study-card]",
      "[data-study-writing]",
      "[data-study-reading]",
      "[data-study-meaning]",
      "[data-study-prompt]",
      "[data-study-actions]",
      "[data-study-again]",
      "[data-study-got-it]",
      "[data-study-rest]",
      "[data-study-reset]",
    ]);
    studyElements.root = root;
    studyElements["[data-study-actions]"].hidden = true;
    document.queries.set("[data-study]", root);
  }

  const studyApi = {
    createStudyState: () => ({ level: "hiragana", scored: 0 }),
    loadStudyState: () => ({ level: "hiragana", scored: 0 }),
    getStudyProgress: (state) => ({
      mastered: state.scored,
      total: 2,
      due: 1,
    }),
    getNextStudyCard: (state) => ({
      card: state.scored
        ? { id: "next", level: "hiragana", writing: "い", reading: "i", meaning: "" }
        : { id: "first", level: "hiragana", writing: "あ", reading: "a", meaning: "" },
      nextDueAt: null,
    }),
    scoreStudyCard: (state) => ({ ...state, scored: state.scored + 1 }),
  };
  const storage = new Map();
  const window = {
    VirpoJapanData: {
      getTokyoParts: () => ({
        year: 2026,
        month: 7,
        day: 23,
        label: "21:00",
      }),
      getBloomState: () => ({
        bloom: {
          emoji: "🌻",
          name: "Sunflowers",
          place: "Hokuryu",
          region: "Hokkaido",
          startMonth: 7,
          startDay: 20,
          endMonth: 8,
          endDay: 20,
          sourceUrl: "https://example.com",
        },
        label: "blooming now",
      }),
    },
    VirpoStudy: studyApi,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    matchMedia: () => ({ matches: false }),
    clearTimeout() {},
    setTimeout: () => 1,
    setInterval: () => 1,
    confirm: () => true,
  };

  vm.runInNewContext(app, { console, Date, document, Intl, window });
  return { bloomElements, document, studyElements };
}

test("Escape from the bloom source closes the popover and returns focus to its trigger", () => {
  const { bloomElements, document } = runApp({ bloom: true });
  const trigger = bloomElements["[data-bloom-trigger]"];
  const popover = bloomElements["[data-bloom-popover]"];
  const source = bloomElements["[data-bloom-source]"];

  source.focus();
  assert.equal(popover.hidden, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");

  document.dispatchEvent({ type: "keydown", key: "Escape" });

  assert.equal(popover.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, trigger);
});

test("scoring a revealed study card moves focus to the next card", () => {
  const { document, studyElements } = runApp({ study: true });
  const card = studyElements["[data-study-card]"];
  const actions = studyElements["[data-study-actions]"];
  const gotIt = studyElements["[data-study-got-it]"];
  const writing = studyElements["[data-study-writing]"];

  card.click();
  assert.equal(actions.hidden, false);
  gotIt.focus();
  gotIt.click();

  assert.equal(actions.hidden, true);
  assert.equal(writing.textContent, "い");
  assert.equal(document.activeElement, card);
});
