const BATCH_SIZE = 20;
const DEFAULT_SEED = "visualmix";
const CATEGORY_LIMITS = {
  science: 4,
  computing: 4,
  vehicles: 4,
  aviation: 4,
  space: 4,
};

const {
  buildFactHeadline,
  buildFactLane,
  countHeadlineWords,
  countHeadlineProperNames,
} = window.factUtils;

const PRESET_BATCHES = {
  visualmix: [
    "12-30",
    "04-02",
    "08-19",
    "10-21",
    "11-08",
    "03-06",
    "02-22",
    "02-06",
    "06-12",
    "12-11",
    "04-19",
    "07-14",
    "01-19",
    "03-18",
    {
      dateKey: "03-31-eiffel",
      month: 3,
      day: 31,
      year: 1889,
      emoji: "🗼",
      category: "science",
      event: "Eiffel Tower is inaugurated",
      source: "https://www.toureiffel.paris/en/the-monument/history",
    },
    {
      dateKey: "04-01-bauhaus",
      month: 4,
      day: 1,
      year: 1919,
      emoji: "✏️",
      category: "science",
      event: "Bauhaus is founded",
      source: "https://www.britannica.com/topic/Bauhaus",
    },
    {
      dateKey: "05-17-color-photo",
      month: 5,
      day: 17,
      year: 1861,
      emoji: "🎨",
      category: "science",
      event: "First color photo is shown",
      source: "https://www.britannica.com/technology/color-photography",
    },
    {
      dateKey: "10-06-talkie",
      month: 10,
      day: 6,
      year: 1927,
      emoji: "🎬",
      category: "science",
      event: "First talkie premieres",
      source: "https://www.britannica.com/topic/The-Jazz-Singer",
    },
    {
      dateKey: "10-20-opera-house",
      month: 10,
      day: 20,
      year: 1973,
      emoji: "🏛️",
      category: "science",
      event: "Sydney Opera House opens",
      source: "https://www.sydneyoperahouse.com/our-story/history",
    },
    {
      dateKey: "01-28-lego",
      month: 1,
      day: 28,
      year: 1958,
      emoji: "🧱",
      category: "science",
      event: "LEGO brick is patented",
      source: "https://www.lego.com/en-us/history/articles/f-the-lego-brick",
    },
  ],
  varietycheck: [
    "12-30",
    "01-10",
    "04-02",
    "08-19",
    "01-14",
    "10-21",
    "11-08",
    "03-06",
    "02-22",
    "02-06",
    "03-07",
    "12-23",
    "06-12",
    "08-31",
    "09-01",
    "12-11",
    "04-19",
    "07-14",
    "01-19",
    "03-18",
  ],
  coolcheck: [
    "12-30",
    "07-14",
    "08-19",
    "01-19",
    "04-30",
    "05-01",
    "11-25",
    "04-19",
    "01-29",
    "10-21",
    "11-08",
    "03-07",
    "03-06",
    "04-01",
    "08-23",
    "10-04",
    "04-12",
    "03-18",
    "01-03",
    "04-24",
  ],
  tastecheck: [
    "12-30",
    "07-14",
    "08-19",
    "01-19",
    "04-30",
    "05-01",
    "11-25",
    "04-19",
    "01-29",
    "10-21",
    "11-08",
    "03-07",
    "03-06",
    "04-01",
    "08-23",
    "10-04",
    "04-12",
    "03-18",
    "01-03",
    "04-24",
  ],
};

const LAB_POOL_KEYS = new Set([
  "01-03",
  "01-10",
  "01-19",
  "01-24",
  "01-29",
  "02-03",
  "02-06",
  "02-22",
  "02-29",
  "03-06",
  "03-07",
  "03-12",
  "03-17",
  "03-18",
  "03-29",
  "03-31",
  "04-01",
  "04-06",
  "04-12",
  "04-13",
  "04-16",
  "04-17",
  "04-19",
  "04-22",
  "04-24",
  "04-30",
  "05-01",
  "05-05",
  "05-23",
  "05-24",
  "06-02",
  "06-10",
  "06-12",
  "06-15",
  "06-19",
  "07-03",
  "07-10",
  "07-14",
  "07-18",
  "07-25",
  "07-31",
  "08-12",
  "08-19",
  "08-20",
  "08-22",
  "08-23",
  "08-25",
  "08-29",
  "08-31",
  "09-01",
  "09-03",
  "09-13",
  "09-20",
  "09-24",
  "09-27",
  "10-04",
  "10-21",
  "11-08",
  "11-20",
  "11-21",
  "11-25",
  "12-01",
  "12-11",
  "12-23",
  "12-30",
]);

const BOOST_PATTERNS = [
  { pattern: /\bfirst\b/i, points: 6 },
  { pattern: /\bpenicillin|antibiotic|vaccine|insulin|x-ray|ultrasound|ct scanner|synthetic diamond|photon|dna|carbon-14\b/i, points: 11 },
  { pattern: /\btelephone|telegraph|television|tv|radio|photograph|photographic|daguerreotype|camera|transistor|hearing aid|atomic clock|metric|bicycle|railway|railroad|underground railway|steam car|steam-powered\b/i, points: 9 },
  { pattern: /\bmoon|mars|venus|mercury|asteroid|planet|satellite|spacewalk|orbit|orbital|space station|robot|rover|helicopter\b/i, points: 8 },
  { pattern: /\bearth|circumference of the earth|eclipse|telescope|microscope|theatre|movie theater|moving picture\b/i, points: 7 },
  { pattern: /\bpatent|patented|patent application\b/i, points: 5 },
  { pattern: /\bpublicly demonstrates|unveiled|announces|introduced|opens\b/i, points: 4 },
  { pattern: /\bjapan|tokyo|ginza|light bulb|telephone|earth|moon|neptune|ring|eclipse|x-ray|metro|underground\b/i, points: 8 },
];

const PENALTY_PATTERNS = [
  { pattern: /\bhouse of representatives|meet the press|television network|tv network|commercial television|nbc television|ctv\b/i, points: 16 },
  { pattern: /\bgeneral motors|pontiac division|buys into|declassified|software and services separately\b/i, points: 16 },
  { pattern: /\bsts-\d+|as-\d+|mission|launched on sts|returns to earth|program ends|expedition \d+\b/i, points: 12 },
  { pattern: /\bsearch for .* suspended|bureau|office|act|assembly|newsletter|court\b/i, points: 10 },
  { pattern: /\bwar\b|\bmilitary\b|\bbomber\b|\bcombat aircraft\b|\bnuclear missile\b|\bfirst strike\b|\bfighter\b|\bmissile\b|\bair force\b/i, points: 20 },
  { pattern: /\bcompany\b/i, points: 3 },
  { pattern: /\bprivate crewed\b|\btest vehicle\b|\btest flight\b|\bcertification\b|\bdebut\b|\bdebuts\b/i, points: 10 },
];

const CATEGORY_BONUS = {
  science: 18,
  computing: 14,
  vehicles: 11,
  aviation: 9,
  space: 10,
};

const REJECT_PATTERNS = [
  /\blost at sea\b|\bwith all hands\b/i,
  /\broyal navy\b|\bhmas\b|\buss\b/i,
  /\bthunderbolt\b|\bhellcat\b|\bmesserschmitt\b|\bheinkel\b/i,
  /\bmedical research reactor\b|\bnuclear submarine\b|\breactor reaches criticality\b/i,
  /\bfalcon 1\b|\bvega rocket\b|\bstudent radio station\b|\bprivate crewed\b/i,
  /\btrain trip across canada\b|\bdepartment\b|\bdispatch company\b/i,
  /\bsoap opera\b|\bdeep blue\b|\bchess\b/i,
  /\bf\/a-18\b|\bhornet\b|\bb-17\b|\bflying fortress\b/i,
  /\bburma railway\b|\badmiral\b|\bnorth pole\b|\bopens for business\b/i,
  /\btelevision station\b|\btelevision programme\b|\bchannel \d+\b/i,
  /\bgemini \d+\b|\bgravity recovery and interior laboratory\b|\bgrail\b/i,
  /\bfirst railway line opens\b/i,
  /\bsabotage\b|\bdestroyed\b|\bworm\b/i,
  /\bflight test\b|\btest-1\b/i,
  /\bpolygraph\b|\bsynchrotron\b|\bfacsimile\b|\bportland cement\b/i,
  /\bgloster\b|\blockheed\b|\bmig-\d+\b|\bindianapolis 500\b|\bformula one\b/i,
];

const cardsGrid = document.getElementById("cards-grid");
const batchIdNode = document.getElementById("batch-id");
const progressNode = document.getElementById("progress-text");
const copyStatusNode = document.getElementById("copy-status");
const rerollButton = document.getElementById("reroll-button");
const copyButton = document.getElementById("copy-button");

let facts = [];
let currentBatch = [];
let currentVotes = {};
let currentSeed = "";

function makeSeed() {
  return Math.random().toString(36).slice(2, 10);
}

function createRng(seed) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) >>> 0;
  }
  if (value === 0) value = 0x12345678;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function formatDate(record) {
  const fakeDate = new Date(2024, record.month - 1, record.day);
  return fakeDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function scoreFact(record) {
  const text = record.event;
  const lower = text.toLowerCase();
  const headline = buildFactHeadline(record);

  if (REJECT_PATTERNS.some((pattern) => pattern.test(text))) {
    return -999;
  }

  let score = CATEGORY_BONUS[record.category] ?? 0;

  BOOST_PATTERNS.forEach(({ pattern, points }) => {
    if (pattern.test(text)) score += points;
  });

  PENALTY_PATTERNS.forEach(({ pattern, points }) => {
    if (pattern.test(text)) score -= points;
  });

  if (/\blaunches\b|\bis launched\b|\blaunched\b/i.test(text) && !/\bfirst\b/i.test(text)) {
    score -= 7;
  }

  if (/\breturns to earth\b|\bdebut\b|\bdebuts\b|\breceives certification\b|\borbits the earth twice\b/i.test(text)) {
    score -= 7;
  }

  if (/\bmonkey|chimpanzee|mammal\b/i.test(text)) {
    score += 3;
  }

  if (/\bdiscovery of huge silver deposits\b/i.test(lower)) {
    score -= 6;
  }

  if (/\bcomputer error\b/i.test(text)) {
    score -= 8;
  }

  const wordCount = countHeadlineWords(headline);
  const properNames = countHeadlineProperNames(headline);

  if (wordCount <= 5) score += 10;
  else if (wordCount <= 7) score += 7;
  else if (wordCount <= 9) score += 3;
  else if (wordCount >= 12) score -= 8;
  else if (wordCount >= 10) score -= 4;

  if (properNames >= 4) score -= 10;
  else if (properNames >= 3) score -= 5;

  if (/[A-Z]-\d|\b[A-Z]\.\d+\b|\b\d+-\d+\b/.test(headline)) {
    score -= 10;
  }

  return score;
}

function buildCandidatePool(records) {
  return records
    .filter((record) => LAB_POOL_KEYS.has(record.dateKey))
    .map((record) => ({ ...record, appealScore: scoreFact(record) }))
    .filter((record) => record.appealScore >= 24)
    .sort((left, right) => right.appealScore - left.appealScore);
}

function pickBatch(records, seed) {
  if (PRESET_BATCHES[seed]) {
    return PRESET_BATCHES[seed]
      .map((item) => {
        if (typeof item === "string") {
          return records.find((record) => record.dateKey === item);
        }
        return item;
      })
      .filter(Boolean);
  }

  const rng = createRng(seed);
  const pool = buildCandidatePool(records);
  const counts = {
    science: 0,
    computing: 0,
    vehicles: 0,
    aviation: 0,
    space: 0,
  };
  const picked = [];

  Object.keys(CATEGORY_LIMITS).forEach((category) => {
    const categoryPool = shuffle(
      pool.filter((record) => record.category === category),
      rng,
    );

    categoryPool.slice(0, CATEGORY_LIMITS[category]).forEach((record) => {
      picked.push(record);
      counts[category] += 1;
    });
  });

  if (picked.length < BATCH_SIZE) {
    shuffle(pool, rng).forEach((record) => {
      if (picked.length >= BATCH_SIZE) return;
      if (picked.some((item) => item.dateKey === record.dateKey)) return;
      picked.push(record);
    });
  }

  return shuffle(picked, rng).slice(0, BATCH_SIZE);
}

function updateProgress() {
  const rated = Object.values(currentVotes).filter(Boolean).length;
  progressNode.textContent = `${rated} / ${currentBatch.length}`;
}

function voteText(vote) {
  if (vote === "like") return "like";
  if (vote === "dislike") return "dislike";
  return "skip";
}

function buildCopyText() {
  const lines = [`Fact batch: ${currentSeed}`, ""];
  currentBatch.forEach((record, index) => {
    lines.push(
      `${index + 1}. ${voteText(currentVotes[record.dateKey])} | ${record.dateKey} | ${record.emoji} ${buildFactHeadline(record)}`,
    );
  });
  return lines.join("\n");
}

async function copyVotes() {
  try {
    await navigator.clipboard.writeText(buildCopyText());
    copyStatusNode.textContent = "Copied. Paste it back here.";
  } catch (error) {
    console.error(error);
    copyStatusNode.textContent = "Copy failed. Select and copy manually from the console.";
  }
}

function setVote(dateKey, vote) {
  currentVotes[dateKey] = currentVotes[dateKey] === vote ? null : vote;
  renderCards();
}

function renderCards() {
  cardsGrid.innerHTML = "";

  currentBatch.forEach((record, index) => {
    const article = document.createElement("article");
    const vote = currentVotes[record.dateKey] ?? null;
    article.className = "fact-card";
    if (vote === "like") article.classList.add("is-liked");
    if (vote === "dislike") article.classList.add("is-disliked");

    article.innerHTML = `
      <div class="fact-top">
        <span class="fact-index">${index + 1}</span>
        <div class="fact-chip-row">
          <span class="fact-chip">${record.emoji} ${buildFactLane(record)}</span>
          <span class="fact-chip">${record.year < 0 ? `${Math.abs(record.year)} BC` : record.year}</span>
        </div>
      </div>

      <p class="fact-text">${buildFactHeadline(record)}</p>

      <div class="fact-meta">
        <p class="fact-date">${formatDate(record)}</p>
        <a class="source-link" href="${record.source}" target="_blank" rel="noreferrer">source</a>
      </div>

      <div class="vote-row">
        <button class="vote-button ${vote === "dislike" ? "is-active" : ""}" data-vote="dislike" type="button">
          Dislike
        </button>
        <button class="vote-button ${vote === "like" ? "is-active" : ""}" data-vote="like" type="button">
          Like
        </button>
      </div>
    `;

    article.querySelectorAll(".vote-button").forEach((button) => {
      button.addEventListener("click", () => {
        setVote(record.dateKey, button.dataset.vote);
      });
    });

    cardsGrid.appendChild(article);
  });

  updateProgress();
}

function renderBatch(seed) {
  currentSeed = seed;
  currentBatch = pickBatch(facts, seed);
  currentVotes = Object.fromEntries(currentBatch.map((record) => [record.dateKey, null]));
  batchIdNode.textContent = seed;
  copyStatusNode.textContent = "Paste the copied block back here.";
  renderCards();

  const url = new URL(window.location.href);
  url.searchParams.set("seed", seed);
  window.history.replaceState({}, "", url);
}

async function initialize() {
  const response = await fetch("./data/today-facts.json");
  facts = await response.json();

  const url = new URL(window.location.href);
  const seed = url.searchParams.get("seed") || DEFAULT_SEED;
  renderBatch(seed);
}

rerollButton.addEventListener("click", () => {
  renderBatch(makeSeed());
});

copyButton.addEventListener("click", () => {
  copyVotes();
});

window.addEventListener("DOMContentLoaded", () => {
  initialize().catch((error) => {
    console.error(error);
    copyStatusNode.textContent = "Failed to load facts.";
  });
});
