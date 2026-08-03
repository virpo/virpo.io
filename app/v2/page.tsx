import type { Metadata } from "next";
import Link from "next/link";
import { FaceToy } from "../../components/home/FaceToy";
import { SiteFooter } from "../../components/site/SiteFooter";
import { SoundsToy } from "../../components/toys/SoundsToy";
import { StudyToy } from "../../components/toys/StudyToy";
import { WindowSeatToy } from "../../components/toys/WindowSeatToy";
import { V2Masthead } from "../../components/v2/V2Masthead";
import { V2WritingPreview } from "../../components/v2/V2WritingPreview";
import { getPostSummaries } from "../../lib/blog";
import styles from "./v2.module.css";

export const metadata: Metadata = {
  title: "Homepage v2 preview",
  alternates: { canonical: "/v2/" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "virpo",
    title: "virpo · homepage v2 preview",
    description: "A calmer personal homepage for Peter Hraska.",
    url: "/v2/",
  },
};

export default function HomePageV2() {
  const posts = getPostSummaries().slice(0, 3);

  return (
    <div className={styles.page} data-v2-home>
      <V2Masthead className={styles.masthead} />
      <main className={styles.main}>
        <section className={styles.hero} data-v2-hero>
          <div className={styles.face}>
            <FaceToy />
          </div>
          <div className={styles.intro} id="about" aria-label="About Peter">
            <p className={styles.eyebrow}>Hello, I’m Peter.</p>
            <h1>
              Product engineer from Slovakia. I make products and small tools.
            </h1>
            <p>
              Working at Slido for 10+ years now. We became part of Cisco in
              2021. I always want to be where product, design, and engineering
              meet.
            </p>
            <div className={styles.links} aria-label="Peter elsewhere">
              <a href="https://www.linkedin.com/in/hraska/" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href="https://github.com/virpo" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
        </section>

        <section className={styles.toys} data-v2-toys aria-label="Small Japan toys">
          <div className={styles.toyGrid}>
            <div className={styles.radio} data-v2-toy="radio">
              <SoundsToy />
            </div>
            <div className={styles.window} data-v2-toy="window-seat">
              <WindowSeatToy />
            </div>
            <div className={styles.study} data-v2-toy="study">
              <StudyToy promptLabel="Click me" />
            </div>
          </div>
        </section>

        <section className={styles.writing} data-v2-writing aria-label="Latest writing">
          <header className={styles.sectionHeading}>
            <div>
              <p>Latest writing</p>
              <span>Short notes from making real things.</span>
            </div>
            <Link href="/blog/">All writing →</Link>
          </header>
          <div className={styles.writingGrid}>
            {posts.map((post) => (
              <V2WritingPreview key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
