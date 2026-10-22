"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getFaceImageUrl } from "../../home/FaceToy";
import { SoundsToy } from "../../toys/SoundsToy";
import { StudyToy } from "../../toys/StudyToy";
import { bloomEntries } from "../../../lib/japan/bloom-data";
import { getBloomStatus, getBloomTimeline, getTokyoParts } from "../../../lib/japan/bloom";
import type { RoomToyId } from "../hotspots";
import { RoomWindow } from "./RoomWindow";
import styles from "./panels.module.css";

export type PanelProject = {
  slug: string;
  title: string;
  type: string;
  href: string;
  blurb: string;
  image?: { src: string; alt: string; width: number; height: number; fit: "cover" | "contain"; position?: string };
};

export type PanelAbout = {
  name: string;
  eyebrow: string;
  headline: string;
  body: string;
  links: readonly { label: string; href: string }[];
};

const external = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {});

/** A project card. Projects without their own picture show the object they live in, rendered from the room. */
export function ProjectPanel({ project, spotId, object }: { project: PanelProject; spotId?: string; object?: string }) {
  return (
    <div className={styles.project}>
      {project.image ? (
        <div className={styles.projectImage} data-fit={project.image.fit}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            style={{ objectPosition: project.image.position }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : spotId ? (
        <div className={styles.projectImage} data-object>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/lab/room/obj-${spotId}.webp`} alt={`The ${object?.toLowerCase() ?? "object"} in the Pocket Room`} width={640} height={360} loading="lazy" decoding="async" />
          <span className={styles.objectTag}>In the room</span>
        </div>
      ) : null}
      <p className={styles.kicker}>{project.type}</p>
      <p className={styles.projectBlurb}>{project.blurb}</p>
      <a className={styles.primary} href={project.href} {...external(project.href)}>
        Visit {project.title} <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}

export function AboutPanel({ about }: { about: PanelAbout }) {
  return (
    <div className={styles.about}>
      <p className={styles.kicker}>{about.eyebrow}</p>
      <p className={styles.aboutHeadline}>{about.headline}</p>
      <p className={styles.aboutBody}>{about.body}</p>
      <ul className={styles.links}>
        {about.links.map((link) => (
          <li key={link.label}>
            <a href={link.href} {...external(link.href)}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
const quantize = (value: number) => clamp(Math.round((-15 + ((value + 1) * 30) / 2) / 3) * 3, -15, 15);

/** The mirror: Peter's face follows your cursor (or finger). */
export function FacePanel() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState(getFaceImageUrl(0, 0));
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const track = (x: number, y: number) => {
      const rect = frame.getBoundingClientRect();
      const h = clamp((x - (rect.left + rect.width / 2)) / (rect.width / 1.2), -1, 1);
      const v = clamp((rect.top + rect.height / 2 - y) / (rect.height / 1.2), -1, 1);
      setSrc(getFaceImageUrl(quantize(h), quantize(v)));
    };
    const onMove = (event: PointerEvent) => track(event.clientX, event.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div className={styles.face}>
      <div className={styles.mirror} ref={frameRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Peter’s face, looking towards your pointer" width={256} height={256} />
      </div>
      <p className={styles.hint}>Move your pointer around. On a phone, drag across the mirror.</p>
    </div>
  );
}

function BloomPanel() {
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
          <p className={styles.bloomMeta}>
            {status?.bloom ? `${status.bloom.place}, ${status.bloom.region} · ${status.label}` : ""}
          </p>
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

export function ToyPanel({ toy }: { toy: RoomToyId }) {
  switch (toy) {
    case "face":
      return <FacePanel />;
    case "kana":
      return (
        <div className={styles.toyWrap} data-toy="kana">
          <StudyToy promptLabel="Tap to reveal" />
        </div>
      );
    case "window":
      return <RoomWindow />;
    case "sounds":
      return (
        <div className={styles.toyWrap} data-toy="sounds">
          <SoundsToy />
        </div>
      );
    case "bloom":
      return <BloomPanel />;
  }
}
