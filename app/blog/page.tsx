import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../../components/site/SiteShell";
import { getPostSummaries } from "../../lib/blog";

export const metadata: Metadata = {
  title: "Writing",
  description: "Short notes from Peter Hraska about making real things.",
  alternates: { canonical: "/blog/" },
  openGraph: {
    type: "website",
    title: "Writing · Peter Hraska",
    description: "Short notes from Peter Hraska about making real things.",
    url: "/blog/",
  },
  twitter: {
    card: "summary",
    title: "Writing · Peter Hraska",
    description: "Short notes from Peter Hraska about making real things.",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function BlogPage() {
  const posts = getPostSummaries();

  return (
    <SiteShell current="blog">
      <section className="tile blogIndex">
        <header className="blogIndexHeader">
          <p>Writing</p>
          <h1>Short notes about making real things.</h1>
        </header>
        <ol className="blogList" aria-label="Posts">
          {posts.map((post) => (
            <li id={post.slug} key={post.slug}>
              <article>
                <p className="blogListMeta">
                  <time dateTime={post.publishedAt.toISOString()}>
                    {dateFormatter.format(post.publishedAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingTime.label}</span>
                </p>
                <h2>
                  <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
                </h2>
                <p>{post.description}</p>
                <ul className="articleTags" aria-label={`Tags for ${post.title}`}>
                  {post.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </SiteShell>
  );
}
