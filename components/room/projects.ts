// What the Pocket Room says about each project in one glance: two tags and the years. Shared by the
// project cards under the room and the labels on the room's objects.

export type ProjectMeta = { tags: readonly [string, string]; years: string };

export const PROJECT_META: Record<string, ProjectMeta> = {
  levels: { tags: ["Game", "Agents"], years: "2026" },
  youtldr: { tags: ["Chrome extension", "AI"], years: "2026" },
  "zlta-stopa": { tags: ["Civic tech", "Open data"], years: "2026–now" },
  "mood-radio": { tags: ["Web app", "Music"], years: "2013" },
  "pegboard-toy": { tags: ["3D printing", "Toy"], years: "2026" },
  "ai-build-week": { tags: ["Event", "Bratislava"], years: "2026" },
  "cmux-deck": { tags: ["Hardware", "Agents"], years: "2026" },
  "bratislava-slushd": { tags: ["Event", "Startups"], years: "2025" },
  "advent-of-no-code": { tags: ["Challenge", "No-code"], years: "2024" },
};

/** "Game · Agents · 2026" */
export const projectLine = (slug: string) => {
  const meta = PROJECT_META[slug];
  return meta ? [...meta.tags, meta.years].join(" · ") : "";
};
