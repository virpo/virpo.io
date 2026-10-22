import type { Metadata } from "next";
import Link from "next/link";
import { dotDate, noteNumber, SidecarFooter, SidecarHeader } from "../../components/sidecar/Chrome";
import { Device } from "../../components/sidecar/Device";
import { Instruments } from "../../components/sidecar/Instruments";
import { getLatestPostDate, getPostSummaries } from "../../lib/blog";
import { labAbout, labProjects } from "../../lib/lab/catalog";
import styles from "./sidecar.module.css";

export const metadata: Metadata = {
  title: { absolute: "virpo · Peter Hraska · Sidecar" },
  description: "Peter Hraska writes about building with AI, making physical things, and Japan.",
  alternates: { canonical: "/" },
};

export default function SidecarHome() {
  const posts = getPostSummaries();
  const latest = posts.slice(0, 3);
  const updated = getLatestPostDate(posts);

  return (
    <div className={styles.page}>
      <SidecarHeader />
      <p className={styles.indexStrip}>
        <span>Personal index</span>
        <span>
          {posts.length} notes · {labProjects.length} projects · 5 instruments
        </span>
        {updated ? (
          <span>
            Last note <time dateTime={updated.toISOString().slice(0, 10)}>{dotDate(updated)}</time>
          </span>
        ) : null}
      </p>

      <main id="main" className={styles.landing}>
        <div className={styles.deviceColumn}>
          <div className={styles.deviceSticky}>
            <Device variant="hero" />
          </div>
        </div>

        <section className={styles.writing} id="writing" aria-labelledby="writing-title">
          <header className={styles.sectionHead}>
            <span className={styles.sectionNumber} aria-hidden="true">01</span>
            <h2 id="writing-title">Writing</h2>
            <span className={styles.badge}>Blog</span>
            <p className={styles.sectionLede}>Short notes on building with AI, making physical things, and Japan.</p>
          </header>
          <ol className={styles.postList}>
            {latest.map((post, index) => (
              <li key={post.slug}>
                <Link className={styles.postRow} href={`/sidecar/blog/${post.slug}/`}>
                  <span className={styles.postNumber}>{noteNumber(index, posts.length)}</span>
                  <span className={styles.postMain}>
                    <span className={styles.postTitle}>{post.title}</span>
                    <span className={styles.postDescription}>{post.description}</span>
                  </span>
                  <time className={styles.postDate} dateTime={post.publishedAt.toISOString().slice(0, 10)}>
                    {dotDate(post.publishedAt)}
                  </time>
                  <span className={styles.postArrow} aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link className={styles.allLink} href="/sidecar/writing/">
            All writing <span aria-hidden="true">→</span>
          </Link>
        </section>

        <div className={styles.instrumentsSlot}>
          <Instruments />
        </div>

        <section className={styles.projects} id="projects" aria-labelledby="projects-title">
          <header className={styles.sectionHead}>
            <span className={styles.sectionNumber} aria-hidden="true">02</span>
            <h2 id="projects-title">Projects</h2>
            <p className={styles.sectionLede}>Things I built, mostly for fun, some for work.</p>
          </header>
          <ul className={styles.projectList}>
            {labProjects.map((project) => (
              <li key={project.slug}>
                <a className={styles.projectRow} href={project.href}>
                  <span className={styles.projectTitle}>{project.title}</span>
                  <span className={styles.projectType}>{project.type}</span>
                  <span className={styles.projectBlurb}>{project.blurb}</span>
                  <span className={styles.projectArrow} aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.about} id="about" aria-labelledby="about-title">
          <header className={styles.sectionHead}>
            <span className={styles.sectionNumber} aria-hidden="true">03</span>
            <h2 id="about-title">About</h2>
          </header>
          <p className={styles.aboutEyebrow}>{labAbout.eyebrow}</p>
          <p className={styles.aboutHeadline}>{labAbout.headline}</p>
          <p className={styles.aboutBody}>{labAbout.body}</p>
          <ul className={styles.aboutLinks}>
            {labAbout.links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SidecarFooter />
    </div>
  );
}
