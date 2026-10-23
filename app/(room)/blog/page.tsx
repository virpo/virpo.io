import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { RoomBackKey, roomDate, RoomFooter } from "../../../components/room/RoomChrome";
import { roomPostHref } from "../../../components/room/scene/objects";
import { getPostSummaries } from "../../../lib/blog";
import { pageMeta } from "../../../lib/site";
import shell from "../room.module.css";

export const metadata: Metadata = pageMeta({
  title: "Writing",
  description: "Every post by Peter Hraska, newest first: notes from making real things with AI agents, small teams and objects you can hold.",
  path: "/blog/",
});

/** the notebooks on the desk are orange, yellow and blue; older posts sit on the shelf */
const NOTEBOOK_COLORS = ["#e8621c", "#e5b23a", "#3f78c0"];
const SHELF_COLORS = ["#6f8d6a", "#b5523c", "#4c5d7a", "#a98a5a"];

export default function RoomWritingPage() {
  const posts = getPostSummaries();
  const years = new Map<number, typeof posts>();
  for (const post of posts) {
    const year = post.publishedAt.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  let index = -1;

  return (
    <div className={shell.page}>
      <main className={shell.writing}>
        <RoomBackKey />
        <header className={shell.writingHead}>
          <h1>Writing</h1>
          <p>
            Short notes from making real things: AI agents, small teams and objects you can hold. {posts.length} {posts.length === 1 ? "post" : "posts"}, newest first. Follow along by{" "}
            <a href="/rss.xml">RSS</a>.
          </p>
        </header>
        {[...years.entries()].map(([year, items]) => (
          <section key={year} className={shell.year} aria-labelledby={`year-${year}`}>
            <h2 id={`year-${year}`}>{year}</h2>
            <ol className={shell.entries}>
              {items.map((post) => {
                index += 1;
                const color = NOTEBOOK_COLORS[index] ?? SHELF_COLORS[index % SHELF_COLORS.length];
                return (
                  <li key={post.slug} id={post.slug}>
                    <Link href={roomPostHref(post.slug)} className={shell.entry} style={{ "--book": color } as CSSProperties}>
                      <i className={shell.book} aria-hidden="true" />
                      <strong>{post.title}</strong>
                      <span>{post.description}</span>
                      <time dateTime={post.publishedAt.toISOString()}>
                        {roomDate.format(post.publishedAt)} · {post.readingTime.label}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </main>
      <RoomFooter />
    </div>
  );
}
