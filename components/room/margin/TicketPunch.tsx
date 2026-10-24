"use client";

import { useEffect, useRef, useState } from "react";
import { playClick } from "../clicks";
import styles from "./margin.module.css";
import { useReadingProgress } from "./useReadingProgress";

const HOLES = 14;

/**
 * A ticket punch for the margin: a strip of paper runs through a little aluminium punch, and every
 * stretch you read punches one more hole along its edge. At the end the strip is fully punched.
 */
export function TicketPunch({ target }: { target: string }) {
  const progress = useReadingProgress(target);
  const punched = Math.min(HOLES, Math.floor(progress * HOLES + 0.02));
  const last = useRef(punched);
  const [hit, setHit] = useState(0);
  useEffect(() => {
    if (punched > last.current) {
      setHit((value) => value + 1);
      playClick("knob");
    }
    last.current = punched;
  }, [punched]);

  return (
    <div className={styles.punch} role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.punchBody} aria-hidden="true">
        <i className={styles.punchLever} key={`lever-${hit}`} data-hit={hit > 0 || undefined} />
        <i className={styles.punchSlot} />
        <span className={styles.punchLabel}>PR-03 · PUNCH</span>
      </div>
      <div className={styles.strip} aria-hidden="true">
        {Array.from({ length: HOLES }, (_, i) => (
          <i key={i} className={styles.hole} data-punched={i < punched || undefined} data-fresh={i === punched - 1 || undefined} />
        ))}
        {punched === HOLES ? <span className={styles.stamp}>Read</span> : null}
      </div>
      <p className={styles.toyNote}>{punched === HOLES ? "All the way through. Thanks for reading." : `${Math.round(progress * 100)}% read`}</p>
    </div>
  );
}
