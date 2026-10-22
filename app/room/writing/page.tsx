import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { roomPostHref } from "../../../components/room/hotspots";
import { spineLabel } from "../../../components/room/spines";
import { RoomFooter, RoomHeader, roomDate } from "../../../components/room/RoomChrome";
import { getPostSummaries } from "../../../lib/blog";
import shell from "../room.module.css";
import styles from "./writing.module.css";

export const metadata: Metadata = {
  title: "Writing · Pocket Room",
  description: "Every post by Peter Hraska, newest first.",
  alternates: { canonical: "/blog/" },
  robots: { index: false, follow: true },
};

const SPINES = ["#ff5a12", "#f2c84b", "#3f73b8", "#84a17f", "#ee8a72", "#2d3b58"];

export default function RoomWritingPage() {
  const posts = getPostSummaries();
  const years = new Map<number, typeof posts>();
  for (const post of posts) {
    const year = post.publishedAt.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), post]);
  }

  return (
    <div className={shell.page} data-room-page>
      <RoomHeader current="writing" />
      <main className={styles.main}>
        <div className={styles.top}>
          <header className={styles.header}>
            <p className={styles.kicker}>
              <Link href="/room/?spot=bookshelf#world">Fig. 05</Link> The bookshelf
            </p>
            <h1>Writing</h1>
            <p className={styles.lede}>
              Short notes from making real things: AI agents, small teams, and objects you can hold. {posts.length}{" "}
              {posts.length === 1 ? "post" : "posts"}, newest first. Follow along with <a href="/rss.xml">RSS</a>.
            </p>
          </header>

          <div className={styles.shelf} aria-hidden="true">
            {posts.map((post, index) => (
              <Link
                key={post.slug}
                href={roomPostHref(post.slug)}
                tabIndex={-1}
                className={styles.spine}
                title={post.title}
                style={{ "--spine": SPINES[index % SPINES.length], "--h": `${88 + ((index * 37) % 11)}%` } as CSSProperties}
              >
                <span>{spineLabel(post.title)}</span>
                <i>{roomDate.format(post.publishedAt).split(" ").slice(1).join(" ")}</i>
              </Link>
            ))}
            <span className={styles.bookend} />
            <span className={styles.plate}>
              {posts.length} notebooks
              <br />
              more soon
            </span>
          </div>
        </div>

        {[...years.entries()].map(([year, items]) => (
          <section key={year} className={styles.year} aria-labelledby={`year-${year}`}>
            <h2 id={`year-${year}`}>{year}</h2>
            <ol className={styles.list}>
              {items.map((post) => (
                <li key={post.slug}>
                  <article className={styles.item}>
                    <time dateTime={post.publishedAt.toISOString()}>{roomDate.format(post.publishedAt)}</time>
                    <div>
                      <h3>
                        <Link href={roomPostHref(post.slug)}>{post.title}</Link>
                      </h3>
                      <p>{post.description}</p>
                      <p className={styles.itemMeta}>
                        {post.readingTime.label} · {post.tags.join(" · ")}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <p className={styles.back}>
          <Link href="/room/">↖ Back to the Pocket Room</Link>
        </p>
      </main>
      <RoomFooter />
    </div>
  );
}
