import { getPostSummaries } from "../../lib/blog";
import { aiProjects } from "../../lib/ai-projects";
import { SITE_DESCRIPTION, SITE_URL } from "../../lib/site";

export const dynamic = "force-static";

// /llms.txt (llmstxt.org): a plain summary of the site for AI answer engines and agents
export function GET() {
  const posts = getPostSummaries();
  const projects = aiProjects();
  const body = [
    "# Peter Hraska (virpo)",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Peter has worked at Slido (part of Cisco) for 10+ years, somewhere between product, design and engineering. He writes about building with AI agents, small teams and objects you can hold. On X he is @virpo.",
    "",
    "## Writing",
    "",
    ...posts.map((post) => `- [${post.title}](${SITE_URL}/blog/${post.slug}/): ${post.description}`),
    "",
    "## Projects",
    "",
    `Everything Peter has made, newest first (nearly all of it with AI since 2023). All of it is on the home page: ${SITE_URL}/#projects`,
    "",
    ...projects.map((project) => {
      const name = project.href && !project.private ? `[${project.title}](${new URL(project.href, SITE_URL).toString()})` : `${project.title} (private)`;
      return `- ${name}, ${project.start.slice(0, 4)}: ${project.blurb}`;
    }),
    "",
    "## More",
    "",
    `- [Agent skills](${SITE_URL}/skills/): skills for coding agents, free to use`,
    `- [Levels](${SITE_URL}/levels/): what level are you with agents?`,
    `- [Levels, for agents](${SITE_URL}/levels/llms.txt): the 100 tricks as Markdown (${SITE_URL}/levels/levels.md) and the check an agent runs (${SITE_URL}/levels/check.md)`,
    `- [Full text of every post](${SITE_URL}/llms-full.txt)`,
    `- [RSS](${SITE_URL}/rss.xml)`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
