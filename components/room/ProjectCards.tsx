import type { CSSProperties } from "react";
import styles from "../../app/(room)/room.module.css";
import type { AiProject } from "../../lib/ai-projects";
import { ProjectLogo } from "./ProjectLogo";
import { projectLine } from "./projects";
import { objectForProject } from "./scene/objects";

// the cards show three across (about 340 px), two across, or full width on phones
const CARD_SIZES = "(max-width: 699px) 92vw, (max-width: 1099px) 46vw, 360px";
const srcSet = (base: string) => `${base}-540.webp 540w, ${base}-720.webp 720w, ${base}.webp 1080w`;
const year = (project: AiProject) => project.start.slice(0, 4);
const linkProps = (project: AiProject) => (project.href && !project.private ? { href: project.href, ...(project.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {}) } : null);

/** A featured project: one clean thing, painted from its real screenshot or photo. Pencil at rest, colour on hover. */
export function ProjectCard({ project }: { project: AiProject }) {
  const base = `/lab/room/projects/${project.slug}`;
  const link = linkProps(project);
  return (
    <a className={styles.projectCard} {...link} data-room-target={objectForProject(project.slug)?.id} data-project-card>
      <span className={styles.projectArt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.projectPencil} src={`${base}-pencil-720.webp`} srcSet={srcSet(`${base}-pencil`)} sizes={CARD_SIZES} alt="" width={1080} height={720} loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.projectColour} src={`${base}-720.webp`} srcSet={srcSet(base)} sizes={CARD_SIZES} alt="" width={1080} height={720} loading="lazy" decoding="async" fetchPriority="low" />
        <ProjectLogo slug={project.slug} title={project.title} />
      </span>
      <span className={styles.projectHead}>
        <span className={styles.rowTitle}>{project.title}</span>
        <span className={styles.projectKind}>{projectLine(project.slug) || `${project.kind} · ${year(project)}`}</span>
      </span>
    </a>
  );
}

/**
 * Everything else, one line each: emoji, name, a few words, year. Two columns that fill top to
 * bottom (a grid, so nothing reflows when the peeks appear). Pointing at a line shows its picture.
 */
export function ProjectList({ projects }: { projects: readonly AiProject[] }) {
  return (
    <ul className={styles.moreList} style={{ "--rows": Math.ceil(projects.length / 2) } as CSSProperties}>
      {projects.map((project) => {
        const link = linkProps(project);
        const art = project.card === "room" ? `/lab/room/projects/${project.slug}` : project.card === "ai" ? `/ai/${project.slug}` : null;
        const inner = (
          <>
            <span className={styles.moreEmoji} aria-hidden="true">
              {project.emoji}
            </span>
            <span className={styles.moreName}>
              <span className={styles.moreTitle}>{project.title}</span> <span className={styles.moreShort}>{project.short}</span>
            </span>
            <span className={styles.moreYear}>{project.private ? `private · ${year(project)}` : year(project)}</span>
            {art ? (
              // a peek at the picture, loaded only once you point at the list
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.morePeek} src={`${art}-540.webp`} alt="" width={540} height={360} loading="lazy" decoding="async" />
            ) : null}
          </>
        );
        const roomTarget = objectForProject(project.slug)?.id;
        return (
          <li key={project.slug} id={project.slug}>
            {link ? (
              <a className={styles.moreRow} {...link} data-room-target={roomTarget}>
                {inner}
              </a>
            ) : (
              <span className={styles.moreRow} data-room-target={roomTarget}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
