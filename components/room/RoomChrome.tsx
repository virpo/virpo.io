import Link from "next/link";
import styles from "../../app/room/room.module.css";

/** "October 12, 2026", as in the agreed mockup. */
export const roomDate = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function RoomFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        <Link href="/room/">Pocket Room</Link> is an experiment on <Link href="/">virpo.io</Link>. The room is painted in ink and
        watercolour, one layer per thing that moves or opens.
      </p>
      <p>
        <a href="/rss.xml">RSS</a> · <a href="https://github.com/virpo">GitHub</a> · <a href="mailto:peter@hraska.sk">peter@hraska.sk</a>
      </p>
    </footer>
  );
}

/** A small device-style key that leads back into the room. */
export function RoomBackKey({ label = "Pocket Room" }: { label?: string }) {
  return (
    <Link href="/room/" className={styles.backKey}>
      <span className={styles.backKeyCap} aria-hidden="true">
        ←
      </span>
      {label}
    </Link>
  );
}
