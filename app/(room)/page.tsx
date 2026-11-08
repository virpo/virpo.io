import type { Metadata } from "next";
import Link from "next/link";
import { Device } from "../../components/room/Device";
import { CardsInView } from "../../components/room/CardsInView";
import { ProjectCard, ProjectList } from "../../components/room/ProjectCards";
import { PROJECT_META } from "../../components/room/projects";
import { roomDate, RoomFooter, RoomSocial } from "../../components/room/RoomChrome";
import { roomPostHref } from "../../components/room/scene/objects";
import { V2SocialIcon } from "../../components/v2/V2SocialIcon";
import { aiProjects, featuredProjects, moreProjects } from "../../lib/ai-projects";
import { getLatestPostDate, getPostSummaries } from "../../lib/blog";
import { labAbout, labProjects } from "../../lib/lab/catalog";
import { jsonLd, OG_IMAGE, OG_VIDEO, PERSON, RSS_ALTERNATE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, HOME_TITLE } from "../../lib/site";
import styles from "./room.module.css";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", types: RSS_ALTERNATE },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    // the pocket-device cut, for previews that play video
    videos: [OG_VIDEO],
  },
  twitter: {
    card: "summary_large_image",
    site: "@virpo",
    creator: "@virpo",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
  },
};

// every project, for search engines and answer engines
const PROJECT_LIST = {
  "@type": "ItemList",
  "@id": `${SITE_URL}/#projects`,
  name: "Projects by Peter Hraska",
  itemListElement: aiProjects().map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: { "@type": "CreativeWork", name: p.title, description: p.blurb, dateCreated: p.start, ...(p.href && !p.private ? { url: new URL(p.href, SITE_URL).toString() } : {}), creator: { "@id": PERSON["@id"] } },
  })),
};

// who this is and what the site is, for search engines and answer engines
const STRUCTURED = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: `${SITE_URL}/`, name: SITE_NAME, alternateName: SITE_TITLE, description: SITE_DESCRIPTION, author: { "@id": PERSON["@id"] }, publisher: { "@id": PERSON["@id"] }, inLanguage: "en" },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#profile`,
      url: `${SITE_URL}/`,
      name: SITE_TITLE,
      dateCreated: "2026-10-23",
      dateModified: (getLatestPostDate(getPostSummaries()) ?? new Date("2026-10-23")).toISOString().slice(0, 10),
      mainEntity: PERSON,
    },
    PROJECT_LIST,
  ],
};

// a project that lives outside the catalog: the Slush side event we ran in Bratislava
const SLUSHD = {
  slug: "bratislava-slushd",
  title: "Bratislava Slush’D",
  type: "Event · Startups",
  href: "https://bratislavaslushd.com/",
  blurb: "The official Slush spin-off in Bratislava: founder stories, workshops and 1-on-1s with VCs. 21 October 2025, Nová Cvernovka.",
};

// 24 daily no-code challenges, December 2024
const ADVENT = {
  slug: "advent-of-no-code",
  title: "Advent of No-Code",
  type: "Challenge · No-code",
  href: "https://www.adventofnocode.io/",
  blurb: "Build something new every day: 24 days, 10 minutes each, no code. 229 people joined.",
};

export default function RoomPage() {
  const posts = getPostSummaries();
  const newest = posts.slice(0, 3);
  const devicePosts = newest.map((post) => ({ slug: post.slug, title: post.title, date: post.publishedAt.toISOString() }));
  // the room's objects open these (Prehistoriq stays out of the room for now); the Projects section
  // below lists everything from lib/ai-projects
  const shown = labProjects
    .filter((project) => project.slug !== "prehistoriq")
    .map((project) => (project.slug === "levels" ? { ...project, blurb: "What level are you with agents? Your agent checks 100 tricks and deals you a card." } : project))
    .concat(SLUSHD, ADVENT);
  const projects = shown.map((project) => ({
    slug: project.slug,
    title: project.title,
    type: project.type,
    href: project.href,
    blurb: project.blurb,
    tags: PROJECT_META[project.slug]?.tags,
  }));
  const featured = featuredProjects();
  const more = moreProjects();

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED) }} />
      <main>
        <section className={styles.hero} aria-label="Peter Hraska">
          <a className={styles.skip} href="#writing">
            Skip to writing
          </a>
          <div className={styles.deviceCol} id="room">
            <Device posts={devicePosts} projects={projects} about={labAbout} />
            <p className={styles.deviceHint}>
              <span className={styles.hintMouse}>Everything with a number opens.</span>
              <span className={styles.hintTouch}>Tap a number, tap again to open.</span>
              <span className={styles.hintKeys}>
                <kbd>←</kbd>
                <kbd>→</kbd> browse · <kbd>Enter</kbd> open · <kbd>Esc</kbd> back
              </span>
            </p>
          </div>

          <div className={styles.textCol}>
            <div className={styles.intro}>
              <h1 className={styles.name}>Peter Hraska</h1>
              <RoomSocial />
            </div>
            <ol className={styles.posts} aria-label="Newest writing" id="writing" tabIndex={-1}>
              {newest.map((post, index) => (
                <li key={post.slug}>
                  <Link href={roomPostHref(post.slug)} className={styles.post} data-room-target={`post-${index}`}>
                    <span className={styles.postTitle}>{post.title}</span>
                    <time dateTime={post.publishedAt.toISOString()}>{roomDate.format(post.publishedAt)}</time>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/blog/" className={styles.allWriting} data-room-target="bookshelf">
              All writing <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <div className={styles.below}>
          <section className={`${styles.section} ${styles.projectsSection}`} id="projects" aria-labelledby="projects-title">
            <h2 id="projects-title">Projects</h2>
            {/* the few I'd show first, each one clean thing painted from its real screenshot or photo: pencil at rest, colour on hover */}
            <ul className={styles.projectGrid}>
              {featured.map((project) => (
                <li key={project.slug} id={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
            <h3 className={styles.moreHead}>{more.length} more, newest first</h3>
            <ProjectList projects={more} />
            <p className={styles.projectsEnd}>
              <a className={styles.follow} href="https://x.com/virpo" target="_blank" rel="noopener">
                <V2SocialIcon name="x" />
                <span>I post what I make with AI on X as I make it.</span>
                <b>Follow @virpo</b>
              </a>
              <a className={styles.githubLink} href="https://github.com/virpo" target="_blank" rel="noopener">
                Smaller things on GitHub <span aria-hidden="true">→</span>
              </a>
            </p>
          </section>

          <section className={styles.section} id="about" aria-labelledby="about-title" data-room-target="peter">
            <h2 id="about-title">About</h2>
            <p className={styles.about}>
              {labAbout.headline} {labAbout.body}
            </p>
            <ul className={styles.links}>
              {[...labAbout.links, { label: "Agent skills", href: "/skills/" }].map((link) => (
                <li key={link.label}>
                  <a href={link.href} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <RoomFooter />
      <CardsInView />
    </div>
  );
}
