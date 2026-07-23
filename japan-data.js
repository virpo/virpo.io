(function exposeJapanData(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VirpoJapanData = api;
})(typeof window !== "undefined" ? window : globalThis, function createJapanData() {
  const DAY_MS = 86_400_000;

  const blooms = [
    {
      id: "camellia",
      name: "Camellias",
      emoji: "🌺",
      startMonth: 1,
      startDay: 15,
      endMonth: 3,
      endDay: 15,
      place: "Izu Oshima",
      region: "Tokyo",
      sourceUrl: "https://www.japan.travel/en/spot/2180/",
    },
    {
      id: "plum",
      name: "Plum blossoms",
      emoji: "🌸",
      startMonth: 2,
      startDay: 20,
      endMonth: 3,
      endDay: 25,
      place: "Kairakuen Garden",
      region: "Ibaraki",
      sourceUrl: "https://www.japan.travel/en/spot/1466/",
    },
    {
      id: "sakura",
      name: "Cherry blossoms",
      emoji: "🌸",
      startMonth: 3,
      startDay: 20,
      endMonth: 4,
      endDay: 10,
      place: "Tokyo",
      region: "Kanto",
      sourceUrl: "https://www.japan.travel/en/see-and-do/flowers/",
    },
    {
      id: "wisteria",
      name: "Wisteria",
      emoji: "🪻",
      startMonth: 4,
      startDay: 15,
      endMonth: 5,
      endDay: 15,
      place: "Ashikaga Flower Park",
      region: "Tochigi",
      sourceUrl: "https://www.japan.travel/en/spot/1473/",
    },
    {
      id: "hydrangea",
      name: "Hydrangeas",
      emoji: "🪻",
      startMonth: 6,
      startDay: 1,
      endMonth: 6,
      endDay: 30,
      place: "Hasedera Temple",
      region: "Kamakura",
      sourceUrl: "https://www.japan.travel/en/see-and-do/flowers/",
    },
    {
      id: "lotus",
      name: "Ancient lotuses",
      emoji: "🪷",
      startMonth: 6,
      startDay: 25,
      endMonth: 8,
      endDay: 5,
      place: "Ancient Lotus Park",
      region: "Gyoda, Saitama",
      sourceUrl: "https://www.japan.travel/en/spot/2082/",
    },
    {
      id: "sunflower",
      name: "Sunflowers",
      emoji: "🌻",
      startMonth: 7,
      startDay: 27,
      endMonth: 8,
      endDay: 15,
      place: "Hokuryu Sunflower Village",
      region: "Hokkaido",
      sourceUrl: "https://www.japan.travel/en/spot/1882/",
    },
    {
      id: "cosmos",
      name: "Cosmos",
      emoji: "🌼",
      startMonth: 9,
      startDay: 20,
      endMonth: 10,
      endDay: 20,
      place: "Hitachi Seaside Park",
      region: "Ibaraki",
      sourceUrl: "https://www.japan.travel/en/see-and-do/flowers/",
    },
    {
      id: "chrysanthemum",
      name: "Chrysanthemums",
      emoji: "🏵️",
      startMonth: 11,
      startDay: 1,
      endMonth: 11,
      endDay: 15,
      place: "Shinjuku Gyoen",
      region: "Tokyo",
      sourceUrl: "https://www.env.go.jp/garden/shinjukugyoen/english/",
    },
  ];

  function getTokyoParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const values = Object.fromEntries(
      formatter
        .formatToParts(date)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const hour = Number(values.hour);
    const minute = Number(values.minute);

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour,
      minute,
      label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  }

  function isValidBloom(entry) {
    return (
      entry &&
      typeof entry.id === "string" &&
      typeof entry.name === "string" &&
      Number.isInteger(entry.startMonth) &&
      Number.isInteger(entry.startDay) &&
      Number.isInteger(entry.endMonth) &&
      Number.isInteger(entry.endDay) &&
      typeof entry.place === "string" &&
      typeof entry.region === "string" &&
      typeof entry.sourceUrl === "string"
    );
  }

  function bloomWindow(entry, year) {
    const start = new Date(Date.UTC(year, entry.startMonth - 1, entry.startDay));
    const endYear =
      entry.endMonth < entry.startMonth ||
      (entry.endMonth === entry.startMonth && entry.endDay < entry.startDay)
        ? year + 1
        : year;
    const end = new Date(Date.UTC(endYear, entry.endMonth - 1, entry.endDay));
    return { entry, start, end };
  }

  function getBloomState(parts, entries = blooms) {
    const year = Number(parts?.year);
    const month = Number(parts?.month);
    const day = Number(parts?.day);
    if (![year, month, day].every(Number.isInteger)) {
      return { status: "unavailable", bloom: null, days: null, label: "Seasonal guide unavailable" };
    }

    const current = new Date(Date.UTC(year, month - 1, day));
    const validEntries = entries.filter(isValidBloom);
    const windows = validEntries.flatMap((entry) => [
      bloomWindow(entry, year - 1),
      bloomWindow(entry, year),
      bloomWindow(entry, year + 1),
    ]);
    const active = windows
      .filter(({ start, end }) => start <= current && current <= end)
      .sort((a, b) => a.end - b.end)[0];

    if (active) {
      const days = Math.round((active.end - current) / DAY_MS);
      return {
        status: "active",
        bloom: active.entry,
        days,
        label: days === 0 ? "last day" : `now · ${days} day${days === 1 ? "" : "s"} left`,
      };
    }

    const upcoming = windows
      .filter(({ start }) => start > current)
      .sort((a, b) => a.start - b.start)[0];

    if (!upcoming) {
      return { status: "unavailable", bloom: null, days: null, label: "Seasonal guide unavailable" };
    }

    const days = Math.round((upcoming.start - current) / DAY_MS);
    return {
      status: "upcoming",
      bloom: upcoming.entry,
      days,
      label: `in ${days} day${days === 1 ? "" : "s"}`,
    };
  }

  return { blooms, getTokyoParts, getBloomState };
});
