import styles from "./lanyard.module.css";

/**
 * The wrist strap on the handheld's left side: a thin cord through the lug, an aluminium cord lock,
 * then the braided loop that goes round your hand. Painted as one picture (tools/strap.py). It hangs
 * from the back edge of the side, behind the case, so wherever the two overlap the case covers it.
 */
export function Lanyard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 70 410" aria-hidden="true">
      <image href="/lab/room/strap.webp" x="8.7" y="119" width="41.6" height="286" preserveAspectRatio="xMidYMin meet" />
      <rect className={styles.lug} x="25" y="117" width="9" height="11" rx="3.5" />
      <circle className={styles.lugHole} cx="29.5" cy="122.5" r="1.7" />
    </svg>
  );
}
