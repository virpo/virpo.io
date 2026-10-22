import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({ IBM_Plex_Mono: () => ({ variable: "font-plex-mono" }) }));
import SidecarPost, { generateMetadata, generateStaticParams } from "../../app/sidecar/blog/[slug]/page";
import SidecarHome, { metadata as homeMetadata } from "../../app/sidecar/page";
import SidecarWriting, { metadata as writingMetadata } from "../../app/sidecar/writing/page";
import { metadata as layoutMetadata } from "../../app/sidecar/layout";
import { getPostSummaries } from "../../lib/blog";
import { labProjects } from "../../lib/lab/catalog";

const posts = getPostSummaries();
// next/link drops the trailing slash outside a real build (trailingSlash lives in next.config).
const link = (path: string) => new RegExp(`href="${path.replace(/\/$/, "")}/?"`);

describe("sidecar landing", () => {
  const html = renderToStaticMarkup(<SidecarHome />);

  it("server-renders the three newest posts and the archive link", () => {
    for (const post of posts.slice(0, 3)) {
      expect(html).toMatch(link(`/sidecar/blog/${post.slug}/`));
      expect(html).toContain(`data-lcd-ticker="Note`);
    }
    expect(html).toMatch(link("/sidecar/writing/"));
    expect(html).toContain("All writing");
    expect(html.indexOf("Writing</h2>")).toBeLessThan(html.indexOf("Projects</h2>"));
  });

  it("lists every project and the about copy as plain HTML", () => {
    for (const project of labProjects) expect(html).toContain(`href="${project.href}"`);
    expect(html).toContain("About</h2>");
  });

  it("renders the device with five keys, shortcuts and a still LCD poster", () => {
    for (const [index, label] of ["FACE", "KANA", "WINDOW", "SOUND", "BLOOM"].entries()) {
      expect(html).toContain(`aria-keyshortcuts="${index + 1}"`);
      expect(html).toContain(label);
    }
    expect(html).toMatch(/aria-pressed="true"[^>]*aria-keyshortcuts="3"/);
    expect(html).toContain("/lab/sidecar/lcd-window.png");
    expect(html).toContain("/lab/sidecar/lcd-window-night.png");
    for (const poster of ["lcd-window.png", "lcd-window-night.png"]) {
      expect(existsSync(resolve(process.cwd(), "public/lab/sidecar", poster))).toBe(true);
    }
  });

  it("points search engines at the real homepage and keeps RSS discoverable", () => {
    expect(homeMetadata.alternates?.canonical).toBe("/");
    for (const alternates of [homeMetadata.alternates, writingMetadata.alternates, layoutMetadata.alternates]) {
      expect(alternates?.types).toMatchObject({ "application/rss+xml": [{ url: "/rss.xml" }] });
    }
    expect(layoutMetadata.robots).toMatchObject({ index: false });
    expect(writingMetadata.alternates?.canonical).toBe("/blog/");
  });
});

describe("sidecar posts", () => {
  it("exports a page for every post", () => {
    expect(generateStaticParams().map((entry) => entry.slug).sort()).toEqual(posts.map((post) => post.slug).sort());
  });

  it.each(posts.map((post) => post.slug))("renders %s readable without JavaScript", async (slug) => {
    const element = await SidecarPost({ params: Promise.resolve({ slug }) });
    const html = renderToStaticMarkup(element);
    const post = posts.find((entry) => entry.slug === slug)!;
    expect(html).toContain("<h1");
    expect(html).toContain(post.title.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    expect(html).toContain(`dateTime="${post.publishedAt.toISOString().slice(0, 10)}"`);
    expect(html).toContain("data-sidecar-article");
    expect(html).toContain('data-variant="dock"');
    expect(html).toMatch(link("/sidecar/"));
  });

  it("is noindex with a canonical pointing at the real post, and keeps RSS", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: posts[0].slug }) });
    expect(metadata.robots).toMatchObject({ index: false });
    expect(metadata.alternates?.canonical).toBe(`/blog/${posts[0].slug}/`);
    expect(metadata.alternates?.types).toMatchObject({ "application/rss+xml": [{ url: "/rss.xml" }] });
  });

  it("ends with a divider, an author card and the facts rail", async () => {
    const html = renderToStaticMarkup(await SidecarPost({ params: Promise.resolve({ slug: posts[0].slug }) }));
    expect(html).toContain("End of note 003");
    expect(html).toContain("/lab/sidecar/peter-lcd.png");
    expect(html).toContain("Write back");
    expect(html).toMatch(/aria-label="About this note"/);
    expect(html).toMatch(/aria-label="Breadcrumb"/);
  });

  it("links previous and next notes", async () => {
    const middle = posts[1];
    const html = renderToStaticMarkup(await SidecarPost({ params: Promise.resolve({ slug: middle.slug }) }));
    expect(html).toMatch(link(`/sidecar/blog/${posts[0].slug}/`));
    expect(html).toMatch(link(`/sidecar/blog/${posts[2].slug}/`));
  });
});

describe("sidecar writing index", () => {
  it("lists every post with its date", () => {
    const html = renderToStaticMarkup(<SidecarWriting />);
    for (const post of posts) {
      expect(html).toMatch(link(`/sidecar/blog/${post.slug}/`));
    }
    expect(html).toContain('href="/rss.xml"');
  });
});

describe("sidecar assets", () => {
  it("keeps the face sheet and the avatar small", () => {
    expect(statSync(resolve(process.cwd(), "public/lab/sidecar/face-sheet.webp")).size).toBeLessThan(180_000);
    expect(statSync(resolve(process.cwd(), "public/lab/sidecar/peter-lcd.png")).size).toBeLessThan(8_000);
  });
});
