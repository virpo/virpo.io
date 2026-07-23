function initializeBloomTicker() {
  const root = document.querySelector("[data-bloom-module]");
  const api = window.VirpoJapanData;
  if (!root || !api) return;

  const trigger = root.querySelector("[data-bloom-trigger]");
  const popover = root.querySelector("[data-bloom-popover]");
  const time = root.querySelector("[data-tokyo-time]");
  const emoji = root.querySelector("[data-bloom-emoji]");
  const name = root.querySelector("[data-bloom-name]");
  const countdown = root.querySelector("[data-bloom-countdown]");
  const place = root.querySelector("[data-bloom-place]");
  const windowLabel = root.querySelector("[data-bloom-window]");
  const source = root.querySelector("[data-bloom-source]");
  if (!trigger || !popover || !time) return;

  const monthName = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  });
  const formatWindow = (bloom) => {
    const start = new Date(Date.UTC(2026, bloom.startMonth - 1, bloom.startDay));
    const end = new Date(Date.UTC(2026, bloom.endMonth - 1, bloom.endDay));
    return `Typical window: ${monthName.format(start)} ${bloom.startDay} – ${monthName.format(end)} ${bloom.endDay}`;
  };

  const render = () => {
    const tokyo = api.getTokyoParts();
    const state = api.getBloomState(tokyo);
    time.textContent = tokyo.label;
    time.dateTime = `${tokyo.year}-${String(tokyo.month).padStart(2, "0")}-${String(tokyo.day).padStart(2, "0")}T${tokyo.label}:00+09:00`;

    if (!state.bloom) {
      name.textContent = "Seasonal guide";
      countdown.textContent = state.label;
      return;
    }

    const bloom = state.bloom;
    emoji.textContent = bloom.emoji;
    name.textContent = bloom.name;
    countdown.textContent = state.label;
    place.textContent = `${bloom.place} · ${bloom.region}`;
    windowLabel.textContent = formatWindow(bloom);
    source.href = bloom.sourceUrl;
  };

  const setOpen = (open) => {
    popover.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  };
  const isOpen = () => trigger.getAttribute("aria-expanded") === "true";
  let pointerInitiatedFocus = false;
  let hoverTimer = null;

  trigger.addEventListener("pointerdown", () => {
    window.clearTimeout(hoverTimer);
    pointerInitiatedFocus = true;
    window.setTimeout(() => {
      pointerInitiatedFocus = false;
    }, 0);
  });
  trigger.addEventListener("click", () => setOpen(!isOpen()));
  trigger.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      hoverTimer = window.setTimeout(() => setOpen(true), 140);
    }
  });
  root.addEventListener("pointerleave", (event) => {
    window.clearTimeout(hoverTimer);
    if (event.pointerType === "mouse" && !root.contains(document.activeElement)) setOpen(false);
  });
  root.addEventListener("focusin", () => {
    if (!pointerInitiatedFocus) setOpen(true);
  });
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!root.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  });

  render();
  window.setInterval(render, 60_000);
}

function initializeFaceTracker() {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  document.querySelectorAll("[data-face] .face-tracker").forEach((container) => {
    const image = document.createElement("img");
    const basePath = container.dataset.basePath;
    const P_MIN = -15;
    const P_MAX = 15;
    const STEP = 3;
    image.className = "face-image";
    image.alt = "Peter Hraska";
    container.appendChild(image);

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const quantize = (value) => {
      const raw = P_MIN + ((value + 1) * (P_MAX - P_MIN)) / 2;
      return clamp(Math.round(raw / STEP) * STEP, P_MIN, P_MAX);
    };
    const sanitize = (value) => Number(value).toFixed(1).replace("-", "m").replace(".", "p");
    const filename = (px, py) => `gaze_px${sanitize(px)}_py${sanitize(py)}_256.webp`;
    const renderAt = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      const nx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = ((rect.top + rect.height / 2) - clientY) / (rect.height / 2);
      image.src = `${basePath}${filename(quantize(clamp(nx, -1, 1)), quantize(clamp(ny, -1, 1)))}`;
    };
    const renderNeutral = () => {
      image.src = `${basePath}${filename(0, 0)}`;
    };

    renderNeutral();
    if (finePointer) {
      window.addEventListener("pointermove", (event) => renderAt(event.clientX, event.clientY), {
        passive: true,
      });
    }
  });
}

function initializeSounds() {
  const root = document.querySelector("[data-sounds]");
  if (!root) return;

  const sounds = [
    { title: "FamilyMart entrance", src: "./audio/japan-familymart.mp3" },
    { title: "Door chime", src: "./audio/japan-door-chime.ogg" },
    { title: "Cuckoo crossing", src: "./audio/japan-crosswalk-cuckoo.mp3" },
    { title: "Shibuya announcement", src: "./audio/japan-mamonaku-shibuya.mp3" },
    { title: "Rail crossing", src: "./audio/japan-rail-crossing.mp3" },
    { title: "Shinkansen passing", src: "./audio/japan-shinkansen-pass.mp3" },
    { title: "Summer crickets", src: "./audio/japan-summer-crickets.mp3" },
  ];
  const audio = root.querySelector("[data-sound-audio]");
  const display = root.querySelector("[data-sound-play]");
  const title = root.querySelector("[data-sound-title]");
  const stateLabel = root.querySelector("[data-sound-state]");
  const previous = root.querySelector("[data-sound-prev]");
  const next = root.querySelector("[data-sound-next]");
  const playIcon = root.querySelector("[data-sound-play-icon]");
  const pauseIcon = root.querySelector("[data-sound-pause-icon]");
  if (!audio || !display || !title || !stateLabel || !previous || !next || !playIcon || !pauseIcon) return;

  let index = 0;
  const isPlaying = () => !audio.paused && !audio.ended;
  const renderState = () => {
    const playing = isPlaying();
    display.classList.toggle("is-playing", playing);
    display.setAttribute("aria-pressed", String(playing));
    display.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${sounds[index].title}`);
    playIcon.hidden = playing;
    pauseIcon.hidden = !playing;
    stateLabel.textContent = playing ? "playing · press to pause" : "press to play";
  };
  const load = (nextIndex, autoplay = false) => {
    index = (nextIndex + sounds.length) % sounds.length;
    audio.src = sounds[index].src;
    title.textContent = sounds[index].title;
    renderState();
    if (autoplay) audio.play().catch(() => renderState());
  };
  const step = (direction) => load(index + direction, isPlaying());

  display.addEventListener("click", () => {
    if (isPlaying()) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        stateLabel.textContent = "sound unavailable";
      });
    }
  });
  previous.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  audio.addEventListener("play", renderState);
  audio.addEventListener("pause", renderState);
  audio.addEventListener("ended", () => load(index + 1, false));
  load(0, false);
}

function initializeTrain() {
  const frame = document.querySelector("[data-train-frame]");
  if (!frame) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) frame.src = frame.dataset.trainSrc;
}

function initializeStudy() {
  const root = document.querySelector("[data-study]");
  const api = window.VirpoStudy;
  if (!root || !api) return;

  const storageKey = "virpo-study-v1";
  const level = root.querySelector("[data-study-level]");
  const progress = root.querySelector("[data-study-progress]");
  const due = root.querySelector("[data-study-due]");
  const cardButton = root.querySelector("[data-study-card]");
  const writing = root.querySelector("[data-study-writing]");
  const reading = root.querySelector("[data-study-reading]");
  const meaning = root.querySelector("[data-study-meaning]");
  const prompt = root.querySelector("[data-study-prompt]");
  const actions = root.querySelector("[data-study-actions]");
  const again = root.querySelector("[data-study-again]");
  const gotIt = root.querySelector("[data-study-got-it]");
  const rest = root.querySelector("[data-study-rest]");
  const reset = root.querySelector("[data-study-reset]");
  if (
    ![
      level,
      progress,
      due,
      cardButton,
      writing,
      reading,
      meaning,
      prompt,
      actions,
      again,
      gotIt,
      rest,
      reset,
    ].every(Boolean)
  ) {
    return;
  }

  const labels = {
    hiragana: "Hiragana",
    katakana: "Katakana",
    kanji: "Kanji",
  };
  let state;
  let storageWarning = "";
  try {
    state = api.loadStudyState(window.localStorage.getItem(storageKey));
  } catch {
    state = api.createStudyState();
    storageWarning = "Progress stays here until this tab closes.";
  }
  let current = null;
  let revealed = false;
  let wakeTimer = null;
  let notice = "";

  const persist = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      storageWarning = "";
    } catch {
      storageWarning = "Progress stays here until this tab closes.";
    }
  };

  const render = () => {
    window.clearTimeout(wakeTimer);
    const now = Date.now();
    const stats = api.getStudyProgress(state, now);
    const next = api.getNextStudyCard(state, now);
    current = next.card;
    root.dataset.studyLevel = state.level;
    root.classList.toggle("is-revealed", revealed && Boolean(current));
    level.textContent = labels[state.level];
    progress.textContent = `${stats.mastered} / ${stats.total} learned`;
    due.textContent = `${stats.due} due`;
    actions.hidden = !revealed || !current;
    cardButton.setAttribute("aria-expanded", String(revealed && Boolean(current)));

    if (!current) {
      const waitMs = Math.max(1_000, next.nextDueAt - now);
      writing.textContent = "✓";
      reading.textContent = "";
      meaning.textContent = "";
      reading.hidden = true;
      meaning.hidden = true;
      prompt.textContent = `next card in ${Math.ceil(waitMs / 60_000)} min`;
      rest.textContent = storageWarning || "Saved here. Come back soon.";
      cardButton.disabled = true;
      cardButton.setAttribute("aria-label", "No Japanese Study card is due");
      wakeTimer = window.setTimeout(render, Math.min(waitMs, 60_000));
      return;
    }

    cardButton.disabled = false;
    writing.textContent = current.writing;
    reading.textContent = current.reading;
    meaning.textContent = current.meaning;
    reading.hidden = !revealed && current.level !== "kanji";
    meaning.hidden = !revealed || current.level !== "kanji";
    prompt.textContent = revealed ? "How did it go?" : "tap to reveal";
    rest.textContent = notice || storageWarning;
    notice = "";

    const visibleReading =
      current.level === "kanji" ? `, ${current.reading}` : "";
    cardButton.setAttribute(
      "aria-label",
      revealed
        ? `${current.writing}, ${current.reading}${current.meaning ? `, ${current.meaning}` : ""}`
        : `${current.writing}${visibleReading}. Reveal answer`,
    );
  };

  const score = (correct) => {
    if (!current) return;
    const previousLevel = state.level;
    state = api.scoreStudyCard(state, current.id, correct, Date.now());
    persist();
    revealed = false;
    if (state.level !== previousLevel) {
      notice = `${labels[state.level]} unlocked.`;
    }
    render();
  };

  cardButton.addEventListener("click", () => {
    if (!current || revealed) return;
    revealed = true;
    render();
  });
  again.addEventListener("click", () => score(false));
  gotIt.addEventListener("click", () => score(true));
  reset.addEventListener("click", () => {
    if (!window.confirm("Reset all Japanese Study progress?")) return;
    state = api.createStudyState();
    persist();
    revealed = false;
    notice = "Progress reset.";
    render();
  });

  persist();
  render();
}

initializeBloomTicker();
initializeFaceTracker();
initializeSounds();
initializeTrain();
initializeStudy();
