"use client";

import { useEffect } from "react";

/** On touch screens there is no hover, so a project card colours in while it is in view. */
export function CardsInView() {
  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(hover: none)").matches || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.target.toggleAttribute("data-in-view", entry.intersectionRatio >= 0.6);
      },
      { threshold: [0, 0.6, 1] },
    );
    document.querySelectorAll("[data-project-card]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);
  return null;
}
