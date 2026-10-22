"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { currentLighting, type LightingName } from "./lighting";
import type { MiniRoom as MiniRoomHandle } from "./world/mini";
import styles from "./MiniRoom.module.css";

/**
 * The margin toy on a post page: a small, calm window into the same Pocket Room,
 * in the same light as the landing (Tokyo clock or the saved choice).
 * Reading progress drives Peter's page turns; at the end he looks up and waves.
 */
export function MiniRoom({ articleId, fig, bookColor, spotId }: { articleId: string; fig?: string; bookColor?: string; spotId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<MiniRoomHandle | null>(null);
  const [live, setLive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lighting, setLighting] = useState<LightingName>("day");

  useEffect(() => setLighting(currentLighting()), []);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = article.getBoundingClientRect();
      const span = Math.max(1, rect.height - window.innerHeight * 0.55);
      const value = Math.min(1, Math.max(0, (window.innerHeight * 0.3 - rect.top) / span));
      setProgress(value);
      roomRef.current?.setProgress(value);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [articleId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    if (!document.createElement("canvas").getContext("webgl2")) return;
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let intersecting = true;
    const boot = async () => {
      await Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 1200))]);
      const { createMiniRoom } = await import("./world/mini");
      if (disposed) return;
      const css = getComputedStyle(root);
      try {
        const room = createMiniRoom(canvas, {
          reducedMotion,
          bookColor,
          lighting: currentLighting(),
          fonts: { mono: css.getPropertyValue("--r-mono").trim(), sans: css.getPropertyValue("--r-sans").trim() },
        });
        roomRef.current = room;
        room.setVisible(intersecting && !document.hidden);
        requestAnimationFrame(() => setLive(true));
      } catch (error) {
        console.warn("Mini room unavailable", error);
      }
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(() => void boot(), { timeout: 1200 });
    else window.setTimeout(() => void boot(), 200);
    const resize = new ResizeObserver(() => roomRef.current?.resize());
    resize.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      roomRef.current?.setVisible(intersecting && !document.hidden);
    });
    io.observe(canvas);
    const onVisibility = () => roomRef.current?.setVisible(intersecting && !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      resize.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      roomRef.current?.dispose();
      roomRef.current = null;
    };
  }, [bookColor]);

  const percent = Math.round(progress * 100);
  const segments = 12;
  const lit = Math.round(progress * segments);
  const status = progress > 0.97 ? "Finished · waving" : progress < 0.02 ? "Opening the notebook" : "Reading along";
  const roomHref = spotId ? `/room/?spot=${spotId}#world` : "/room/#world";

  return (
    <div className={styles.mini} ref={rootRef} data-live={live} data-lighting={lighting}>
      <div className={styles.top}>
        <span className={styles.model}>
          <b>PR-03</b> {fig ?? "Writing room"}
        </span>
        <span className={styles.percent} aria-hidden="true">
          {String(percent).padStart(3, "0")}%
        </span>
      </div>
      <div className={styles.screen}>
        <div className={styles.still} data-room-still aria-hidden="true">
          {(["day", "dusk", "night"] as const).map((time) => (
            <div
              key={time}
              data-time={time}
              style={{ "--still-tall": `url(/lab/room/mini-tall-${time}.webp)`, "--still-wide": `url(/lab/room/mini-wide-${time}.webp)` } as CSSProperties}
            />
          ))}
        </div>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
      <div className={styles.meter} role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        {Array.from({ length: segments }, (_, i) => (
          <i key={i} data-on={i < lit} />
        ))}
      </div>
      <p className={styles.caption}>
        <span>{status}</span>
        <Link href={roomHref}>Back to the room ↖</Link>
      </p>
    </div>
  );
}
