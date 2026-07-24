"use client";

import { useEffect, useRef, useState } from "react";

const TRAIN_VIDEO_ID = "RMpM2Qu3QC8";
const TRAIN_VIDEO_URL =
  `https://www.youtube-nocookie.com/embed/${TRAIN_VIDEO_ID}` +
  `?start=20&autoplay=1&mute=1&controls=0&loop=1` +
  `&playlist=${TRAIN_VIDEO_ID}&rel=0&playsinline=1` +
  "&iv_load_policy=3&disablekb=1&fs=0";

export function WindowSeatToy() {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [coverVisible, setCoverVisible] = useState(true);
  const coverTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!window.matchMedia) {
      setReducedMotion(false);
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (coverTimerRef.current !== null) {
        window.clearTimeout(coverTimerRef.current);
        coverTimerRef.current = null;
      }
      setReducedMotion(query.matches);
      setCoverVisible(true);
    };
    update();
    query.addEventListener?.("change", update);
    return () => {
      query.removeEventListener?.("change", update);
      if (coverTimerRef.current !== null) {
        window.clearTimeout(coverTimerRef.current);
      }
    };
  }, []);

  function handleFrameLoad() {
    if (reducedMotion) return;
    if (coverTimerRef.current !== null) {
      window.clearTimeout(coverTimerRef.current);
    }
    coverTimerRef.current = window.setTimeout(() => {
      setCoverVisible(false);
      coverTimerRef.current = null;
    }, 1_200);
  }

  return (
    <section
      className="tile windowSeatToy"
      data-window-seat-toy
      data-reduced-motion={String(reducedMotion)}
      aria-label="Window Seat"
    >
      <header className="toyHeading windowSeatHeading">
        <h2>Window Seat</h2>
        <span>{reducedMotion ? "Still journey" : "Ambient loop"}</span>
      </header>

      <div className="windowSeatScene" data-testid="window-seat-still">
        <div className="windowSeatAperture">
          <div className="windowSeatStill" aria-hidden="true" />
          <iframe
            className="windowSeatVideo"
            src={reducedMotion ? "about:blank" : TRAIN_VIDEO_URL}
            title="Japanese train window from Mount Fuji to Tokyo"
            loading="lazy"
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
            aria-hidden="true"
            onLoad={handleFrameLoad}
            style={{ pointerEvents: "none", transform: "none" }}
          />
          <span
            className="windowSeatMask windowSeatMask--top"
            data-testid="youtube-mask-top"
            aria-hidden="true"
          />
          <span
            className="windowSeatMask windowSeatMask--bottom"
            data-testid="youtube-mask-bottom"
            aria-hidden="true"
          />
          <span
            className="windowSeatMask windowSeatMask--left"
            data-testid="youtube-mask-left"
            aria-hidden="true"
          />
          <span
            className="windowSeatMask windowSeatMask--right"
            data-testid="youtube-mask-right"
            aria-hidden="true"
          />
          <span
            className="windowSeatMask windowSeatSubtitleMask"
            data-testid="youtube-subtitle-mask"
            aria-hidden="true"
          />
          {!reducedMotion && coverVisible ? (
            <span
              className="windowSeatStartupCover"
              data-testid="youtube-startup-cover"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <span className="windowSeatGlass" aria-hidden="true" />
        <img
          className="windowSeatArt"
          src="/assets/train-window.png"
          alt=""
          width="2130"
          height="1481"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
