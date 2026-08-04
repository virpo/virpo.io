const DAY_MS = 86_400_000;

export type BloomEntry = {
  id: string;
  name: string;
  emoji: string;
  pixelArt: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  place: string;
  region: string;
  sourceUrl: string;
};

export type TokyoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  label: string;
};

export type BloomStatus =
  | {
      status: "active" | "upcoming";
      bloom: BloomEntry;
      days: number;
      label: string;
    }
  | {
      status: "unavailable";
      bloom: null;
      days: null;
      label: string;
    };

export type BloomTimelineItem = Extract<
  BloomStatus,
  { status: "active" | "upcoming" }
>;

export function getTokyoParts(date = new Date()): TokyoParts {
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

function isValidBloom(entry: BloomEntry): boolean {
  return (
    entry &&
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.emoji === "string" &&
    typeof entry.pixelArt === "string" &&
    Number.isInteger(entry.startMonth) &&
    Number.isInteger(entry.startDay) &&
    Number.isInteger(entry.endMonth) &&
    Number.isInteger(entry.endDay) &&
    typeof entry.place === "string" &&
    typeof entry.region === "string" &&
    typeof entry.sourceUrl === "string"
  );
}

function bloomWindow(entry: BloomEntry, year: number) {
  const start = new Date(Date.UTC(year, entry.startMonth - 1, entry.startDay));
  const wrapsYear =
    entry.endMonth < entry.startMonth ||
    (entry.endMonth === entry.startMonth && entry.endDay < entry.startDay);
  const end = new Date(
    Date.UTC(wrapsYear ? year + 1 : year, entry.endMonth - 1, entry.endDay),
  );

  return { entry, start, end };
}

export function getBloomStatus(
  entries: readonly BloomEntry[],
  now = new Date(),
): BloomStatus {
  const { year, month, day } = getTokyoParts(now);
  if (![year, month, day].every(Number.isInteger)) {
    return {
      status: "unavailable",
      bloom: null,
      days: null,
      label: "Seasonal guide unavailable",
    };
  }

  const current = new Date(Date.UTC(year, month - 1, day));
  const windows = entries
    .filter(isValidBloom)
    .flatMap((entry) => [
      bloomWindow(entry, year - 1),
      bloomWindow(entry, year),
      bloomWindow(entry, year + 1),
    ]);
  const active = windows
    .filter(({ start, end }) => start <= current && current <= end)
    .sort((left, right) => left.end.getTime() - right.end.getTime())[0];

  if (active) {
    const days = Math.round((active.end.getTime() - current.getTime()) / DAY_MS);
    return {
      status: "active",
      bloom: active.entry,
      days,
      label: days === 0 ? "last day" : `now · ${days} day${days === 1 ? "" : "s"} left`,
    };
  }

  const upcoming = windows
    .filter(({ start }) => start > current)
    .sort((left, right) => left.start.getTime() - right.start.getTime())[0];

  if (!upcoming) {
    return {
      status: "unavailable",
      bloom: null,
      days: null,
      label: "Seasonal guide unavailable",
    };
  }

  const days = Math.round((upcoming.start.getTime() - current.getTime()) / DAY_MS);
  return {
    status: "upcoming",
    bloom: upcoming.entry,
    days,
    label: `in ${days} day${days === 1 ? "" : "s"}`,
  };
}

export function getBloomTimeline(
  entries: readonly BloomEntry[],
  now = new Date(),
  limit = 4,
): BloomTimelineItem[] {
  return entries
    .map((entry) => getBloomStatus([entry], now))
    .filter((status): status is BloomTimelineItem => status.status !== "unavailable")
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === "active" ? -1 : 1;
      return left.days - right.days;
    })
    .slice(0, Math.max(0, limit));
}
