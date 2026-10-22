import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compilePostMdx } from "../../../../components/blog/mdx-components";
import { dotDate, fullDate, noteNumber, SidecarFooter, SidecarHeader } from "../../../../components/sidecar/Chrome";
import { Device } from "../../../../components/sidecar/Device";
import { rssAlternates } from "../../../../components/sidecar/meta";
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
      alternates: { canonical: `/blog/${post.slug}/`, types: rssAlternates },
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
  // Posts are newest first: "previous" is the older note, "next" the newer one.
  const older = posts[index + 1];
  const newer = posts[index - 1];
  const number = noteNumber(index, posts.length);
  const isoDate = post.publishedAt.toISOString().slice(0, 10);
  const updated = post.updatedAt ? { iso: post.updatedAt.toISOString().slice(0, 10), label: fullDate(post.updatedAt) } : null;

  const facts = (
    <>
      <div>
        <dt>No.</dt>
        <dd>{number}</dd>
      </div>
      <div>
        <dt>Published</dt>
        <dd>
          <time dateTime={isoDate}>{fullDate(post.publishedAt)}</time>
        </dd>
      </div>
      {updated ? (
        <div>
          <dt>Updated</dt>
          <dd>
            <time dateTime={updated.iso}>{updated.label}</time>
          </dd>
        </div>
      ) : null}
      <div>
        <dt>Length</dt>
        <dd>
          {post.readingTime.words} words · {post.readingTime.label}
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
    </>
  );

  return (
    <div className={styles.page}>
      <SidecarHeader current="post" />
      <nav className={styles.ruleRow} aria-label="Breadcrumb">
        <span className={styles.trail}>
          <Link href="/sidecar/">Sidecar</Link>
          <span aria-hidden="true">/</span>
          <Link href="/sidecar/writing/">Writing</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Note {number}</span>
        </span>
        <span>
          <time dateTime={isoDate}>{dotDate(post.publishedAt)}</time> · {post.readingTime.label}
        </span>
      </nav>
      <div className={styles.postLayout}>
        <aside className={styles.factsRail} aria-label="About this note">
          <dl className={styles.facts}>{facts}</dl>
        </aside>

        <main id="main" className={styles.postMainColumn}>
          <article className={styles.article} data-sidecar-article>
            <header className={styles.articleHeader}>
              <h1 className={styles.articleTitle}>{post.title}</h1>
              <p className={styles.standfirst}>{post.description}</p>
              <dl className={styles.articleMeta}>{facts}</dl>
            </header>
            <div className={styles.prose}>{content}</div>
            <p className={styles.endOfPost}>
              <span className={styles.endDots} aria-hidden="true" />
              <span>End of note {number}</span>
              <span className={styles.endDots} aria-hidden="true" />
            </p>
            <footer className={styles.author}>
              {/* A dithered LCD portrait, the same four tones as the device's FACE mode. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.authorFace} src="/lab/sidecar/peter-lcd.png" alt="" width={80} height={80} loading="lazy" decoding="async" />
              <div className={styles.authorText}>
                <p>
                  <strong>Peter Hraska</strong> builds products at Slido, part of Cisco, and small tools and toys on the
                  side. This note was published <time dateTime={isoDate}>{fullDate(post.publishedAt)}</time>.
                </p>
                <p className={styles.endLinks}>
                  <a href={`mailto:peter@hraska.sk?subject=${encodeURIComponent(`Re: ${post.title}`)}`}>Write back</a>
                  <a href="/rss.xml">Follow via RSS</a>
                  <a href={`/blog/${post.slug}/`}>Original on virpo.io</a>
                </p>
              </div>
            </footer>
          </article>

          <nav className={styles.pager} aria-label="More writing">
            {older ? (
              <Link className={styles.pagerLink} href={`/sidecar/blog/${older.slug}/`} rel="prev" data-lcd-ticker={`Previous: ${older.title}`}>
                <span className={styles.pagerLabel}>← Previous note</span>
                <span className={styles.pagerTitle}>{older.title}</span>
                <span className={styles.pagerDate}>{dotDate(older.publishedAt)}</span>
              </Link>
            ) : (
              <span className={styles.pagerEmpty}>This is the first note.</span>
            )}
            {newer ? (
              <Link className={`${styles.pagerLink} ${styles.pagerNext}`} href={`/sidecar/blog/${newer.slug}/`} rel="next" data-lcd-ticker={`Next: ${newer.title}`}>
                <span className={styles.pagerLabel}>Next note →</span>
                <span className={styles.pagerTitle}>{newer.title}</span>
                <span className={styles.pagerDate}>{dotDate(newer.publishedAt)}</span>
              </Link>
            ) : (
              <span className={`${styles.pagerEmpty} ${styles.pagerNext}`}>This is the newest note.</span>
            )}
          </nav>
          <p className={styles.backHome}>
            <Link href="/sidecar/">← Back to Sidecar</Link>
            <Link href="/sidecar/writing/">All writing</Link>
          </p>
        </main>

        <aside className={styles.rail} aria-label="Sidecar device">
          <div className={styles.railSticky}>
            <Device variant="dock" progressTarget="[data-sidecar-article]" label="Sidecar, docked. Its LEDs fill as you read." />
            <p className={styles.railNote}>
              Reading is a trip: the train leaves Tokyo with the first line and pulls into Shin-Osaka at the last. Keys
              1–5 switch toys.
            </p>
          </div>
        </aside>
      </div>
      <SidecarFooter />
    </div>
  );
}
