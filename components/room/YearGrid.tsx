import type { AiProject } from "../../lib/ai-projects";
import styles from "../../app/(room)/ai/ai.module.css";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The id of a month's first card, which its tile scrolls to. */
export const monthId = (start: string) => `m-${start.slice(0, 7)}`;

/**
 * A small overview: a row per year, a tile per month, deeper orange the more projects started that
 * month. A month with projects links to its first card.
 */
export function YearGrid({ projects, today }: { projects: AiProject[]; today: string }) {
  const first = Number(projects.reduce((m, p) => (p.start < m ? p.start : m), today).slice(0, 4));
  const last = Number(today.slice(0, 4));
  const years = Array.from({ length: last - first + 1 }, (_, i) => last - i);
  const now = today.slice(0, 7);

  return (
    <div className={styles.grid} role="group" aria-label="Projects by month">
      <span />
      {MONTHS.map((m, i) => (
        <span key={i} className={styles.gridMonth} aria-hidden="true">
          {m}
        </span>
      ))}
      <span />
      {years.map((year) => {
        const ofYear = projects.filter((p) => p.start.startsWith(String(year)));
        return [
          <span key={`${year}-y`} className={styles.gridYear}>
            {year}
          </span>,
          ...NAMES.map((name, i) => {
            const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
            const items = projects.filter((p) => p.start.startsWith(ym));
            const level = items.length === 0 ? 0 : items.length === 1 ? 1 : items.length <= 3 ? 2 : 3;
            if (ym > now) return <span key={ym} className={styles.tile} data-level="future" />;
            return items.length ? (
              <a key={ym} href={`#${monthId(ym)}`} className={styles.tile} data-level={level} title={`${name} ${year}: ${items.map((p) => p.title).join(", ")}`} aria-label={`${name} ${year}: ${items.length} ${items.length === 1 ? "project" : "projects"}`} />
            ) : (
              <span key={ym} className={styles.tile} data-level={0} title={`${name} ${year}`} />
            );
          }),
          <span key={`${year}-c`} className={styles.gridCount}>
            {ofYear.length}
          </span>,
        ];
      })}
    </div>
  );
}
