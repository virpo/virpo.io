import { getPostSummaries } from "../../lib/blog";
import { labProjects } from "../../lib/lab/catalog";
import { SITE_DESCRIPTION, SITE_URL } from "../../lib/site";

export const dynamic = "force-static";

// /llms.txt (llmstxt.org): a plain summary of the site for AI answer engines and agents
export function GET() {
  const posts = getPostSummaries();
  const projects = labProjects.filter((project) => project.slug !== "prehistoriq");
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
    ...projects.map((project) => `- [${project.title}](${new URL(project.href, SITE_URL).toString()}): ${project.blurb}`),
    "- [Bratislava Slush’D](https://bratislavaslushd.com/): the official Slush spin-off in Bratislava, 21 October 2025.",
    "- [Advent of No-Code](https://www.adventofnocode.io/): 24 daily no-code challenges, December 2024.",
    "",
    "## More",
    "",
    `- [Agent skills](${SITE_URL}/skills/): skills for coding agents, free to use`,
    `- [Levels](${SITE_URL}/levels/): what level are you with agents?`,
    `- [RSS](${SITE_URL}/rss.xml)`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
