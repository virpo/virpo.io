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
 * The toy beside a post: the room's hydrangea, tiny, standing on the bottom of the screen. While
 * Peter chooses, ?margin=<toy> previews the other candidates, and ?margin=room the docked handheld.
 */
export function MarginToy({ target, children }: { target: string; children: ReactNode }) {
  const [toy, setToy] = useState<Toy | "room">("hydrangea");
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("margin");
    if (value === "room" || TOYS.includes(value as Toy)) setToy(value as Toy);
  }, []);
  if (toy === "room") return <>{children}</>;
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
