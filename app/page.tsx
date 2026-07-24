import type { Metadata } from "next";
import Link from "next/link";
import { FaceToy } from "../components/home/FaceToy";
import { Intro } from "../components/home/Intro";
import {
  SoundsToyPlaceholder,
  StudyToyPlaceholder,
  WindowSeatToyPlaceholder,
} from "../components/home/ToyPlaceholders";
import { WritingPreview } from "../components/home/WritingPreview";
import { ProjectCard } from "../components/projects/ProjectCard";
import { SiteShell } from "../components/site/SiteShell";
import { getPostSummaries } from "../lib/blog";
import { projects } from "../lib/projects";

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
            <StudyToyPlaceholder />
          </aside>

          <div className="homeEditorial">
            <Intro />
            <section
              className="tile writingSection"
              aria-label="Latest writing"
            >
              <header className="sectionHeader">
                <p className="sectionLabel">Latest writing</p>
                <Link href="/blog/">All writing <span aria-hidden="true">→</span></Link>
              </header>
              <div className="writingList">
                {posts.map((post) => (
                  <WritingPreview key={post.slug} post={post} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <section
          className="selectedProjects"
          aria-label="Selected projects"
        >
          <header className="tile sectionHeader selectedProjectsHeader">
            <p className="sectionLabel">Selected work</p>
            <Link href="/projects/">All projects <span aria-hidden="true">→</span></Link>
          </header>
          <div className="projectGrid projectGrid--teasers">
            {projects.slice(0, 3).map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
