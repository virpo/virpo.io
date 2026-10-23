import type { Metadata } from "next";
import Link from "next/link";
import { Device } from "../../components/room/Device";
import { roomDate, RoomFooter, RoomSocial } from "../../components/room/RoomChrome";
import { figLabel, objectForProject, roomPostHref } from "../../components/room/scene/objects";
import { getPostSummaries } from "../../lib/blog";
import { labAbout, labProjects } from "../../lib/lab/catalog";
import styles from "./room.module.css";

export const metadata: Metadata = {
  title: { absolute: "Peter Hraska · Pocket Room" },
  description: "Peter Hraska’s writing and projects, with a tiny painted room where a shinkansen passes the window.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

// a project that lives outside the catalog: the Slush side event we ran in Bratislava
const SLUSHD = {
  slug: "bratislava-slushd",
  title: "Bratislava Slush’D",
  type: "Event · Startups",
  href: "https://bratislavaslushd.com/",
  blurb: "The official Slush spin-off in Bratislava: founder stories, workshops and 1-on-1s with VCs. 21 October 2025, Nová Cvernovka.",
};

export default function RoomPage() {
  const posts = getPostSummaries();
  const newest = posts.slice(0, 3);
  const devicePosts = newest.map((post) => ({ slug: post.slug, title: post.title, date: post.publishedAt.toISOString() }));
  // Prehistoriq stays out of the room for now (Levels still lives on its domain).
  const shown = labProjects
    .filter((project) => project.slug !== "prehistoriq")
    .map((project) => (project.slug === "levels" ? { ...project, blurb: "What level are you with agents? Your agent checks 100 tricks and deals you a card." } : project))
    .concat(SLUSHD);
  const projects = shown.map((project) => ({
    slug: project.slug,
    title: project.title,
    type: project.type,
    href: project.href,
    blurb: project.blurb,
  }));

  return (
    <div className={styles.page}>
      <main>
        <section className={styles.hero} aria-label="Peter Hraska">
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
            <ol className={styles.posts} aria-label="Newest writing">
              {newest.map((post, index) => (
                <li key={post.slug}>
                  <Link href={roomPostHref(post.slug)} className={styles.post} data-room-target={`post-${index}`}>
                    <span className={styles.postTitle}>{post.title}</span>
                    <time dateTime={post.publishedAt.toISOString()}>{roomDate.format(post.publishedAt)}</time>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href="/room/writing/" className={styles.allWriting} data-room-target="bookshelf">
              All writing <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <div className={styles.below}>
          <section className={`${styles.section} ${styles.projectsSection}`} id="projects" aria-labelledby="projects-title">
            <h2 id="projects-title">Projects</h2>
            {/* each project painted in the room's ink and watercolour, from its real screenshot or photo */}
            <ul className={styles.projectGrid}>
              {shown.map((project) => {
                const item = objectForProject(project.slug);
                return (
                  <li key={project.slug}>
                    <a className={styles.projectCard} href={project.href} target="_blank" rel="noreferrer" data-room-target={item?.id}>
                      <span className={styles.projectArt}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/lab/room/projects/${project.slug}.webp`} alt="" width={1080} height={720} loading="lazy" decoding="async" />
                      </span>
                      <span className={styles.projectHead}>
                        <span className={styles.rowTitle}>{project.title}</span>
                        <span className={styles.projectKind}>{item ? `${figLabel(item.fig)} · ${project.type}` : project.type}</span>
                      </span>
                      <span className={styles.rowMeta}>{project.blurb}</span>
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
              {labAbout.links.map((link) => (
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
