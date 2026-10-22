import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compilePostMdx } from "../../../../components/blog/mdx-components";
import { dotDate, fullDate, noteNumber, SidecarFooter, SidecarHeader } from "../../../../components/sidecar/Chrome";
import { Device } from "../../../../components/sidecar/Device";
import { getPost, getPostSummaries } from "../../../../lib/blog";
import styles from "../../sidecar.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSummaries().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPost(slug);
    return {
      title: post.title,
      description: post.description,
      robots: { index: false, follow: true },
      alternates: { canonical: `/blog/${post.slug}/` },
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

export default async function SidecarPost({ params }: Props) {
  const { slug } = await params;
  const posts = getPostSummaries();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) notFound();
  const post = getPost(slug);
  const { content } = await compilePostMdx(post.source);
  const older = posts[index + 1];
  const newer = posts[index - 1];
  const number = noteNumber(index, posts.length);
  const isoDate = post.publishedAt.toISOString().slice(0, 10);

  return (
    <div className={styles.page}>
      <SidecarHeader current="post" />
      <div className={styles.postLayout}>
        <main id="main" className={styles.postMainColumn}>
          <article className={styles.article} data-sidecar-article>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/sidecar/">Sidecar</Link>
              <span aria-hidden="true">/</span>
              <Link href="/sidecar/writing/">Writing</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Note {number}</span>
            </nav>
            <header className={styles.articleHeader}>
              <h1 className={styles.articleTitle}>{post.title}</h1>
              <p className={styles.standfirst}>{post.description}</p>
              <dl className={styles.articleMeta}>
                <div>
                  <dt>Published</dt>
                  <dd>
                    <time dateTime={isoDate}>{fullDate(post.publishedAt)}</time>
                  </dd>
                </div>
                {post.updatedAt ? (
                  <div>
                    <dt>Updated</dt>
                    <dd>
                      <time dateTime={post.updatedAt.toISOString().slice(0, 10)}>{fullDate(post.updatedAt)}</time>
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
                  <dt>Filed under</dt>
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
            <div className={styles.prose}>{content}</div>
            <footer className={styles.articleEnd}>
              <span className={styles.endMark} aria-hidden="true" />
              <p>
                End of note {number}. Written by Peter Hraska, published{" "}
                <time dateTime={isoDate}>{dotDate(post.publishedAt)}</time>.
              </p>
              <p className={styles.endLinks}>
                <a href="/rss.xml">Follow via RSS</a>
                <a href={`mailto:peter@hraska.sk?subject=${encodeURIComponent(`Re: ${post.title}`)}`}>Reply by email</a>
              </p>
            </footer>
          </article>

          <nav className={styles.pager} aria-label="More writing">
            {older ? (
              <Link className={styles.pagerLink} href={`/sidecar/blog/${older.slug}/`} rel="prev">
                <span className={styles.pagerLabel}>← Previous note</span>
                <span className={styles.pagerTitle}>{older.title}</span>
                <span className={styles.pagerDate}>{dotDate(older.publishedAt)}</span>
              </Link>
            ) : (
              <span className={styles.pagerEmpty}>This is the first note.</span>
            )}
            {newer ? (
              <Link className={`${styles.pagerLink} ${styles.pagerNext}`} href={`/sidecar/blog/${newer.slug}/`} rel="next">
                <span className={styles.pagerLabel}>Next note →</span>
                <span className={styles.pagerTitle}>{newer.title}</span>
                <span className={styles.pagerDate}>{dotDate(newer.publishedAt)}</span>
              </Link>
            ) : (
              <span className={`${styles.pagerEmpty} ${styles.pagerNext}`}>This is the newest note.</span>
            )}
          </nav>
          <p className={styles.backHome}>
            <Link href="/sidecar/writing/">All writing</Link>
            <Link href="/sidecar/">← Back to Sidecar</Link>
          </p>
        </main>

        <aside className={styles.rail} aria-label="Sidecar device">
          <div className={styles.railSticky}>
            <Device variant="dock" progressTarget="[data-sidecar-article]" label="Sidecar, docked. Its LEDs fill as you read." />
            <p className={styles.railNote}>
              Reading is a trip: the train leaves Tokyo with the first line and pulls into Shin-Osaka at the last. Keys 1–5 switch toys.
            </p>
          </div>
        </aside>
      </div>
      <SidecarFooter />
    </div>
  );
}
