"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./margin.module.css";
import { playFold } from "./sounds";
import { useReadingProgress } from "./useReadingProgress";

const STAGES = 6;

/**
 * A sheet of paper in the margin that folds itself into a crane as you read, one fold per stretch of
 * the post. At the end the crane takes off, flies a loop and lands. Click it to fly again.
 * (Art: prompts/margin-crane.txt.)
 */
export function PaperCrane({ target }: { target: string }) {
  const progress = useReadingProgress(target);
  const stage = progress >= 0.985 ? STAGES - 1 : Math.min(STAGES - 2, Math.floor((progress / 0.985) * (STAGES - 1)));
  const last = useRef(stage);
  const [fold, setFold] = useState(0);
  const [flight, setFlight] = useState(0);

  useEffect(() => {
    if (stage === last.current) return;
    setFold((value) => value + 1);
    playFold();
    if (stage === STAGES - 1 && last.current < stage) setFlight((value) => value + 1);
    last.current = stage;
  }, [stage]);

  const done = stage === STAGES - 1;
  return (
    <div className={styles.crane}>
      <button
        type="button"
        className={styles.craneArt}
        key={`flight-${flight}`}
        data-flying={(done && flight > 0) || undefined}
        onClick={() => done && setFlight((value) => value + 1)}
        aria-label={done ? "A paper crane, folded. Click to make it fly" : `A paper crane, folded ${stage} of ${STAGES - 1} steps`}
      >
        {Array.from({ length: STAGES }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={`/lab/room/margin/crane-${i + 1}.webp`} alt="" width={512} height={512} data-show={i === stage || undefined} data-fold={i === stage && fold > 0 ? fold : undefined} />
        ))}
      </button>
    </div>
  );
}
