export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fit: "cover" | "contain";
  position?: string;
};

export type Project = {
  title: string;
  type: string;
  href: string;
  emoji: string;
  tone: "paper" | "yellow" | "peach" | "kaki" | "red" | "ink";
  image: ProjectImage;
};

export const projects = [
  {
    title: "YouTLDR",
    type: "Product · Browser extension",
    href: "https://youtldr.com/",
    emoji: "🪄",
    tone: "paper",
    image: {
      src: "/assets/projects/youtldr-home.png",
      alt: "YouTLDR homepage",
      width: 1200,
      height: 800,
      fit: "contain",
      position: "center top",
    },
  },
  {
    title: "Žltá stopa",
    type: "Civic tech · Open data",
    href: "https://zltastopa.sk/",
    emoji: "🟡",
    tone: "yellow",
    image: {
      src: "/assets/projects/zltastopa-sk-thumb.png",
      alt: "Žltá stopa website",
      width: 1602,
      height: 882,
      fit: "contain",
      position: "center top",
    },
  },
  {
    title: "Mood Radio",
    type: "Hardware · Interaction",
    href: "https://virpo.sk/wp-content/uploads/radio.jpg",
    emoji: "📻",
    tone: "kaki",
    image: {
      src: "/assets/projects/mood-radio.jpg",
      alt: "Mood Radio interface",
      width: 960,
      height: 540,
      fit: "cover",
    },
  },
  {
    title: "Pegboard Toy",
    type: "Physical toy · 3D printing",
    href: "https://github.com/virpo/pegboard",
    emoji: "🧩",
    tone: "peach",
    image: {
      src: "/assets/projects/pegboard.jpg",
      alt: "A colorful 3D-printed pegboard toy beside its sketch",
      width: 1800,
      height: 920,
      fit: "cover",
    },
  },
  {
    title: "AI Build Week",
    type: "Community · Event",
    href: "https://aibuildweek.com/",
    emoji: "🏗️",
    tone: "ink",
    image: {
      src: "/assets/projects/ai-build-week.jpg",
      alt: "AI Build Week event poster",
      width: 1200,
      height: 630,
      fit: "contain",
      position: "center top",
    },
  },
  {
    title: "CMUX Deck",
    type: "Hardware · Developer tool",
    href: "https://github.com/virpo/cmux-deck",
    emoji: "🎛️",
    tone: "red",
    image: {
      src: "/assets/projects/cmux-deck.jpeg",
      alt: "Stream Deck showing agent and project status",
      width: 1400,
      height: 1050,
      fit: "cover",
      position: "center 58%",
    },
  },
] as const satisfies readonly Project[];
