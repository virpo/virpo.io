"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./margin.module.css";
import { Hydrangea } from "./Hydrangea";
import { LuckyCat } from "./LuckyCat";
import { MiniPlayer } from "./MiniPlayer";
import { PaperCrane } from "./PaperCrane";
import { SleepingShiba } from "./SleepingShiba";
import { StrapCharm } from "./StrapCharm";
import { TicketPunch } from "./TicketPunch";
import { WalkingShiba } from "./WalkingShiba";

const TOYS = ["pup", "strap", "crane", "neko", "hydrangea", "player", "punch", "shiba"] as const;
type Toy = (typeof TOYS)[number];

/**
 * The toy beside a post. While we choose, ?margin=<toy> swaps the docked room for one of the
 * candidates below; without it the room stays.
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
      {toy === "pup" ? (
        <WalkingShiba target={target} />
      ) : toy === "strap" ? (
        <StrapCharm />
      ) : toy === "crane" ? (
        <PaperCrane target={target} />
      ) : toy === "neko" ? (
        <LuckyCat />
      ) : toy === "hydrangea" ? (
        <Hydrangea target={target} />
      ) : toy === "player" ? (
        <MiniPlayer />
      ) : toy === "punch" ? (
        <TicketPunch target={target} />
      ) : (
        <SleepingShiba target={target} />
      )}
    </div>
  );
}
