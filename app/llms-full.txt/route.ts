import { getPost, getPostSummaries } from "../../lib/blog";
import { AUTHOR, SITE_URL } from "../../lib/site";

export const dynamic = "force-static";

/** MDX to plain Markdown: pictures and loops become their descriptions, so the text reads on its own */
function plain(source: string) {
  const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
  return source
    .replace(/<ImagePair[\s\S]*?\/>\n?/g, (tag) =>
      [...tag.matchAll(/alt: "([^"]*)"/g)].map((m) => `[Picture: ${m[1]}]`).join("\n") + "\n")
    .replace(/<(ArticleImage|ArticleLoop|ArticleVideo)\b[\s\S]*?\/>/g, (tag) => {
      const what = attr(tag, "alt") ?? attr(tag, "label") ?? "";
      const caption = attr(tag, "title");
      return `[${tag.startsWith("<ArticleImage") ? "Picture" : "Video"}: ${what}${caption ? `. Caption: ${caption}` : ""}]`;
    })
    .replace(/```prompt\n/g, "```text\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// /llms-full.txt: every post in full, for answer engines that want to quote exact sentences
export function GET() {
  const posts = getPostSummaries();
  const body = [
    `# ${AUTHOR} (virpo): every post in full`,
    "",
    `> The full text of the writing on ${SITE_URL}/blog/, newest first. A short summary of the site is at ${SITE_URL}/llms.txt.`,
    "",
    ...posts.flatMap((summary) => {
      const post = getPost(summary.slug);
      return [
        "---",
        "",
        `## ${post.title}`,
        "",
        `URL: ${SITE_URL}/blog/${post.slug}/`,
        `Author: ${AUTHOR}`,
        `Published: ${post.publishedAt.toISOString().slice(0, 10)}${post.updatedAt ? `, updated ${post.updatedAt.toISOString().slice(0, 10)}` : ""}`,
        "",
        `> ${post.description}`,
        "",
        plain(post.source),
        "",
      ];
    }),
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
