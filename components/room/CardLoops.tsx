"use client";

import { useEffect } from "react";

/**
 * A card's loop plays like a GIF whenever the card is on screen, and pauses when it scrolls away
 * (so only the loops you can see use the battery). Loops load only when first seen.
 */
export function CardLoops() {
  useEffect(() => {
    const videos = [...document.querySelectorAll<HTMLVideoElement>("[data-card-loop]")];
    if (!videos.length || typeof IntersectionObserver !== "function") return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.preload = "auto";
            void video.play().then(() => video.setAttribute("data-playing", ""), () => undefined);
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.25 },
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, []);
  return null;
}
