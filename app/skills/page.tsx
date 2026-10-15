import type { Metadata } from "next";
import { CopyCommand } from "../../components/skills/CopyCommand";
import { SiteShell } from "../../components/site/SiteShell";
import { installCommand, skills, sourceUrl } from "../../lib/skills";

const description = "Agent skills Peter Hraska made for real chores. Free to use and adapt.";

export const metadata: Metadata = {
  title: "Skills",
  description,
  alternates: { canonical: "/skills/" },
  openGraph: {
    type: "website",
    title: "Skills · Peter Hraska",
    description,
    url: "/skills/",
  },
  twitter: {
    card: "summary",
    title: "Skills · Peter Hraska",
    description,
  },
};

export default function SkillsPage() {
  return (
    <SiteShell current="skills">
      <section className="tile skillsPage">
        <header className="skillsHeader">
          <p>Skills</p>
          <h1>Agent skills I made for real chores. Free to use and adapt.</h1>
        </header>
        <ul className="skillList" aria-label="Skills">
          {skills.map((skill) => (
            <li key={skill.slug} id={skill.slug} data-testid="skill">
              <h2>
                <span className="skillEmoji" aria-hidden="true">
                  {skill.emoji}
                </span>
                {skill.name}
              </h2>
              <p className="skillSummary">{skill.summary}</p>
              {"proof" in skill ? <p className="skillProof">{skill.proof}</p> : null}
              <div className="skillActions">
                <CopyCommand command={installCommand(skill)} label={skill.name} />
                <a
                  className="skillSource"
                  href={sourceUrl(skill)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`GitHub source for ${skill.name}`}
                >
                  GitHub <span aria-hidden="true">↗</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
