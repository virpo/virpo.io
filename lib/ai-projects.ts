// Everything Peter made (nearly all of it with AI), for the Projects section of the home page:
// the FEATURED few as painted cards, in that order, then every other one on a line, newest first.
// To add one: an entry here, and a screenshot or photo at components/room/tools/art/ai/<slug>.png
// (then run components/room/tools/ai_projects.py). Projects with a painted card from the room
// reuse it (card: "room"). Without a picture the card shows the project's name on paper.

export type AiKind = "Product" | "Agent tool" | "Hardware" | "Event" | "For kids" | "Research" | "Experiment" | "Personal";

export type AiLogo =
  | { src: string; tall?: boolean; word?: string } // an image, optionally with a word beside it
  | { repo: string } // the GitHub mark and the repo name
  | { word: string; style?: "caps" | "mono" }; // just a word

export type AiProject = {
  slug: string;
  title: string;
  /** when it started, YYYY-MM-DD (the repo's first day, or the event's) */
  start: string;
  /** when work on it last happened, for the year grid; defaults to start */
  until?: string;
  kind: AiKind;
  /** one emoji for the list under the featured cards */
  emoji: string;
  /** about five words, for that list */
  short: string;
  blurb: string;
  href?: string;
  /** "room": a painted card, public/lab/room/projects/<slug> (every featured project has one);
   *  "ai": the screenshot or photo in public/ai/<slug>, shown when you point at its line */
  card?: "room" | "ai";
  /** a short muted loop, public/ai/<slug>.mp4, that plays over the card on hover */
  loop?: boolean;
  logo?: AiLogo;
  /** private: shown, but without a link */
  private?: boolean;
  /** hidden: kept here, not shown yet */
  hidden?: boolean;
};

const gh = (repo: string): AiLogo => ({ repo: `virpo/${repo}` });

export const AI_PROJECTS: AiProject[] = [
  { slug: "mood-radio", title: "Mood Radio", emoji: "📻", short: "Pick music by your mood", start: "2013-05-01", kind: "Experiment", blurb: "A mood-based music picker from 2013. Basically pre-Spotify, still weirdly timeless.", href: "https://virpo.sk/wp-content/uploads/radio.jpg", card: "room" },
  { slug: "prompy", title: "Prompy", emoji: "🪄", short: "A prompt IDE that stayed a domain", start: "2023-03-27", kind: "Agent tool", blurb: "An IDE for prompting GPT models. It never got past the domain name: prompy.ai.", private: true },
  { slug: "prompterator", title: "Prompterator", emoji: "🔁", short: "Compare prompts side by side", start: "2023-04-03", until: "2023-08-12", kind: "Agent tool", blurb: "Iterate on prompts side by side and rate the outputs; built with the Slido ML team.", href: "https://github.com/slidoapp/prompterator", card: "ai", logo: { src: "/ai/logos/prompterator.png", word: "slidoapp/prompterator" } },
  { slug: "bryndza", title: "Bryndza", emoji: "🧀", short: "RAG on climate-activism news", start: "2024-03-22", kind: "Research", blurb: "Retrieval-augmented GPT-4 and LLaMA; second place in a climate-activism NLP task.", href: "https://aclanthology.org/2024.case-1.23/", card: "ai", logo: { word: "Bryndza · CASE 2024" } },
  { slug: "ragthoven", title: "RAGthoven", emoji: "🎼", short: "A toolkit for RAG experiments", start: "2024-10-09", until: "2025-01-24", kind: "Research", blurb: "A configurable toolkit for RAG experiments, published at COLING 2025.", href: "https://github.com/ragthoven-dev/ragthoven", card: "ai", logo: { src: "/ai/logos/ragthoven.png", word: "RAGthoven" } },
  { slug: "advent-of-no-code", title: "Advent of No-Code", emoji: "🎄", short: "24 days of no-code", start: "2024-11-30", until: "2024-12-24", kind: "Event", blurb: "Twenty-four days of tiny no-code and AI creations. 229 people joined.", href: "https://adventofnocode.io", card: "room" },
  { slug: "ai-build-day", title: "AI Build Day", emoji: "🛠️", short: "70 people, 12 hours, prototypes", start: "2025-08-24", until: "2025-09-20", kind: "Event", blurb: "A 12-hour hackathon where 70 people built working AI prototypes.", href: "https://buildday.ai", card: "ai", logo: { src: "/ai/logos/ai-build-day.png", word: "AI Build Day" } },
  { slug: "blendo-coffee", title: "Blendo Coffee", emoji: "☕", short: "Vibe-coded live at TED AI", start: "2025-09-25", kind: "Experiment", blurb: "What 60 minutes of vibe-coding with early Claude Code made, live at TED AI Vienna.", href: "https://github.com/virpo/blendo-coffee-ted-ai-vienna", card: "ai", logo: gh("blendo-coffee-ted-ai-vienna") },
  { slug: "bratislava-slushd", title: "Bratislava Slush’D", emoji: "🎤", short: "The Slush side event, Bratislava", start: "2025-08-04", until: "2025-10-21", kind: "Event", blurb: "A founder conference I helped build, from the website to the stage.", href: "https://bratislavaslushd.com", card: "room" },
  { slug: "ai-capitan", title: "AI Capitan", emoji: "⚓", short: "AI adoption, made a game", start: "2025-11-15", kind: "Product", blurb: "Makes AI adoption in a company visible, social and a little competitive.", href: "https://ai-capitan.netlify.app", card: "ai", logo: { src: "/ai/logos/ai-capitan.svg", word: "AI Capitan" } },
  { slug: "skillfool", title: "Skillfool", emoji: "💪", short: "31 days, commits or workouts", start: "2025-12-23", until: "2026-01-17", kind: "Product", blurb: "A January challenge: 31 days of commits or workouts, and a board that keeps you honest. It never took off.", href: "https://skillfool.io", logo: { word: "skillfool.io", style: "mono" }, hidden: true },
  { slug: "posture-check", title: "Posture Check", emoji: "👀", short: "Googly eyes that nag posture", start: "2026-01-26", until: "2026-01-27", kind: "Experiment", blurb: "A hackathon persona for a Webex room device: googly eyes that watch you, nag about your posture and play air hockey.", href: "https://github.com/virpo/posture-check", card: "ai", loop: true, logo: gh("posture-check") },
  { slug: "zlta-stopa", title: "Žltá stopa", emoji: "🟡", short: "Follow the public money", start: "2026-02-10", kind: "Product", blurb: "AI-assisted civic tools for following contracts, assets and public money.", href: "https://zltastopa.sk", card: "room" },
  { slug: "agent-olympics", title: "Agent Olympics", emoji: "🏅", short: "Capture-the-flag for agents", start: "2026-02-23", until: "2026-02-24", kind: "Agent tool", blurb: "A capture-the-flag for agents: browser, document, spreadsheet, Slack and visual challenges.", href: "https://github.com/virpo/ctf-agent-olympics", card: "ai", logo: gh("ctf-agent-olympics") },
  { slug: "youtldr", title: "YouTLDR", emoji: "⏩", short: "YouTube’s answer, minus the video", start: "2026-03-30", until: "2026-10-27", kind: "Product", blurb: "A YouTube extension that gives you the answer before the video takes your time.", href: "https://youtldr.com", card: "room" },
  { slug: "pegboard-toy", title: "Pegboard Toy", emoji: "🧩", short: "A 3D-printed toy for my son", start: "2026-03-30", until: "2026-04-12", kind: "Hardware", blurb: "A hand sketch and two measurements became a 3D-printed toy for my son.", href: "https://github.com/virpo/pegboard", card: "room" },
  { slug: "dough-press", title: "Christmas Dough Roller", emoji: "🍪", short: "Seven stamps, 3D-printed", start: "2026-04-04", kind: "Hardware", blurb: "A play-dough roller with seven Christmas stamps, designed through an agent-to-printer loop. On MakerWorld.", href: "https://makerworld.com/en/models/3518990-christmas-play-dough-roller-7-stamps", card: "ai", logo: { word: "MakerWorld" } },
  { slug: "virpo-pocket-room", title: "virpo.io", emoji: "📟", short: "This site: a room in a pocket", start: "2026-04-09", until: "2026-10-28", kind: "Product", blurb: "This website: a painted room in a pocket device, made by asking for ten of everything.", href: "/blog/how-this-room-was-made/", card: "ai", logo: { src: "/ai/logos/virpo.png", word: "virpo.io" } },
  { slug: "japan", title: "Japan knowledge base", emoji: "🗾", short: "116 places, one trip", start: "2026-04-11", until: "2026-07-17", kind: "Personal", blurb: "Every place for a family trip to Japan, 116 pins from Tokyo to Ishigaki, kept by an agent and now growing into a guide.", card: "ai", private: true, logo: { word: "116 places" } },
  { slug: "prehistoriq-stacks", title: "Prehistoriq Stacks", emoji: "📊", short: "How 94 engineers use agents", start: "2026-05-10", kind: "Research", blurb: "How 94 engineers actually use coding agents: tools, models, how they review.", href: "https://prehistoriq.com/stacks", card: "ai", logo: { word: "prehistoriq/stacks", style: "mono" } },
  { slug: "marketplace-seller-agent", title: "Sell My Stuff", emoji: "🏷️", short: "Photos in, priced listings out", start: "2026-06-11", kind: "Agent tool", blurb: "An agent skill that turns photos of your old things into researched, priced marketplace listings. Thirteen things sold, €584.", href: "/skills/#sell-my-stuff", card: "ai", loop: true, logo: { src: "/ai/logos/agent-skills.png", word: "sell-my-stuff" } },
  { slug: "cmux-deck", title: "CMUX Deck", emoji: "🎛️", short: "A Stream Deck for coding agents", start: "2026-06-19", kind: "Hardware", blurb: "A Stream Deck that shows what each of my coding agents is doing.", href: "https://github.com/virpo/cmux-deck", card: "room" },
  { slug: "tada", title: "Tada", emoji: "📸", short: "A disposable camera for events", start: "2026-07-10", until: "2026-09-04", kind: "Product", blurb: "A disposable camera for events: one shared roll, no retakes, revealed the morning after. On the App Store.", href: "https://tada.camera", card: "room", logo: { src: "/ai/logos/tada.png", word: "tada.camera" } },
  { slug: "autoslides", title: "Autoslides", emoji: "🐕", short: "Agents that make their own slides", start: "2026-07-17", kind: "Agent tool", blurb: "Presentations built natively by agents, through render-and-review loops.", href: "https://github.com/virpo/autoslides", card: "ai", logo: { src: "/ai/logos/autoslides.png", word: "Autoslides" } },
  { slug: "agent-skills", title: "Agent Skills", emoji: "🧰", short: "Agent workflows from real projects", start: "2026-07-20", until: "2026-11-01", kind: "Agent tool", blurb: "Opinionated agent workflows forged in real projects.", href: "/skills/", card: "ai", logo: { src: "/ai/logos/agent-skills.png", word: "Agent Skills" } },
  { slug: "product-festival", title: "Product Festival", emoji: "🎪", short: "A demo day with fake investing", start: "2026-07-24", until: "2026-08-03", kind: "Product", blurb: "A QR-powered demo day with feedback, fictional investing and VibeBank.", href: "https://festival.aibuildweek.com", card: "ai", logo: { src: "/ai/logos/product-festival.svg", word: "Product Festival" } },
  { slug: "ai-build-week", title: "AI Build Week", emoji: "🚀", short: "Five days from idea to product", start: "2026-06-11", until: "2026-07-31", kind: "Event", blurb: "Twenty-one builders, seven teams, five days from idea to a working AI product.", href: "https://aibuildweek.com", card: "room" },
  { slug: "rinok", title: "Rinok home guide", emoji: "🔑", short: "An offline guide to our flat", start: "2026-08-05", until: "2026-08-06", kind: "Personal", blurb: "A guide to our flat, for us and our guests: the door, the air con, the blinds, the coffee. Encrypted, and it works offline.", card: "ai", private: true, logo: { word: "Rinok" } },
  { slug: "all-packed", title: "All Packed", emoji: "🧳", short: "A calm packing list", start: "2026-08-11", until: "2026-08-30", kind: "Product", blurb: "A calm packing app, distilled from a spreadsheet I used for more than ten years.", href: "https://allpacked.virpo.io", card: "ai", logo: { src: "/ai/logos/all-packed.png", word: "All Packed" } },
  { slug: "timer", title: "Just a Timer", emoji: "⏱️", short: "A fullscreen timer for talks", start: "2026-09-16", until: "2026-09-18", kind: "Product", blurb: "A no-nonsense fullscreen timer for talks, workshops and events.", href: "https://timer.virpo.io", card: "ai", logo: { word: "timer.virpo.io", style: "mono" } },
  { slug: "pracovna", title: "Pracovna", emoji: "🪑", short: "Try a home office in 3D", start: "2026-09-26", kind: "Personal", blurb: "An interactive 3D model of a compact home office, to try it out before building it.", href: "https://pracovna.virpo.io", card: "ai", loop: true, logo: gh("pracovna") },
  { slug: "leo", title: "Leo’s Workshop", emoji: "🪶", short: "Da Vinci’s inventions, narrated", start: "2026-10-16", until: "2026-10-18", kind: "For kids", blurb: "A little Leonardo da Vinci museum: six inventions, narrated in English and Slovak.", href: "https://leo.virpo.io", card: "ai", logo: { src: "/ai/logos/leo.png", word: "Leo’s Workshop" } },
  { slug: "plane", title: "The Jumbo Jet", emoji: "✈️", short: "Open up a Boeing 747", start: "2026-10-10", kind: "For kids", blurb: "An interactive cut-away of a Boeing 747 for children: zoom into the painting and open it up.", href: "https://plane.virpo.io", card: "ai", loop: true, logo: { word: "plane.virpo.io", style: "mono" } },
  { slug: "howthings-work", title: "howthings.work", emoji: "🔍", short: "How machines work, for small children", start: "2026-10-28", kind: "For kids", blurb: "A picture encyclopedia of machines for small children: zoom into a pencil town, into the Jumbo Jet, into the cockpit, and take off.", href: "https://howthings.work", card: "room", loop: true, logo: { src: "/ai/logos/howthings-work.png", word: "howthings.work" } },
  { slug: "moonlit", title: "Moonlit", emoji: "🌙", short: "Bedtime stories, read aloud", start: "2026-10-20", until: "2026-10-26", kind: "For kids", blurb: "Oli’s bedtime library: three little worlds to read aloud, in English and Slovak, with sounds and illustrated books like Nela and the bakery under the duvet.", href: "https://moonlit.virpo.io", card: "ai", logo: { src: "/ai/logos/moonlit.svg", word: "Moonlit" } },
  { slug: "dojo", title: "Dojo", emoji: "🥋", short: "Thirty minutes of practice a day", start: "2026-10-21", until: "2026-10-23", kind: "Product", blurb: "Thirty minutes a day, one practice, and a sensei that learns you.", private: true, hidden: true },
  { slug: "levels", title: "Levels", emoji: "🃏", short: "100 levels of working with agents", start: "2026-10-24", until: "2026-10-26", kind: "Agent tool", blurb: "100 levels of working with coding agents. Your agent checks which you do and deals you a card.", href: "/levels/", card: "room" },
  { slug: "enkiplate", title: "Enkiplate", emoji: "🎴", short: "Japanese flashcards on e-paper", start: "2026-10-24", kind: "Hardware", blurb: "Japanese flashcards on e-paper, with washi, spaced repetition, the weather and your next events.", href: "https://github.com/virpo/enkiplate", card: "room", logo: gh("enkiplate") },
];

/** the painted cards at the top of Projects, in this order (each needs card: "room"; twelve fill 3, 2 and 1 columns evenly) */
export const FEATURED = [
  "levels",
  "youtldr",
  "howthings-work",
  "ai-build-week",
  "zlta-stopa",
  "cmux-deck",
  "tada",
  "enkiplate",
  "pegboard-toy",
  "bratislava-slushd",
  "advent-of-no-code",
  "mood-radio",
] as const;

/** newest first */
export const aiProjects = () => AI_PROJECTS.filter((p) => !p.hidden).sort((a, b) => b.start.localeCompare(a.start));

export const featuredProjects = () => FEATURED.map((slug) => AI_PROJECTS.find((p) => p.slug === slug)).filter((p): p is AiProject => Boolean(p && !p.hidden));

/** everything not featured, newest first */
export const moreProjects = () => aiProjects().filter((p) => !(FEATURED as readonly string[]).includes(p.slug));
