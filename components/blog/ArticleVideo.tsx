"use client";

import { useEffect, useRef } from "react";

/**
 * A short muted loop in a post: it plays inline like a GIF, with a still poster until it loads and
 * controls to pause it. With reduced motion it waits for a press of play.
 */
export function ArticleVideo({ src, poster, title, label }: { src: string; poster?: string; title?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {
      /* autoplay can be refused; the controls are there */
    });
  }, []);
  return (
    <figure className="articleMedia">
      <video ref={ref} src={src} poster={poster} muted loop playsInline controls preload="metadata" aria-label={label} width={1280} height={720} />
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
}
