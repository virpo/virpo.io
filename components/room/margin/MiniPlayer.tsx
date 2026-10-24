"use client";

import { useEffect, useRef, useState } from "react";
import { playClick } from "../clicks";
import { JAPAN_SOUNDS } from "../../toys/SoundsToy";
import styles from "./margin.module.css";

const GRILLE = Array.from({ length: 30 }, (_, i) => i);

/**
 * A pocket radio for the margin of a post, built like the handheld: the same aluminium, drilled
 * grille and keys with travel. It plays the sounds of Japan from the old site, quietly, one after
 * another, while you read.
 */
export function MiniPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const sound = JAPAN_SOUNDS[index];

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.src = sound.src;
    el.currentTime = sound.startAt;
    el.volume = 0.6;
    if (playing) void el.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => () => audio.current?.pause(), []);

  const press = (id: string) => {
    setPressed(id);
    window.setTimeout(() => setPressed((current) => (current === id ? null : current)), 140);
    playClick("down");
  };
  const step = (by: number) => setIndex((value) => (value + by + JAPAN_SOUNDS.length) % JAPAN_SOUNDS.length);
  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  };

  return (
    <div className={styles.player} data-playing={playing || undefined}>
      <audio ref={audio} preload="none" onTimeUpdate={(e) => e.currentTarget.currentTime >= sound.endAt && step(1)} onEnded={() => step(1)} />
      <i className={styles.antenna} aria-hidden="true" />
      <div className={styles.playerFace}>
        <i className={styles.playerGrille} aria-hidden="true">
          {GRILLE.map((hole) => (
            <i key={hole} />
          ))}
        </i>
        <div className={styles.playerRight}>
          <div className={styles.lcd} aria-live="polite">
            <span className={styles.lcdTop}>
              <span>{String(index + 1).padStart(2, "0")}/{String(JAPAN_SOUNDS.length).padStart(2, "0")}</span>
              <span>{playing ? "▶ ON AIR" : "❚❚ PAUSED"}</span>
            </span>
            <span className={styles.lcdTitle}>
              <span>{sound.title}</span>
            </span>
            <span className={styles.meter} aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${(i * 137) % 600}ms` }} />
              ))}
            </span>
          </div>
          <div className={styles.playerKeys}>
            <button type="button" className={styles.pkey} data-pressed={pressed === "prev" || undefined} onClick={() => (press("prev"), step(-1))} aria-label="Previous sound">
              ◂◂
            </button>
            <button type="button" className={`${styles.pkey} ${styles.pkeyPlay}`} data-pressed={pressed === "play" || undefined} onClick={() => (press("play"), toggle())} aria-label={playing ? "Pause" : "Play sounds of Japan"} aria-pressed={playing}>
              {playing ? "❚❚" : "▶"}
            </button>
            <button type="button" className={styles.pkey} data-pressed={pressed === "next" || undefined} onClick={() => (press("next"), step(1))} aria-label="Next sound">
              ▸▸
            </button>
          </div>
        </div>
      </div>
      <p className={styles.toyNote}>Sounds of Japan, quietly, while you read.</p>
    </div>
  );
}
