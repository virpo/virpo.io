import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseFrontmatter, type PostFrontmatter } from "./schema";

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;

const authoredOrder: Record<string, number> = {
  "a-different-kind-of-hackathon": 0,
  "weird-use-of-ai-1": 1,
  "weird-use-of-ai-3": 2,
};

export type ReadingTime = {
  minutes: number;
  words: number;
  label: string;
};

export type PostSummary = PostFrontmatter & {
  slug: string;
  readingTime: ReadingTime;
};

export type PostSource = PostSummary & {
  frontmatter: PostFrontmatter;
  source: string;
};

export function getLatestPostDate(
  posts: Array<Pick<PostSummary, "publishedAt" | "updatedAt">>,
): Date | undefined {
  return posts.reduce<Date | undefined>((latest, post) => {
    const candidate =
      post.updatedAt && post.updatedAt > post.publishedAt ? post.updatedAt : post.publishedAt;
    return !latest || candidate > latest ? candidate : latest;
  }, undefined);
}

function calculateReadingTime(source: string): ReadingTime {
  const words = source
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#_*`>{}[\]()]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return { minutes, words, label: `${minutes} min read` };
}

function readPost(slug: string): PostSource {
  const filename = path.join(POSTS_DIRECTORY, `${slug}.mdx`);

  if (!fs.existsSync(filename)) {
    throw new Error(`Blog post not found: ${slug}`);
  }

  const file = fs.readFileSync(filename, "utf8");
  const { data, content } = matter(file);
  const frontmatter = parseFrontmatter(data);

  return {
    ...frontmatter,
    slug,
    frontmatter,
    source: content.trim(),
    readingTime: calculateReadingTime(content),
  };
}

function comparePosts(a: PostSummary, b: PostSummary): number {
  const dateDifference = b.publishedAt.getTime() - a.publishedAt.getTime();
  if (dateDifference !== 0) return dateDifference;

  return (authoredOrder[b.slug] ?? 0) - (authoredOrder[a.slug] ?? 0);
}

export function getPostSlugs(): string[] {
  return getPostSummaries().map((post) => post.slug);
}

export function getPostSummaries(): PostSummary[] {
  return fs
    .readdirSync(POSTS_DIRECTORY)
    .filter((filename) => filename.endsWith(".mdx"))
    .map((filename) => readPost(filename.replace(/\.mdx$/, "")))
    .filter((post) => process.env.NODE_ENV !== "production" || !post.draft)
    .map(({ frontmatter: _frontmatter, source: _source, ...summary }) => summary)
    .sort(comparePosts);
}

export function getPost(slug: string): PostSource {
  return readPost(slug);
}
