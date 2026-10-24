"use client";

import { useEffect, useRef } from "react";
import styles from "./margin.module.css";
import { playBell } from "./sounds";

const GRILLE = Array.from({ length: 10 }, (_, i) => i);

/**
 * The corner of the handheld peeking into the margin, with a shiba charm on its orange strap. The
 * charm swings on a little pendulum when you scroll, flick it with the pointer, and the bell rings.
 */
export function StrapCharm() {
  const swing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = swing.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let angle = 0;
    let speed = 0;
    let lastY = window.scrollY;
    let lastRing = 0;
    let frame = 0;
    const tick = (now: number) => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      speed += Math.max(-60, Math.min(60, dy)) * 0.0002;
      const before = speed;
      speed = (speed - angle * 0.0062) * 0.986;
      angle = Math.max(-0.7, Math.min(0.7, angle + speed));
      if (Math.sign(before) !== Math.sign(speed) && Math.abs(angle) > 0.12 && now - lastRing > 220) {
        lastRing = now;
        playBell();
      }
      el.style.transform = `rotate(${angle}rad)`;
      frame = Math.abs(angle) + Math.abs(speed) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const flick = (by: number) => {
      speed += by;
      wake();
    };
    const onMove = (event: PointerEvent) => flick(Math.max(-30, Math.min(30, event.movementX)) * 0.0009);
    const onClick = () => {
      playBell();
      flick(angle > 0 ? -0.05 : 0.05);
    };
    window.addEventListener("scroll", wake, { passive: true });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", wake);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.strap}>
      <div className={styles.strapDevice} aria-hidden="true">
        <i className={styles.strapScreen} />
        <i className={styles.strapGrille}>
          {GRILLE.map((hole) => (
            <i key={hole} />
          ))}
        </i>
        <i className={styles.strapKnob} />
        <i className={styles.strapLug} />
      </div>
      <div className={styles.strapSwing} ref={swing} role="img" aria-label="A shiba charm on an orange strap, hanging from the corner of the handheld">
        <i className={styles.strapCord} />
        <i className={styles.strapCrimp} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.charm} src="/lab/room/margin/charm.webp" alt="" width={400} height={560} draggable={false} />
      </div>
    </div>
  );
}
