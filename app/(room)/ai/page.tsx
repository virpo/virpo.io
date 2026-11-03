import type { Metadata } from "next";
import { CardLoops } from "../../../components/room/CardLoops";
import { ColourOnScroll } from "../../../components/room/ColourOnScroll";
import { ProjectLogo } from "../../../components/room/ProjectLogo";
import { RoomBackKey, RoomFooter } from "../../../components/room/RoomChrome";
import { SiteMark } from "../../../components/room/SiteMark";
import { monthId, YearGrid } from "../../../components/room/YearGrid";
import { V2SocialIcon } from "../../../components/v2/V2SocialIcon";
import { aiProjects, type AiProject } from "../../../lib/ai-projects";
import { jsonLd, pageMeta, PERSON, SITE_URL } from "../../../lib/site";
import shell from "../room.module.css";
import styles from "./ai.module.css";

const description = "Everything Peter Hraska has made with AI since 2023, newest first: products, agent tools, hardware, events and research.";

export const metadata: Metadata = pageMeta({ title: "Things I made with AI", description, path: "/ai/" });

const CARD_SIZES = "(max-width: 699px) 92vw, (max-width: 1099px) 46vw, 360px";
const srcSet = (base: string) => `${base}-540.webp 540w, ${base}-720.webp 720w, ${base}.webp 1080w`;

function Logo({ project }: { project: AiProject }) {
  if (project.card === "room") return <ProjectLogo slug={project.slug} title={project.title} />;
  const logo = project.logo;
  let mark;
  if (!logo) mark = <span>{project.title}</span>;
  else if ("repo" in logo)
    mark = (
      <>
        <V2SocialIcon name="github" />
        <span className={shell.logoMono}>{logo.repo}</span>
      </>
    );
  else if ("src" in logo)
    mark = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} alt="" className={logo.tall ? shell.logoTall : styles.logoIcon} loading="lazy" decoding="async" />
        {logo.word ? <span>{logo.word}</span> : null}
      </>
    );
  else mark = <span className={logo.style === "mono" ? shell.logoMono : logo.style === "caps" ? shell.logoCaps : undefined}>{logo.word}</span>;
  return (
    <span className={shell.projectLogo} aria-hidden="true">
      {mark}
    </span>
  );
}

function Card({ project }: { project: AiProject }) {
  const base = project.card === "room" ? `/lab/room/projects/${project.slug}` : `/ai/${project.slug}`;
  const art = project.card ? (
    <>
      {project.loop ? (
        // the moving version, over the picture; it plays on hover (or when in view on a phone)
        <video className={styles.loop} src={`/ai/${project.slug}.mp4`} muted loop playsInline preload="none" aria-hidden="true" data-card-loop />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={shell.projectPencil} src={`${base}-pencil-720.webp`} srcSet={srcSet(`${base}-pencil`)} sizes={CARD_SIZES} alt="" width={1080} height={720} loading="lazy" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={shell.projectColour} src={`${base}-720.webp`} srcSet={srcSet(base)} sizes={CARD_SIZES} alt="" width={1080} height={720} loading="lazy" decoding="async" fetchPriority="low" />
    </>
  ) : (
    // no picture yet: the name, on paper
    <span className={styles.paper}>
      <span>{project.title}</span>
    </span>
  );
  const month = new Date(project.start).toLocaleString("en", { month: "short", year: "numeric", timeZone: "UTC" });
  const inner = (
    <>
      <span className={shell.projectArt}>
        {art}
        <Logo project={project} />
      </span>
      <span className={shell.projectHead}>
        <span className={shell.rowTitle}>{project.title}</span>
        <span className={styles.blurb}>{project.blurb}</span>
        <span className={shell.projectKind}>
          {project.kind} · {month}
          {project.private ? " · private" : ""}
        </span>
      </span>
    </>
  );
  const external = project.href?.startsWith("http");
  return project.href && !project.private ? (
    <a className={shell.projectCard} href={project.href} {...(external ? { target: "_blank", rel: "noopener" } : {})} data-project-card>
      {inner}
    </a>
  ) : (
    <div className={shell.projectCard} data-project-card>
      {inner}
    </div>
  );
}

export default function AiPage() {
  const projects = aiProjects();
  const today = new Date().toISOString().slice(0, 10);
  const years = [...new Set(projects.map((p) => p.start.slice(0, 4)))];
  const structured = jsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: `${SITE_URL}/ai/`,
    name: "Things I made with AI",
    description,
    author: { "@id": PERSON["@id"] },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "CreativeWork", name: p.title, description: p.blurb, dateCreated: p.start, ...(p.href && !p.private ? { url: new URL(p.href, SITE_URL).toString() } : {}), creator: { "@id": PERSON["@id"] } },
      })),
    },
  });

  return (
    <div className={shell.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structured }} />
      <main className={styles.main}>
        <SiteMark>
          <RoomBackKey />
        </SiteMark>
        <header className={styles.head}>
          <h1>Things I made with AI</h1>
          <p className={styles.thesis}>
            {projects.length} things since 2023, most of them in the last year. Without agents it would have taken me a lifetime. I just worry about the people who will use them for evil.
          </p>
          <a className={styles.follow} href="https://x.com/virpo" target="_blank" rel="noopener">
            <V2SocialIcon name="x" />
            <span>I post what I make with AI on X as I make it.</span>
            <b>Follow @virpo</b>
          </a>
        </header>

        <YearGrid projects={projects} today={today} />

        {years.map((year) => {
          const items = projects.filter((p) => p.start.startsWith(year));
          return (
            <section key={year} className={styles.year} aria-labelledby={`y${year}`}>
              <h2 id={`y${year}`}>
                {year} <span>{items.length}</span>
              </h2>
              <ul className={shell.projectGrid}>
                {items.map((project, i) => {
                  // the first card of each month carries the month's anchor for the overview
                  const firstOfMonth = i === 0 || items[i - 1].start.slice(0, 7) !== project.start.slice(0, 7);
                  return (
                    <li key={project.slug} id={firstOfMonth ? monthId(project.start) : project.slug}>
                      <Card project={project} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </main>
      <RoomFooter />
      <ColourOnScroll />
      <CardLoops />
    </div>
  );
}
