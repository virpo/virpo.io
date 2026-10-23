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
        Made with love <span aria-label="trademark">™</span> <Link href="/">Virpo</Link>
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
