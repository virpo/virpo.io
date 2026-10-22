// The Tokaido line as the reading trip: a post starts in Tokyo and ends at
// Shin-Osaka. Shared by the WINDOW scene and the dock caption.

export const STATIONS = [
  { at: 0, name: "TOKYO", title: "Tokyo" },
  { at: 0.12, name: "SHINAGAWA", title: "Shinagawa" },
  { at: 0.26, name: "SHIN-YOKOHAMA", title: "Shin-Yokohama" },
  { at: 0.52, name: "NAGOYA", title: "Nagoya" },
  { at: 0.8, name: "KYOTO", title: "Kyoto" },
  { at: 1, name: "SHIN-OSAKA", title: "Shin-Osaka" },
] as const;

export const ARRIVED_AT = 0.995;

export function nextStation(progress: number) {
  return STATIONS.find((station) => station.at > progress + 0.001) ?? STATIONS[STATIONS.length - 1];
}

/** "42% read · next stop Nagoya", or the arrival line at the end of a post. */
export function tripCaption(progress: number) {
  if (progress >= ARRIVED_AT) return "100% read · arrived at Shin-Osaka";
  return `${Math.round(progress * 100)}% read · next stop ${nextStation(progress).title}`;
}
