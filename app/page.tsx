import type { Metadata } from "next";
import Link from "next/link";
import { FaceToy } from "../components/home/FaceToy";
import { Intro } from "../components/home/Intro";
import {
  SoundsToyPlaceholder,
  WindowSeatToyPlaceholder,
} from "../components/home/ToyPlaceholders";
import { StudyToy } from "../components/toys/StudyToy";
import { WritingPreview } from "../components/home/WritingPreview";
import { SiteShell } from "../components/site/SiteShell";
import { getPostSummaries } from "../lib/blog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "virpo",
    title: "virpo · Peter Hraska",
    description: "Peter Hraska makes useful things where product, design, and engineering meet.",
    url: "/",
  },
};

export default function HomePage() {
  const posts = getPostSummaries().slice(0, 3);

  return (
    <SiteShell current="home">
      <div className="homeFlow">
        <div className="homeBento">
          <aside className="toyRail" id="toys" aria-label="Small Japan toys">
            <FaceToy />
            <SoundsToyPlaceholder />
            <WindowSeatToyPlaceholder />
            <StudyToy />
          </aside>

          <div className="homeEditorial">
            <Intro />
            <section
              className="tile writingSection"
              aria-label="Latest writing"
            >
              <header className="sectionHeader">
                <p className="sectionLabel">Latest writing</p>
                <nav className="writingLinks" aria-label="Writing and projects">
                  <Link href="/projects/">Projects</Link>
                  <Link href="/blog/">
                    All writing <span aria-hidden="true">→</span>
                  </Link>
                </nav>
              </header>
              <div className="writingList">
                {posts.map((post) => (
                  <WritingPreview key={post.slug} post={post} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
