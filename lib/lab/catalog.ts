import { projects, type Project } from "../projects";

// Shared content for the /room and /sidecar experiments. Posts come from lib/blog.

export type LabProject = {
  slug: string;
  title: string;
  type: string;
  href: string;
  blurb: string;
  image?: Project["image"];
};

const blurbs: Record<string, string> = {
  YouTLDR: "Adds the missing summary to YouTube, so long clickbait collapses into one useful sentence.",
  "Žltá stopa": "Agentic kit for investigative journalists to interrogate public data.",
  "Mood Radio": "A mood-based music picker from 2013. Basically pre-Spotify, still weirdly timeless.",
  "Pegboard Toy": "An ugly sketch and two measurements became a 3D-printed toy for my son.",
  "AI Build Week": "Twelve hours, tiny teams, and products that earned their first euro.",
  "CMUX Deck": "A Stream Deck that shows what each of my coding agents is doing.",
};

const slugify = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const labProjects: readonly LabProject[] = [
  {
    slug: "levels",
    title: "Levels",
    type: "Game · Web",
    href: "/levels/",
    blurb: "What level are you with agents? Your agent checks 100 tricks and deals you a card.",
  },
  {
    slug: "prehistoriq",
    title: "Prehistoriq",
    type: "Website · Miniature world",
    href: "https://prehistoriq.com",
    blurb: "A tilt-shift miniature site with bokeh on hover and an animated clay guy.",
  },
  ...projects.map((project) => ({
    slug: slugify(project.title),
    title: project.title,
    type: project.type,
    href: project.href,
    blurb: blurbs[project.title] ?? "",
    image: project.image,
  })),
];

export const labAbout = {
  name: "Peter Hraska",
  eyebrow: "Hello, I’m Peter.",
  headline: "I like living somewhere between product, design, and engineering.",
  body: "I’ve been doing that at Slido for 10+ years. Since 2021, we’ve been part of Cisco. Sometimes it’s a product, sometimes a tool, sometimes a toy.",
  links: [
    { label: "GitHub", href: "https://github.com/virpo" },
    { label: "Instagram", href: "https://www.instagram.com/virpo.san/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/hraska/" },
    { label: "X", href: "https://x.com/virpo" },
    { label: "Email", href: "mailto:peter@hraska.sk" },
  ],
} as const;
