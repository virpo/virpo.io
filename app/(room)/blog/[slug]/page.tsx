import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleLightbox } from "../../../../components/blog/ArticleLightbox";
import { compilePostMdx } from "../../../../components/blog/mdx-components";
import { Device } from "../../../../components/room/Device";
import { RoomBackKey, roomDate, RoomFooter } from "../../../../components/room/RoomChrome";
import { roomPostHref } from "../../../../components/room/scene/objects";
import { getPost, getPostSlugs, getPostSummaries, type PostSource } from "../../../../lib/blog";
import { absolute, AUTHOR, jsonLd, OG_IMAGE, PERSON, SITE_URL } from "../../../../lib/site";
import { imageDimensions } from "../../../../components/blog/media-dimensions";
import shell from "../../room.module.css";
import styles from "./post.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPost(slug);
    return {
      title: post.title,
      description: post.description,
      alternates: { canonical: `/blog/${post.slug}/` },
      authors: [{ name: AUTHOR, url: `${SITE_URL}/` }],
      openGraph: {
        type: "article",
        siteName: "virpo",
        locale: "en_US",
        title: post.title,
        description: post.description,
        url: `/blog/${post.slug}/`,
        publishedTime: post.publishedAt.toISOString(),
        modifiedTime: post.updatedAt?.toISOString(),
        authors: [`${SITE_URL}/`],
        tags: post.tags,
        images: post.socialImage ? [{ url: post.socialImage, alt: post.description, ...imageDimensions[post.socialImage] }] : [OG_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        site: "@virpo",
        creator: "@virpo",
        title: post.title,
        description: post.description,
        images: [post.socialImage ?? OG_IMAGE.url],
      },
    };
  } catch {
    return {};
  }
}

export function articleJsonLd(post: Pick<PostSource, "slug" | "title" | "description" | "publishedAt" | "updatedAt" | "socialImage" | "tags">) {
  const url = `${SITE_URL}/blog/${post.slug}/`;
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt).toISOString(),
    mainEntityOfPage: url,
    url,
    keywords: post.tags.join(", "),
    inLanguage: "en",
    author: PERSON,
    publisher: { "@id": PERSON["@id"] },
    image: absolute(post.socialImage ?? OG_IMAGE.url),
  });
}

const TOY_KEYS = [
  { href: "/#toy-window", icon: "🚄", label: "Shinkansen" },
  { href: "/#toy-sounds", icon: "♪", label: "Sounds" },
  { href: "/#toy-kana", icon: "あ", label: "Kana" },
];

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
  const devicePosts = all.slice(0, 3).map((item) => ({ slug: item.slug, title: item.title, date: item.publishedAt.toISOString() }));

  return (
    <div className={shell.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(post) }} />
      <main className={styles.layout}>
        <aside className={styles.margin} aria-label="Pocket Room">
          <div className={styles.sticky}>
            <div className={styles.dock}>
              <Device variant="dock" posts={devicePosts} progressTarget="room-article" />
            </div>
            {/* on a phone the room doesn't fit the margin: a few of its toys, one tap away */}
            <nav className={styles.toyKeys} aria-label="Toys in the room">
              {TOY_KEYS.map((toy) => (
                <a key={toy.href} href={toy.href} className={styles.toyKey}>
                  <span className={styles.toyKeyCap} aria-hidden="true">
                    {toy.icon}
                  </span>
                  {toy.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className={styles.article} id="room-article">
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <RoomBackKey label="Peter Hraska" />
            <span aria-hidden="true">/</span>
            <Link href="/blog/">Writing</Link>
          </nav>

          <header className={styles.header}>
            <h1>{post.title}</h1>
            <p className={styles.standfirst}>{post.description}</p>
            <p className={styles.meta}>
              <time dateTime={post.publishedAt.toISOString()}>{roomDate.format(post.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime.label}</span>
              {post.updatedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated <time dateTime={post.updatedAt.toISOString()}>{roomDate.format(post.updatedAt)}</time>
                  </span>
                </>
              ) : null}
            </p>
            <ul className={styles.tags} aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </header>

          <div className={styles.body}>{content}</div>
          <ArticleLightbox root="room-article" />

          <footer className={styles.end}>
            <p className={styles.signoff}>
              Thanks for reading. Replies are welcome at <a href="mailto:peter@hraska.sk">peter@hraska.sk</a>. Want more like this? <a href="https://x.com/virpo">Follow me on X</a>.
            </p>
            <nav className={styles.pager} aria-label="More posts">
              {older ? (
                <Link href={roomPostHref(older.slug)} className={styles.pageLink} rel="prev">
                  <span>← Older</span>
                  <strong>{older.title}</strong>
                  <time dateTime={older.publishedAt.toISOString()}>{roomDate.format(older.publishedAt)}</time>
                </Link>
              ) : (
                <Link href="/blog/" className={styles.pageLink}>
                  <span>The first post</span>
                  <strong>See every post on the shelf</strong>
                  <em>All writing →</em>
                </Link>
              )}
              {newer ? (
                <Link href={roomPostHref(newer.slug)} className={styles.pageLink} data-align="end" rel="next">
                  <span>Newer →</span>
                  <strong>{newer.title}</strong>
                  <time dateTime={newer.publishedAt.toISOString()}>{roomDate.format(newer.publishedAt)}</time>
                </Link>
              ) : (
                <Link href="/" className={styles.pageLink} data-align="end">
                  <span>The newest post</span>
                  <strong>Back to the room, where this notebook sits on the desk</strong>
                  <em>Pocket Room →</em>
                </Link>
              )}
            </nav>
          </footer>
        </article>
      </main>
      <RoomFooter />
    </div>
  );
}
