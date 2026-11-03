"use client";

import { useEffect } from "react";

/**
 * On a long page of cards, each one colours in from pencil as it scrolls into view, and stays in
 * colour. (The home page's few cards keep pencil until you point at them.)
 */
export function ColourOnScroll() {
  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio < 0.35) continue;
          entry.target.setAttribute("data-in-view", "");
          observer.unobserve(entry.target);
        }
      },
      { threshold: [0, 0.35] },
    );
    document.querySelectorAll("[data-project-card]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);
  return null;
}
