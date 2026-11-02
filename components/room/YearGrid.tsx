import type { AiProject } from "../../lib/ai-projects";
import styles from "../../app/(room)/ai/ai.module.css";

const CELL = 11;
const GAP = 3;
const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * One GitHub-style grid per year: a column per week, a square per day, at GitHub's size. A day is
 * washed orange while a project is being worked on (deeper when three or more are), and solid orange
 * on the day a project starts; that square links to its card.
 */
export function YearGrid({ projects, today }: { projects: AiProject[]; today: string }) {
  const active = new Map<string, string[]>();
  const starts = new Map<string, AiProject[]>();
  for (const p of projects) {
    const a = Date.parse(p.start);
    const b = Date.parse(p.until ?? p.start);
    for (let t = a; t <= b; t += DAY) active.set(iso(t), [...(active.get(iso(t)) ?? []), p.title]);
    starts.set(p.start, [...(starts.get(p.start) ?? []), p]);
  }
  const first = Number(projects.reduce((m, p) => (p.start < m ? p.start : m), today).slice(0, 4));
  const last = Number(today.slice(0, 4));
  const years = Array.from({ length: last - first + 1 }, (_, i) => last - i);

  return (
    <div className={styles.grids}>
      {years.map((year) => {
        const jan1 = Date.UTC(year, 0, 1);
        const offset = new Date(jan1).getUTCDay();
        const days = (Date.UTC(year + 1, 0, 1) - jan1) / DAY;
        const weeks = Math.ceil((days + offset) / 7);
        const count = projects.filter((p) => p.start.startsWith(String(year))).length;
        const cells = [];
        const months = [];
        for (let d = 0; d < days; d++) {
          const t = jan1 + d * DAY;
          const day = iso(t);
          const col = Math.floor((d + offset) / 7);
          const row = (d + offset) % 7;
          if (new Date(t).getUTCDate() === 1) months.push({ col, label: new Date(t).toLocaleString("en", { month: "short", timeZone: "UTC" }) });
          const x = col * (CELL + GAP);
          const y = row * (CELL + GAP) + 16;
          const begun = starts.get(day);
          const on = active.get(day);
          const level = begun ? 4 : on ? (on.length >= 3 ? 2 : 1) : 0;
          const future = day > today;
          const rect = <rect x={x} y={y} width={CELL} height={CELL} rx={2.5} data-level={future ? "future" : level} />;
          if (begun) {
            cells.push(
              <a key={day} href={`#${begun[0].slug}`}>
                <title>{`${day}: started ${begun.map((p) => p.title).join(", ")}`}</title>
                {rect}
              </a>,
            );
          } else {
            cells.push(
              <g key={day}>
                {on ? <title>{`${day}: ${on.join(", ")}`}</title> : null}
                {rect}
              </g>,
            );
          }
        }
        return (
          <div key={year} className={styles.gridRow}>
            <p className={styles.gridYear}>
              {year} <span>{count ? `${count} ${count === 1 ? "thing" : "things"}` : "nothing yet"}</span>
            </p>
            <div className={styles.gridScroll}>
              <svg className={styles.grid} width={weeks * (CELL + GAP) - GAP} height={7 * (CELL + GAP) - GAP + 16} viewBox={`0 0 ${weeks * (CELL + GAP) - GAP} ${7 * (CELL + GAP) - GAP + 16}`} role="img" aria-label={`${year}: ${count} projects started`}>
                {months.map((m) => (
                  <text key={m.label} x={m.col * (CELL + GAP)} y={10} className={styles.gridMonth}>
                    {m.label}
                  </text>
                ))}
                {cells}
              </svg>
            </div>
          </div>
        );
      })}
      <p className={styles.legend} aria-hidden="true">
        Less <svg viewBox="0 0 53 11"><rect x="0" width="11" height="11" rx="2.5" data-level="0" /><rect x="14" width="11" height="11" rx="2.5" data-level="1" /><rect x="28" width="11" height="11" rx="2.5" data-level="2" /><rect x="42" width="11" height="11" rx="2.5" data-level="4" /></svg> More · a solid square is the day a project started
      </p>
    </div>
  );
}
