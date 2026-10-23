import styles from "../../app/room/room.module.css";
import { V2SocialIcon } from "../v2/V2SocialIcon";

const REPOS: Record<string, string> = { "pegboard-toy": "virpo/pegboard", "cmux-deck": "virpo/cmux-deck" };
const IMAGES: Record<string, { src: string; tall?: boolean }> = {
  "ai-build-week": { src: "/lab/room/projects/logos/ai-build-week.svg" },
  "bratislava-slushd": { src: "/lab/room/projects/logos/bratislava-slushd.svg", tall: true },
  "zlta-stopa": { src: "/lab/room/projects/logos/zlta-stopa.png", tall: true },
};

/** The project's own mark, small in the bottom-left corner of its card. */
export function ProjectLogo({ slug, title }: { slug: string; title: string }) {
  const image = IMAGES[slug];
  let mark;
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    mark = <img src={image.src} alt="" className={image.tall ? styles.logoTall : undefined} />;
  } else if (REPOS[slug]) {
    mark = (
      <>
        <V2SocialIcon name="github" />
        <span className={styles.logoMono}>{REPOS[slug]}</span>
      </>
    );
  } else if (slug === "youtldr") {
    mark = (
      <>
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M2 2 H26 V10 H18 V18 H10 V26 H2 Z" fill="#00a84a" />
        </svg>
        <span className={styles.logoCaps}>YOUTLDR</span>
      </>
    );
  } else if (slug === "levels") {
    mark = <span className={styles.logoLevels}>levels</span>;
  } else {
    mark = <span>{title}</span>;
  }
  return (
    <span className={styles.projectLogo} aria-hidden="true">
      {mark}
    </span>
  );
}
