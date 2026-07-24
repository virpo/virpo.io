import type { Metadata } from "next";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { SiteShell } from "../../components/site/SiteShell";
import { projects } from "../../lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Products, tools, events, and physical things made by Peter Hraska.",
  alternates: { canonical: "/projects/" },
  openGraph: {
    type: "website",
    title: "Projects · Peter Hraska",
    description: "Products, tools, events, and physical things made by Peter Hraska.",
    url: "/projects/",
  },
  twitter: {
    card: "summary",
    title: "Projects · Peter Hraska",
    description: "Products, tools, events, and physical things made by Peter Hraska.",
  },
};

export default function ProjectsPage() {
  return (
    <SiteShell current="projects">
      <div className="projectsPage">
        <header className="tile projectsIntro">
          <p className="sectionLabel">Projects</p>
          <h1>Things I made, helped make, or could not leave alone.</h1>
        </header>
        <section className="projectGrid" aria-label="Projects">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} eager={index === 0} />
          ))}
        </section>
      </div>
    </SiteShell>
  );
}
