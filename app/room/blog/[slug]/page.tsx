import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { compilePostMdx } from "../../../../components/blog/mdx-components";
import { hotspotById, figLabel, roomPostHref } from "../../../../components/room/hotspots";
import { MiniRoom } from "../../../../components/room/MiniRoom";
import { RoomFooter, RoomHeader, roomDate, roomLongDate } from "../../../../components/room/RoomChrome";
import { getPost, getPostSlugs, getPostSummaries } from "../../../../lib/blog";
import shell from "../../room.module.css";
import styles from "./post.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

// matches the three notebooks on the desk in the room (orange, yellow, blue)
const NOTEBOOK_COLORS = ["#ff5a12", "#e2a400", "#3f73b8"];
const BOOK_3D = ["#f26a21", "#f2c84b", "#3f73b8"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPost(slug);
    return {
      title: post.title,
      description: post.description,
      // The Pocket Room is an experiment; the original post stays canonical.
      alternates: { canonical: `/blog/${post.slug}/` },
      robots: { index: false, follow: true },
      openGraph: {
        type: "article",
        title: post.title,
        description: post.description,
        url: `/blog/${post.slug}/`,
        publishedTime: post.publishedAt.toISOString(),
        images: post.socialImage ? [{ url: post.socialImage, alt: post.title }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function RoomPostPage({ params }: Props) {
  const { slug } = await params;
  let post;
  try {
    post = getPost(slug);
  } catch {
    notFound();
  }
  const { content } = await compilePostMdx(post.source);
  const all = getPostSummaries();
  const index = all.findIndex((item) => item.slug === post.slug);
  const newer = index > 0 ? all[index - 1] : null;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const spot = index >= 0 && index < 3 ? hotspotById.get(`post-${index}`) : null;
  const notebook = spot ? NOTEBOOK_COLORS[index] : "var(--r-ink)";
  const shelf = hotspotById.get("bookshelf");
  const roomLink = `/room/?spot=${spot ? spot.id : "bookshelf"}#world`;
  // the Fig. legend in the margin: the notebooks on the desk, then the bookshelf
  const legend = all.slice(0, 3).map((item, i) => ({ item, fig: hotspotById.get(`post-${i}`)?.fig ?? i + 2, color: NOTEBOOK_COLORS[i] }));

  return (
    <div className={shell.page} data-room-page>
      <RoomHeader current="writing" />
      <div className={styles.layout}>
        <article className={styles.article} id="room-article" style={{ "--notebook": notebook } as CSSProperties}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/room/">Pocket Room</Link>
            <span aria-hidden="true">/</span>
            <Link href="/room/writing/">Writing</Link>
          </nav>
          <header className={styles.header}>
            <Link className={styles.notebook} href={roomLink} title="See it in the Pocket Room">
              <i aria-hidden="true" />
              {spot ? `${figLabel(spot.fig)} · Notebook ${String(index + 1).padStart(2, "0")} on the desk` : `${figLabel(shelf?.fig ?? 5)} · From the bookshelf`}
              <span aria-hidden="true">↖</span>
            </Link>
            <h1>{post.title}</h1>
            <p className={styles.standfirst}>{post.description}</p>
            <dl className={styles.meta}>
              <div>
                <dt>Published</dt>
                <dd>
                  <time dateTime={post.publishedAt.toISOString()}>{roomLongDate.format(post.publishedAt)}</time>
                </dd>
              </div>
              {post.updatedAt ? (
                <div>
                  <dt>Updated</dt>
                  <dd>
                    <time dateTime={post.updatedAt.toISOString()}>{roomLongDate.format(post.updatedAt)}</time>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Reading</dt>
                <dd>
                  {post.readingTime.label} · {post.readingTime.words} words
                </dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>
                  <ul className={styles.tags}>
                    {post.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </header>

          <div className={styles.body}>{content}</div>

          <footer className={styles.end}>
            <p className={styles.signoff}>
              <span className={styles.signature}>Peter</span>
              Thanks for reading. Replies are welcome at <a href="mailto:peter@hraska.sk">peter@hraska.sk</a>, and new
              posts arrive by <a href="/rss.xml">RSS</a>.
            </p>
            <nav className={styles.pager} aria-label="More posts">
              {older ? (
                <Link href={roomPostHref(older.slug)} className={styles.pageLink} rel="prev">
                  <span>← Older</span>
                  <strong>{older.title}</strong>
                  <time dateTime={older.publishedAt.toISOString()}>{roomDate.format(older.publishedAt)}</time>
                </Link>
              ) : (
                <Link href="/room/writing/" className={styles.pageLink} data-kind="room">
                  <span>{figLabel(shelf?.fig ?? 5)} · The bookshelf</span>
                  <strong>That’s the first post. See every post on the shelf</strong>
                  <em aria-hidden="true">All writing →</em>
                </Link>
              )}
              {newer ? (
                <Link href={roomPostHref(newer.slug)} className={styles.pageLink} data-align="end" rel="next">
                  <span>Newer →</span>
                  <strong>{newer.title}</strong>
                  <time dateTime={newer.publishedAt.toISOString()}>{roomDate.format(newer.publishedAt)}</time>
                </Link>
              ) : (
                <Link href={roomLink} className={styles.pageLink} data-align="end" data-kind="room">
                  <span>Newest post · {spot ? figLabel(spot.fig) : "The room"}</span>
                  <strong>Back to the Pocket Room, where this notebook sits on the desk</strong>
                  <em aria-hidden="true">↖ Into the room</em>
                </Link>
              )}
            </nav>
            <p className={styles.back}>
              <Link href="/room/">↖ Back to the Pocket Room</Link>
              <Link href="/room/writing/">All writing</Link>
            </p>
          </footer>
        </article>

        <aside className={styles.margin} aria-label="A small window into the Pocket Room: Peter reading this post">
          <div className={styles.sticky}>
            <MiniRoom articleId="room-article" fig={spot ? `${figLabel(spot.fig)} · notebook` : "Writing room"} bookColor={spot ? BOOK_3D[index] : "#84a17f"} spotId={spot?.id ?? "bookshelf"} />
            <nav className={styles.legend} aria-label="In the Pocket Room">
              <p>In the room</p>
              <ol>
                {legend.map(({ item, fig, color }) => (
                  <li key={item.slug}>
                    <Link href={roomPostHref(item.slug)} aria-current={item.slug === post.slug ? "page" : undefined} style={{ "--notebook": color } as CSSProperties}>
                      <b>{String(fig).padStart(2, "0")}</b>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/room/writing/" style={{ "--notebook": "var(--r-ink)" } as CSSProperties}>
                    <b>{String(shelf?.fig ?? 5).padStart(2, "0")}</b>
                    <span>The bookshelf · all writing</span>
                  </Link>
                </li>
              </ol>
            </nav>
          </div>
        </aside>
      </div>
      <RoomFooter />
    </div>
  );
}
