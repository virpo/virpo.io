import type { ReactNode } from "react";
import styles from "./icons.module.css";

/*
 * Small monochrome pictograms for the project list on /room/.
 * One family: 32-unit grid, 1.6 stroke, round caps and joins, ~3.5 corner radius,
 * filled bits only as tiny accents. Each is still at rest and plays a short
 * motion when an ancestor with [data-icon-play] is hovered or focused, or while
 * the svg itself has data-playing="true" (see icons.module.css).
 */

const ICONS = {
  levels: (
    <>
      <path d="M3 28H10V22H17V16H24V10H29" />
      <g className={styles.levelsTrail} fill="currentColor" stroke="none">
        <circle cx="11.6" cy="16.2" r=".8" />
        <circle cx="12.9" cy="12.9" r=".8" />
      </g>
      <g className={styles.levelsHopX}>
        <g className={styles.levelsHopY}>
          <circle className={styles.levelsBall} cx="16.5" cy="10" r="2.3" fill="currentColor" stroke="none" />
        </g>
      </g>
    </>
  ),
  youtldr: (
    <>
      <rect x="3" y="3.5" width="26" height="16" rx="3.5" />
      <path d="M13.9 8.4 19.6 11.5 13.9 14.6Z" fill="currentColor" />
      <g className={styles.tldrLong}>
        <path d="M3.5 24q1.75-1.8 3.5 0t3.5 0 3.5 0 3.5 0 3.5 0 3.5 0 3.5 0" />
        <path d="M3.5 28.5q1.75-1.8 3.5 0t3.5 0 3.5 0 3.5 0" />
      </g>
      <path className={styles.tldrShort} d="M3.5 26.2H13" />
    </>
  ),
  "zlta-stopa": (
    <>
      <g className={styles.stopaFoot}>
        <path d="M11.6 12.4c3.2 0 4.2 2.8 3.4 5.6-.6 2.1-1 3.8-1 5.6 0 2.4-1.3 3.9-3.2 3.9s-3-1.5-2.8-3.6c.2-2.1.9-3.2.5-5.1-.6-3 .2-6.4 3.1-6.4Z" />
        <circle className={styles.toe1} cx="14.2" cy="9" r="1.5" fill="currentColor" stroke="none" />
        <circle className={styles.toe2} cx="11.5" cy="8.6" r="1.1" fill="currentColor" stroke="none" />
        <circle className={styles.toe3} cx="9.4" cy="9.6" r="1" fill="currentColor" stroke="none" />
        <circle className={styles.toe4} cx="7.9" cy="11.4" r=".85" fill="currentColor" stroke="none" />
      </g>
      <g className={styles.stopaLens}>
        <circle cx="21.5" cy="18.5" r="5" />
        <path d="M25.1 22.1 28.6 25.6" />
      </g>
    </>
  ),
  "mood-radio": (
    <>
      <rect x="2.5" y="9" width="27" height="19.5" rx="3.5" />
      <path d="M9 9 5.8 3.2" />
      <path className={styles.radioWave1} d="M9.6 2.9a2.8 2.8 0 0 1 0 3.8" />
      <path className={styles.radioWave2} d="M12.2 1.5a5.6 5.6 0 0 1 0 6.6" />
      <path d="M7 13.2H7.01M10 13.2H10.01M13 13.2H13.01M16 13.2H16.01M19 13.2H19.01M22 13.2H22.01M25 13.2H25.01" strokeWidth="1.2" />
      <path className={styles.radioNeedle} d="M22.5 11.4V15" />
      <circle cx="9.5" cy="21.6" r="3.9" />
      <path d="M8.1 20.6H8.11M10.9 20.6H10.91M8.2 23.3Q9.5 22.1 10.8 23.3" strokeWidth="1.3" />
      <circle cx="22.5" cy="21.6" r="3.9" />
      <path d="M21.1 20.6H21.11M23.9 20.6H23.91M21.2 22.5Q22.5 23.8 23.8 22.5" strokeWidth="1.3" />
    </>
  ),
  "pegboard-toy": (
    <>
      <path d="M2.6 11.5V27M1.2 11.5H4M1.2 27H4" />
      <path d="M7 19V14.1a2.1 2.1 0 0 1 4.2 0V19" />
      <path d="M13 19V14.1a2.1 2.1 0 0 1 4.2 0V19" />
      <path d="M25 19V14.1a2.1 2.1 0 0 1 4.2 0V19" />
      <rect className={styles.pegFall} x="19" y="3.5" width="4.2" height="7.5" rx="2.1" />
      <rect x="6" y="19" width="24.5" height="8" rx="2.5" />
    </>
  ),
  "ai-build-week": (
    <>
      <circle cx="12.5" cy="19.5" r="9.5" />
      <path d="M12.5 11.9V13.1M20.1 19.5H18.9M12.5 27.1V25.9M4.9 19.5H6.1" />
      <g className={styles.clockHand}>
        <path d="M12.5 19.5 16.3 15.7" />
      </g>
      <circle cx="12.5" cy="19.5" r=".9" fill="currentColor" stroke="none" />
      <g className={styles.coin}>
        <circle cx="25" cy="7.5" r="5" />
        <path d="M26.7 5.6a2.6 2.6 0 1 0 0 3.8" strokeWidth="1.3" />
        <path d="M22.1 7.5H25.1" strokeWidth="1.3" />
      </g>
      <g className={styles.coinRays}>
        <path d="M18.4 4 19.6 5M25 .6V1.2M29.4 1.4 28.6 2.2" />
      </g>
    </>
  ),
  "cmux-deck": (
    <>
      <rect x="2" y="5" width="28" height="20" rx="3.5" />
      <path d="M11 25 9.8 28.5H22.2L21 25" />
      <rect className={styles.key1} x="5.5" y="8.5" width="5" height="5" rx="1.4" />
      <rect className={styles.key2} x="13.5" y="8.5" width="5" height="5" rx="1.4" fill="currentColor" />
      <rect className={styles.key3} x="21.5" y="8.5" width="5" height="5" rx="1.4" />
      <rect className={styles.key4} x="5.5" y="16.5" width="5" height="5" rx="1.4" />
      <rect className={styles.key5} x="13.5" y="16.5" width="5" height="5" rx="1.4" />
      <rect className={styles.key6} x="21.5" y="16.5" width="5" height="5" rx="1.4" fill="currentColor" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type ProjectIconSlug = keyof typeof ICONS;

export const PROJECT_ICON_SLUGS = Object.keys(ICONS) as ProjectIconSlug[];

const SLUG_CLASS: Record<ProjectIconSlug, string | undefined> = {
  levels: styles.levels,
  youtldr: styles.youtldr,
  "zlta-stopa": styles.stopa,
  "mood-radio": styles.radio,
  "pegboard-toy": styles.pegboard,
  "ai-build-week": styles.buildWeek,
  "cmux-deck": styles.deck,
};

function isIconSlug(slug: string): slug is ProjectIconSlug {
  return Object.prototype.hasOwnProperty.call(ICONS, slug);
}

export function ProjectIcon({ slug, className, playing }: { slug: string; className?: string; playing?: boolean }) {
  if (!isIconSlug(slug)) return null;
  const classes = [styles.icon, SLUG_CLASS[slug], className].filter(Boolean).join(" ");
  return (
    <svg
      className={classes}
      viewBox="0 0 32 32"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-playing={playing ? "true" : undefined}
    >
      {ICONS[slug]}
    </svg>
  );
}
