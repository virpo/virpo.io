// Shared, framework-free description of every clickable thing in the Pocket Room.
// Server components use it to tag the plain HTML lists (data-room-target) and the
// client world uses it to build markers, labels and panels.

export type RoomToyId = "face" | "kana" | "window" | "sounds" | "bloom";

export type RoomHotspotKind = "about" | "post" | "writing" | "project" | "toy";

export type RoomHotspot = {
  id: string;
  fig: number;
  /** What the object is in the world. */
  object: string;
  /** What it opens. */
  title: string;
  kind: RoomHotspotKind;
  /** Where in the diorama it sits, for the label chip. */
  zone: "Writing room" | "Workshop" | "Street";
  href?: string;
  projectSlug?: string;
  toy?: RoomToyId;
  postIndex?: number;
};

export type RoomPostRef = {
  slug: string;
  title: string;
  description: string;
  date: string;
};

const base: Omit<RoomHotspot, "fig">[] = [
  { id: "peter", object: "Peter", title: "Peter Hraska", kind: "about", zone: "Writing room" },
  { id: "post-0", object: "Notebook", title: "Newest post", kind: "post", zone: "Writing room", postIndex: 0 },
  { id: "post-1", object: "Notebook", title: "Post", kind: "post", zone: "Writing room", postIndex: 1 },
  { id: "post-2", object: "Notebook", title: "Post", kind: "post", zone: "Writing room", postIndex: 2 },
  { id: "bookshelf", object: "Bookshelf", title: "All writing", kind: "writing", zone: "Writing room", href: "/room/writing/" },
  { id: "deck", object: "Stream deck", title: "CMUX Deck", kind: "project", zone: "Writing room", projectSlug: "cmux-deck" },
  { id: "radio", object: "Old radio", title: "Mood Radio", kind: "project", zone: "Writing room", projectSlug: "mood-radio" },
  { id: "window", object: "Window", title: "Shinkansen window", kind: "toy", zone: "Writing room", toy: "window" },
  { id: "mirror", object: "Mirror", title: "Peter’s face", kind: "toy", zone: "Writing room", toy: "face" },
  { id: "kana", object: "Hiragana poster", title: "Learn kana", kind: "toy", zone: "Writing room", toy: "kana" },
  { id: "bloom", object: "Hydrangea", title: "Bloom forecast", kind: "toy", zone: "Writing room", toy: "bloom" },
  { id: "printer", object: "3D printer", title: "Pegboard Toy", kind: "project", zone: "Workshop", projectSlug: "pegboard-toy" },
  { id: "arcade", object: "Arcade cabinet", title: "Levels", kind: "project", zone: "Workshop", projectSlug: "levels" },
  { id: "tv", object: "Small TV", title: "YouTLDR", kind: "project", zone: "Workshop", projectSlug: "youtldr" },
  { id: "corkboard", object: "Detective board", title: "Žltá stopa", kind: "project", zone: "Workshop", projectSlug: "zlta-stopa" },
  { id: "stage", object: "Tiny stage", title: "AI Build Week", kind: "project", zone: "Workshop", projectSlug: "ai-build-week" },
  { id: "clay", object: "Clay figure", title: "Prehistoriq", kind: "project", zone: "Workshop", projectSlug: "prehistoriq" },
  { id: "vending", object: "Vending machine", title: "Japan sounds", kind: "toy", zone: "Street", toy: "sounds" },
];

export const roomHotspots: readonly RoomHotspot[] = base.map((spot, index) => ({ ...spot, fig: index + 1 }));

export const hotspotById = new Map(roomHotspots.map((spot) => [spot.id, spot]));

export const hotspotForProject = (slug: string) =>
  roomHotspots.find((spot) => spot.projectSlug === slug);

export const toyHotspots = roomHotspots.filter((spot) => spot.kind === "toy");

export const figLabel = (fig: number) => `Fig. ${String(fig).padStart(2, "0")}`;

export const roomPostHref = (slug: string) => `/room/blog/${slug}/`;

/** Resolve a hotspot's final title and link once posts are known. */
export function resolveHotspot(spot: RoomHotspot, posts: readonly RoomPostRef[]) {
  if (spot.kind === "post" && spot.postIndex !== undefined) {
    const post = posts[spot.postIndex];
    if (!post) return null;
    return { ...spot, title: post.title, href: roomPostHref(post.slug) };
  }
  return spot;
}

export const kindVerb: Record<RoomHotspotKind, string> = {
  about: "About",
  post: "Read",
  writing: "Browse",
  project: "Project",
  toy: "Toy",
};
