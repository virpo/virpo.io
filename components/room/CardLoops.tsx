"use client";

import { useEffect } from "react";

/**
 * A card with a loop plays it while the pointer is on it, or, on touch screens, while it's in view,
 * and rewinds it when you move on. Loops load only when first played.
 */
export function CardLoops() {
  useEffect(() => {
    const videos = [...document.querySelectorAll<HTMLVideoElement>("[data-card-loop]")];
    const play = (v: HTMLVideoElement) => {
      v.preload = "auto";
      void v.play().catch(() => undefined);
    };
    const stop = (v: HTMLVideoElement) => {
      v.pause();
      v.currentTime = 0;
    };
    const cleanups: (() => void)[] = [];
    const touch = typeof window.matchMedia === "function" && window.matchMedia("(hover: none)").matches;
    if (touch && typeof IntersectionObserver === "function") {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.intersectionRatio >= 0.6 ? play : stop)(e.target as HTMLVideoElement)), { threshold: [0, 0.6] });
      videos.forEach((v) => io.observe(v));
      cleanups.push(() => io.disconnect());
    } else {
      for (const v of videos) {
        const card = v.closest("[data-project-card]");
        if (!card) continue;
        const on = () => play(v);
        const off = () => stop(v);
        card.addEventListener("pointerenter", on);
        card.addEventListener("pointerleave", off);
        card.addEventListener("focusin", on);
        card.addEventListener("focusout", off);
        cleanups.push(() => {
          card.removeEventListener("pointerenter", on);
          card.removeEventListener("pointerleave", off);
          card.removeEventListener("focusin", on);
          card.removeEventListener("focusout", off);
        });
      }
    }
    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
