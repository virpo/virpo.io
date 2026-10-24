"use client";

import art from "./art.json";
import styles from "./margin.module.css";
import { useReadingProgress } from "./useReadingProgress";

/**
 * The hydrangea from the room, in its grey pot. One flower head opens for each stretch of the post
 * you read; the last one at the end. (Art: prompts/margin-hydrangea*.txt.)
 */
export function Hydrangea({ target }: { target: string }) {
  const progress = useReadingProgress(target);
  const heads = art.hydrangea.heads;
  const open = progress >= 0.985 ? heads.length : Math.min(heads.length - 1, Math.floor((progress / 0.985) * heads.length));
  return (
    <div className={styles.hydrangea}>
      <div className={styles.plant} role="img" aria-label={`A potted hydrangea, ${open} of ${heads.length} flowers open`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.plantBase} src="/lab/room/margin/hydrangea.webp" alt="" width={640} height={640} />
        {heads.map((head, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            className={styles.bloom}
            src={`/lab/room/margin/bloom-${head.art}.webp`}
            alt=""
            data-open={i < open || undefined}
            style={{ left: `${head.x}%`, top: `${head.y}%`, width: `${head.w}%`, "--tilt": `${head.tilt}deg` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
