"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A short silent loop that behaves like a GIF: no player chrome, it plays inline on repeat and a tap
 * pauses it. With reduced motion it shows its still frame until you press play.
 */
export function ArticleLoop({ src, poster, title, label }: { src: string; poster?: string; title?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {
      /* autoplay can be refused; the button is there */
    });
  }, []);
  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };
  return (
    <figure className="articleMedia articleLoop">
      <button type="button" className="articleLoopToggle" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"}: ${label}`} aria-pressed={playing}>
        <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        {playing ? null : (
          <span className="articleLoopPlay" aria-hidden="true">
            ▶
          </span>
        )}
      </button>
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
}
