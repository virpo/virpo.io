import Link from "next/link";
import { V2SocialIcon } from "../v2/V2SocialIcon";
import styles from "../../app/(room)/room.module.css";

/** "October 12, 2026", as in the agreed mockup. */
export const roomDate = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const ELSEWHERE = [
  { label: "GitHub", icon: "github", href: "https://github.com/virpo" },
  { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/virpo.san/" },
] as const;

/** X (where the tips go) with words, then GitHub and Instagram as small round keys; RSS only in the footer. */
export function RoomSocial({ rss = false, className }: { rss?: boolean; className?: string }) {
  return (
    <ul className={`${styles.social} ${className ?? ""}`} aria-label="Elsewhere">
      <li>
        <a className={styles.socialX} href="https://x.com/virpo" target="_blank" rel="noreferrer" aria-label="Tips and fun on X">
          <V2SocialIcon name="x" />
          <span aria-hidden="true">Tips &amp; fun</span>
        </a>
      </li>
      {ELSEWHERE.map((link) => (
        <li key={link.icon}>
          <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
            <V2SocialIcon name={link.icon} />
          </a>
        </li>
      ))}
      {rss ? (
        <li>
          <a href="/rss.xml" aria-label="RSS feed" title="RSS feed">
            <V2SocialIcon name="rss" />
          </a>
        </li>
      ) : null}
    </ul>
  );
}

export function RoomFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        Made with love <span aria-label="trademark">™</span> <Link href="/">Virpo</Link>
      </p>
      <RoomSocial rss className={styles.footerSocial} />
    </footer>
  );
}

/** A small device-style key that leads back into the room. */
export function RoomBackKey({ label = "Peter Hraska" }: { label?: string }) {
  return (
    <Link href="/" className={styles.backKey}>
      <span className={styles.backKeyCap} aria-hidden="true">
        ←
      </span>
      {label}
    </Link>
  );
}
