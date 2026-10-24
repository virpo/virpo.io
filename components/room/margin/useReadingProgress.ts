"use client";

import { useEffect, useState } from "react";

/** 0 at the top of the article, 1 once its last line is on screen. */
export function useReadingProgress(targetId: string) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const article = document.getElementById(targetId);
    if (!article) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, total > 0 ? -rect.top / total : 1)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);
  return progress;
}
