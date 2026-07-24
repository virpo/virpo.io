import type { ReactNode } from "react";
import type { PostSummary } from "../../lib/blog";
import { ArticleFooter } from "./ArticleFooter";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function ArticleLayout({
  post,
  children,
}: {
  post: PostSummary;
  children: ReactNode;
}) {
  return (
    <article className="tile articlePage">
      <header className="articleHeader">
        <p className="articleMeta">
          <time dateTime={post.publishedAt.toISOString()}>
            {dateFormatter.format(post.publishedAt)}
          </time>
          {post.updatedAt ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Updated{" "}
                <time dateTime={post.updatedAt.toISOString()}>
                  {dateFormatter.format(post.updatedAt)}
                </time>
              </span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{post.readingTime.label}</span>
        </p>
        <h1>{post.title}</h1>
        <ul className="articleTags" aria-label="Tags">
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </header>
      <div className="articleBody">{children}</div>
      <ArticleFooter />
    </article>
  );
}
