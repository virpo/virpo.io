import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { RoomFooter, RoomHeader, roomDate } from "../../components/room/RoomChrome";
import { RoomStage } from "../../components/room/RoomStage";
import { figLabel, hotspotById, hotspotForProject, roomPostHref, toyHotspots } from "../../components/room/hotspots";
import { getPostSummaries } from "../../lib/blog";
import { labAbout, labProjects } from "../../lib/lab/catalog";
import styles from "./room.module.css";

export const metadata: Metadata = {
  title: "Pocket Room",
  description: "Peter Hraska’s writing and projects, kept in a tiny interactive room with trains going past the window.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

const toyBlurbs: Record<string, string> = {
  window: "Ride the shinkansen past Mount Fuji.",
  face: "My face follows your cursor.",
  kana: "Learn hiragana, one card at a time.",
  bloom: "What is blooming in Japan right now.",
  sounds: "Ten tiny sounds of Japan.",
};

export default function RoomPage() {
  const posts = getPostSummaries().slice(0, 3);
  const postRefs = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.publishedAt.toISOString(),
  }));
  const projects = labProjects.map((project) => ({
    slug: project.slug,
    title: project.title,
    type: project.type,
    href: project.href,
    blurb: project.blurb,
    image: project.image ? { ...project.image } : undefined,
  }));

  return (
    <div className={styles.page} data-room-page>
      <RoomHeader current="home" home />
      <main className={styles.home}>
        <section className={styles.world} id="world" aria-label="Pocket Room: an interactive diorama of Peter’s writing room and workshop">
          <RoomStage posts={postRefs} projects={projects} about={labAbout} />
        </section>

        <div className={styles.index}>
          <section className={styles.intro} data-room-target="peter">
            <p className={styles.kicker}>
              <span>Fig. 01</span> Peter Hraska
            </p>
            <h1>
              A blog and a box of projects, <em>kept in a pocket room.</em>
            </h1>
            <p className={styles.lede}>
              Short notes on building useful things with AI, hardware and small teams. Anything in the room with a
              number opens something. Prefer plain text? The full list is right here.
            </p>
          </section>

          <section className={styles.block} id="writing" aria-labelledby="writing-title">
            <header className={styles.blockHead}>
              <h2 id="writing-title">
                <i style={{ background: "var(--r-orange)" }} aria-hidden="true" />
                Writing
              </h2>
              <span>Newest first</span>
            </header>
            <ol className={styles.posts}>
              {posts.map((post, index) => {
                const spot = hotspotById.get(`post-${index}`);
                return (
                  <li key={post.slug}>
                    <Link className={styles.post} href={roomPostHref(post.slug)} data-room-target={`post-${index}`}>
                      <span className={styles.fig} aria-hidden="true">
                        {String(spot?.fig ?? index + 2).padStart(2, "0")}
                      </span>
                      <span className={styles.postText}>
                        <strong>{post.title}</strong>
                        <span>{post.description}</span>
                      </span>
                      <time dateTime={post.publishedAt.toISOString()}>{roomDate.format(post.publishedAt)}</time>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className={styles.more}>
              <Link href="/room/writing/" data-room-target="bookshelf">
                All writing <span aria-hidden="true">→</span>
              </Link>
              <a href="/rss.xml">RSS feed</a>
            </p>
          </section>

          <section className={styles.block} id="projects" aria-labelledby="projects-title">
            <header className={styles.blockHead}>
              <h2 id="projects-title">
                <i style={{ background: "var(--r-blue)" }} aria-hidden="true" />
                Projects
              </h2>
              <span>{labProjects.length} things I made</span>
            </header>
            <ul className={styles.rows} style={{ "--accent": "var(--r-blue)" } as CSSProperties}>
              {labProjects.map((project) => {
                const spot = hotspotForProject(project.slug);
                return (
                  <li key={project.slug}>
                    <a className={styles.row} href={project.href} target="_blank" rel="noreferrer" data-room-target={spot?.id}>
                      <span className={styles.fig} aria-hidden="true">
                        {spot ? String(spot.fig).padStart(2, "0") : "··"}
                      </span>
                      <strong>{project.title}</strong>
                      <span className={styles.rowMeta}>{project.type}</span>
                      <span className={styles.arrow} aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.block} id="toys" aria-labelledby="toys-title">
            <header className={styles.blockHead}>
              <h2 id="toys-title">
                <i style={{ background: "var(--r-green)" }} aria-hidden="true" />
                Japan toys
              </h2>
              <span>One click each</span>
            </header>
            <ul className={styles.rows} style={{ "--accent": "var(--r-green)" } as CSSProperties}>
              {toyHotspots.map((spot) => (
                <li key={spot.id}>
                  <a className={styles.row} href="#world" data-room-open={spot.id} data-room-target={spot.id} aria-label={`${spot.title}: ${toyBlurbs[spot.id]} Opens in the room. ${figLabel(spot.fig)}.`}>
                    <span className={styles.fig} aria-hidden="true">
                      {String(spot.fig).padStart(2, "0")}
                    </span>
                    <strong>{spot.title}</strong>
                    <span className={styles.rowMeta}>{toyBlurbs[spot.id]}</span>
                    <span className={styles.arrow} aria-hidden="true">
                      ◱
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.block} id="about" aria-labelledby="about-title" data-room-target="peter">
            <header className={styles.blockHead}>
              <h2 id="about-title">
                <i style={{ background: "var(--r-ink)" }} aria-hidden="true" />
                About
              </h2>
              <span>Product · design · engineering</span>
            </header>
            <p className={styles.aboutText}>
              <strong>{labAbout.headline}</strong> {labAbout.body}
            </p>
            <ul className={styles.social}>
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
