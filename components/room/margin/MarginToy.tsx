"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./margin.module.css";
import { MiniPlayer } from "./MiniPlayer";
import { SleepingShiba } from "./SleepingShiba";
import { TicketPunch } from "./TicketPunch";

const TOYS = ["player", "punch", "shiba"] as const;
type Toy = (typeof TOYS)[number];

/**
 * The toy beside a post. While we choose, ?margin=player|punch|shiba swaps the docked room for one
 * of the three candidates; without it the room stays.
 */
export function MarginToy({ target, children }: { target: string; children: ReactNode }) {
  const [toy, setToy] = useState<Toy | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("margin");
    if (TOYS.includes(value as Toy)) setToy(value as Toy);
  }, []);
  if (!toy) return <>{children}</>;
  return (
    <div className={styles.toy} data-toy={toy}>
      {toy === "player" ? <MiniPlayer /> : toy === "punch" ? <TicketPunch target={target} /> : <SleepingShiba target={target} />}
    </div>
  );
}
