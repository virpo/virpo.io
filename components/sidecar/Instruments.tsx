"use client";

import { useEffect, useState } from "react";
import type { Mode } from "./lcd/types";
import { DEVICE_KEYS, MODE_CHANGED_EVENT, requestMode } from "./modes";
import styles from "../../app/sidecar/sidecar.module.css";

/** The device's five modes as a plain, readable index. Each row is one click. */
export function Instruments() {
  const [active, setActive] = useState<Mode>("window");

  useEffect(() => {
    const onChange = (event: Event) => setActive((event as CustomEvent<Mode>).detail);
    window.addEventListener(MODE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(MODE_CHANGED_EVENT, onChange);
  }, []);

  return (
    <section className={styles.instruments} aria-labelledby="instruments-title">
      <header className={styles.instrumentsHead}>
        <h2 id="instruments-title">Instruments</h2>
        <p>Five small Japan toys. Press a key, or 1 to 5.</p>
      </header>
      <ol className={styles.instrumentList}>
        {DEVICE_KEYS.map((key, index) => (
          <li key={key.mode}>
            <button
              type="button"
              className={styles.instrument}
              aria-pressed={active === key.mode}
              onClick={() => requestMode(key.mode)}
            >
              <span className={styles.instrumentNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.instrumentName}>{key.label}</span>
              <span className={styles.instrumentHint}>{key.hint}</span>
              <kbd className={styles.instrumentKey}>{index + 1}</kbd>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
