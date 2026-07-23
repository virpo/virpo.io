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
  if (!audio || !display || !title || !stateLabel || !previous || !next) return;

  let index = 0;
  const isPlaying = () => !audio.paused && !audio.ended;
  const renderState = () => {
    const playing = isPlaying();
    display.classList.toggle("is-playing", playing);
    display.setAttribute("aria-pressed", String(playing));
    display.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${sounds[index].title}`);
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
  const root = document.querySelector("[data-train]");
  const frame = root?.querySelector("[data-train-frame]");
  const toggle = root?.querySelector("[data-train-toggle]");
  if (!root || !frame || !toggle) return;

  const source = frame.src;
  let running = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = () => {
    root.classList.toggle("is-paused", !running);
    toggle.textContent = running ? "pause" : "run";
    toggle.setAttribute("aria-pressed", String(running));
    frame.src = running ? source : "";
  };

  toggle.addEventListener("click", () => {
    running = !running;
    render();
  });
  render();
}

function initializeStudy() {
  const root = document.querySelector("[data-study]");
  const card = root?.querySelector("[data-study-card]");
  const glyph = root?.querySelector("[data-study-glyph]");
  const reading = root?.querySelector("[data-study-reading]");
  const meaning = root?.querySelector("[data-study-meaning]");
  const prompt = root?.querySelector("[data-study-prompt]");
  const progress = root?.querySelector("[data-study-progress]");
  if (!root || !card || !glyph || !reading || !meaning || !prompt || !progress) return;

  const vocabulary = [
    { glyph: "電車", reading: "でんしゃ", meaning: "train" },
    { glyph: "駅", reading: "えき", meaning: "station" },
    { glyph: "空", reading: "そら", meaning: "sky" },
    { glyph: "雨", reading: "あめ", meaning: "rain" },
    { glyph: "喫茶店", reading: "きっさてん", meaning: "coffee shop" },
  ];
  let index = 0;
  try {
    index = Number.parseInt(window.localStorage.getItem("virpo-study-index") || "0", 10);
    if (!Number.isInteger(index) || index < 0 || index >= vocabulary.length) index = 0;
  } catch {
    index = 0;
  }
  let revealed = false;

  const render = () => {
    const item = vocabulary[index];
    glyph.textContent = item.glyph;
    reading.textContent = item.reading;
    meaning.textContent = item.meaning;
    progress.textContent = `${index + 1} / ${vocabulary.length}`;
    card.classList.toggle("is-revealed", revealed);
    prompt.textContent = revealed ? "tap for the next one" : "tap to reveal";
    card.setAttribute(
      "aria-label",
      revealed ? `${item.glyph}, ${item.reading}, ${item.meaning}. Next card` : `Reveal reading for ${item.glyph}`,
    );
  };

  card.addEventListener("click", () => {
    if (!revealed) {
      revealed = true;
    } else {
      index = (index + 1) % vocabulary.length;
      revealed = false;
      try {
        window.localStorage.setItem("virpo-study-index", String(index));
      } catch {
        // Persistence is optional.
      }
    }
    render();
  });
  render();
}

function initializeFocusMenu() {
  const flow = document.querySelector(".content-flow");
  const primary = document.getElementById("primary-field");
  const projects = document.getElementById("projects");
  const intro = document.querySelector("[data-intro]");
  const buttons = [...document.querySelectorAll("[data-focus]")];
  if (!flow || !primary || !projects || !intro || buttons.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mode = "writing";
  const flip = (elements, mutate) => {
    const before = new Map(elements.map((element) => [element, element.getBoundingClientRect()]));
    mutate();
    if (prefersReducedMotion) return;
    elements.forEach((element) => {
      const first = before.get(element);
      const last = element.getBoundingClientRect();
      const x = first.left - last.left;
      const y = first.top - last.top;
      if (Math.abs(x) < 1 && Math.abs(y) < 1) return;
      element.animate(
        [{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }],
        { duration: 340, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    });
  };
  const apply = (nextMode, userInitiated = false) => {
    mode = nextMode;
    flip([primary, projects], () => {
      if (mode === "projects") {
        flow.prepend(projects);
        projects.after(primary);
      } else {
        flow.prepend(primary);
        primary.after(projects);
      }
    });
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.focus === mode));
    });
    document.body.dataset.focusMode = mode;

    if (mode === "about" && userInitiated) {
      intro.focus({ preventScroll: true });
      intro.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    } else if (mode === "projects" && userInitiated) {
      projects.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    } else if (mode === "writing" && userInitiated) {
      primary.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => apply(button.dataset.focus || "writing", true));
  });
  apply(mode, false);
}

initializeBloomTicker();
initializeFaceTracker();
initializeSounds();
initializeTrain();
initializeStudy();
initializeFocusMenu();
