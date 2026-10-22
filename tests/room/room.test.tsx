import { existsSync, readFileSync } from "node:fs";
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

import RoomPostPage, { generateMetadata, generateStaticParams } from "../../app/room/blog/[slug]/page";
import RoomPage, { metadata as landingMetadata } from "../../app/room/page";
import RoomWritingPage, { metadata as writingMetadata } from "../../app/room/writing/page";
import { roomHotspots, resolveHotspot, toyHotspots } from "../../components/room/hotspots";
import { lightingForHour } from "../../components/room/RoomStage";
import { getPostSlugs, getPostSummaries } from "../../lib/blog";
import { labProjects } from "../../lib/lab/catalog";

const html = (node: ReactElement) => renderToStaticMarkup(node);
// next/link drops the trailing slash outside a Next build; the export keeps it.
const href = (path: string) => new RegExp(`href="${path.replace(/\/$/, "")}/?"`);

describe("Pocket Room landing", () => {
  const markup = html(<RoomPage />);
  const newest = getPostSummaries().slice(0, 3);

  it("renders the three newest posts as plain links with real dates, plus All writing", () => {
    for (const post of newest) {
      expect(markup).toMatch(href(`/room/blog/${post.slug}/`));
      expect(markup).toContain(post.title.replace(/&/g, "&amp;"));
      expect(markup).toContain(`dateTime="${post.publishedAt.toISOString()}"`);
    }
    expect(markup).toMatch(/href="\/room\/writing\/?"[^>]*>All writing/);
    expect(markup).toContain('href="/rss.xml"');
  });

  it("lists every project with an outbound link, and links each one to its object", () => {
    for (const project of labProjects) {
      expect(markup).toContain(`href="${project.href}"`);
      expect(markup).toContain(project.title);
      expect(roomHotspots.some((spot) => spot.projectSlug === project.slug)).toBe(true);
    }
  });

  it("keeps the five Japan toys one click away from the plain list", () => {
    for (const toy of toyHotspots) expect(markup).toContain(`data-room-open="${toy.id}"`);
    expect(toyHotspots.map((spot) => spot.toy).sort()).toEqual(["bloom", "face", "kana", "sounds", "window"]);
  });

  it("renders a still image and keyboard-reachable markers before any WebGL loads", () => {
    expect(markup).toContain("/lab/room/still-day-desktop.webp");
    const markers = markup.match(/aria-label="Fig\. \d\d, /g) ?? [];
    expect(markers).toHaveLength(roomHotspots.length);
  });

  it("is kept out of search results while it is an experiment", () => {
    expect(landingMetadata.robots).toMatchObject({ index: false });
  });
});

describe("Pocket Room hotspots", () => {
  it("numbers every clickable object uniquely, in order", () => {
    expect(roomHotspots.map((spot) => spot.fig)).toEqual(roomHotspots.map((_, index) => index + 1));
    expect(new Set(roomHotspots.map((spot) => spot.id)).size).toBe(roomHotspots.length);
  });

  it("covers every object the brief asks for", () => {
    const objects = roomHotspots.map((spot) => spot.object.toLowerCase()).join("|");
    for (const thing of ["peter", "notebook", "bookshelf", "3d printer", "arcade", "stage", "detective board", "tv", "stream deck", "clay", "radio", "window", "mirror", "hiragana", "hydrangea", "vending"]) {
      expect(objects).toContain(thing);
    }
  });

  it("turns the notebooks into the newest posts", () => {
    const posts = getPostSummaries().slice(0, 3).map((post) => ({ slug: post.slug, title: post.title, description: post.description, date: "" }));
    const resolved = roomHotspots.filter((spot) => spot.kind === "post").map((spot) => resolveHotspot(spot, posts));
    expect(resolved.map((spot) => spot?.href)).toEqual(posts.map((post) => `/room/blog/${post.slug}/`));
  });

  it("follows Tokyo time for day, dusk and night", () => {
    expect(lightingForHour(10)).toBe("day");
    expect(lightingForHour(17)).toBe("dusk");
    expect(lightingForHour(23)).toBe("night");
    expect(lightingForHour(5)).toBe("dusk");
  });
});

describe("Pocket Room post page", () => {
  it("exports every post", () => {
    expect(generateStaticParams().map((params) => params.slug).sort()).toEqual([...getPostSlugs()].sort());
  });

  it("points canonical at the original post and stays out of the index", async () => {
    const slug = getPostSlugs()[0];
    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(meta.alternates?.canonical).toBe(`/blog/${slug}/`);
    expect(meta.robots).toMatchObject({ index: false });
  });

  it("renders one readable column with date, reading time, tags, body and neighbours", async () => {
    const posts = getPostSummaries();
    const post = posts[1];
    const markup = html(await RoomPostPage({ params: Promise.resolve({ slug: post.slug }) }));
    expect(markup).toContain(`<h1>${post.title.replace(/&/g, "&amp;")}</h1>`);
    expect(markup).toContain(`dateTime="${post.publishedAt.toISOString()}"`);
    expect(markup).toContain(post.readingTime.label);
    for (const tag of post.tags) expect(markup).toContain(tag);
    expect(markup).toContain('id="room-article"');
    expect(markup).toMatch(href(`/room/blog/${posts[0].slug}/`));
    expect(markup).toMatch(href(`/room/blog/${posts[2].slug}/`));
    expect(markup).toContain('aria-label="A small window into the Pocket Room: Peter reading this post"');
    expect(markup).toContain("/lab/room/mini-tall.webp");
  });
});

describe("Pocket Room writing index", () => {
  it("lists every post with a room link and points canonical at /blog/", () => {
    const markup = html(<RoomWritingPage />);
    for (const post of getPostSummaries()) expect(markup).toMatch(href(`/room/blog/${post.slug}/`));
    expect(writingMetadata.alternates?.canonical).toBe("/blog/");
  });
});

describe("Pocket Room assets", () => {
  it("ships small WebP stills for the no-WebGL fallback", () => {
    for (const name of ["day", "dusk", "night"].flatMap((time) => [`still-${time}-desktop`, `still-${time}-mobile`]).concat(["mini-tall", "mini-wide"])) {
      const path = resolve(process.cwd(), `public/lab/room/${name}.webp`);
      expect(existsSync(path), name).toBe(true);
      expect(readFileSync(path).byteLength, name).toBeLessThan(220_000);
    }
  });

  it("loads three.js lazily, never from a server component", () => {
    const stage = readFileSync(resolve(process.cwd(), "components/room/RoomStage.tsx"), "utf8");
    expect(stage).toContain('await import("./world/engine")');
    expect(stage).not.toMatch(/^import .*from "three"/m);
  });
});
