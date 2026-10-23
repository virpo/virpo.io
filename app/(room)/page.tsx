import type { Metadata } from "next";
import Link from "next/link";
import { Device } from "../../components/room/Device";
import { ProjectLogo } from "../../components/room/ProjectLogo";
import { PROJECT_META, projectLine } from "../../components/room/projects";
import { roomDate, RoomFooter, RoomSocial } from "../../components/room/RoomChrome";
import { objectForProject, roomPostHref } from "../../components/room/scene/objects";
import { getPostSummaries } from "../../lib/blog";
import { labAbout, labProjects } from "../../lib/lab/catalog";
import { jsonLd, OG_IMAGE, OG_VIDEO, PERSON, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "../../lib/site";
import styles from "./room.module.css";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    // a calm loop of the room, for previews that play video
    videos: [OG_VIDEO],
  },
};

// who this is and what the site is, for search engines and answer engines
const STRUCTURED = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: `${SITE_URL}/`, name: SITE_NAME, description: SITE_DESCRIPTION, author: { "@id": PERSON["@id"] }, inLanguage: "en" },
    { "@type": "ProfilePage", "@id": `${SITE_URL}/#profile`, url: `${SITE_URL}/`, name: SITE_TITLE, mainEntity: PERSON },
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

// the cards show three across (about 340 px), two across, or full width on phones
const CARD_SIZES = "(max-width: 699px) 92vw, (max-width: 1099px) 46vw, 360px";
const cardSrcSet = (name: string) => `/lab/room/projects/${name}-540.webp 540w, /lab/room/projects/${name}-720.webp 720w, /lab/room/projects/${name}.webp 1080w`;

export default function RoomPage() {
  const posts = getPostSummaries();
  const newest = posts.slice(0, 3);
  const devicePosts = newest.map((post) => ({ slug: post.slug, title: post.title, date: post.publishedAt.toISOString() }));
  // Prehistoriq stays out of the room for now (Levels still lives on its domain).
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
            {/* one clean thing per project, painted from its real screenshot or photo: pencil at rest, colour on hover */}
            <ul className={styles.projectGrid}>
              {shown.map((project) => {
                const item = objectForProject(project.slug);
                return (
                  <li key={project.slug}>
                    <a className={styles.projectCard} href={project.href} target="_blank" rel="noreferrer" data-room-target={item?.id}>
                      <span className={styles.projectArt}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className={styles.projectPencil} src={`/lab/room/projects/${project.slug}-pencil-720.webp`} srcSet={cardSrcSet(`${project.slug}-pencil`)} sizes={CARD_SIZES} alt="" width={1080} height={720} loading="lazy" decoding="async" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className={styles.projectColour} src={`/lab/room/projects/${project.slug}-720.webp`} srcSet={cardSrcSet(project.slug)} sizes={CARD_SIZES} alt="" width={1080} height={720} loading="lazy" decoding="async" fetchPriority="low" />
                        <ProjectLogo slug={project.slug} title={project.title} />
                      </span>
                      <span className={styles.projectHead}>
                        <span className={styles.rowTitle}>{project.title}</span>
                        <span className={styles.projectKind}>{projectLine(project.slug) || project.type}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
              <li className={styles.moreItem}>
                <a className={styles.moreCard} href="https://github.com/virpo" target="_blank" rel="noreferrer">
                  <strong>More on GitHub →</strong>
                  <span>Smaller tools and experiments</span>
                </a>
              </li>
            </ul>
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
    </div>
  );
}
