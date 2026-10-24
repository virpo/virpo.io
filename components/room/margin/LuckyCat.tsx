"use client";

import { useEffect, useRef, useState } from "react";
import art from "./art.json";
import styles from "./margin.module.css";
import { playCoin } from "./sounds";

/**
 * A maneki-neko made of the handheld's aluminium. Its orange paw beckons slowly, faster while you
 * scroll. Click it and a 5-yen coin drops into the slot on its belly. (Art: prompts/margin-neko.txt.)
 */
export function LuckyCat() {
  const [up, setUp] = useState(true);
  const [coins, setCoins] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const scrolled = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      scrolled.current = performance.now();
    };
    let timer = 0;
    const beckon = () => {
      setUp((value) => !value);
      const busy = performance.now() - scrolled.current < 300;
      timer = window.setTimeout(beckon, busy ? 190 : 900);
    };
    timer = window.setTimeout(beckon, 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const drop = () => {
    const id = performance.now();
    setCoins((value) => [...value, id]);
    window.setTimeout(() => {
      playCoin();
      setCount((value) => value + 1);
      setCoins((value) => value.filter((coin) => coin !== id));
    }, 520);
  };

  return (
    <div className={styles.neko}>
      <button
        type="button"
        className={styles.nekoArt}
        onClick={drop}
        style={{ "--slot-x": `${art.neko.slot[0]}%`, "--slot-y": `${art.neko.slot[1]}%` } as React.CSSProperties}
        aria-label="A lucky cat beckoning. Click to drop a 5-yen coin in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lab/room/margin/neko-up.webp" alt="" width={560} height={560} data-show={up || undefined} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lab/room/margin/neko-down.webp" alt="" width={560} height={560} data-show={!up || undefined} />
        {coins.map((coin) => (
          <i key={coin} className={styles.coin} aria-hidden="true" />
        ))}
      </button>
      <p className={styles.toyNote} aria-live="polite">
        {count === 0 ? "Drop in a 5-yen coin. Go-en also means a good connection." : `${count} × 5 yen. Good connections ahead.`}
      </p>
    </div>
  );
}
