// Small pure helpers for the room's clock-driven life (trains, Peter's poses, light).

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type TimeChoice = "auto" | TimeOfDay;
export const TIME_CHOICES: readonly TimeChoice[] = ["auto", "morning", "day", "evening", "night"];
export const TIME_KEY = "virpo-room-time";

/** Tokyo hour → light in the room. */
export function timeForHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 9) return "morning";
  if (hour >= 9 && hour < 16) return "day";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

export function tokyoHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Tokyo" }).format(date));
}

export type Train = { kind: "shinkansen" | "local"; dir: 1 | -1; id: number; ms: number };

/**
 * The timetable: a shinkansen every 15–25 s, a local train roughly halfway in between.
 * Returns [delay before the next train, the train].
 */
export function nextTrain(previous: Train | null, random: () => number = Math.random): [number, Train] {
  const id = (previous?.id ?? 0) + 1;
  if (!previous) return [2600, { kind: "shinkansen", dir: 1, id, ms: 3400 }];
  if (previous.kind === "shinkansen") return [3500 + random() * 2500, { kind: "local", dir: -1, id, ms: 7200 }];
  return [3000 + random() * 3000, { kind: "shinkansen", dir: 1, id, ms: 3400 }];
}

export type Pose = "typing" | "mug" | "window" | "reading" | "page" | "wave";
export const POSES: readonly Pose[] = ["typing", "mug", "window", "reading", "page", "wave"];

/** On a post page: which pose for this much reading progress (0..1). */
export function readingPose(progress: number, turning: boolean): Pose {
  if (progress >= 0.985) return "wave";
  return turning ? "page" : "reading";
}
