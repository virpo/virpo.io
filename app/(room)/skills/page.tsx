import type { Metadata } from "next";
import { RoomBackKey, RoomFooter } from "../../../components/room/RoomChrome";
import { CopyCommand } from "../../../components/skills/CopyCommand";
import { installCommand, skills, sourceUrl } from "../../../lib/skills";
import { pageMeta } from "../../../lib/site";
import shell from "../room.module.css";

const description = "Agent skills Peter Hraska made for real chores. Free to use and adapt.";

export const metadata: Metadata = pageMeta({ title: "Skills", description, path: "/skills/" });

export default function SkillsPage() {
  return (
    <div className={shell.page}>
      <main className={shell.writing}>
        <RoomBackKey />
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
