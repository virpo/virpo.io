import Link from "next/link";
import styles from "../../app/room/room.module.css";

export const roomDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const roomLongDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function RoomHeader({ current, home = false }: { current?: "writing" | "home"; home?: boolean }) {
  const base = home ? "" : "/room/";
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/room/" aria-label="virpo, Pocket Room home">
        <span className={styles.brandMark} aria-hidden="true">
          <i />
        </span>
        <span>virpo</span>
        <span className={styles.brandSub}>/ pocket room</span>
      </Link>
      <nav className={styles.nav} aria-label="Site">
        <Link href="/room/writing/" aria-current={current === "writing" ? "page" : undefined}>
          Writing
        </Link>
        <a href={`${base}#projects`} className={styles.navExtra}>
          Projects
        </a>
        <a href={`${base}#toys`} className={styles.navExtra}>
          Toys
        </a>
        <a href={`${base}#about`} className={styles.navExtra}>
          About
        </a>
        <a href="/rss.xml" className={styles.rss}>
          RSS
        </a>
      </nav>
    </header>
  );
}

export function RoomFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        <strong>Pocket Room</strong> is a working experiment on{" "}
        <Link href="/">virpo.io</Link>. Every object in the room is geometry made in code with three.js.
      </p>
      <p>
        <a href="/rss.xml">RSS</a> · <a href="https://github.com/virpo">GitHub</a> · <a href="mailto:peter@hraska.sk">peter@hraska.sk</a>
      </p>
    </footer>
  );
}
