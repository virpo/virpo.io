import Link from "next/link";
import styles from "../../app/sidecar/sidecar.module.css";

type Section = "home" | "writing" | "post";

export function SidecarHeader({ current = "home" }: { current?: Section }) {
  return (
    <header className={styles.header}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <div className={styles.brandRow}>
        <Link className={styles.wordmark} href="/sidecar/" aria-label="virpo, Sidecar home">
          virpo
        </Link>
        <span className={styles.byline}>Peter Hraska</span>
      </div>
      <nav className={styles.nav} aria-label="Primary">
        <Link href="/sidecar/writing/" aria-current={current === "writing" ? "page" : undefined}>
          Writing
        </Link>
        <Link href="/sidecar/#projects">Projects</Link>
        <Link href="/sidecar/#about">About</Link>
        <a href="/rss.xml" className={styles.rss}>
          RSS
        </a>
      </nav>
    </header>
  );
}

export function SidecarFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        <span className={styles.footerMark} aria-hidden="true">■</span> virpo.io · Peter Hraska
      </p>
      <p className={styles.footerLinks}>
        <a href="/rss.xml">RSS feed</a>
        <a href="https://github.com/virpo">GitHub</a>
        <a href="mailto:peter@hraska.sk">peter@hraska.sk</a>
        <Link href="/">Current site →</Link>
      </p>
    </footer>
  );
}

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function dotDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, ".");
}

export function fullDate(date: Date) {
  return longDate.format(date);
}

export function noteNumber(index: number, total: number) {
  return String(total - index).padStart(3, "0");
}
