import type { Project } from "../../lib/projects";

export function ProjectCard({
  project,
  eager = false,
}: {
  project: Project;
  eager?: boolean;
}) {
  return (
    <a
      className={`projectCard projectCard--${project.tone} projectCard--${project.image.fit}`}
      href={project.href}
      target="_blank"
      rel="noreferrer"
      data-testid="project-card"
      aria-label={`${project.title} — ${project.type} (opens in a new tab)`}
    >
      <img
        src={project.image.src}
        alt={project.image.alt}
        width={project.image.width}
        height={project.image.height}
        loading={eager ? undefined : "lazy"}
        decoding="async"
        style={project.image.position ? { objectPosition: project.image.position } : undefined}
      />
      <span className="projectCopy">
        <strong>{project.title}</strong>
        <small>{project.type}</small>
      </span>
    </a>
  );
}
