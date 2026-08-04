import Link from "next/link";
import type { PostSummary } from "../../lib/blog";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const excerpts: Record<string, string> = {
  "a-different-kind-of-hackathon":
    "The teams shipped working products, and one earned its first euro within two weeks—not a room full of demos, but proof that tiny teams can make something real.",
  "weird-use-of-ai-1":
    "I gave an agent an ugly sketch and two measurements. Five minutes later, my printer was making pieces for the pegboard toy we had drilled by hand.",
  "weird-use-of-ai-3":
    "Journalists turned repeated investigative research into reusable skills an AI agent can carry between contracts, companies, ownership records, and real cases.",
};

export function V2WritingPreview({
  post,
  featured = false,
}: {
  post: PostSummary;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}/`}
      data-v2-writing-link
      data-v2-writing-featured={featured || undefined}
    >
      <article>
        {featured ? <span data-v2-writing-featured-label>Newest</span> : null}
        <div data-v2-writing-meta>
          <span>{post.tags[0]}</span>
          <time dateTime={post.publishedAt.toISOString()}>
            {dateFormatter.format(post.publishedAt)}
          </time>
        </div>
        <h2>{post.title}</h2>
        <p data-testid="v2-writing-excerpt">
          {excerpts[post.slug] ?? post.description}
        </p>
        <div data-v2-writing-route>
          <span>{post.readingTime.label}</span>
          <span aria-hidden="true">→</span>
        </div>
      </article>
    </Link>
  );
}
