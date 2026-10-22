"use client";

import { useEffect, useState } from "react";
import { currentLighting, type LightingName } from "../lighting";
import styles from "./window.module.css";

const VIDEO_ID = "RMpM2Qu3QC8";
const VIDEO_URL =
  `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
  `?start=20&autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO_ID}` +
  "&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0";

/** Hills drawn as one repeating SVG strip (two copies side by side = a seamless loop). */
function Strip({ className, path, fill, width = 800, height = 200 }: { className: string; path: string; fill: string; width?: number; height?: number }) {
  return (
    <svg className={className} viewBox={`0 0 ${width * 2} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill={fill} />
      <path d={path} fill={fill} transform={`translate(${width} 0)`} />
    </svg>
  );
}

const FAR = "M0 120 C60 90 110 70 170 88 S280 130 340 96 S470 52 540 84 S690 118 800 104 L800 200 L0 200Z";
const MID = "M0 140 C50 120 90 112 150 126 S250 150 320 128 S430 104 500 122 S640 152 720 132 S780 124 800 140 L800 200 L0 200Z";
const NEAR = "M0 170 C40 160 80 156 120 164 S200 178 260 166 S360 150 420 162 S560 182 640 168 S760 156 800 170 L800 200 L0 200Z";

/**
 * The shinkansen window toy: a local, code-drawn ride past Mount Fuji inside the
 * pixel-art window frame. The real YouTube ride only loads when you ask for it.
 */
export function RoomWindow() {
  const [lighting, setLighting] = useState<LightingName>("day");
  const [video, setVideo] = useState(false);
  useEffect(() => setLighting(currentLighting()), []);

  return (
    <div className={styles.toy} data-lighting={lighting}>
      <div className={styles.scene}>
        <div className={styles.aperture}>
          {video ? (
            <iframe
              className={styles.video}
              src={VIDEO_URL}
              title="Japanese train window, from Mount Fuji to Tokyo"
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className={styles.ride} aria-hidden="true">
              <i className={styles.sun} />
              <svg className={styles.fuji} viewBox="0 0 200 90" aria-hidden="true">
                <path d="M0 90 L78 22 Q100 6 122 22 L200 90Z" fill="var(--fuji)" />
                <path d="M78 22 Q100 6 122 22 L132 31 L120 36 L110 29 L100 37 L90 29 L80 36 L68 31Z" fill="#f8f9fb" />
              </svg>
              <Strip className={styles.far} path={FAR} fill="var(--far)" />
              <Strip className={styles.mid} path={MID} fill="var(--mid)" />
              <div className={styles.town} />
              <Strip className={styles.near} path={NEAR} fill="var(--near)" />
              <div className={styles.poles} />
              <div className={styles.lights} />
            </div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.frame} src="/assets/optimized/train-window.webp" alt="" width={1464} height={800} />
      </div>
      <div className={styles.bar}>
        <p>{video ? "The real ride, Fuji to Tokyo (YouTube, muted)" : "Tokaido line, somewhere past Mount Fuji"}</p>
        <button type="button" onClick={() => setVideo((value) => !value)} aria-pressed={video}>
          {video ? "Back to the toy" : "▶ Play the real ride"}
        </button>
      </div>
    </div>
  );
}
