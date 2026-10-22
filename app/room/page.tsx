import type { Metadata } from "next";
import Link from "next/link";
import { Device } from "../../components/room/Device";
import { roomDate, RoomFooter } from "../../components/room/RoomChrome";
import { figLabel, objectForProject, roomPostHref, TOY_OBJECTS } from "../../components/room/scene/objects";
import { getPostSummaries } from "../../lib/blog";
import { labAbout, labProjects } from "../../lib/lab/catalog";
import styles from "./room.module.css";

export const metadata: Metadata = {
  title: { absolute: "Peter Hraska · Pocket Room" },
  description: "Peter Hraska’s writing and projects, with a tiny painted room where a shinkansen passes the window.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

const TOY_BLURBS: Record<string, string> = {
  window: "Ride the shinkansen past the hills.",
  face: "My face follows your cursor.",
  kana: "Learn hiragana, one card at a time.",
  sounds: "Small sounds of Japan on the radio.",
  bloom: "What is blooming in Japan right now.",
};

export default function RoomPage() {
  const posts = getPostSummaries();
  const newest = posts.slice(0, 3);
  const devicePosts = newest.map((post) => ({ slug: post.slug, title: post.title, date: post.publishedAt.toISOString() }));
  const projects = labProjects.map((project) => ({
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
              <span className={styles.hintTouch}>Tap a number to see it, tap again to open.</span>
              <span className={styles.hintKeys}>
                <kbd>←</kbd>
                <kbd>→</kbd> browse · <kbd>Enter</kbd> open · <kbd>Esc</kbd> back
              </span>
            </p>
          </div>

          <div className={styles.textCol}>
            <h1 className={styles.name}>Peter Hraska</h1>
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
              {labProjects.map((project) => {
                const item = objectForProject(project.slug);
                return (
                  <li key={project.slug}>
                    <a className={styles.row} href={project.href} target="_blank" rel="noreferrer" data-room-target={item?.id}>
                      <span className={styles.rowTitle}>{project.title}</span>
                      <span className={styles.rowMeta}>{project.blurb}</span>
                      <span className={styles.rowFig}>{item ? `${figLabel(item.fig)} · ${item.name}` : project.type}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.section} id="toys" aria-labelledby="toys-title">
            <h2 id="toys-title">In the room</h2>
            <ul className={styles.rows}>
              {TOY_OBJECTS.map((item) => (
                <li key={item.id} id={`toy-${item.toy}`}>
                  <a className={styles.row} href={`#toy-${item.toy}`} data-room-target={item.id}>
                    <span className={styles.rowTitle}>{item.goes}</span>
                    <span className={styles.rowMeta}>{TOY_BLURBS[item.toy ?? ""]}</span>
                    <span className={styles.rowFig}>
                      {figLabel(item.fig)} · {item.name}
                    </span>
                  </a>
                </li>
              ))}
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
