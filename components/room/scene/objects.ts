// Every clickable thing in the painted room, in Fig. order. Boxes come from the layer build
// (components/room/scene/layers.ts), so the hit area sits exactly on the painted object.
import { LAYERS } from "./layers";

export type RoomToyId = "window" | "face" | "kana" | "sounds" | "bloom";
export type RoomAppId = RoomToyId | "about" | `project:${string}`;

export type RoomObject = {
  id: string;
  fig: number;
  /** what it is, on the label tag */
  name: string;
  /** where it goes, on the label tag */
  goes: string;
  kind: "about" | "post" | "writing" | "toy" | "project";
  /** image layer (public/lab/room/<layer>.webp) and its box in plate pixels */
  layer: string;
  box: readonly [number, number, number, number];
  toy?: RoomToyId;
  projectSlug?: string;
  postIndex?: number;
  /** optional tighter or larger hit area than the painted box, in plate pixels */
  hit?: readonly [number, number, number, number];
  /** convex hull of the painted layer, % of the box: the precise hit shape for a mouse */
  hull?: readonly (readonly number[])[];
};

const obj = (id: keyof typeof LAYERS.objects) => LAYERS.objects[id];
const spr = (id: keyof typeof LAYERS.sprites) => LAYERS.sprites[id];

const peter = spr("peter-typing");
const hull = (layer: keyof typeof LAYERS.hulls) => LAYERS.hulls[layer];

export const ROOM_OBJECTS: readonly RoomObject[] = [
  { id: "peter", fig: 1, name: "Peter", goes: "About me", kind: "about", layer: "peter", box: peter, hull: hull("peter-typing") },
  { id: "post-0", fig: 2, name: "Orange notebook", goes: "Newest post", kind: "post", postIndex: 0, layer: "notebook-0", box: spr("notebook-0"), hull: hull("notebook-0") },
  { id: "post-1", fig: 3, name: "Yellow notebook", goes: "Post", kind: "post", postIndex: 1, layer: "notebook-1", box: spr("notebook-1"), hull: hull("notebook-1") },
  { id: "post-2", fig: 4, name: "Blue notebook", goes: "Post", kind: "post", postIndex: 2, layer: "notebook-2", box: spr("notebook-2"), hull: hull("notebook-2") },
  { id: "bookshelf", fig: 5, name: "Bookshelf", goes: "All writing", kind: "writing", layer: "obj-books", box: obj("books"), hull: hull("books") },
  { id: "window", fig: 6, name: "Window", goes: "Shinkansen view", kind: "toy", toy: "window", layer: "obj-window", box: obj("window"), hull: hull("window") },
  { id: "mirror", fig: 7, name: "Mirror", goes: "Face tracker", kind: "toy", toy: "face", layer: "obj-mirror", box: obj("mirror"), hull: hull("mirror") },
  { id: "kana", fig: 8, name: "Hiragana poster", goes: "Kana cards", kind: "toy", toy: "kana", layer: "obj-kana", box: obj("kana"), hull: hull("kana") },
  { id: "radio", fig: 9, name: "Radio", goes: "Sounds of Japan", kind: "toy", toy: "sounds", layer: "obj-radio", box: obj("radio"), hull: hull("radio") },
  { id: "hydrangea", fig: 10, name: "Hydrangea", goes: "Bloom forecast", kind: "toy", toy: "bloom", layer: "obj-hydrangea", box: obj("hydrangea"), hull: hull("hydrangea") },
  { id: "printer", fig: 11, name: "3D printer", goes: "Pegboard Toy", kind: "project", projectSlug: "pegboard-toy", layer: "obj-printer", box: obj("printer"), hull: hull("printer") },
  { id: "arcade", fig: 12, name: "Arcade", goes: "Levels", kind: "project", projectSlug: "levels", layer: "obj-arcade", box: obj("arcade"), hull: hull("arcade") },
  { id: "tv", fig: 13, name: "Tiny TV", goes: "YouTLDR", kind: "project", projectSlug: "youtldr", layer: "obj-tv", box: obj("tv"), hull: hull("tv") },
  { id: "deck", fig: 14, name: "Stream deck", goes: "CMUX Deck", kind: "project", projectSlug: "cmux-deck", layer: "obj-deck", box: obj("deck"), hull: hull("deck") },
  { id: "clay", fig: 15, name: "Clay figure", goes: "Prehistoriq", kind: "project", projectSlug: "prehistoriq", layer: "obj-clay", box: obj("clay"), hull: hull("clay") },
  { id: "cork", fig: 16, name: "Cork board", goes: "Žltá stopa", kind: "project", projectSlug: "zlta-stopa", layer: "obj-cork", box: obj("cork"), hull: hull("cork") },
  { id: "aiposter", fig: 17, name: "Poster", goes: "AI Build Week", kind: "project", projectSlug: "ai-build-week", layer: "obj-aiposter", box: obj("aiposter"), hull: hull("aiposter") },
];

export const objectById = new Map(ROOM_OBJECTS.map((item) => [item.id, item]));
export const objectForProject = (slug: string) => ROOM_OBJECTS.find((item) => item.projectSlug === slug);
export const objectForToy = (toy: RoomToyId) => ROOM_OBJECTS.find((item) => item.toy === toy);
export const TOY_OBJECTS = ROOM_OBJECTS.filter((item) => item.kind === "toy");

export const figLabel = (fig: number) => `Fig. ${String(fig).padStart(2, "0")}`;
export const roomPostHref = (slug: string) => `/room/blog/${slug}/`;

export const PLATE_W = LAYERS.plate.w;
export const PLATE_H = LAYERS.plate.h;

/** Plate box → CSS percentages of the screen. */
export function boxStyle(box: readonly [number, number, number, number]) {
  const [x, y, w, h] = box;
  return {
    left: `${((x / PLATE_W) * 100).toFixed(3)}%`,
    top: `${((y / PLATE_H) * 100).toFixed(3)}%`,
    width: `${((w / PLATE_W) * 100).toFixed(3)}%`,
    height: `${((h / PLATE_H) * 100).toFixed(3)}%`,
  };
}

export const centerOf = (item: RoomObject) => {
  const [x, y, w, h] = item.hit ?? item.box;
  return { x: x + w / 2, y: y + h / 2 };
};

/** Game-style d-pad move: the nearest object in that direction, favouring straight lines. */
export function neighbour(fromId: string | null, direction: "up" | "down" | "left" | "right", items: readonly RoomObject[] = ROOM_OBJECTS) {
  const from = fromId ? items.find((item) => item.id === fromId) : null;
  if (!from) return items[0];
  const a = centerOf(from);
  let best: RoomObject | null = null;
  let bestScore = Infinity;
  for (const item of items) {
    if (item.id === from.id) continue;
    const b = centerOf(item);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const along = direction === "left" ? -dx : direction === "right" ? dx : direction === "up" ? -dy : dy;
    const across = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
    if (along <= 4) continue;
    const score = along + across * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best ?? from;
}

/**
 * Touch: fingers are big and the painted objects are small, so a tap picks the object under it
 * (the smallest box that contains it) or else the nearest one within reach.
 */
export function pickAt(x: number, y: number, reach = 120, items: readonly RoomObject[] = ROOM_OBJECTS) {
  let inside: RoomObject | null = null;
  let insideArea = Infinity;
  let near: RoomObject | null = null;
  let nearDist = Infinity;
  for (const item of items) {
    const [bx, by, bw, bh] = item.hit ?? item.box;
    const dx = Math.max(bx - x, 0, x - (bx + bw));
    const dy = Math.max(by - y, 0, y - (by + bh));
    const dist = Math.hypot(dx, dy);
    if (dist === 0 && bw * bh < insideArea) {
      inside = item;
      insideArea = bw * bh;
    }
    if (dist < nearDist) {
      nearDist = dist;
      near = item;
    }
  }
  return inside ?? (nearDist <= reach ? near : null);
}

export const hullClip = (points?: readonly (readonly number[])[]) => (points && points.length > 2 ? `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})` : undefined);

export function cycle(fromId: string | null, step: 1 | -1, items: readonly RoomObject[] = ROOM_OBJECTS) {
  const index = fromId ? items.findIndex((item) => item.id === fromId) : -1;
  if (index === -1) return step === 1 ? items[0] : items[items.length - 1];
  return items[(index + step + items.length) % items.length];
}
