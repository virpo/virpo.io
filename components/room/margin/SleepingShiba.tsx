"use client";

import { useState } from "react";
import styles from "./margin.module.css";
import { useReadingProgress } from "./useReadingProgress";

/**
 * A shiba inu asleep on a cushion in the margin. It breathes while you read, peeks when you point
 * at it, and wakes up happy when you reach the end. (Painted like the room: prompts/margin-shiba.txt.)
 */
export function SleepingShiba({ target }: { target: string }) {
  const progress = useReadingProgress(target);
  const [peek, setPeek] = useState(false);
  const awake = progress >= 0.985 || peek;
  return (
    <div className={styles.shiba} data-awake={awake || undefined} onPointerEnter={() => setPeek(true)} onPointerLeave={() => setPeek(false)}>
      <div className={styles.shibaArt} role="img" aria-label={awake ? "A shiba inu on a cushion, awake and happy" : "A shiba inu asleep on a cushion"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.shibaSleep} src="/lab/room/margin/shiba-asleep.webp" alt="" width={640} height={640} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.shibaAwake} src="/lab/room/margin/shiba-awake.webp" alt="" width={640} height={640} />
        <span className={styles.zzz} aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      </div>
      <p className={styles.toyNote}>{progress >= 0.985 ? "You made it to the end. Woof." : "Shh, she's asleep until the end."}</p>
    </div>
  );
}
