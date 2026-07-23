"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bloomEntries } from "../../lib/japan/bloom-data";
import { getBloomStatus, getTokyoParts } from "../../lib/japan/bloom";

const FALLBACK_SOURCE = "https://www.japan.travel/en/see-and-do/flowers/";

function formatWindow(startMonth: number, startDay: number, endMonth: number, endDay: number) {
  const monthName = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  });
  const start = new Date(Date.UTC(2026, startMonth - 1, startDay));
  const end = new Date(Date.UTC(2026, endMonth - 1, endDay));

  return `Typical window: ${monthName.format(start)} ${startDay} – ${monthName.format(end)} ${endDay}`;
}

export function BloomTicker() {
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pointerInitiatedFocus = useRef(false);
  const suppressNextFocusOpen = useRef(false);
  const hoverTimer = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const interval = window.setInterval(update, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isOpen) return;
      suppressNextFocusOpen.current = true;
      close();
      triggerRef.current?.focus();
      window.setTimeout(() => {
        suppressNextFocusOpen.current = false;
      }, 0);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, isOpen]);

  useEffect(
    () => () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    },
    [],
  );

  const tokyo = useMemo(() => (now ? getTokyoParts(now) : null), [now]);
  const status = useMemo(
    () => (now ? getBloomStatus(bloomEntries, now) : null),
    [now],
  );
  const bloom = status?.bloom;
  const isoDateTime = tokyo
    ? `${tokyo.year}-${String(tokyo.month).padStart(2, "0")}-${String(tokyo.day).padStart(2, "0")}T${tokyo.label}:00+09:00`
    : undefined;

  return (
    <section
      ref={rootRef}
      className="tile bloomTicker"
      aria-label="Tokyo time and seasonal bloom"
      onFocusCapture={() => {
        if (suppressNextFocusOpen.current) {
          suppressNextFocusOpen.current = false;
          return;
        }
        if (!pointerInitiatedFocus.current) setIsOpen(true);
      }}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) close();
      }}
      onPointerLeave={(event) => {
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
        if (event.pointerType === "mouse" && !rootRef.current?.contains(document.activeElement)) {
          close();
        }
      }}
    >
      <div className="tokyoClock">
        <span className="tickerKicker">Tokyo</span>
        <time dateTime={isoDateTime}>{tokyo?.label ?? "00:00"}</time>
      </div>
      <button
        ref={triggerRef}
        className="bloomTrigger"
        type="button"
        aria-label="Open Japan bloom details"
        aria-expanded={isOpen}
        aria-controls="bloom-popover"
        onPointerDown={() => {
          if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
          pointerInitiatedFocus.current = true;
          window.setTimeout(() => {
            pointerInitiatedFocus.current = false;
          }, 0);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          hoverTimer.current = window.setTimeout(() => setIsOpen(true), 140);
        }}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="bloomEmoji" aria-hidden="true">
          {bloom?.emoji ?? "🌱"}
        </span>
        <span className="bloomSummary">
          <span className="tickerKicker">{status?.status === "active" ? "Blooming now" : "Blooming next"}</span>
          <strong>{bloom?.name ?? "Checking Japan"}</strong>
          <span>{status?.label ?? "one moment"}</span>
        </span>
      </button>
      <div
        className="bloomPopover"
        id="bloom-popover"
        role="dialog"
        aria-label="Japan bloom details"
        hidden={!isOpen}
      >
        <span className="popoverArrow" aria-hidden="true" />
        <p className="popoverKicker">
          {status?.status === "active" ? "Now in Japan" : "Next in Japan"}
        </p>
        <strong>{bloom ? `${bloom.place} · ${bloom.region}` : "Somewhere in Japan"}</strong>
        <span>
          {bloom
            ? formatWindow(
                bloom.startMonth,
                bloom.startDay,
                bloom.endMonth,
                bloom.endDay,
              )
            : "Typical bloom window"}
        </span>
        <a href={bloom?.sourceUrl ?? FALLBACK_SOURCE} target="_blank" rel="noreferrer">
          Source <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
