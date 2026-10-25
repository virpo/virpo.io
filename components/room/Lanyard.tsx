"use client";

import { useEffect, useId, useState } from "react";
import styles from "./lanyard.module.css";

const STRAP = "M18 178 C 13 220, 12 270, 13 310 C 14 350, 17 392, 28 401 C 40 409, 44 378, 41 330 C 38 280, 32 220, 26 178";
const THIN = ["M30 124 C 27 134, 23 142, 20 152", "M30 124 C 29 135, 27 143, 25 152"];
const NOW_CLASSES = ["cord", "cordBody", "cordTwist", "cordShade", "cordShine"] as const;

type Strap = "now" | "a" | "b" | "c";

/**
 * The wrist strap on the handheld's left side: a thin cord through the lug, a cord lock, then the
 * loop that goes round your hand. While Peter picks, ?strap=a|b|c previews three remakes of it:
 * a matte braided cord, flat woven webbing, or the strap painted as one picture.
 */
export function Lanyard({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const [strap, setStrap] = useState<Strap>("now");
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("strap");
    if (value === "a" || value === "b" || value === "c") setStrap(value);
  }, []);

  const lug = (
    <>
      <rect className={styles.lug} x="25" y="117" width="9" height="11" rx="3.5" />
      <circle className={styles.lugHole} cx="29.5" cy="122.5" r="1.7" />
    </>
  );

  if (strap === "c") {
    return (
      <svg className={className} viewBox="0 0 70 410" aria-hidden="true" data-strap="c">
        <image href="/lab/room/strap.webp" x="8.7" y="119" width="41.6" height="286" preserveAspectRatio="xMidYMin meet" />
        {lug}
      </svg>
    );
  }

  const fibre = `fibre-${id}`;
  const alu = `alu-${id}`;
  return (
    <svg className={className} viewBox="0 0 70 410" aria-hidden="true" data-strap={strap}>
      <defs>
        {/* fine fibre grain: dark specks from noise, kept inside the shape */}
        <filter id={fibre} x="-10%" y="-2%" width="120%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="2" seed="4" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0 0.02  0.9 0 0 0 -0.32" result="specks" />
          <feComposite in="specks" in2="SourceGraphic" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
        {/* bead-blasted aluminium, turned into a little cylinder: lit from the left */}
        <linearGradient id={alu} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9c9286" />
          <stop offset="0.32" stopColor="#ddd6cc" />
          <stop offset="0.62" stopColor="#c3baaf" />
          <stop offset="1" stopColor="#857b70" />
        </linearGradient>
      </defs>

      {strap === "now" ? (
        <>
          <g className={styles.thin}>
            {THIN.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g className={styles.thinShine}>
            {THIN.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {NOW_CLASSES.map((name) => (
            <path key={name} className={styles[name]} d={STRAP} />
          ))}
          <rect className={styles.slider} x="13.5" y="148" width="17" height="34" rx="8.5" />
          <rect className={styles.sliderShine} x="16.5" y="152" width="3.8" height="25" rx="1.9" />
          <path className={styles.sliderSeam} d="M15 165 H 29" />
        </>
      ) : null}

      {strap === "a" ? (
        <>
          {/* A: a round braided cord, matte, the braid as two staggered rows of plaits */}
          <g className={styles.aThin} filter={`url(#${fibre})`}>
            {THIN.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g filter={`url(#${fibre})`}>
            <path className={styles.aEdge} d={STRAP} />
            <path className={styles.aBody} d={STRAP} />
            <path className={styles.aPlaitL} d={STRAP} />
            <path className={styles.aPlaitR} d={STRAP} />
            <path className={styles.aLight} d={STRAP} />
            <path className={styles.aDark} d={STRAP} />
          </g>
          {/* a cord lock of the case's aluminium, with a machined groove round its middle */}
          <rect x="14" y="149" width="16" height="32" rx="6" fill={`url(#${alu})`} className={styles.aLock} filter={`url(#${fibre})`} />
          <path className={styles.aGroove} d="M14.6 164.2 H 29.4" />
          <path className={styles.aGrooveLight} d="M14.6 165.4 H 29.4" />
        </>
      ) : null}

      {strap === "b" ? (
        <>
          {/* B: flat woven webbing, a herringbone weave and stitched edges */}
          <g className={styles.aThin} filter={`url(#${fibre})`}>
            {THIN.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g filter={`url(#${fibre})`}>
            <path className={styles.bEdge} d={STRAP} />
            <path className={styles.bBody} d={STRAP} />
            <path className={styles.bWeaveL} d={STRAP} />
            <path className={styles.bWeaveR} d={STRAP} />
            <path className={styles.bStitchL} d={STRAP} />
            <path className={styles.bStitchR} d={STRAP} />
          </g>
          {/* a flat aluminium crimp holding both ends, with a rivet */}
          <rect x="13" y="150" width="18" height="26" rx="3.2" fill={`url(#${alu})`} className={styles.aLock} filter={`url(#${fibre})`} />
          <path className={styles.aGroove} d="M13.6 154 H 30.4 M13.6 172 H 30.4" />
          <circle className={styles.bRivet} cx="22" cy="163" r="2.3" />
          <circle className={styles.bRivetLight} cx="21.4" cy="162.4" r="0.9" />
        </>
      ) : null}

      {lug}
    </svg>
  );
}
