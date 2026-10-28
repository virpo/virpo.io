import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import RoomPostPage, { generateMetadata, generateStaticParams } from "../../app/(room)/blog/[slug]/page";
import RoomPage, { metadata as landingMetadata } from "../../app/(room)/page";
import RoomWritingPage, { metadata as writingMetadata } from "../../app/(room)/blog/page";
import { LAYERS } from "../../components/room/scene/layers";
import { nextTrain, readingPose, timeForHour, tokyoClock } from "../../components/room/scene/life";
import { cycle, hullClip, neighbour, objectById, pickAt, ROOM_OBJECTS, TOY_OBJECTS } from "../../components/room/scene/objects";
import { cardArt } from "../../components/room/screens/Apps";
import { CARD_ART } from "../../components/room/screens/cards";
import { getPostSlugs, getPostSummaries } from "../../lib/blog";
import { labProjects } from "../../lib/lab/catalog";

const html = (node: ReactElement) => renderToStaticMarkup(node);
// next/link drops the trailing slash outside a Next build; the export keeps it.
const href = (path: string) => new RegExp(`href="${path.replace(/\/$/, "")}/?"`);
const escape = (text: string) => text.replace(/&/g, "&amp;");

describe("Pocket Room landing", () => {
  const markup = html(<RoomPage />);
  const newest = getPostSummaries().slice(0, 3);

  it("shows the name, the three newest posts with real dates, and All writing", () => {
    expect(markup).toMatch(/<h1[^>]*>Peter Hraska<\/h1>/);
    for (const post of newest) {
      expect(markup).toMatch(href(`/blog/${post.slug}/`));
      expect(markup).toContain(escape(post.title));
      expect(markup).toContain(`dateTime="${post.publishedAt.toISOString()}"`);
    }
    expect(markup).toMatch(/href="\/blog\/?"[^>]*>All writing/);
  });

  it("server-renders the painted room: plate, window view, every object layer and Peter", () => {
    expect(markup).toContain("/lab/room/plate.webp");
    expect(markup).toContain("/lab/room/view.webp");
    expect(markup).toContain("/lab/room/peter-typing.webp");
    for (const item of ROOM_OBJECTS) if (item.id !== "peter" && item.id !== "window") expect(markup, item.id).toContain(`/lab/room/${item.layer}.webp`);
  });

  it("makes every object a real link with a Fig. label, so Tab, Enter and no-JS all work", () => {
    const hits = markup.match(/<a[^>]*data-hit="[^"]+"[^>]*>/g) ?? [];
    expect(hits).toHaveLength(ROOM_OBJECTS.length);
    for (const item of ROOM_OBJECTS) expect(markup, item.id).toMatch(new RegExp(`aria-label="Fig\\. ${String(item.fig).padStart(2, "0")}, `));
    // notebooks are links to their posts
    newest.forEach((post, index) => expect(markup).toMatch(new RegExp(`href="/blog/${post.slug}/?"[^>]*data-hit="post-${index}"|data-hit="post-${index}"[^>]*href="/blog/${post.slug}/?"`)));
  });

  it("links the plain lists to their objects both ways", () => {
    for (let index = 0; index < 3; index += 1) expect(markup).toContain(`data-room-target="post-${index}"`);
    expect(markup).toContain('data-room-target="bookshelf"');
    for (const project of labProjects.filter((entry) => entry.slug !== "prehistoriq")) {
      expect(markup).toContain(`href="${project.href}"`);
      expect(markup).toContain(project.title);
    }
  });

  it("shows every project as a painted card, Bratislava Slush’D included", () => {
    const cards = markup.match(/\/lab\/room\/projects\/[a-z-]+\.webp/g) ?? [];
    // each card: the pencil picture at rest and the colour one it fades into
    expect(cards.filter((src) => src.endsWith("-pencil.webp")).length).toBeGreaterThanOrEqual(8);
    expect(cards.filter((src) => !src.endsWith("-pencil.webp")).length).toBeGreaterThanOrEqual(8);
    for (const src of cards) expect(existsSync(resolve(process.cwd(), "public", src.slice(1))), src).toBe(true);
    expect(markup).toContain("Bratislava Slush’D");
    expect(markup).toContain("Event · Startups · 2025");
    expect(markup).toContain('href="https://bratislavaslushd.com/"');
  });

  it("leaves Prehistoriq out of the room for now", () => {
    expect(markup).not.toContain("Prehistoriq");
    expect(markup).not.toMatch(/>[^<]*prehistoriq[^<]*</i);
  });

  it("keeps the Japan toys one click away from the plain list", () => {
    expect(TOY_OBJECTS.map((item) => item.toy).sort()).toEqual(["bloom", "face", "kana", "sounds", "window"]);
    for (const item of TOY_OBJECTS) expect(markup).toContain(`href="#toy-${item.toy}"`);
  });

  it("has the device controls: d-pad, open button, pill keys, knob and a side button", () => {
    for (const label of ["Select the object above", "Select the object below", "Select the object to the left", "Select the object to the right", "Open the selected object", "Show all Fig. numbers", "Clear the selection", "Turn to browse the objects in the room", "Light in the room"]) {
      expect(markup).toContain(label);
    }
  });

  it("is the home page: canonical /, indexable, with a preview image and the pocket-device video", () => {
    expect(landingMetadata.alternates?.canonical).toBe("/");
    expect(landingMetadata.robots).toBeUndefined();
    const og = landingMetadata.openGraph as { images?: unknown[]; videos?: { url: string }[] };
    expect(og.images?.length).toBeGreaterThan(0);
    expect(og.videos?.[0].url).toBe("https://virpo.io/og/pocket-device.mp4");
    expect(markup).toContain('"@type":"ProfilePage"');
  });
});

describe("Pocket Room objects", () => {
  it("numbers every clickable object uniquely, in order", () => {
    expect(ROOM_OBJECTS.map((item) => item.fig)).toEqual(ROOM_OBJECTS.map((_, index) => index + 1));
    expect(new Set(ROOM_OBJECTS.map((item) => item.id)).size).toBe(ROOM_OBJECTS.length);
  });

  it("maps the objects the brief asks for to the right places", () => {
    const goes = (id: string) => objectById.get(id);
    expect(goes("window")?.toy).toBe("window");
    expect(goes("mirror")?.toy).toBe("face");
    expect(goes("kana")?.toy).toBe("kana");
    expect(goes("radio")?.toy).toBe("sounds");
    expect(goes("hydrangea")?.toy).toBe("bloom");
    expect(goes("arcade")?.projectSlug).toBe("levels");
    expect(goes("tv")?.projectSlug).toBe("youtldr");
    expect(goes("deck")?.projectSlug).toBe("cmux-deck");
    expect(goes("clay")).toBeUndefined();
    expect(goes("cork")?.projectSlug).toBe("zlta-stopa");
    expect(goes("aiposter")?.projectSlug).toBe("ai-build-week");
    expect(goes("printer")?.projectSlug).toBe("pegboard-toy");
    expect(goes("peter")?.kind).toBe("about");
    const slugs = new Set(labProjects.map((project) => project.slug));
    for (const item of ROOM_OBJECTS) if (item.projectSlug) expect(slugs.has(item.projectSlug), item.projectSlug).toBe(true);
  });

  it("places every object inside the plate and gives it a hull hit shape", () => {
    for (const item of ROOM_OBJECTS) {
      const [x, y, w, h] = item.box;
      expect(x >= 0 && y >= 0 && x + w <= LAYERS.plate.w + 1 && y + h <= LAYERS.plate.h + 1, item.id).toBe(true);
      expect(hullClip(item.hull), item.id).toMatch(/^polygon\(/);
    }
  });

  it("moves the d-pad cursor to a neighbour in that direction, and the knob cycles", () => {
    const peter = objectById.get("peter")!;
    const right = neighbour("peter", "right");
    expect(right.box[0] + right.box[2] / 2).toBeGreaterThan(peter.box[0] + peter.box[2] / 2);
    const up = neighbour("peter", "up");
    expect(up.box[1] + up.box[3] / 2).toBeLessThan(peter.box[1] + peter.box[3] / 2);
    expect(neighbour(null, "left").id).toBe(ROOM_OBJECTS[0].id);
    expect(cycle("post-0", 1).id).toBe("post-1");
    expect(cycle(ROOM_OBJECTS[0].id, -1).id).toBe(ROOM_OBJECTS[ROOM_OBJECTS.length - 1].id);
  });

  it("picks the object under a finger, or the nearest one within reach", () => {
    const [x, y, w, h] = objectById.get("mirror")!.box;
    expect(pickAt(x + w / 2, y + h / 2)?.id).toBe("mirror");
    expect(pickAt(x + w + 20, y + h / 2)?.id).toBeDefined();
    expect(pickAt(-500, -500)).toBeNull();
  });
});

describe("Pocket Room life", () => {
  it("runs a shinkansen every 15–25 s with a local train in between", () => {
    for (const roll of [0, 0.5, 0.999]) {
      const [, train] = nextTrain(null, () => roll);
      expect(train.kind).toBe("shinkansen");
      const [toLocal, local] = nextTrain(train, () => roll);
      expect(local.kind).toBe("local");
      const [toNext, next] = nextTrain(local, () => roll);
      expect(next.kind).toBe("shinkansen");
      // start of one shinkansen to the start of the next (the scene adds 200 ms after each train)
      const gap = train.ms + 200 + toLocal + local.ms + 200 + toNext;
      expect(gap, String(roll)).toBeGreaterThanOrEqual(15_000);
      expect(gap, String(roll)).toBeLessThanOrEqual(25_000);
    }
  });

  it("follows Tokyo time for the light in the room", () => {
    expect(timeForHour(7)).toBe("morning");
    expect(timeForHour(12)).toBe("day");
    expect(timeForHour(17)).toBe("evening");
    expect(timeForHour(23)).toBe("night");
    // the bezel prints Tokyo time
    expect(tokyoClock(new Date("2026-10-23T12:05:00Z"))).toBe("21:05");
  });

  it("has mini-Peter read, turn pages, and wave at the end", () => {
    expect(readingPose(0.2, false)).toBe("reading");
    expect(readingPose(0.5, true)).toBe("page");
    expect(readingPose(1, false)).toBe("wave");
  });
});

describe("Pocket Room post page", () => {
  it("exports every post", () => {
    expect(generateStaticParams().map((params) => params.slug).sort()).toEqual([...getPostSlugs()].sort());
  });

  it("is the canonical, indexable post with article previews", async () => {
    const slug = getPostSlugs()[0];
    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(meta.alternates?.canonical).toBe(`/blog/${slug}/`);
    expect(meta.robots).toBeUndefined();
    expect(meta.openGraph).toMatchObject({ type: "article" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("renders one readable column with date, reading time, tags, body, neighbours, the way home and the hydrangea", async () => {
    const posts = getPostSummaries();
    const post = posts[1];
    const markup = html(await RoomPostPage({ params: Promise.resolve({ slug: post.slug }) }));
    expect(markup).toContain(`<h1>${escape(post.title)}</h1>`);
    expect(markup).toContain(`dateTime="${post.publishedAt.toISOString()}"`);
    expect(markup).toContain(post.readingTime.label);
    for (const tag of post.tags) expect(markup).toContain(tag);
    expect(markup).toContain('id="room-article"');
    expect(markup).toMatch(href(`/blog/${posts[0].slug}/`));
    expect(markup).toMatch(href(`/blog/${posts[2].slug}/`));
    expect(markup).toContain('aria-label="Peter Hraska, home"');
    expect(markup).toContain("/lab/room/peter-reading.webp");
    expect(markup).toContain('data-toy="hydrangea"');
    expect(markup).toContain("/lab/room/margin/hydrangea.webp");
    // the margin is decorative: no extra tab stops in it
    expect(markup).not.toContain("data-hit=");
  });
});

describe("Pocket Room writing index", () => {
  it("lists every post and points canonical at /blog/", () => {
    const markup = html(<RoomWritingPage />);
    for (const post of getPostSummaries()) expect(markup).toMatch(href(`/blog/${post.slug}/`));
    expect(writingMetadata.alternates?.canonical).toBe("/blog/");
  });
});

describe("Pocket Room assets", () => {
  it("ships every painted layer as a small WebP", () => {
    const files = [
      "plate.webp",
      "plate-800.webp",
      "view.webp",
      "glass-mask.png",
      "part.webp",
      "cat.webp",
      "train-shinkansen.webp",
      "train-local.webp",
      ...["typing", "mug", "window", "reading", "page", "wave"].map((pose) => `peter-${pose}.webp`),
      ...Object.keys(LAYERS.objects).map((id) => `obj-${id}.webp`),
      "notebook-0.webp",
      "notebook-1.webp",
      "notebook-2.webp",
    ];
    let total = 0;
    for (const name of files) {
      const path = resolve(process.cwd(), "public/lab/room", name);
      expect(existsSync(path), name).toBe(true);
      const size = statSync(path).size;
      expect(size, name).toBeLessThan(220_000);
      total += size;
    }
    expect(total).toBeLessThan(1_200_000);
  });

  it("gives every project card its own painted art, small and crisp at 2x", () => {
    for (const item of ROOM_OBJECTS.filter((entry) => entry.kind === "project")) {
      const id = item.layer.replace(/^obj-/, "");
      const card = CARD_ART[id];
      expect(card, id).toBeDefined();
      expect(cardArt(item.layer).src).toBe(`/lab/room/card-${id}.webp`);
      // the art column is at most about 285 x 346 CSS px (2560-wide desktop)
      expect(Math.max(card.width / 285, card.height / 346), id).toBeGreaterThanOrEqual(1.9);
      const path = resolve(process.cwd(), "public", card.src.slice(1));
      expect(existsSync(path), id).toBe(true);
      expect(statSync(path).size, id).toBeLessThan(120_000);
      expect(existsSync(resolve(process.cwd(), `components/room/tools/prompts/card-${id}.txt`)), id).toBe(true);
    }
  });

  it("keeps the room free of three.js and WebGL", () => {
    for (const file of ["components/room/Device.tsx", "components/room/scene/RoomScene.tsx"]) {
      expect(readFileSync(resolve(process.cwd(), file), "utf8")).not.toMatch(/from "three"|getContext\("webgl/);
    }
  });
});
