import type { Metadata } from "next";
import Link from "next/link";
import { Device } from "../../components/room/Device";
import { ProjectIcon } from "../../components/room/icons/ProjectIcon";
import { V2SocialIcon } from "../../components/v2/V2SocialIcon";
import { roomDate, RoomFooter } from "../../components/room/RoomChrome";
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

// under the name: X (where the tips go) with words, the rest as quiet icons
const SOCIAL = [
  { label: "GitHub", icon: "github", href: "https://github.com/virpo" },
  { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/virpo.san/" },
  { label: "RSS feed", icon: "rss", href: "/rss.xml" },
] as const;

export default function RoomPage() {
  const posts = getPostSummaries();
  const newest = posts.slice(0, 3);
  const devicePosts = newest.map((post) => ({ slug: post.slug, title: post.title, date: post.publishedAt.toISOString() }));
  // Prehistoriq stays out of the room for now (Levels still lives on its domain).
  const shown = labProjects
    .filter((project) => project.slug !== "prehistoriq")
    .map((project) => (project.slug === "levels" ? { ...project, blurb: "What is your AI level? A small web game, one level at a time." } : project));
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
              <ul className={styles.social} aria-label="Elsewhere">
                <li>
                  <a className={styles.socialX} href="https://x.com/virpo" target="_blank" rel="noreferrer" aria-label="Tips and fun on X">
                    <V2SocialIcon name="x" />
                    <span aria-hidden="true">Tips &amp; fun</span>
                  </a>
                </li>
                {SOCIAL.map((link) => (
                  <li key={link.icon}>
                    <a href={link.href} aria-label={link.label} title={link.label} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                      <V2SocialIcon name={link.icon} />
                    </a>
                  </li>
                ))}
              </ul>
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
          <section className={styles.section} id="projects" aria-labelledby="projects-title">
            <h2 id="projects-title">Projects</h2>
            <ul className={styles.rows}>
              {shown.map((project) => {
                const item = objectForProject(project.slug);
                return (
                  <li key={project.slug}>
                    <a className={`${styles.row} ${styles.projectRow}`} href={project.href} target="_blank" rel="noreferrer" data-room-target={item?.id} data-icon-play>
                      <span className={styles.rowIcon}>
                        <ProjectIcon slug={project.slug} />
                      </span>
                      <span className={styles.rowTitle}>{project.title}</span>
                      <span className={styles.rowMeta}>{project.blurb}</span>
                      <span className={styles.rowFig}>{item ? `${figLabel(item.fig)} · ${item.name}` : project.type}</span>
                    </a>
                  </li>
                );
              })}
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
