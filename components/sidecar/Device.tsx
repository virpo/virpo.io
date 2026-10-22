"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { playClick } from "./clicks";
import type { Engine, EngineSnapshot } from "./lcd/engine";
import { LED_COUNT, MODES, type Mode } from "./lcd/types";
import { DEVICE_KEYS, MODE_CHANGED_EVENT, MODE_EVENT } from "./modes";
import styles from "./device.module.css";

const CLICK_STORAGE_KEY = "sidecar-click";
const DEFAULT_SOFTKEYS: [string, string, string] = ["Slower", "Night", "Faster"];
const POSTER = "/lab/sidecar/lcd-window.png";

type Variant = "hero" | "dock";

function readClickPreference() {
  try {
    return window.localStorage.getItem(CLICK_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value));

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function Device({
  variant = "hero",
  progressTarget,
  label = "Sidecar, a pocket device with five small Japan toys",
}: {
  variant?: Variant;
  /** CSS selector of the element whose reading progress fills the LED strip. */
  progressTarget?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lcdRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const ledRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const engineRef = useRef<Engine | null>(null);
  const modeRef = useRef<Mode>("window");
  const clickRef = useRef(true);
  const progressRef = useRef<number | null>(null);
  const [mode, setModeState] = useState<Mode>("window");
  const [softkeys, setSoftkeys] = useState<[string, string, string]>(DEFAULT_SOFTKEYS);
  const [announcement, setAnnouncement] = useState("");
  const [clickOn, setClickOn] = useState(true);
  const [pressed, setPressed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [readPercent, setReadPercent] = useState<number | null>(null);
  const [hovered, setHovered] = useState<Mode | null>(null);

  const paintLeds = useCallback((levels: number[]) => {
    const progress = progressRef.current;
    const values = progress === null ? levels : Array.from({ length: LED_COUNT }, (_, i) => clamp(progress * LED_COUNT - i, 0, 1));
    values.forEach((value, index) => {
      const led = ledRefs.current[index];
      if (led) led.style.setProperty("--level", value.toFixed(2));
    });
  }, []);

  const click = useCallback((kind: "down" | "up" | "knob") => {
    if (clickRef.current) playClick(kind);
  }, []);

  const flashKey = useCallback((id: string) => {
    setPressed(id);
    window.setTimeout(() => setPressed((current) => (current === id ? null : current)), 140);
  }, []);

  const selectMode = useCallback(
    (next: Mode, { fromKeyboard = false }: { fromKeyboard?: boolean } = {}) => {
      if (fromKeyboard) {
        flashKey(next);
        click("down");
      }
      modeRef.current = next;
      setModeState(next);
      engineRef.current?.setMode(next);
      window.dispatchEvent(new CustomEvent(MODE_CHANGED_EVENT, { detail: next }));
    },
    [click, flashKey],
  );

  const soft = useCallback(
    (which: "prev" | "action" | "next", fromKeyboard = false) => {
      if (fromKeyboard) {
        flashKey(which);
        click(which === "action" ? "knob" : "down");
      }
      const engine = engineRef.current;
      if (!engine) return;
      if (which === "prev") engine.prev();
      else if (which === "next") engine.next();
      else engine.action();
    },
    [click, flashKey],
  );

  // Boot the LCD engine after first paint; the poster frame covers the wait.
  useEffect(() => {
    let cancelled = false;
    clickRef.current = readClickPreference();
    setClickOn(clickRef.current);
    const reducedQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

    void import("./lcd/engine").then(({ createEngine }) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      engineRef.current = createEngine({
        canvas,
        mode: modeRef.current,
        reducedMotion: Boolean(reducedQuery?.matches),
        onLeds: paintLeds,
        onChange: (snapshot: EngineSnapshot) => setSoftkeys(snapshot.softkeys),
        onAnnounce: setAnnouncement,
      });
      engineRef.current.setProgress(progressRef.current);
      setReady(true);
    });

    const onReduced = () => engineRef.current?.setReducedMotion(Boolean(reducedQuery?.matches));
    reducedQuery?.addEventListener?.("change", onReduced);
    return () => {
      cancelled = true;
      reducedQuery?.removeEventListener?.("change", onReduced);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [paintLeds]);

  // Keyboard shortcuts 1-5 and requests from the instrument list.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < MODES.length && event.key.length === 1) {
        selectMode(DEVICE_KEYS[index].mode, { fromKeyboard: true });
        return;
      }
      const inside = rootRef.current?.contains(document.activeElement);
      if (inside && event.key === "ArrowLeft") {
        event.preventDefault();
        soft("prev", true);
      } else if (inside && event.key === "ArrowRight") {
        event.preventDefault();
        soft("next", true);
      }
    };
    const onRequest = (event: Event) => {
      const next = (event as CustomEvent<Mode>).detail;
      if (MODES.includes(next)) {
        click("down");
        flashKey(next);
        selectMode(next);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(MODE_EVENT, onRequest);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(MODE_EVENT, onRequest);
    };
  }, [click, flashKey, selectMode, soft]);

  // FACE follows a fine pointer anywhere on the page.
  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      if (modeRef.current !== "face" || !lcdRef.current) return;
      const rect = lcdRef.current.getBoundingClientRect();
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, window.innerWidth * 0.22));
      const y = clamp((rect.top + rect.height / 2 - event.clientY) / Math.max(rect.height, window.innerHeight * 0.26));
      engineRef.current?.setGaze(x, y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Reading progress for the docked device, and tucking the phone bar away
  // while the reader scrolls down.
  useEffect(() => {
    if (!progressTarget) return;
    let frame = 0;
    let lastY = window.scrollY;
    const measure = () => {
      frame = 0;
      const element = document.querySelector(progressTarget);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const value = span <= 0 ? 1 : clamp(-rect.top / span, 0, 1);
      const rounded = Math.round(value * 1000) / 1000;
      progressRef.current = rounded;
      engineRef.current?.setProgress(rounded);
      setReadPercent(Math.round(rounded * 100));
      paintLeds(new Array(LED_COUNT).fill(0));
      const y = window.scrollY;
      const nearEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
      if (Math.abs(y - lastY) > 6) {
        setTucked(y > lastY && y > 120 && !nearEnd);
        lastY = y;
      }
      if (nearEnd) setTucked(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [paintLeds, progressTarget]);

  const toggleClick = () => {
    const next = !clickOn;
    clickRef.current = next;
    setClickOn(next);
    try {
      window.localStorage.setItem(CLICK_STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Preference lasts for this page view only.
    }
    if (next) playClick("down");
  };

  const pressProps = (id: string, kind: "down" | "knob" = "down") => ({
    "data-down": pressed === id ? "true" : undefined,
    onPointerDown: (event: ReactPointerEvent) => {
      if (event.button !== 0) return;
      setPressed(id);
      click(kind);
    },
    onPointerUp: () => {
      setPressed((current) => (current === id ? null : current));
      click("up");
    },
    onPointerLeave: () => setPressed((current) => (current === id ? null : current)),
    onPointerCancel: () => setPressed((current) => (current === id ? null : current)),
  });

  // Touch: drag on the screen to steer the face; a tap is the action key.
  const lcdStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const onLcdPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    lcdStart.current = { x: event.clientX, y: event.clientY, moved: false };
    if (event.pointerType !== "mouse") event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onLcdPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = lcdStart.current;
    if (!start || event.pointerType === "mouse" || modeRef.current !== "face") return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) start.moved = true;
    const rect = event.currentTarget.getBoundingClientRect();
    engineRef.current?.setGaze(
      clamp(((event.clientX - rect.left) / rect.width) * 2 - 1),
      clamp(1 - ((event.clientY - rect.top) / rect.height) * 2),
    );
  };
  const onLcdPointerUp = () => {
    const start = lcdStart.current;
    lcdStart.current = null;
    if (start && !start.moved) {
      click("knob");
      soft("action");
    }
  };

  const active = DEVICE_KEYS.find((key) => key.mode === mode) ?? DEVICE_KEYS[2];
  const style = { "--poster": `url(${POSTER})` } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={styles.wrap}
      data-variant={variant}
      data-mode={mode}
      data-ready={ready ? "true" : "false"}
      data-tucked={tucked ? "true" : "false"}
      data-sidecar-device
      style={style}
    >
      <div className={styles.device} role="group" aria-label={label}>
        <span className={styles.plate} aria-hidden="true" />
        {(["tl", "tr", "bl", "br"] as const).map((corner, index) => (
          <span key={corner} className={styles.screw} data-corner={corner} style={{ "--turn": `${[18, 74, 131, 47][index]}deg` } as CSSProperties} aria-hidden="true" />
        ))}
        <span className={styles.sideButtons} aria-hidden="true" />

        <div className={styles.top} aria-hidden="true">
          <span className={styles.brand}>virpo</span>
          <span className={styles.model}>
            <span className={styles.power} />
            SIDECAR&nbsp;SC-01
          </span>
        </div>

        <div className={styles.bezel}>
          <div
            ref={lcdRef}
            className={styles.lcd}
            onPointerDown={onLcdPointerDown}
            onPointerMove={onLcdPointerMove}
            onPointerUp={onLcdPointerUp}
            onPointerCancel={() => (lcdStart.current = null)}
          >
            <canvas ref={canvasRef} width={160} height={100} className={styles.canvas} aria-hidden="true" />
            <span className={styles.pixelGrid} aria-hidden="true" />
            <span className={styles.glass} aria-hidden="true" />
          </div>
          <div className={styles.bezelLabel} aria-hidden="true">
            <span className={styles.bezelHint} data-hint={hovered ? "true" : undefined}>
              {hovered ? DEVICE_KEYS.find((key) => key.mode === hovered)?.hint : "LCD 160×100 · 4 TONE"}
            </span>
            <span className={styles.bezelMode}>
              <span className={styles.bezelDot} />
              {active.label}
            </span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.soft} role="group" aria-label={`${active.title} controls`}>
            {(["prev", "action", "next"] as const).map((which, index) => (
              <button
                key={which}
                type="button"
                className={styles.softButton}
                data-kind={which}
                aria-label={softkeys[index]}
                onClick={() => soft(which)}
                {...pressProps(which, which === "action" ? "knob" : "down")}
              >
                <span className={styles.softCap} aria-hidden="true">
                  {which === "prev" ? "◀" : which === "next" ? "▶" : "●"}
                </span>
                <span className={styles.softLabel} aria-hidden="true">
                  {softkeys[index]}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.meter} aria-hidden="true">
            <span className={styles.ledWindow}>
              {Array.from({ length: LED_COUNT }, (_, index) => (
                <span key={index} className={styles.led} ref={(node) => void (ledRefs.current[index] = node)} />
              ))}
            </span>
            <span className={styles.meterLabel}>{progressTarget ? `READ ${readPercent ?? 0}%` : "LEVEL"}</span>
          </div>
        </div>

        <div className={styles.keys} role="group" aria-label="Modes, keys 1 to 5">
          {DEVICE_KEYS.map((key, index) => (
            <button
              key={key.mode}
              type="button"
              className={styles.key}
              aria-pressed={mode === key.mode}
              aria-keyshortcuts={String(index + 1)}
              aria-label={`${key.title}. ${key.hint}`}
              title={`${key.title} · key ${index + 1}`}
              onClick={() => selectMode(key.mode)}
              onMouseEnter={() => setHovered(key.mode)}
              onMouseLeave={() => setHovered((current) => (current === key.mode ? null : current))}
              onFocus={() => setHovered(key.mode)}
              onBlur={() => setHovered((current) => (current === key.mode ? null : current))}
              {...pressProps(key.mode)}
            >
              <span className={styles.well} aria-hidden="true">
                <span className={styles.cap}>
                  <span className={styles.keyLed} />
                  <span className={styles.keyNumber}>{index + 1}</span>
                </span>
              </span>
              <span className={styles.keyLabel} aria-hidden="true">
                {key.label}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.bottom}>
          <button type="button" role="switch" aria-checked={clickOn} className={styles.switch} onClick={toggleClick}>
            <span className={styles.switchTrack} aria-hidden="true">
              <span className={styles.switchThumb} />
            </span>
            <span className={styles.switchLabel}>Key click</span>
          </button>
          <span className={styles.grille} aria-hidden="true" />
        </div>
      </div>


      <button
        type="button"
        className={styles.knob}
        aria-label={`Action: ${softkeys[1]}`}
        onClick={() => soft("action")}
        {...pressProps("knob", "knob")}
      >
        <span className={styles.knobGrip} aria-hidden="true" />
      </button>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
