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
  const [nearViewport, setNearViewport] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const [engagementReady, setEngagementReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    if (!idleReady || reducedMotion) return;

    const events = [
      "pointermove",
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;
    let finished = false;

    const cleanup = () => {
      window.clearTimeout(settleTimer);
      for (const event of events) window.removeEventListener(event, markReady);
    };
    const markReady = () => {
      if (finished) return;
      finished = true;
      cleanup();
      setEngagementReady(true);
    };
    const settleTimer = window.setTimeout(markReady, 6_000);

    for (const event of events) {
      window.addEventListener(event, markReady, { once: true, passive: true });
    }

    return cleanup;
  }, [idleReady, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const idleWindow = window as unknown as {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let cancelled = false;
    let idleId: number | null = null;
    let fallbackTimer: number | null = null;

    const markIdle = () => {
      if (!cancelled) setIdleReady(true);
    };
    const scheduleIdle = () => {
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(markIdle, { timeout: 2_500 });
      } else {
        fallbackTimer = window.setTimeout(markIdle, 0);
      }
    };

    if (document.readyState === "complete") {
      scheduleIdle();
    } else {
      window.addEventListener("load", scheduleIdle, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleIdle);
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
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
    }, 4_000);
  }

  return (
    <section
      ref={rootRef}
      className="tile windowSeatToy"
      data-window-seat-toy
      data-reduced-motion={String(reducedMotion)}
      aria-label="Window Seat"
    >
      <header className="toyHeading windowSeatHeading">
        <h2>Window Seat</h2>
      </header>

      <div className="windowSeatScene" data-testid="window-seat-still">
        <div className="windowSeatAperture">
          <div className="windowSeatStill" aria-hidden="true" />
          {!reducedMotion && nearViewport && idleReady && engagementReady ? (
            <iframe
              className="windowSeatVideo"
              src={TRAIN_VIDEO_URL}
              title="Japanese train window from Mount Fuji to Tokyo"
              loading="lazy"
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
              aria-hidden="true"
              onLoad={handleFrameLoad}
              style={{ pointerEvents: "none" }}
            />
          ) : null}
          {!reducedMotion &&
          nearViewport &&
          idleReady &&
          engagementReady &&
          coverVisible ? (
            <span
              className="windowSeatStartupCover"
              data-testid="youtube-startup-cover"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <span className="windowSeatGlass" aria-hidden="true" />
        <picture>
          <source
            media="(max-width: 700px)"
            srcSet="/assets/optimized/train-window-mobile.webp"
          />
          <img
            className="windowSeatArt"
            src="/assets/optimized/train-window.webp"
            alt=""
            width="1464"
            height="800"
            aria-hidden="true"
          />
        </picture>
        <span
          className="windowSeatCompassMask"
          data-testid="youtube-compass-mask"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
