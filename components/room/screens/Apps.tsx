"use client";

// The apps the room's objects open, drawn for the device screen. Each one reuses the logic
// of the existing toys (face images, the study deck, Japan sounds, the bloom calendar).
import { useEffect, useMemo, useRef, useState } from "react";
import { getFaceImageUrl } from "../../home/FaceToy";
import { JAPAN_SOUNDS } from "../../toys/SoundsToy";
import { bloomEntries } from "../../../lib/japan/bloom-data";
import { getBloomStatus, getBloomTimeline, getTokyoParts } from "../../../lib/japan/bloom";
import { getStudyProgress, scoreCard, selectNextCard } from "../../../lib/study/engine";
import { loadStoredStudyState, saveStudyState } from "../../../lib/study/storage";
import type { StudySelection, StudyState } from "../../../lib/study/types";
import { LAYERS } from "../scene/layers";
import { nextTrain, type Train } from "../scene/life";
import styles from "./apps.module.css";

export type AppProject = { slug: string; title: string; type: string; href: string; blurb: string; image?: { src: string; alt: string; width: number; height: number; fit: string; position?: string } };
export type AppAbout = { name: string; eyebrow: string; headline: string; body: string; links: readonly { label: string; href: string }[] };

const external = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/* ---------------------------------------------------------------- window */

const VIDEO_ID = "RMpM2Qu3QC8";
const VIDEO_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?start=20&autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO_ID}&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0`;

export function WindowApp({ reducedMotion }: { reducedMotion: boolean }) {
  const [train, setTrain] = useState<Train | null>(null);
  const [video, setVideo] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reducedMotion || video) return;
    let timer = 0;
    let last: Train | null = null;
    const run = (delay: number) => {
      timer = window.setTimeout(() => {
        const [, next] = nextTrain(last);
        last = next;
        setTrain(next);
        setCount((value) => value + 1);
        timer = window.setTimeout(() => {
          setTrain(null);
          run(1800 + Math.random() * 2200);
        }, next.ms * 1.25 + 100);
      }, delay);
    };
    run(500);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, video]);

  const [sw, sh] = train?.kind === "local" ? LAYERS.trains.local : LAYERS.trains.shinkansen;
  return (
    <div className={styles.window}>
      {video ? (
        <iframe className={styles.video} src={VIDEO_URL} title="Japanese train window, from Mount Fuji to Tokyo" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <div className={styles.ride} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.rideView} src="/lab/room/view.webp" alt="" />
          {train ? (
            <div key={train.id} className={styles.rideTrain} data-dir={train.dir} style={{ animationDuration: `${train.ms * 1.25}ms`, height: train.kind === "local" ? "15%" : "16%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/lab/room/train-${train.kind}.webp`} alt="" style={{ aspectRatio: `${sw} / ${sh}`, animationDuration: `${train.ms * 1.25}ms` }} />
            </div>
          ) : null}
        </div>
      )}
      <div className={styles.windowBar}>
        <p aria-live="polite">{video ? "The real ride, Fuji to Tokyo (YouTube, muted)" : train ? (train.kind === "shinkansen" ? "Nozomi passing · 285 km/h" : "Local train · next stop Odawara") : `Tōkaidō line · ${count} trains so far`}</p>
        <button type="button" data-primary onClick={() => setVideo((value) => !value)} aria-pressed={video}>
          {video ? "Back to the painting" : "▶ Real ride"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- mirror */

const quantize = (value: number) => clamp(Math.round((-15 + ((value + 1) * 30) / 2) / 3) * 3, -15, 15);

export function MirrorApp() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState(getFaceImageUrl(0, 0));
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      const h = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 1.1), -1, 1);
      const v = clamp((rect.top + rect.height / 2 - event.clientY) / (rect.height * 1.1), -1, 1);
      setSrc(getFaceImageUrl(quantize(h), quantize(v)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div className={styles.mirror}>
      <div className={styles.mirrorFrame} ref={frameRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Peter’s face, looking towards your pointer" width={256} height={256} />
      </div>
      <p className={styles.hint}>Move your pointer, or drag a finger across the screen. I’ll keep an eye on it.</p>
    </div>
  );
}

/* ---------------------------------------------------------------- kana */

export function KanaApp() {
  const [state, setState] = useState<StudyState | null>(null);
  const [selection, setSelection] = useState<StudySelection | null>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const loaded = loadStoredStudyState();
    setState(loaded);
    setSelection(selectNextCard(loaded));
  }, []);
  const card = selection?.card ?? null;
  const progress = state ? getStudyProgress(state) : null;
  const answer = (correct: boolean) => {
    if (!state || !card) return;
    const next = scoreCard(state, card.id, correct);
    try {
      saveStudyState(next);
    } catch {
      /* storage blocked: keep going in memory */
    }
    setState(next);
    setSelection(selectNextCard(next));
    setRevealed(false);
  };
  return (
    <div className={styles.kana}>
      <button type="button" className={styles.card} data-primary={!revealed ? "" : undefined} onClick={() => setRevealed(true)} aria-label={card ? (revealed ? `${card.writing}: ${card.reading}` : `${card.writing}. Reveal the reading`) : "Loading"} disabled={!card}>
        <span className={styles.cardKana} lang="ja">
          {card?.writing ?? "…"}
        </span>
        <span className={styles.cardReading}>{card ? (revealed ? card.reading : "tap to reveal") : selection ? "All caught up. Come back soon." : ""}</span>
        {revealed && card && card.meaning ? <span className={styles.cardMeaning}>{card.meaning}</span> : null}
      </button>
      <div className={styles.kanaBar}>
        <span>{progress ? `${progress.stable} of ${progress.total} learnt` : ""}</span>
        <span className={styles.kanaButtons}>
          <button type="button" data-prev onClick={() => answer(false)} disabled={!revealed}>
            Again
          </button>
          <button type="button" data-next data-primary={revealed ? "" : undefined} onClick={() => answer(true)} disabled={!revealed}>
            Knew it
          </button>
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- radio */

export function RadioApp({ moodRadio }: { moodRadio?: AppProject }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const sound = JAPAN_SOUNDS[index];
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = sound.src;
    audio.currentTime = sound.startAt;
    if (playing) void audio.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => () => audioRef.current?.pause(), []);
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  };
  const step = (by: number) => setIndex((value) => (value + by + JAPAN_SOUNDS.length) % JAPAN_SOUNDS.length);
  return (
    <div className={styles.radio}>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= sound.endAt) step(1);
        }}
        onEnded={() => step(1)}
      />
      <div className={styles.dial} data-playing={playing ? "true" : "false"}>
        <span className={styles.dialScale} aria-hidden="true">
          {JAPAN_SOUNDS.map((item, i) => (
            <i key={item.title} data-on={i === index ? "true" : undefined} />
          ))}
        </span>
        <span className={styles.dialNeedle} aria-hidden="true" style={{ left: `${6 + (index / (JAPAN_SOUNDS.length - 1)) * 88}%` }} />
      </div>
      <p className={styles.station} aria-live="polite">
        <small>
          {String(index + 1).padStart(2, "0")} / {String(JAPAN_SOUNDS.length).padStart(2, "0")} · {playing ? "On air" : "Paused"}
        </small>
        {sound.title}
      </p>
      <div className={styles.radioKeys}>
        <button type="button" data-prev onClick={() => step(-1)} aria-label="Previous sound">
          ◀◀
        </button>
        <button type="button" data-primary onClick={toggle} className={styles.play} aria-pressed={playing}>
          {playing ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button type="button" data-next onClick={() => step(1)} aria-label="Next sound">
          ▶▶
        </button>
      </div>
      {moodRadio ? (
        <a className={styles.aside} href={moodRadio.href} {...external(moodRadio.href)}>
          Also on this shelf: Mood Radio, a mood-based music picker I built in 2013 ↗
        </a>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- bloom */

export function BloomApp() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const status = useMemo(() => (now ? getBloomStatus(bloomEntries, now) : null), [now]);
  const timeline = useMemo(() => (now ? getBloomTimeline(bloomEntries, now, 4) : []), [now]);
  const tokyo = now ? getTokyoParts(now) : null;
  return (
    <div className={styles.bloom}>
      <div className={styles.bloomNow}>
        {status?.bloom ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={status.bloom.pixelArt} alt="" width={64} height={64} />
        ) : null}
        <div>
          <p className={styles.kicker}>
            {status?.status === "active" ? "Blooming now" : "Blooming next"} · Tokyo {tokyo?.label ?? "--:--"}
          </p>
          <p className={styles.bloomName}>{status?.bloom?.name ?? "Checking Japan…"}</p>
          <p className={styles.bloomMeta}>{status?.bloom ? `${status.bloom.place}, ${status.bloom.region} · ${status.label}` : ""}</p>
        </div>
      </div>
      <ol className={styles.bloomList} aria-label="What blooms next in Japan">
        {timeline.map((item) => (
          <li key={item.bloom.id}>
            <a href={item.bloom.sourceUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.bloom.pixelArt} alt="" width={28} height={28} />
              <span>
                <strong>{item.bloom.name}</strong>
                <small>{item.bloom.place}</small>
              </span>
              <em>{item.label}</em>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------- cards */

export function ProjectApp({ project, layer, object }: { project: AppProject; layer: string; object: string }) {
  return (
    <div className={styles.project}>
      <div className={styles.projectArt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/lab/room/${layer}.webp`} alt={`The ${object.toLowerCase()} in the room`} />
      </div>
      <div className={styles.projectText}>
        <p className={styles.kicker}>{project.type}</p>
        <p className={styles.projectTitle}>{project.title}</p>
        <p className={styles.projectBlurb}>{project.blurb}</p>
        <a className={styles.primary} data-primary href={project.href} {...external(project.href)}>
          Visit {project.title} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

export function AboutApp({ about }: { about: AppAbout }) {
  return (
    <div className={styles.project}>
      <div className={styles.projectArt} data-peter>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lab/room/peter-wave.webp" alt="Mini Peter, waving from his chair" />
      </div>
      <div className={styles.projectText}>
        <p className={styles.kicker}>{about.eyebrow}</p>
        <p className={styles.aboutHeadline}>{about.headline}</p>
        <p className={styles.projectBlurb}>{about.body}</p>
        <ul className={styles.links}>
          {about.links.map((link, index) => (
            <li key={link.label}>
              <a href={link.href} data-primary={index === 0 ? "" : undefined} {...external(link.href)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
