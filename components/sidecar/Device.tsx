"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { getTokyoParts } from "../../lib/japan/bloom";
import { playClick } from "./clicks";
import type { Engine, EngineSnapshot } from "./lcd/engine";
import { tripCaption } from "./lcd/route";
import { LED_COUNT, MODES, type Mode } from "./lcd/types";
import { DEVICE_KEYS, MODE_CHANGED_EVENT, MODE_EVENT } from "./modes";
import styles from "./device.module.css";

const CLICK_STORAGE_KEY = "sidecar-click";
const DEFAULT_SOFTKEYS: [string, string, string] = ["Slower", "Night", "Faster"];
export const POSTER_DAY = "/lab/sidecar/lcd-window.png";
export const POSTER_NIGHT = "/lab/sidecar/lcd-window-night.png";
/** Elements with this attribute scroll their value across the LCD while hovered or focused. */
export const TICKER_ATTRIBUTE = "data-lcd-ticker";

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

function isTokyoNight(date = new Date()) {
  const { hour } = getTokyoParts(date);
  return hour < 5 || hour >= 19;
}

const media = (query: string) => typeof window.matchMedia === "function" && window.matchMedia(query).matches;

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
  const bodyRef = useRef<HTMLDivElement>(null);
  const ledRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const engineRef = useRef<Engine | null>(null);
  const modeRef = useRef<Mode>("window");
  const clickRef = useRef(true);
  const progressRef = useRef<number | null>(null);
  const tickerRef = useRef<string | null>(null);
  const [mode, setModeState] = useState<Mode>("window");
  const [softkeys, setSoftkeys] = useState<[string, string, string]>(DEFAULT_SOFTKEYS);
  const [announcement, setAnnouncement] = useState("");
  const [clickOn, setClickOn] = useState(true);
  const [pressed, setPressed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [night, setNight] = useState(false);
  const [progress, setProgress] = useState<number | null>(progressTarget ? 0 : null);
  const [hovered, setHovered] = useState<Mode | null>(null);
  const [lcdHover, setLcdHover] = useState(false);

  const paintLeds = useCallback((levels: number[]) => {
    const value = progressRef.current;
    const values = value === null ? levels : Array.from({ length: LED_COUNT }, (_, i) => clamp(value * LED_COUNT - i, 0, 1));
    values.forEach((level, index) => {
      const led = ledRefs.current[index];
      if (led) led.style.setProperty("--level", level.toFixed(2));
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
    setNight(isTokyoNight());
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
      engineRef.current.setTicker(tickerRef.current);
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

  // Hovering or focusing a post link scrolls its title along the LCD.
  useEffect(() => {
    const setTicker = (text: string | null) => {
      tickerRef.current = text;
      engineRef.current?.setTicker(text);
    };
    const source = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(`[${TICKER_ATTRIBUTE}]`) : null;
    const onOver = (event: Event) => {
      const element = source(event.target);
      if (element) setTicker(element.getAttribute(TICKER_ATTRIBUTE));
    };
    const onOut = (event: Event) => {
      const element = source(event.target);
      const next = source((event as FocusEvent | PointerEvent).relatedTarget);
      if (element && element !== next) setTicker(null);
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onOver);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onOver);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  // FACE follows a fine pointer anywhere on the page, and the hero device
  // tilts a few degrees towards it.
  useEffect(() => {
    if (!media("(pointer: fine)")) return;
    const tilt = variant === "hero" && !media("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      frame = 0;
      const event = last;
      const body = bodyRef.current;
      if (!event || !body) return;
      const rect = body.getBoundingClientRect();
      const dx = clamp((event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, window.innerWidth * 0.5));
      const dy = clamp((event.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height, window.innerHeight * 0.6));
      body.style.setProperty("--tilt-y", `${(dx * 3.2).toFixed(2)}deg`);
      body.style.setProperty("--tilt-x", `${(-dy * 2.4).toFixed(2)}deg`);
    };
    const onMove = (event: PointerEvent) => {
      if (modeRef.current === "face" && lcdRef.current) {
        const rect = lcdRef.current.getBoundingClientRect();
        const x = clamp((event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, window.innerWidth * 0.22));
        const y = clamp((rect.top + rect.height / 2 - event.clientY) / Math.max(rect.height, window.innerHeight * 0.26));
        engineRef.current?.setGaze(x, y);
      }
      if (tilt) {
        last = event;
        if (!frame) frame = requestAnimationFrame(apply);
      }
    };
    const onLeave = () => {
      bodyRef.current?.style.setProperty("--tilt-x", "0deg");
      bodyRef.current?.style.setProperty("--tilt-y", "0deg");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [variant]);

  // Reading progress for the docked device.
  useEffect(() => {
    if (!progressTarget) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const element = document.querySelector(progressTarget);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const span = rect.height - window.innerHeight * 0.6;
      const value = span <= 0 ? 1 : clamp((window.innerHeight * 0.4 - rect.top) / span, 0, 1);
      const rounded = Math.round(value * 1000) / 1000;
      if (rounded === progressRef.current) return;
      progressRef.current = rounded;
      engineRef.current?.setProgress(rounded);
      setProgress(rounded);
      paintLeds(new Array(LED_COUNT).fill(0));
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

  const activeIndex = Math.max(0, DEVICE_KEYS.findIndex((key) => key.mode === mode));
  const active = DEVICE_KEYS[activeIndex];
  const hoveredKey = hovered ? DEVICE_KEYS.find((key) => key.mode === hovered) : null;
  const style = { "--poster": `url(${POSTER_DAY})`, "--poster-night": `url(${POSTER_NIGHT})` } as CSSProperties;
  const caption = progress === null ? null : tripCaption(progress);

  return (
    <div
      ref={rootRef}
      className={styles.wrap}
      data-variant={variant}
      data-mode={mode}
      data-ready={ready ? "true" : "false"}
      data-night={night ? "true" : "false"}
      data-sidecar-device
      style={style}
    >
      <div ref={bodyRef} className={styles.body}>
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
              onPointerEnter={(event) => event.pointerType === "mouse" && setLcdHover(true)}
              onPointerLeave={() => setLcdHover(false)}
            >
              <span className={styles.posterNight} aria-hidden="true" />
              <canvas ref={canvasRef} width={160} height={100} className={styles.canvas} aria-hidden="true" />
              <span className={styles.pixelGrid} aria-hidden="true" />
              <span className={styles.glass} aria-hidden="true" />
            </div>
            <div className={styles.bezelLabel} aria-hidden="true">
              <span className={styles.bezelHint} data-hint={hoveredKey || lcdHover ? "true" : undefined}>
                {hoveredKey ? (
                  hoveredKey.short
                ) : lcdHover ? (
                  `Click the screen: ${softkeys[1]}`
                ) : (
                  <>
                    <span className={styles.hintFine}>Click the screen · keys 1–5</span>
                    <span className={styles.hintTouch}>Tap the screen to play</span>
                  </>
                )}
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
                  aria-keyshortcuts={which === "prev" ? "ArrowLeft" : which === "next" ? "ArrowRight" : undefined}
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
              <span className={styles.meterLabel}>{progress === null ? "LEVEL" : `READ ${Math.round(progress * 100)}%`}</span>
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
                onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(key.mode)}
                onFocus={(event) => event.currentTarget.matches(":focus-visible") && setHovered(key.mode)}
                onBlur={() => setHovered((current) => (current === key.mode ? null : current))}
                {...pressProps(key.mode)}
                onPointerLeave={() => {
                  setHovered((current) => (current === key.mode ? null : current));
                  setPressed((current) => (current === key.mode ? null : current));
                }}
              >
                <span className={styles.well} aria-hidden="true">
                  <span className={styles.cap}>
                    <span className={styles.keyLed} />
                    <span className={styles.keyNumber}>{index + 1}</span>
                    <span className={styles.capLabel}>{key.label}</span>
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
      </div>

      {variant === "hero" ? (
        <p className={styles.readout} aria-live="polite">
          <span className={styles.readoutMode}>
            <span className={styles.readoutIndex}>{String(activeIndex + 1).padStart(2, "0")}</span>
            {active.label}
          </span>
          <span className={styles.readoutText}>{announcement || active.hint}</span>
        </p>
      ) : (
        <>
          <p className={styles.caption} data-arrived={progress !== null && progress >= 0.995 ? "true" : undefined}>
            {caption ?? `${active.label} · keys 1–5 work anywhere`}
          </p>
          <p className={styles.srOnly} aria-live="polite">
            {announcement}
          </p>
        </>
      )}
    </div>
  );
}
