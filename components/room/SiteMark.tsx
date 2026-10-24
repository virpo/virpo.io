"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./sitemark.module.css";

const MARKS = ["icon", "key", "peter", "plate"] as const;
type Mark = (typeof MARKS)[number];

/**
 * The top of a post: the way home and the way to the other posts. Mini Peter in a round window
 * turns round to wave when you point at him, like in the room. While Peter chooses, ?header=<mark>
 * previews the other candidates, and ?header=crumbs the old breadcrumb.
 */
export function SiteMark({ children, current }: { children?: ReactNode; current?: "writing" }) {
  const [mark, setMark] = useState<Mark | "crumbs">("peter");
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("header");
    if (value === "crumbs" || MARKS.includes(value as Mark)) setMark(value as Mark);
  }, []);
  if (mark === "crumbs") return <>{children}</>;
  return (
    <nav className={styles.bar} data-mark={mark} aria-label="Site">
      <Link href="/" className={styles.home} aria-label="Peter Hraska, home">
        {mark === "icon" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.icon} src="/lab/room/brand/icon-64.png" alt="" width={64} height={64} />
        ) : null}
        {mark === "peter" ? (
          <span className={styles.porthole} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.reading} src="/lab/room/peter-reading.webp" alt="" width={299} height={440} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.waving} src="/lab/room/peter-wave.webp" alt="" width={298} height={452} />
          </span>
        ) : null}
        {mark === "plate" ? <i className={styles.plateKnob} aria-hidden="true" /> : null}
        <span className={styles.name}>Peter Hraska</span>
      </Link>
      <Link href="/blog/" className={styles.writing} aria-current={current === "writing" ? "page" : undefined}>
        Writing
      </Link>
    </nav>
  );
}
