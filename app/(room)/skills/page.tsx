import type { Metadata } from "next";
import { RoomBackKey, RoomFooter } from "../../../components/room/RoomChrome";
import { CopyCommand } from "../../../components/skills/CopyCommand";
import { installCommand, skills, sourceUrl } from "../../../lib/skills";
import { jsonLd, pageMeta, PERSON, SITE_URL } from "../../../lib/site";
import { SiteMark } from "../../../components/room/SiteMark";
import shell from "../room.module.css";

const description = "Agent skills Peter Hraska made for real chores. Free to use and adapt.";

export const metadata: Metadata = pageMeta({ title: "Skills", description, path: "/skills/" });

// the skills as source code anyone can install, for search and answer engines
const STRUCTURED = jsonLd({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Agent skills by Peter Hraska",
  url: `${SITE_URL}/skills/`,
  itemListElement: skills.map((skill, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: { "@type": "SoftwareSourceCode", name: skill.name, description: skill.summary, url: `${SITE_URL}/skills/#${skill.slug}`, codeRepository: sourceUrl(skill), author: { "@id": PERSON["@id"] } },
  })),
});

export default function SkillsPage() {
  return (
    <div className={shell.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED }} />
      <main className={shell.writing}>
        <SiteMark>
          <RoomBackKey />
        </SiteMark>
        <header className={shell.writingHead}>
          <h1>Skills</h1>
          <p>Agent skills I made for real chores. Free to use and adapt.</p>
        </header>
        <ul className={shell.skillList} aria-label="Skills">
          {skills.map((skill) => (
            <li key={skill.slug} id={skill.slug} className={shell.skill} data-testid="skill">
              <h2>
                <span aria-hidden="true">{skill.emoji}</span> {skill.name}
              </h2>
              <p>{skill.summary}</p>
              {"proof" in skill ? <p className={shell.skillProof}>{skill.proof}</p> : null}
              <div className={shell.skillActions}>
                <CopyCommand command={installCommand(skill)} label={skill.name} />
                <a href={sourceUrl(skill)} target="_blank" rel="noreferrer" aria-label={`GitHub source for ${skill.name}`}>
                  GitHub <span aria-hidden="true">↗</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <RoomFooter />
    </div>
  );
}
