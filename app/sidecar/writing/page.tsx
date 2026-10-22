import type { Metadata } from "next";
import Link from "next/link";
import { dotDate, fullDate, noteNumber, SidecarFooter, SidecarHeader } from "../../../components/sidecar/Chrome";
import { Device } from "../../../components/sidecar/Device";
import { getPostSummaries, type PostSummary } from "../../../lib/blog";
import { rssAlternates } from "../../../components/sidecar/meta";
import styles from "../sidecar.module.css";

export const metadata: Metadata = {
  title: "Writing",
  description: "Every note Peter Hraska has written, newest first.",
  alternates: { canonical: "/blog/", types: rssAlternates },
};

export default function SidecarWriting() {
  const posts = getPostSummaries();
  const latest = posts[0];
  const topics = [...new Set(posts.flatMap((post) => post.tags))];
  const years = new Map<number, Array<{ post: PostSummary; index: number }>>();
  posts.forEach((post, index) => {
    const year = post.publishedAt.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), { post, index }]);
  });

  return (
    <div className={styles.page}>
      <SidecarHeader current="writing" />
      <nav className={styles.ruleRow} aria-label="Breadcrumb">
        <span className={styles.trail}>
          <Link href="/sidecar/">Sidecar</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Writing</span>
        </span>
        <span>{posts.length} notes · newest first</span>
      </nav>
      <div className={styles.postLayout}>
        <aside className={styles.factsRail} aria-label="About the archive">
          <dl className={styles.facts}>
            <div>
              <dt>Notes</dt>
              <dd>{posts.length}</dd>
            </div>
            {latest ? (
              <div>
                <dt>Latest</dt>
                <dd>
                  <time dateTime={latest.publishedAt.toISOString().slice(0, 10)}>{fullDate(latest.publishedAt)}</time>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Topics</dt>
              <dd>
                <ul className={styles.tags}>
                  {topics.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Feed</dt>
              <dd>
                <a href="/rss.xml">RSS</a>
              </dd>
            </div>
          </dl>
        </aside>
        <main id="main" className={styles.postMainColumn} data-sidecar-writing>
          <header className={styles.writingHeader}>
            <h1 className={styles.articleTitle}>Writing</h1>
            <p className={styles.standfirst}>
              Short notes on building with AI, making physical things, and Japan. {posts.length} so far, newest first. Also as an{" "}
              <a href="/rss.xml">RSS feed</a>.
            </p>
          </header>
          {[...years.entries()].map(([year, entries]) => (
            <section key={year} className={styles.yearGroup} aria-labelledby={`year-${year}`}>
              <h2 id={`year-${year}`} className={styles.yearTitle}>
                {year}
              </h2>
              <ol className={styles.archive}>
                {entries.map(({ post, index }) => (
                  <li key={post.slug}>
                    <Link className={styles.archiveRow} href={`/sidecar/blog/${post.slug}/`} data-lcd-ticker={`Note ${noteNumber(index, posts.length)}: ${post.title}`}>
                      <span className={styles.postNumber}>{noteNumber(index, posts.length)}</span>
                      <span className={styles.archiveMain}>
                        <span className={styles.postTitle}>{post.title}</span>
                        <span className={styles.postDescription}>{post.description}</span>
                        <span className={styles.archiveMeta}>
                          {post.tags.join(" · ")} · {post.readingTime.label}
                        </span>
                      </span>
                      <time className={styles.postDate} dateTime={post.publishedAt.toISOString().slice(0, 10)}>
                        {dotDate(post.publishedAt)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <p className={styles.backHome}>
            <Link href="/sidecar/">← Back to Sidecar</Link>
          </p>
        </main>
        <aside className={`${styles.rail} ${styles.railAfter}`} aria-label="Sidecar device">
          <div className={styles.railSticky}>
            <Device variant="dock" label="Sidecar, docked" />
          </div>
        </aside>
      </div>
      <SidecarFooter />
    </div>
  );
}
