"use client";

import { useEffect, useState } from "react";
import styles from "./margin.module.css";
import { useReadingProgress } from "./useReadingProgress";

type Pose = "trot-a" | "trot-b" | "scratch" | "sleep";
const POSES: Pose[] = ["trot-a", "trot-b", "scratch", "sleep"];

/**
 * A tiny shiba that walks down the margin with you: she trots while you scroll, sits down for a
 * scratch when you stop, and curls up asleep where the post ends. (Art: prompts/margin-shiba-walk.txt.)
 */
export function WalkingShiba({ target }: { target: string }) {
  const progress = useReadingProgress(target);
  const [moving, setMoving] = useState(false);
  const [step, setStep] = useState(false);
  const [back, setBack] = useState(false);
  const [woof, setWoof] = useState(0);

  useEffect(() => {
    let last = window.scrollY;
    let idle = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 2) return;
      setBack(y < last);
      last = y;
      setMoving(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setMoving(false), 260);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    if (!moving) return;
    const timer = window.setInterval(() => setStep((value) => !value), 140);
    return () => window.clearInterval(timer);
  }, [moving]);

  const done = progress >= 0.985;
  const pose: Pose = moving ? (step ? "trot-b" : "trot-a") : done ? "sleep" : "scratch";

  return (
    <div className={styles.pup} style={{ "--at": progress } as React.CSSProperties}>
      <i className={styles.pupTrail} aria-hidden="true" />
      <button
        type="button"
        className={styles.pupDog}
        data-pose={pose}
        data-back={back || undefined}
        onClick={() => setWoof((value) => value + 1)}
        aria-label={done ? "A tiny shiba, asleep at the end of the post" : "A tiny shiba walking down the margin with you"}
      >
        {POSES.map((name) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={name} src={`/lab/room/margin/pup-${name}.webp`} alt="" data-show={name === pose || undefined} width={256} height={256} />
        ))}
        {woof > 0 && !done ? (
          <span className={styles.woof} key={woof} aria-hidden="true">
            Wan!
          </span>
        ) : null}
        {done && !moving ? (
          <span className={styles.zzz} aria-hidden="true">
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </span>
        ) : null}
      </button>
    </div>
  );
}
