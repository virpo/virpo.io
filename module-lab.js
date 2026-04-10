const moduleIcons = {
  play: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="icon-fill" d="M8 6.75 18 12 8 17.25Z"></path>
    </svg>
  `,
  pause: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect class="icon-fill" x="7" y="6" width="3.6" height="12" rx="1.3"></rect>
      <rect class="icon-fill" x="13.4" y="6" width="3.6" height="12" rx="1.3"></rect>
    </svg>
  `,
  reset: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 8.5A8 8 0 1 0 20 12"></path>
      <path d="M19 4.5v4h-4"></path>
    </svg>
  `,
  next: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="icon-fill" d="M6 6.75 14.2 12 6 17.25Z"></path>
      <path class="icon-fill" d="M13.4 6.75 21.6 12 13.4 17.25Z"></path>
    </svg>
  `,
  spark: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="icon-fill" d="m12 2.8 1.9 5.4 5.4 1.9-5.4 1.9-1.9 5.4-1.9-5.4-5.4-1.9 5.4-1.9Z"></path>
      <path d="m18.4 15.6.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z"></path>
    </svg>
  `,
  x: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        class="icon-fill"
        d="M18.7 3h2.7l-5.9 6.8L22.5 21h-5.5l-4.3-5.7L7.8 21H5.1l6.3-7.2L4.5 3H10l3.9 5.2Zm-1 16.3h1.5L9.2 4.6H7.6Z"
      ></path>
    </svg>
  `,
  github: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        class="icon-fill"
        d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.47.09.64-.2.64-.46v-1.66c-2.62.57-3.17-1.12-3.17-1.12-.43-1.07-1.04-1.36-1.04-1.36-.85-.56.06-.55.06-.55.94.07 1.43.95 1.43.95.83 1.41 2.19 1 2.72.76.08-.59.33-1 .59-1.22-2.1-.24-4.31-1.04-4.31-4.65 0-1.03.38-1.87.99-2.53-.1-.24-.43-1.22.09-2.54 0 0 .81-.26 2.64.97A9.3 9.3 0 0 1 12 7.3c.82 0 1.65.11 2.42.33 1.83-1.23 2.64-.97 2.64-.97.52 1.32.19 2.3.09 2.54.61.66.99 1.5.99 2.53 0 3.62-2.21 4.4-4.32 4.64.34.29.64.85.64 1.72v2.55c0 .26.17.56.65.46A9.5 9.5 0 0 0 12 2.5Z"
      ></path>
    </svg>
  `,
};

function setModuleIcon(target, name) {
  if (!target) return;
  target.innerHTML = moduleIcons[name] ?? "";
}

function initializeModuleIcons() {
  document.querySelectorAll("[data-icon]").forEach((element) => {
    setModuleIcon(element, element.dataset.icon);
  });
}

function initializeSavedStyle() {
  const saved = window.localStorage.getItem("virpo-style-state");
  if (!saved) {
    document.body.classList.add("font-serif", "palette-cherry", "corners-round");
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    document.body.classList.remove("font-pixel", "font-sans", "font-serif");
    document.body.classList.remove("palette-cherry", "palette-ember", "palette-cobalt", "palette-mint", "palette-gold");
    document.body.classList.remove("corners-sharp", "corners-round", "corners-pixel");

    if (parsed.theme === "dark") {
      document.body.classList.add("theme-dark");
    }

    document.body.classList.add(parsed.font || "font-serif");
    document.body.classList.add(parsed.palette || "palette-cherry");
    document.body.classList.add(parsed.corners || "corners-round");
  } catch {
    document.body.classList.add("font-serif", "palette-cherry", "corners-round");
  }
}

let youTubeIframeApiPromise;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youTubeIframeApiPromise) return youTubeIframeApiPromise;

  youTubeIframeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector("script[data-youtube-iframe-api]");
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.youtubeIframeApi = "true";
    script.onerror = () => reject(new Error("Failed to load YouTube Iframe API"));
    document.head.append(script);
  });

  return youTubeIframeApiPromise;
}

function getTokyoParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    label: `${map.hour}:${map.minute}`,
  };
}

function initializePomodoro() {
  const root = document.querySelector("[data-pomodoro]");
  if (!root) return;

  const timeEl = root.querySelector("[data-pomodoro-time]");
  const toggleButton = root.querySelector("[data-pomodoro-toggle]");
  const resetButton = root.querySelector("[data-pomodoro-reset]");
  const toggleIcon = root.querySelector("[data-icon-slot='pomodoro-toggle']");
  const pips = [...root.querySelectorAll(".pomodoro-pip")];
  const modeButtons = [...root.querySelectorAll("[data-pomodoro-mode]")];
  const durations = { 10: 10 * 60, 25: 25 * 60, 50: 50 * 60 };

  let mode = "25";
  let totalSeconds = durations[mode];
  let remaining = totalSeconds;
  let running = false;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  };

  const render = () => {
    timeEl.textContent = formatTime(remaining);
    setModuleIcon(toggleIcon, running ? "pause" : "play");
    toggleButton.setAttribute("aria-label", running ? "Pause pomodoro" : "Start pomodoro");

    modeButtons.forEach((button) => {
      const isActive = button.dataset.pomodoroMode === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const progress = Math.min(1, Math.max(0, (totalSeconds - remaining) / totalSeconds));
    const lit = Math.floor(progress * pips.length);
    pips.forEach((pip, index) => {
      pip.classList.toggle("is-on", index < lit);
    });
  };

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.pomodoroMode;
      totalSeconds = durations[mode];
      remaining = totalSeconds;
      running = false;
      render();
    });
  });

  toggleButton.addEventListener("click", () => {
    running = !running;
    render();
  });

  resetButton.addEventListener("click", () => {
    running = false;
    remaining = totalSeconds;
    render();
  });

  window.setInterval(() => {
    if (!running) return;
    remaining = Math.max(0, remaining - 1);
    if (remaining === 0) running = false;
    render();
  }, 1000);

  render();
}

function initializeTokyoNow() {
  const root = document.querySelector("[data-tokyo-now]");
  if (!root) return;

  const timeEl = root.querySelector("[data-tokyo-time]");
  const tempEl = root.querySelector("[data-tokyo-temp]");
  const conditionEl = root.querySelector("[data-tokyo-condition]");
  const phaseEl = root.querySelector("[data-tokyo-phase]");
  const seasonBadgeEl = root.querySelector("[data-tokyo-season-badge]");
  const seasonTitleEl = root.querySelector("[data-tokyo-season-title]");
  const seasonMetaEl = root.querySelector("[data-tokyo-season-meta]");

  const seasonalMoments = [
    { month: 2, day: 15, badge: "🌸", title: "Plum starts", windowDays: 10 },
    { month: 3, day: 27, badge: "🌸", title: "Sakura peak", windowDays: 12 },
    { month: 6, day: 14, badge: "🪻", title: "Hydrangea season", windowDays: 14 },
    { month: 7, day: 27, badge: "🎆", title: "Summer fireworks", windowDays: 10 },
    { month: 11, day: 24, badge: "🍁", title: "Red leaves peak", windowDays: 16 },
    { month: 12, day: 10, badge: "✨", title: "Winter lights", windowDays: 20 },
  ];

  const weatherLabelForCode = (code, isDay) => {
    if (code === 0) return isDay ? "Clear" : "Clear night";
    if ([1, 2].includes(code)) return "Fair";
    if (code === 3) return "Cloudy";
    if ([45, 48].includes(code)) return "Mist";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Storm";
    return "Weather";
  };

  const phaseForHour = (hour) => {
    if (hour < 5) return "last train";
    if (hour < 9) return "morning";
    if (hour < 15) return "daylight";
    if (hour < 19) return "golden";
    if (hour < 23) return "evening";
    return "night";
  };

  const daysBetween = (from, to) => Math.ceil((to - from) / 86_400_000);

  const seasonalState = (now) => {
    const currentDate = new Date(Date.UTC(now.year, now.month - 1, now.day));
    const candidates = seasonalMoments.flatMap((moment) => {
      const currentYear = new Date(Date.UTC(now.year, moment.month - 1, moment.day));
      const nextYear = new Date(Date.UTC(now.year + 1, moment.month - 1, moment.day));
      return [
        { ...moment, date: currentYear },
        { ...moment, date: nextYear },
      ];
    });

    const insideWindow = candidates.find((item) => {
      if (item.date > currentDate) return false;
      const end = new Date(item.date.getTime() + (item.windowDays - 1) * 86_400_000);
      return currentDate <= end;
    });

    if (insideWindow) {
      const end = new Date(insideWindow.date.getTime() + (insideWindow.windowDays - 1) * 86_400_000);
      const left = Math.max(0, daysBetween(currentDate, end));
      return {
        badge: insideWindow.badge,
        title: insideWindow.title,
        meta: left <= 1 ? "right now" : `${left} days left`,
      };
    }

    const next = candidates
      .filter((item) => item.date >= currentDate)
      .sort((a, b) => a.date - b.date)[0];

    return {
      badge: next.badge,
      title: next.title,
      meta: `in ${daysBetween(currentDate, next.date)} days`,
    };
  };

  const renderClock = () => {
    const now = getTokyoParts();
    const season = seasonalState(now);
    timeEl.textContent = now.label;
    phaseEl.textContent = phaseForHour(now.hour);
    seasonBadgeEl.textContent = season.badge;
    seasonTitleEl.textContent = season.title;
    seasonMetaEl.textContent = season.meta;
  };

  const fetchWeather = async () => {
    try {
      const url =
        "https://api.open-meteo.com/v1/jma?latitude=35.6764&longitude=139.6500&current=temperature_2m,weather_code,is_day&timezone=Asia%2FTokyo&forecast_days=1";
      const response = await fetch(url);
      if (!response.ok) throw new Error(`tokyo weather failed: ${response.status}`);
      const data = await response.json();
      const current = data.current;
      tempEl.textContent = `${Math.round(current.temperature_2m)}°`;
      conditionEl.textContent = weatherLabelForCode(current.weather_code, current.is_day === 1);
    } catch (error) {
      console.error(error);
      tempEl.textContent = "--°";
      conditionEl.textContent = "Tokyo weather";
    }
  };

  renderClock();
  fetchWeather();
  window.setInterval(renderClock, 30_000);
  window.setInterval(fetchWeather, 15 * 60 * 1000);
}

function initializeSideQuest() {
  const root = document.querySelector("[data-side-quest]");
  if (!root) return;

  const rollButton = root.querySelector("[data-side-quest-roll]");
  const shareLink = root.querySelector("[data-side-quest-share]");
  const reels = {
    a: root.querySelector("[data-slot-reel='verb']"),
    b: root.querySelector("[data-slot-reel='place']"),
    c: root.querySelector("[data-slot-reel='vibe']"),
  };

  const questBank = [
    ["Watch", "sunset", "with a friend"],
    ["Order", "dessert", "first"],
    ["Walk", "somewhere new", "after dinner"],
    ["Call", "someone you miss", "tonight"],
    ["Buy", "flowers", "for your room"],
    ["Read", "at a cafe", "for 20 minutes"],
    ["Take", "the long route", "home"],
    ["Try", "a pastry", "you never pick"],
    ["Sit", "by water", "without headphones"],
    ["Bring", "coffee", "to somebody"],
    ["Write", "a postcard", "and send it"],
    ["Take", "three photos", "of small details"],
    ["Eat", "outside", "if it is warm"],
    ["Visit", "a bookstore", "with no plan"],
    ["Sketch", "a doorway", "in five minutes"],
    ["Ride", "one stop extra", "just to look"],
    ["Make", "a better breakfast", "than usual"],
    ["Cook", "noodles", "properly"],
    ["Find", "a quiet street", "behind yours"],
    ["Wear", "the nice thing", "for no reason"],
    ["Meet", "a friend", "before sunset"],
    ["Take", "your lunch", "to a bench"],
    ["Leave", "work on time", "once this week"],
    ["Go", "to the market", "before noon"],
    ["Walk", "for an hour", "with one song"],
    ["Pick", "a film", "you meant to watch"],
    ["Try", "the tiny place", "with three tables"],
    ["Bring", "fruit", "to the office"],
    ["Write", "one good note", "to someone"],
    ["Watch", "the rain", "from somewhere dry"],
    ["Plan", "a day trip", "for later"],
    ["Take", "a notebook", "to lunch"],
    ["Find", "a new view", "of your city"],
    ["Eat", "ramen", "with extra patience"],
    ["Call", "your family", "before bed"],
    ["Buy", "a magazine", "for the cover"],
    ["Catch", "golden hour", "after work"],
    ["Watch", "city lights", "come on"],
    ["Find", "your new lunch", "nearby"],
    ["Take", "your camera", "after dinner"],
    ["Bring", "cake", "to somebody"],
    ["Walk", "until the song ends", "then keep going"],
    ["Buy", "the weird snack", "just once"],
    ["Find", "a side street", "with good light"],
    ["Take", "a book", "to the park"],
    ["Write", "a tiny plan", "for one day trip"],
    ["Try", "that cafe", "you always pass"],
    ["Send", "a voice note", "instead of text"],
    ["Go", "to the river", "before breakfast"],
    ["Watch", "trains arrive", "for ten minutes"],
    ["Find", "the oldest tree", "on your route"],
    ["Bring", "water", "on your walk"],
    ["Draw", "your window view", "badly"],
    ["Eat", "breakfast", "somewhere sunny"],
    ["Listen", "to an album", "start to finish"],
    ["Take", "one flower photo", "like it matters"],
    ["Visit", "a gallery", "on a weekday"],
    ["Find", "the best bench", "nearby"],
    ["Buy", "one thing", "from a corner shop"],
    ["Walk", "without your phone", "for fifteen minutes"],
    ["Try", "the soup", "of the day"],
    ["Read", "poems", "before sleep"],
    ["Take", "a tram", "for no reason"],
    ["Notice", "five signs", "you never read"],
    ["Learn", "one tree name", "this week"],
    ["Bring", "something sweet", "to someone"],
    ["Wake", "up early", "for a slow start"],
    ["Take", "the stairs", "all the way"],
    ["Spend", "ten minutes", "under the sun"],
    ["Pick", "a window seat", "on purpose"],
    ["Take", "a long shower", "with no rush"],
    ["Write", "down one idea", "before lunch"],
    ["Buy", "fresh bread", "on the way home"],
    ["Go", "to a museum", "for one room"],
    ["Find", "a small gift", "for future you"],
    ["Sit", "in silence", "for five minutes"],
    ["Wear", "your favorite shoes", "to nowhere special"],
    ["Make", "iced coffee", "at home"],
    ["Take", "a different bridge", "across town"],
    ["Photograph", "one reflection", "after dark"],
    ["Read", "the first chapter", "in a bookstore"],
    ["Bring", "lunch outside", "if the sky allows"],
    ["Watch", "one old film", "this week"],
    ["Find", "the best pastry", "before noon"],
    ["Leave", "one compliment", "behind you"],
    ["Order", "the daily special", "without checking reviews"],
    ["Take", "an evening walk", "before bed"],
    ["Listen", "at a station", "with your eyes closed"],
    ["Buy", "fruit", "from the market"],
    ["Visit", "a flower shop", "just to look"],
    ["Take", "a sketchbook", "to a cafe"],
    ["Walk", "to the last stop", "then back"],
    ["Find", "one new shortcut", "through your city"],
    ["Make", "tea", "in your nicest cup"],
    ["Read", "under a tree", "if you can"],
    ["Watch", "the sky change", "for fifteen minutes"],
    ["Call", "an older relative", "before Sunday"],
    ["Try", "a lunch set", "you cannot pronounce"],
    ["Take", "one portrait", "of a friend"],
    ["Learn", "one station name", "in Japanese"],
    ["Find", "a rooftop view", "before dark"],
    ["Visit", "a record shop", "and ask for something"],
    ["Draw", "the same object", "twice"],
    ["Save", "one address", "worth returning to"],
    ["Buy", "a postcard", "from your city"],
    ["Sit", "somewhere elegant", "with cheap coffee"],
    ["Take", "a morning photo", "before work"],
    ["Walk", "after the rain", "before it dries"],
    ["Order", "something seasonal", "this week"],
    ["Find", "one beautiful package", "in a shop"],
    ["Make", "room noodles", "feel luxurious"],
    ["Watch", "one street corner", "for five minutes"],
    ["Learn", "one cloud name", "this week"],
    ["Take", "the upstairs seat", "if you find one"],
    ["Read", "one essay", "very slowly"],
    ["Bring", "pastries", "to morning work"],
    ["Try", "a matinee", "instead of streaming"],
    ["Buy", "one flower", "not a bouquet"],
    ["Spend", "an hour", "somewhere with no agenda"],
    ["Find", "a quiet cafe", "before the rush"],
    ["Photograph", "neon reflections", "after rain"],
    ["Visit", "one neighborhood", "you rarely choose"],
    ["Pack", "a tiny picnic", "for two"],
    ["Learn", "one new word", "from a sign"],
    ["Write", "tomorrow down", "before sleeping"],
    ["Take", "the scenic route", "to dinner"],
    ["Try", "a set menu", "you did not plan"],
    ["Walk", "with no podcast", "after lunch"],
    ["Find", "one blue thing", "worth photographing"],
    ["Share", "your favorite spot", "with someone"],
    ["Watch", "the first train", "leave the station"],
    ["Try", "a corner table", "and stay longer"],
    ["Buy", "something yellow", "because it feels right"],
    ["Read", "one long article", "with your phone away"],
    ["Take", "a detour", "for good light"],
    ["Notice", "what smells good", "on your street"],
    ["Visit", "a bakery", "before it sells out"],
    ["Bring", "sparkling water", "to the park"],
    ["Find", "a building detail", "you always miss"],
    ["Write", "one page", "before breakfast"],
  ];
  const quests = questBank.map(([a, b, c]) => ({ a, b, c }));

  const today = new Date();
  const jan1 = new Date(today.getFullYear(), 0, 1);
  const week = Math.ceil((((today - jan1) / 86400000) + jan1.getDay() + 1) / 7);
  const storageKey = `virpo-side-quest-week-${today.getFullYear()}-${week}`;

  const fullText = (quest) => `${quest.a} ${quest.b} ${quest.c}`;
  const encodeIntent = (quest) =>
    `https://x.com/intent/tweet?text=${encodeURIComponent(`I did this week's Side Quest: ${fullText(quest)} · virpo.io`)}`;

  const sameQuest = (left, right) => left && right && left.a === right.a && left.b === right.b && left.c === right.c;
  const pickQuest = (exclude = null) => {
    if (quests.length === 1) return quests[0];
    let next = quests[Math.floor(Math.random() * quests.length)];
    while (exclude && sameQuest(next, exclude)) {
      next = quests[Math.floor(Math.random() * quests.length)];
    }
    return next;
  };

  const itemClassForText = (text) => {
    const length = text.length;
    if (length > 21) return "side-quest-slot__item is-tight";
    if (length > 13) return "side-quest-slot__item is-compact";
    return "side-quest-slot__item";
  };

  const paintReel = (element, values, finalValue) => {
    const sequence = values.concat(finalValue);
    element.innerHTML = sequence.map((item) => `<span class="${itemClassForText(item)}">${item}</span>`).join("");
    const itemHeight = element.firstElementChild?.getBoundingClientRect().height ?? 92;
    element.style.transition = "none";
    element.style.transform = "translateY(0)";
    element.getBoundingClientRect();
    element.style.transition = `transform ${920 + values.length * 55}ms cubic-bezier(0.18, 0.86, 0.16, 1)`;
    element.style.transform = `translateY(-${(sequence.length - 1) * itemHeight}px)`;
  };

  const renderQuest = (quest, animate = false) => {
    const filler = (field, count) => Array.from({ length: count }, () => pickQuest(quest)[field]);

    if (animate) {
      paintReel(reels.a, filler("a", 7), quest.a);
      paintReel(reels.b, filler("b", 9), quest.b);
      paintReel(reels.c, filler("c", 11), quest.c);
    } else {
      Object.entries(reels).forEach(([key, element]) => {
        element.innerHTML = `<span class="${itemClassForText(quest[key])}">${quest[key]}</span>`;
        element.style.transform = "translateY(0)";
      });
    }

    shareLink.href = encodeIntent(quest);
  };

  const saveQuest = (quest) => {
    window.localStorage.setItem(storageKey, JSON.stringify(quest));
  };

  const readQuest = () => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      return saved && saved.a && saved.b && saved.c ? saved : null;
    } catch {
      return null;
    }
  };

  let currentQuest = readQuest() || pickQuest();
  if (!readQuest()) saveQuest(currentQuest);
  renderQuest(currentQuest, false);

  rollButton.addEventListener("click", () => {
    currentQuest = pickQuest(currentQuest);
    saveQuest(currentQuest);
    renderQuest(currentQuest, true);
  });
}

function initializeJapanSounds() {
  const root = document.querySelector("[data-japan-sounds]");
  if (!root) return;

  const queueEl = root.querySelector("[data-sound-queue]");
  const prevEl = root.querySelector("[data-sound-prev]");
  const currentEl = root.querySelector("[data-sound-current]");
  const nextEl = root.querySelector("[data-sound-next]");
  const playButton = root.querySelector("[data-sound-play]");
  const nextButton = root.querySelector("[data-sound-next-button]");
  const playIcon = root.querySelector("[data-sound-play-icon]");
  const youtubeHost = root.querySelector("[data-sound-youtube-host]");
  const bars = [...root.querySelectorAll(".sound-bar")];
  const audioNodes = Object.fromEntries(
    [...root.querySelectorAll("audio[data-audio]")].map((audio) => [audio.dataset.audio, audio]),
  );

  const sounds = [
    { id: "familymart", title: "FamilyMart entrance", bars: [16, 30, 46, 28, 14] },
    { id: "door", title: "Door chime", bars: [12, 26, 44, 18, 34] },
    {
      id: "cuckoo",
      title: "Cuckoo / Ka-kakko",
      bars: [14, 28, 18, 32, 16],
      youtube: { videoId: "hwao-5UI754", startSeconds: 4, endSeconds: 12 },
    },
    {
      id: "piyo",
      title: "Piyo / Piyo-piyo",
      bars: [12, 22, 38, 24, 14],
      youtube: { videoId: "opqh-AEiAsw", startSeconds: 2, endSeconds: 10 },
    },
    {
      id: "announce",
      title: "Mamonaku Shibuya",
      bars: [10, 18, 34, 26, 14],
      youtube: { videoId: "MS31alvlsK8", startSeconds: 0, endSeconds: 10 },
    },
    { id: "crossing", title: "Rail crossing bells", bars: [12, 18, 30, 42, 20] },
    { id: "crickets", title: "Summer crickets", bars: [8, 14, 24, 16, 10] },
  ];

  let currentIndex = 0;
  let playing = false;
  let youTubePlayer = null;
  let activeYouTubeSoundId = null;
  let suppressYouTubeEnded = false;
  let youTubeUnavailable = false;

  const currentSound = () => sounds[currentIndex];
  const prevSound = () => sounds[(currentIndex - 1 + sounds.length) % sounds.length];
  const nextSound = () => sounds[(currentIndex + 1) % sounds.length];
  const currentAudio = () => audioNodes[currentSound().id];

  const ensureYouTubePlayer = async () => {
    if (youTubeUnavailable || !youtubeHost) return null;
    if (youTubePlayer) return youTubePlayer;

    try {
      const YT = await loadYouTubeIframeApi();
      youTubePlayer = await new Promise((resolve) => {
        const player = new YT.Player(youtubeHost, {
          width: "1",
          height: "1",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => resolve(player),
            onStateChange: async (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                if (suppressYouTubeEnded || !playing || currentSound().id !== activeYouTubeSoundId) return;
                await jumpTo(currentIndex + 1, { autoplay: true, restart: true });
              }

              if (event.data === YT.PlayerState.PLAYING && currentSound().id === activeYouTubeSoundId) {
                playing = true;
                render();
              }
            },
            onError: () => {
              youTubeUnavailable = true;
              youTubePlayer = null;
            },
          },
        });
      });
      return youTubePlayer;
    } catch (error) {
      console.error(error);
      youTubeUnavailable = true;
      return null;
    }
  };

  const stopAll = ({ resetTime = false } = {}) => {
    Object.values(audioNodes).forEach((audio) => {
      audio.pause();
      if (resetTime) {
        audio.currentTime = 0;
      }
    });

    if (youTubePlayer) {
      suppressYouTubeEnded = true;
      activeYouTubeSoundId = null;
      try {
        youTubePlayer.stopVideo();
      } catch (error) {
        console.error(error);
      }
      window.setTimeout(() => {
        suppressYouTubeEnded = false;
      }, 0);
    }
  };

  const render = () => {
    prevEl.textContent = prevSound().title;
    currentEl.textContent = currentSound().title;
    nextEl.textContent = nextSound().title;
    bars.forEach((bar, index) => {
      bar.style.height = `${currentSound().bars[index]}px`;
      bar.classList.toggle("is-on", playing);
    });
    setModuleIcon(playIcon, playing ? "pause" : "play");
  };

  const animateQueue = (direction) => {
    if (!queueEl || !queueEl.animate) return;
    const distance = direction === 1 ? -10 : 10;
    queueEl.animate(
      [
        { transform: `translateY(${distance}px)`, opacity: 0.84 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      {
        duration: 240,
        easing: "cubic-bezier(0.2, 0.8, 0.16, 1)",
      },
    );
  };

  const playLocal = async (sound, { restart = false } = {}) => {
    const audio = audioNodes[sound.id];
    if (!audio) return false;
    stopAll();
    if (restart) audio.currentTime = 0;

    try {
      await audio.play();
      playing = true;
      activeYouTubeSoundId = null;
    } catch (error) {
      console.error(error);
      playing = false;
    }
    render();
    return playing;
  };

  const playYouTube = async (sound) => {
    const player = await ensureYouTubePlayer();
    if (!player) return false;
    stopAll();
    activeYouTubeSoundId = sound.id;

    try {
      player.loadVideoById({
        videoId: sound.youtube.videoId,
        startSeconds: sound.youtube.startSeconds ?? 0,
        endSeconds: sound.youtube.endSeconds,
        suggestedQuality: "small",
      });
      playing = true;
    } catch (error) {
      console.error(error);
      playing = false;
      activeYouTubeSoundId = null;
    }
    render();
    return playing;
  };

  const playCurrent = async ({ restart = false } = {}) => {
    const sound = currentSound();
    if (sound.youtube && !youTubeUnavailable) {
      const played = await playYouTube(sound);
      if (played) return;
    }
    await playLocal(sound, { restart });
  };

  const jumpTo = async (nextIndex, { autoplay = playing, restart = true } = {}) => {
    const direction = nextIndex > currentIndex ? 1 : -1;
    stopAll({ resetTime: true });
    currentIndex = (nextIndex + sounds.length) % sounds.length;
    animateQueue(direction);
    if (autoplay) {
      await playCurrent({ restart });
      return;
    }
    playing = false;
    render();
  };

  Object.values(audioNodes).forEach((audio) => {
    audio.addEventListener("ended", async () => {
      if (!playing) return;
      await jumpTo(currentIndex + 1, { autoplay: true, restart: true });
    });
  });

  playButton.addEventListener("click", async () => {
    const sound = currentSound();

    if (playing) {
      const localAudio = currentAudio();
      localAudio?.pause();
      if (activeYouTubeSoundId === sound.id && youTubePlayer) {
        try {
          youTubePlayer.pauseVideo();
        } catch (error) {
          console.error(error);
        }
      }
      playing = false;
      render();
      return;
    }

    if (sound.youtube && !youTubeUnavailable) {
      const player = await ensureYouTubePlayer();
      const playerState = player?.getPlayerState?.();
      if (player && activeYouTubeSoundId === sound.id && playerState === window.YT?.PlayerState?.PAUSED) {
        try {
          player.playVideo();
          playing = true;
        } catch (error) {
          console.error(error);
          playing = false;
        }
        render();
        return;
      }

      await playCurrent({ restart: false });
      return;
    }

    const audio = currentAudio();
    if (!audio) return;

    if (audio.currentTime > 0 && audio.currentTime < audio.duration) {
      try {
        await audio.play();
        playing = true;
      } catch (error) {
        console.error(error);
        playing = false;
      }
      render();
      return;
    }

    await playCurrent({ restart: false });
  });

  nextButton.addEventListener("click", async () => {
    await jumpTo(currentIndex + 1, { autoplay: playing, restart: true });
  });

  [prevEl, nextEl].forEach((element) => {
    element.addEventListener("click", async () => {
      const step = Number(element.dataset.soundStep || "0");
      if (!step) return;
      await jumpTo(currentIndex + step, { autoplay: true, restart: true });
    });
  });

  render();
}

function initializeYamanote() {
  const root = document.querySelector("[data-yamanote]");
  if (!root) return;

  const mapEl = root.querySelector("[data-yamanote-map]");
  const laneEl = root.querySelector("[data-yamanote-lane]");
  const currentEl = root.querySelector("[data-yamanote-current]");
  const jpEl = root.querySelector("[data-yamanote-jp]");
  const toggleButton = root.querySelector("[data-yamanote-toggle]");
  const nextButton = root.querySelector("[data-yamanote-next]");
  const toggleIcon = root.querySelector("[data-yamanote-toggle-icon]");
  const audioNodes = Object.fromEntries(
    [...root.querySelectorAll("audio[data-yamanote-audio]")].map((audio) => [audio.dataset.yamanoteAudio, audio]),
  );

  const stations = [
    { id: "tokyo", name: "Tokyo", jp: "東京" },
    { id: "kanda", name: "Kanda", jp: "神田" },
    { id: "akihabara", name: "Akihabara", jp: "秋葉原" },
    { id: "ueno", name: "Ueno", jp: "上野" },
    { id: "ikebukuro", name: "Ikebukuro", jp: "池袋" },
    { id: "shinjuku", name: "Shinjuku", jp: "新宿" },
    { id: "shibuya", name: "Shibuya", jp: "渋谷" },
    { id: "ebisu", name: "Ebisu", jp: "恵比寿" },
  ];

  const copies = 3;
  let currentIndex = 0;
  let activeSlot = stations.length + currentIndex;
  let playing = false;
  let recenterTimer = null;

  laneEl.innerHTML = `
    <div class="yamanote__track" aria-hidden="true"></div>
    ${Array.from({ length: copies }, (_, copyIndex) =>
      stations
        .map(
          (station, stationIndex) => `
            <button
              class="yamanote__station"
              type="button"
              data-yamanote-slot="${copyIndex * stations.length + stationIndex}"
              data-yamanote-station-index="${stationIndex}"
            >
              <span class="yamanote__name">${station.name}</span>
              <span class="yamanote__dot"></span>
            </button>
          `,
        )
        .join(""),
    ).join("")}
  `;

  const stationButtons = [...laneEl.querySelectorAll("[data-yamanote-slot]")];

  const stopAll = ({ resetTime = false } = {}) => {
    Object.values(audioNodes).forEach((audio) => {
      audio.pause();
      if (resetTime) {
        audio.currentTime = 0;
      }
    });
  };

  const centerActive = (behavior = "smooth") => {
    const activeButton = stationButtons.find((button) => Number(button.dataset.yamanoteSlot) === activeSlot);
    if (!activeButton || !mapEl) return;
    const left = activeButton.offsetLeft + activeButton.offsetWidth / 2 - mapEl.clientWidth / 2;
    mapEl.scrollTo({
      left,
      behavior,
    });
  };

  const recenterToMiddleCopy = () => {
    window.clearTimeout(recenterTimer);
    recenterTimer = window.setTimeout(() => {
      activeSlot = stations.length + currentIndex;
      render();
      centerActive("auto");
    }, 280);
  };

  const render = () => {
    const station = stations[currentIndex];
    currentEl.textContent = station.name;
    jpEl.textContent = station.jp;
    stationButtons.forEach((button) => {
      const isActive = Number(button.dataset.yamanoteSlot) === activeSlot;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    setModuleIcon(toggleIcon, playing ? "pause" : "play");
  };

  const playCurrent = async ({ restart = false } = {}) => {
    const station = stations[currentIndex];
    const audio = audioNodes[station.id];
    if (!audio) return;
    stopAll();
    if (restart) audio.currentTime = 0;

    try {
      await audio.play();
      playing = true;
    } catch (error) {
      console.error(error);
      playing = false;
    }
    render();
  };

  const jumpTo = async (nextIndex, { autoplay = playing, restart = true } = {}) => {
    const activeAudio = audioNodes[stations[currentIndex].id];
    if (activeAudio) activeAudio.currentTime = 0;
    currentIndex = ((nextIndex % stations.length) + stations.length) % stations.length;
    playing = autoplay;
    render();
    centerActive("smooth");
    recenterToMiddleCopy();
    if (autoplay) {
      await playCurrent({ restart });
      return;
    }
    stopAll({ resetTime: true });
  };

  Object.values(audioNodes).forEach((audio) => {
    audio.addEventListener("ended", async () => {
      if (!playing) return;
      await jumpTo(currentIndex + 1, { autoplay: true, restart: true });
    });
  });

  toggleButton.addEventListener("click", async () => {
    const audio = audioNodes[stations[currentIndex].id];
    if (!audio) return;

    if (playing) {
      audio.pause();
      playing = false;
      render();
      return;
    }

    if (audio.currentTime > 0 && audio.currentTime < audio.duration) {
      try {
        await audio.play();
        playing = true;
      } catch (error) {
        console.error(error);
        playing = false;
      }
      render();
      return;
    }

    await playCurrent({ restart: false });
  });

  nextButton.addEventListener("click", async () => {
    activeSlot += 1;
    await jumpTo(currentIndex + 1, { autoplay: playing, restart: true });
  });

  stationButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const nextIndex = Number(button.dataset.yamanoteStationIndex);
      activeSlot = Number(button.dataset.yamanoteSlot);
      if (nextIndex < 0) return;
      await jumpTo(nextIndex, { autoplay: playing, restart: true });
    });
  });

  render();
  centerActive("auto");
}

function initializeWindowSeat() {
  const root = document.querySelector("[data-window-seat]");
  if (!root) return;

  const timeEl = root.querySelector("[data-window-time]");
  const metaEl = root.querySelector("[data-window-meta]");
  if (!timeEl || !metaEl) return;

  const phaseForHour = (hour) => {
    if (hour < 5) {
      return "Late-night run past Fuji";
    }

    if (hour < 8) {
      return "First light from the train window";
    }

    if (hour < 17) {
      return "Daylight run around Fuji";
    }

    if (hour < 20) {
      return "Golden-hour window seat";
    }

    return "City lights on the glass";
  };

  const render = () => {
    const now = getTokyoParts();
    timeEl.textContent = `${now.label} JST`;
    metaEl.textContent = phaseForHour(now.hour);
  };

  render();
  window.setInterval(render, 60_000);
}

window.addEventListener("DOMContentLoaded", () => {
  initializeSavedStyle();
  initializeModuleIcons();
  initializePomodoro();
  initializeTokyoNow();
  initializeSideQuest();
  initializeJapanSounds();
  initializeYamanote();
  initializeWindowSeat();
});
