export type Skill = {
  slug: string;
  emoji: string;
  name: string;
  summary: string;
  proof?: string;
};

const REPO = "virpo/agent-skills";

export const skills = [
  {
    slug: "sell-my-stuff",
    emoji: "🏷️",
    name: "Sell My Stuff",
    summary:
      "Point it at a folder of photos of stuff you don't use, tweak the prices it suggests from similar listings, and it posts to Facebook Marketplace, Craigslist, Bazoš, eBay or Vinted once you approve.",
    proof: "Sold €1,059 of my stuff so far.",
  },
  {
    slug: "look-hard",
    emoji: "🔬",
    name: "Look Hard",
    summary:
      "Looks at the thing you shipped the way people actually see it, fixes the biggest problems, and proves it with before and after evidence.",
  },
  {
    slug: "blast-radius-buddy",
    emoji: "🧨",
    name: "Blast Radius Buddy",
    summary:
      "Reviews a GitHub pull request for security holes, what else it could break, and whether the feature really works, double-checks the serious findings, skips the nits, and posts one review.",
  },
] as const satisfies readonly Skill[];

export function installCommand(skill: Pick<Skill, "slug">) {
  return `npx skills add ${REPO} --skill ${skill.slug}`;
}

export function sourceUrl(skill: Pick<Skill, "slug">) {
  return `https://github.com/${REPO}/tree/main/skills/${skill.slug}`;
}
