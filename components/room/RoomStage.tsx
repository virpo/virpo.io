"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { getTokyoParts } from "../../lib/japan/bloom";
import { figLabel, kindVerb, resolveHotspot, roomHotspots, type RoomHotspot, type RoomPostRef } from "./hotspots";
import { applyStillLighting, currentLighting, lightingForHour, readSavedChoice, saveChoice, type LightingChoice, type LightingName } from "./lighting";
import { AboutPanel, ProjectPanel, ToyPanel, type PanelAbout, type PanelProject } from "./panels/RoomPanels";
import { STILL_ANCHORS } from "./still-anchors";
import type { Anchor, Engine } from "./world/engine";
import styles from "./RoomStage.module.css";

export { lightingForHour } from "./lighting";

type Active = { id: string; via: "pointer" | "touch" | "list" | "focus" };

/** On phones the three notebooks share one marker and one chip listing the posts. */
export const DESK_ID = "desk";
const POST_IDS = ["post-0", "post-1", "post-2"];
/** The desk pill sits left of the notebooks' centre, clear of the stream deck's marker. */
const DESK_SHIFT = 0.05;

const KIND_ACCENT: Record<RoomHotspot["kind"], string> = {
  post: "var(--r-orange)",
  writing: "var(--r-orange)",
  about: "var(--r-orange)",
  project: "var(--r-blue)",
  toy: "var(--r-green)",
};

function fallbackHref(spot: RoomHotspot) {
  if (spot.href) return spot.href;
  if (spot.kind === "about") return "#about";
  if (spot.kind === "toy") return "#toys";
  return "#projects";
}

function spotLabel(spot: RoomHotspot) {
  if (spot.kind === "post") return `Read “${spot.title}”`;
  if (spot.kind === "project") return `${spot.title} · project`;
  if (spot.kind === "toy") return `${spot.title} · toy`;
  if (spot.kind === "writing") return "All writing";
  return "About Peter Hraska";
}

const pct = (value: number | undefined) => `${((value ?? 0) * 100).toFixed(2)}%`;

/** Still-image marker position as CSS custom properties (desktop + phone), so markers render server-side. */
function stillVars(id: string): Record<string, string> | null {
  const ids = id === DESK_ID ? POST_IDS : [id];
  const d = ids.map((key) => STILL_ANCHORS.desktop[key]).filter(Boolean);
  const m = ids.map((key) => STILL_ANCHORS.mobile[key]).filter(Boolean);
  if (!d.length || !m.length) return null;
  const avg = (list: [number, number][], i: 0 | 1) => list.reduce((sum, p) => sum + p[i], 0) / list.length;
  // the shared desk marker sits on the notebooks themselves, below their own anchors
  const lift = id === DESK_ID ? -0.035 : 0;
  const shift = id === DESK_ID ? DESK_SHIFT : 0;
  return { "--sx": pct(avg(d, 0)), "--sy": pct(avg(d, 1) - lift), "--mx": pct(avg(m, 0) - shift), "--my": pct(avg(m, 1) - lift) };
}

export function RoomStage({
  posts,
  projects,
  about,
}: {
  posts: RoomPostRef[];
  projects: PanelProject[];
  about: PanelAbout;
}) {
  const router = useRouter();
  const deviceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, HTMLAnchorElement>());
  const anchorsRef = useRef(new Map<string, Anchor>());
  const engineRef = useRef<Engine | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"loading" | "live" | "still">("loading");
  const [active, setActive] = useState<Active | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [choice, setChoice] = useState<LightingChoice>("auto");
  const [tokyo, setTokyo] = useState<{ label: string; lighting: LightingName } | null>(null);
  const [coarse, setCoarse] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sheetDrag, setSheetDrag] = useState(0);
  const activeRef = useRef<Active | null>(null);
  const openRef = useRef<string | null>(null);
  const compactRef = useRef(false);
  const modeRef = useRef(mode);
  activeRef.current = active;
  openRef.current = openId;
  compactRef.current = compact;
  modeRef.current = mode;

  const spots = useMemo(
    () => roomHotspots.map((spot) => resolveHotspot(spot, posts)).filter((spot): spot is RoomHotspot => spot !== null),
    [posts],
  );
  const spotMap = useMemo(() => new Map(spots.map((spot) => [spot.id, spot])), [spots]);
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);
  const deskPosts = useMemo(() => POST_IDS.map((id) => spotMap.get(id)).filter((spot): spot is RoomHotspot => Boolean(spot)), [spotMap]);

  const lighting: LightingName = choice === "auto" ? tokyo?.lighting ?? "day" : choice;

  // ---------- Tokyo clock + saved lighting choice (shared with the post-page toy) ----------
  useEffect(() => {
    const tick = () => {
      const parts = getTokyoParts(new Date());
      setTokyo({ label: parts.label, lighting: lightingForHour(parts.hour) });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    const saved = readSavedChoice();
    if (saved) setChoice(saved);
    const forced = new URLSearchParams(window.location.search).get("time");
    if (forced === "day" || forced === "dusk" || forced === "night") setChoice(forced);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!tokyo) return;
    engineRef.current?.setLighting(lighting);
    applyStillLighting(lighting);
  }, [lighting, tokyo]);

  const chooseLighting = (next: LightingChoice) => {
    setChoice(next);
    saveChoice(next);
  };

  // ---------- positioning (no React re-render per frame) ----------
  const placeOverlays = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const anchors = anchorsRef.current;
    const live = modeRef.current === "live";
    const anchorOf = (id: string): Anchor | null => {
      if (id !== DESK_ID) return anchors.get(id) ?? null;
      const list = POST_IDS.map((key) => anchors.get(key)).filter((a): a is Anchor => Boolean(a && a.visible));
      if (!list.length) return null;
      return { id, x: list.reduce((s, a) => s + a.x, 0) / list.length - width * DESK_SHIFT, y: list.reduce((s, a) => s + a.y, 0) / list.length + height * 0.035, visible: true };
    };
    const stillAnchor = (id: string): Anchor | null => {
      const vars = stillVars(id);
      if (!vars) return null;
      const phone = window.matchMedia?.("(max-width: 719px)").matches;
      return { id, x: (parseFloat(phone ? vars["--mx"] : vars["--sx"]) / 100) * width, y: (parseFloat(phone ? vars["--my"] : vars["--sy"]) / 100) * height, visible: true };
    };
    const locate = (id: string) => (live ? anchorOf(id) : stillAnchor(id));
    if (live) {
      for (const [id, marker] of markerRefs.current) {
        const anchor = anchorOf(id);
        if (!anchor) continue;
        marker.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0)`;
        marker.dataset.placed = anchor.visible ? "true" : "false";
      }
    }
    const current = activeRef.current;
    const chip = chipRef.current;
    if (chip && current) {
      const anchor = locate(current.id);
      if (anchor) {
        const w = chip.offsetWidth;
        const x = Math.max(8, Math.min(width - w - 8, anchor.x - w / 2));
        const above = anchor.y - chip.offsetHeight - 24;
        const y = above < 8 ? Math.min(height - chip.offsetHeight - 8, anchor.y + 24) : above;
        chip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        chip.dataset.below = above < 8 ? "true" : "false";
        chip.style.setProperty("--tail-x", `${Math.max(14, Math.min(w - 14, anchor.x - x)).toFixed(1)}px`);
      }
    }
    const panel = panelRef.current;
    const open = openRef.current;
    if (panel && open && !panel.dataset.sheet) {
      const anchor = locate(open);
      if (anchor) {
        const pw = panel.offsetWidth;
        const ph = panel.offsetHeight;
        const right = anchor.x < width * 0.56;
        const x = right ? Math.min(width - pw - 14, anchor.x + 34) : Math.max(14, anchor.x - 34 - pw);
        const y = Math.max(14, Math.min(height - ph - 14, anchor.y - ph * 0.35));
        panel.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        panel.dataset.side = right ? "right" : "left";
      }
    }
  }, []);

  const setAnchors = useCallback(
    (anchors: Anchor[]) => {
      const map = anchorsRef.current;
      for (const anchor of anchors) map.set(anchor.id, anchor);
      placeOverlays();
    },
    [placeOverlays],
  );

  const highlight = useCallback((id: string | null) => {
    engineRef.current?.highlight(id);
  }, []);

  // ---------- open / close ----------
  const open = useCallback(
    (id: string) => {
      const spot = spotMap.get(id);
      if (!spot) return;
      if (spot.kind === "post" || spot.kind === "writing") {
        if (spot.href) router.push(spot.href);
        return;
      }
      if (!returnFocusRef.current) returnFocusRef.current = (document.activeElement as HTMLElement) ?? null;
      setOpenId(id);
      setActive(null);
      setSheetDrag(0);
      engineRef.current?.highlight(null);
      engineRef.current?.focus(id);
      if (id === "peter") {
        const peter = engineRef.current?.world.peter;
        if (peter) {
          peter.state.wave = 1;
          window.setTimeout(() => {
            peter.state.wave = 0;
          }, 2600);
        }
      }
    },
    [router, spotMap],
  );

  const close = useCallback(() => {
    const id = openRef.current;
    setOpenId(null);
    setSheetDrag(0);
    engineRef.current?.focus(null);
    const back = returnFocusRef.current ?? (id ? markerRefs.current.get(id) : null);
    returnFocusRef.current = null;
    if (back && document.contains(back)) back.focus({ preventScroll: true });
  }, []);

  /** Touch: what the first tap on an object shows. Notebooks on phones show the shared desk chip. */
  const arm = useCallback((id: string) => {
    const shown = compactRef.current && POST_IDS.includes(id) ? DESK_ID : id;
    engineRef.current?.highlight(shown);
    setActive({ id: shown, via: "touch" });
  }, []);

  // ---------- engine boot ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const media = (query: string) => typeof window.matchMedia === "function" && window.matchMedia(query).matches;
    const isCoarse = media("(pointer: coarse)");
    const reducedMotion = media("(prefers-reduced-motion: reduce)");
    setCoarse(isCoarse);
    let disposed = false;
    let engine: Engine | null = null;
    let intersecting = true;
    let firstFrame = true;

    const probe = document.createElement("canvas");
    const supported = Boolean(probe.getContext("webgl2"));
    if (!supported || new URLSearchParams(window.location.search).has("still")) {
      setMode("still");
      return;
    }

    const boot = async () => {
      try {
        await Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
        const { createEngine } = await import("./world/engine");
        if (disposed) return;
        const css = getComputedStyle(stage);
        engine = createEngine({
          canvas,
          reducedMotion,
          coarse: isCoarse,
          tokyoLabel: `TOKYO ${getTokyoParts(new Date()).label}`,
          lighting: currentLighting(),
          fonts: { mono: css.getPropertyValue("--r-mono").trim(), sans: css.getPropertyValue("--r-sans").trim() },
          callbacks: {
            onHover(id, via) {
              // while the canvas itself hovers an object, markers let the pointer through, so a
              // marker riding up with its lifted object can't slide under the cursor and steal it
              if (via === "pointer" && stageRef.current) stageRef.current.dataset.canvasHover = id ? "true" : "false";
              if (openRef.current && via === "pointer" && !id) return;
              if (via === "touch" && id) arm(id);
              else setActive(id ? { id, via } : null);
            },
            onSelect(id) {
              open(id);
            },
            onTapEmpty() {
              setActive(null);
              engine?.highlight(null);
              if (openRef.current) close();
            },
            onFrame(anchors) {
              setAnchors(anchors);
              if (firstFrame) {
                firstFrame = false;
                modeRef.current = "live";
                setMode("live");
              }
            },
          },
        });
        engineRef.current = engine;
        engine.setVisible(intersecting && !document.hidden);
        const params = new URLSearchParams(window.location.search);
        if (params.has("debug")) (window as unknown as { __room: Engine }).__room = engine;
        // deep link from a post page: /room/?spot=post-0 lights that object up
        const spot = params.get("spot");
        if (spot && (spot === DESK_ID || roomHotspots.some((s) => s.id === spot))) {
          window.setTimeout(() => {
            engine?.highlight(spot);
            setActive({ id: spot, via: "list" });
          }, 400);
        }
        canvas.addEventListener("webglcontextlost", () => setMode("still"), { once: true });
      } catch (error) {
        console.warn("Pocket Room: falling back to the still image", error);
        setMode("still");
      }
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(() => void boot(), { timeout: 900 });
    else window.setTimeout(() => void boot(), 120);

    // "compact" = the phone layout; the same breakpoint as the CSS and the phone still
    const phone = () => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 719px)").matches;
    const resizeObserver = new ResizeObserver(() => {
      engine?.resize();
      setCompact(phone());
      placeOverlays();
    });
    resizeObserver.observe(stage);
    setCompact(phone());
    const intersection = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      engine?.setVisible(intersecting && !document.hidden);
    });
    intersection.observe(stage);
    const onVisibility = () => engine?.setVisible(intersecting && !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      engine?.dispose();
      engineRef.current = null;
    };
  }, [arm, close, open, placeOverlays, setAnchors]);

  // ---------- link the HTML lists both ways ----------
  useEffect(() => {
    const targetOf = (event: Event) => (event.target as Element | null)?.closest?.("[data-room-target]") as HTMLElement | null;
    const enter = (event: Event) => {
      const el = targetOf(event);
      if (!el || stageRef.current?.contains(el)) return;
      const id = el.dataset.roomTarget!;
      engineRef.current?.highlight(id);
      setActive({ id, via: "list" });
    };
    const leave = (event: Event) => {
      const el = targetOf(event);
      if (!el || stageRef.current?.contains(el)) return;
      const related = (event as PointerEvent).relatedTarget as Element | null;
      if (related && el.contains(related)) return;
      engineRef.current?.highlight(null);
      setActive((current) => (current?.via === "list" ? null : current));
    };
    const click = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest?.("[data-room-open]") as HTMLElement | null;
      if (!el) return;
      event.preventDefault();
      returnFocusRef.current = el;
      const id = el.dataset.roomOpen!;
      const stage = deviceRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        if (rect.bottom < 80 || rect.top > window.innerHeight - 80) stage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      open(id);
    };
    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
      document.removeEventListener("click", click);
    };
  }, [open]);

  // Exactly one thing is ever lit in the lists: clear every stale row, then light the current one.
  useEffect(() => {
    const id = active?.id ?? openId;
    for (const el of document.querySelectorAll<HTMLElement>("[data-lit]")) delete el.dataset.lit;
    if (!id) return;
    const ids = id === DESK_ID ? POST_IDS : [id];
    for (const key of ids) {
      for (const el of document.querySelectorAll<HTMLElement>(`[data-room-target="${key}"]`)) {
        if (!stageRef.current?.contains(el)) el.dataset.lit = "true";
      }
    }
  }, [active, openId]);

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openRef.current) {
        event.preventDefault();
        close();
      } else if (activeRef.current) {
        setActive(null);
        engineRef.current?.highlight(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useLayoutEffect(() => {
    placeOverlays();
  }, [active, openId, mode, placeOverlays]);

  // still / loading: keep the chip and panel glued to the still markers on resize
  useEffect(() => {
    if (mode === "live") return;
    window.addEventListener("resize", placeOverlays);
    return () => window.removeEventListener("resize", placeOverlays);
  }, [mode, placeOverlays]);

  // panel focus + phone sheet: keep the opened object visible above the sheet
  useEffect(() => {
    if (!openId) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    if (!panel?.dataset.sheet) return;
    const id = window.requestAnimationFrame(() => {
      const stage = stageRef.current;
      const anchor = anchorsRef.current.get(openId);
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const y = rect.top + (anchor ? anchor.y : rect.height * 0.4);
      const sheetTop = window.innerHeight - panel.offsetHeight;
      const wanted = Math.max(70, sheetTop * 0.45);
      if (y > sheetTop - 40 || y < 60) window.scrollBy({ top: y - wanted, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [openId]);

  /** On touch, a tap resolves to the nearest marker centre, so neighbouring 44 px targets never steal taps. */
  const nearestMarker = (clientX: number, clientY: number, fallback: string) => {
    let best = fallback;
    let bestDist = Infinity;
    for (const [id, marker] of markerRefs.current) {
      if (marker.dataset.placed !== "true" || marker.offsetParent === null) continue;
      const rect = marker.getBoundingClientRect();
      const d = Math.hypot(rect.left + rect.width / 2 - clientX, rect.top + rect.height / 2 - clientY);
      if (d < bestDist) {
        bestDist = d;
        best = id;
      }
    }
    return best;
  };

  // a click right after a touch/pen pointerdown is a tap; keyboard Enter has no pointerdown
  const lastPointer = useRef<{ type: string; at: number }>({ type: "", at: 0 });
  const isTap = () => lastPointer.current.type !== "mouse" && lastPointer.current.type !== "" && performance.now() - lastPointer.current.at < 1200;

  const markerClick = (event: ReactMouseEvent, spotId: string) => {
    const tap = isTap();
    lastPointer.current = { type: "", at: 0 };
    const id = tap ? nearestMarker(event.clientX, event.clientY, spotId) : spotId;
    const spot = id === DESK_ID ? null : spotMap.get(id);
    if (!engineRef.current && spot && (spot.kind === "post" || spot.kind === "writing") && !tap) return; // plain link while booting
    event.preventDefault();
    if (id === DESK_ID) {
      highlight(DESK_ID);
      setActive((current) => (current?.id === DESK_ID && current.via === "touch" ? null : { id: DESK_ID, via: "touch" }));
      return;
    }
    // (a tap also focuses the marker first, so only an earlier *tap* counts as armed)
    if (tap && !(activeRef.current?.id === id && activeRef.current.via === "touch")) {
      highlight(id);
      arm(id);
      return;
    }
    returnFocusRef.current = markerRefs.current.get(id) ?? null;
    open(id);
  };

  // ---------- phone sheet: drag the handle down to close ----------
  const dragStart = useRef<{ y: number; id: number } | null>(null);
  const onHandleDown = (event: ReactPointerEvent) => {
    dragStart.current = { y: event.clientY, id: event.pointerId };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onHandleMove = (event: ReactPointerEvent) => {
    if (!dragStart.current) return;
    setSheetDrag(Math.max(0, event.clientY - dragStart.current.y));
  };
  const onHandleUp = (event: ReactPointerEvent) => {
    if (!dragStart.current) return;
    const moved = event.clientY - dragStart.current.y;
    dragStart.current = null;
    if (moved > 70) close();
    else setSheetDrag(0);
  };

  const dismiss = () => {
    setActive(null);
    engineRef.current?.highlight(null);
    engineRef.current?.focus(null);
  };

  const activeSpot = active && active.id !== DESK_ID ? spotMap.get(active.id) : null;
  const deskActive = active?.id === DESK_ID;
  const openSpot = openId ? spotMap.get(openId) : null;
  const openProject = openSpot?.projectSlug ? projectMap.get(openSpot.projectSlug) : null;
  const sheet = compact;

  const markerProps = (id: string, accent: string, fig: number) => {
    const vars = stillVars(id);
    return {
      ref: (el: HTMLAnchorElement | null) => {
        if (el) markerRefs.current.set(id, el);
        else markerRefs.current.delete(id);
      },
      "data-placed": vars ? "true" : "false",
      onPointerDown: (event: ReactPointerEvent) => {
        lastPointer.current = { type: event.pointerType, at: performance.now() };
      },
      style: { ...(vars ?? {}), "--accent": accent, "--d": `${(fig * 0.4).toFixed(2)}s` } as CSSProperties,
    };
  };

  return (
    <div className={styles.device} ref={deviceRef} data-mode={mode} data-lighting={lighting}>
      <div className={styles.deviceTop}>
        <span className={styles.model}>
          <b>PR-03</b> Pocket Room
        </span>
        <span className={styles.status}>
          <span className={styles.led} data-on={mode === "live"} aria-hidden="true" />
          <span>{mode === "live" ? "Live" : mode === "still" ? "Still" : "Loading"}</span>
          <span aria-hidden="true">·</span>
          <span>Tokyo {tokyo?.label ?? "--:--"}</span>
        </span>
      </div>

      <div className={styles.stage} ref={stageRef} data-lighting={lighting} data-coarse={coarse} data-open={openId ? "true" : "false"}>
        <div className={styles.still} data-room-still aria-hidden="true">
          {(["day", "dusk", "night"] as const).map((time) => (
            <div
              key={time}
              data-time={time}
              style={{ "--still-desktop": `url(/lab/room/still-${time}-desktop.webp)`, "--still-mobile": `url(/lab/room/still-${time}-mobile.webp)` } as CSSProperties}
            />
          ))}
        </div>
        <canvas className={styles.canvas} ref={canvasRef} aria-hidden="true" />

        <nav className={styles.markers} aria-label="Things in the room">
          {spots.map((spot) => (
            <a
              key={spot.id}
              {...markerProps(spot.id, KIND_ACCENT[spot.kind], spot.fig)}
              href={fallbackHref(spot)}
              className={styles.marker}
              data-room-target={spot.id}
              data-kind={spot.kind}
              data-desk-item={spot.kind === "post" ? "true" : undefined}
              data-active={active?.id === spot.id || openId === spot.id || (deskActive && spot.kind === "post") ? "true" : "false"}
              aria-label={`${figLabel(spot.fig)}, ${spot.object}: ${spotLabel(spot)}`}
              onClick={(event) => markerClick(event, spot.id)}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                highlight(spot.id);
                setActive({ id: spot.id, via: "pointer" });
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "mouse") return;
                highlight(null);
                setActive((current) => (current?.id === spot.id ? null : current));
              }}
              onFocus={() => {
                highlight(spot.id);
                setActive({ id: spot.id, via: "focus" });
              }}
              onBlur={() => {
                highlight(null);
                setActive((current) => (current?.id === spot.id && current.via === "focus" ? null : current));
              }}
            >
              <span aria-hidden="true">{String(spot.fig).padStart(2, "0")}</span>
            </a>
          ))}
          {deskPosts.length ? (
            <a
              {...markerProps(DESK_ID, "var(--r-orange)", 2)}
              href="#writing"
              className={`${styles.marker} ${styles.deskMarker}`}
              data-room-target={DESK_ID}
              data-kind="post"
              data-active={deskActive ? "true" : "false"}
              aria-label={`${figLabel(deskPosts[0].fig)} to ${figLabel(deskPosts[deskPosts.length - 1].fig)}, notebooks on the desk: the ${deskPosts.length} newest posts`}
              onClick={(event) => markerClick(event, DESK_ID)}
            >
              <span aria-hidden="true">
                {String(deskPosts[0].fig).padStart(2, "0")}
                <small>–{String(deskPosts[deskPosts.length - 1].fig).padStart(2, "0")}</small>
              </span>
            </a>
          ) : null}
        </nav>

        {activeSpot && openId !== activeSpot.id ? (
          <div
            ref={chipRef}
            className={styles.chip}
            data-touch={active?.via === "touch" ? "true" : "false"}
            style={{ "--accent": KIND_ACCENT[activeSpot.kind] } as CSSProperties}
            role="status"
            onClick={active?.via === "touch" ? () => open(activeSpot.id) : undefined}
          >
            <span className={styles.chipTop}>
              <i aria-hidden="true" />
              {figLabel(activeSpot.fig)} · {activeSpot.object}
              <span className={styles.chipZone}>{activeSpot.zone}</span>
              {active?.via === "touch" ? (
                <button
                  type="button"
                  className={styles.chipClose}
                  aria-label="Close"
                  onClick={(event) => {
                    event.stopPropagation();
                    dismiss();
                  }}
                >
                  ×
                </button>
              ) : null}
            </span>
            <span className={styles.chipMain}>
              <em>{kindVerb[activeSpot.kind]}</em> {activeSpot.title}
              <span aria-hidden="true">{activeSpot.kind === "post" || activeSpot.kind === "writing" ? " →" : activeSpot.kind === "project" ? " ↗" : ""}</span>
            </span>
            {active?.via === "touch" ? (
              <button
                type="button"
                className={styles.chipOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  open(activeSpot.id);
                }}
              >
                {activeSpot.kind === "post" ? "Read it" : activeSpot.kind === "project" ? "Open the card" : activeSpot.kind === "about" ? "Say hello" : "Open"}
              </button>
            ) : (
              <span className={styles.chipHint}>{active?.via === "focus" ? "Enter to open" : active?.via === "list" ? "Here in the room" : "Click to open"}</span>
            )}
          </div>
        ) : null}

        {deskActive ? (
          <div ref={chipRef} className={`${styles.chip} ${styles.deskChip}`} data-touch="true" style={{ "--accent": "var(--r-orange)" } as CSSProperties} role="dialog" aria-label="The newest posts, on Peter’s desk">
            <span className={styles.chipTop}>
              <i aria-hidden="true" />
              {figLabel(deskPosts[0]?.fig ?? 2)}–{String(deskPosts[deskPosts.length - 1]?.fig ?? 4).padStart(2, "0")} · Notebooks on the desk
              <button type="button" className={styles.chipClose} aria-label="Close" onClick={dismiss}>
                ×
              </button>
            </span>
            <ol className={styles.deskList}>
              {deskPosts.map((spot) => (
                <li key={spot.id}>
                  <a href={spot.href} onClick={(event) => { event.preventDefault(); open(spot.id); }}>
                    <b aria-hidden="true">{String(spot.fig).padStart(2, "0")}</b>
                    <span>{spot.title}</span>
                    <i aria-hidden="true">→</i>
                  </a>
                </li>
              ))}
            </ol>
            <a className={styles.deskAll} href="/room/writing/" onClick={(event) => { event.preventDefault(); router.push("/room/writing/"); }}>
              All writing <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : null}

        {openSpot ? (
          <div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="false"
            aria-labelledby="room-panel-title"
            data-sheet={sheet ? "true" : undefined}
            style={{ "--accent": KIND_ACCENT[openSpot.kind], ...(sheet && sheetDrag ? { translate: `0 ${sheetDrag}px`, transition: "none" } : {}) } as CSSProperties}
          >
            {sheet ? (
              <div className={styles.grabber} onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp} aria-hidden="true">
                <i />
              </div>
            ) : null}
            <header className={styles.panelHead}>
              <span className={styles.panelFig}>
                <i aria-hidden="true" />
                {figLabel(openSpot.fig)} · {openSpot.object}
              </span>
              <button type="button" className={styles.close} onClick={close} aria-label="Close" data-autofocus>
                <span aria-hidden="true">×</span>
                <kbd>esc</kbd>
              </button>
            </header>
            <h2 id="room-panel-title" className={styles.panelTitle}>
              {openSpot.kind === "about" ? about.name : openSpot.title}
            </h2>
            <div className={styles.panelBody}>
              {openSpot.kind === "about" ? <AboutPanel about={about} /> : null}
              {openSpot.kind === "project" && openProject ? <ProjectPanel project={openProject} spotId={openSpot.id} object={openSpot.object} /> : null}
              {openSpot.kind === "toy" && openSpot.toy ? <ToyPanel toy={openSpot.toy} /> : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.deviceBottom}>
        <ul className={styles.legend} aria-label="Colour key, and where each list is">
          <li style={{ "--accent": "var(--r-orange)" } as CSSProperties}>
            <a href="#writing">Writing</a>
          </li>
          <li style={{ "--accent": "var(--r-blue)" } as CSSProperties}>
            <a href="#projects">Projects</a>
          </li>
          <li style={{ "--accent": "var(--r-green)" } as CSSProperties}>
            <a href="#toys">Toys</a>
          </li>
        </ul>
        <p className={styles.hint}>
          {coarse ? "Tap a number, then Open · swipe sideways to turn" : "Hover anything · click to open · drag to turn"}
        </p>
        <div className={styles.switch} role="group" aria-label="Time of day">
          {(["auto", "day", "dusk", "night"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={choice === value} onClick={() => chooseLighting(value)}>
              {value === "auto" ? "Tokyo" : value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
