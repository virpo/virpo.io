// Short labels for the post spines on the writing index bookshelf (Fig. 05).

const SMALL = new Set(["a", "an", "the", "my", "for", "of", "to", "and", "in", "on", "with", "kind", "different", "use", "weird", "ai"]);

/** A spine is narrow: "Weird use of AI #3: Detective skills…" becomes "#3 Detective". */
export function spineLabel(title: string) {
  const series = title.match(/#(\d+)\s*:\s*(.+)$/);
  const words = (series ? series[2] : title).split(/\s+/).map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""));
  const pick = series ? words.find((word) => word && !SMALL.has(word.toLowerCase())) : [...words].reverse().find((word) => word && !SMALL.has(word.toLowerCase()));
  const word = pick ? pick[0].toUpperCase() + pick.slice(1) : title.slice(0, 12);
  return series ? `#${series[1]} ${word}` : word;
}
