"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { getTokyoParts } from "../../lib/japan/bloom";
import {
  figLabel,
  kindVerb,
  resolveHotspot,
  roomHotspots,
  type RoomHotspot,
  type RoomPostRef,
} from "./hotspots";
import { AboutPanel, ProjectPanel, ToyPanel, type PanelAbout, type PanelProject } from "./panels/RoomPanels";
import { STILL_ANCHORS } from "./still-anchors";
import type { Anchor, Engine } from "./world/engine";
import styles from "./RoomStage.module.css";

type LightingName = "day" | "dusk" | "night";
type LightingChoice = "auto" | LightingName;
type Active = { id: string; via: "pointer" | "touch" | "list" | "focus" };

const KIND_ACCENT: Record<RoomHotspot["kind"], string> = {
  post: "var(--r-orange)",
  writing: "var(--r-orange)",
  about: "var(--r-orange)",
  project: "var(--r-blue)",
  toy: "var(--r-green)",
};

const LIGHTING_KEY = "virpo-room-lighting";

export function lightingForHour(hour: number): LightingName {
  if (hour >= 6 && hour < 16) return "day";
  if ((hour >= 16 && hour < 19) || hour === 5) return "dusk";
  return "night";
}

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
  const activeRef = useRef<Active | null>(null);
  const openRef = useRef<string | null>(null);
  activeRef.current = active;
  openRef.current = openId;

  const spots = useMemo(
    () => roomHotspots.map((spot) => resolveHotspot(spot, posts)).filter((spot): spot is RoomHotspot => spot !== null),
    [posts],
  );
  const spotMap = useMemo(() => new Map(spots.map((spot) => [spot.id, spot])), [spots]);
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);

  const lighting: LightingName = choice === "auto" ? tokyo?.lighting ?? "day" : choice;

  // ---------- Tokyo clock + saved lighting choice ----------
  useEffect(() => {
    const tick = () => {
      const parts = getTokyoParts(new Date());
      setTokyo({ label: parts.label, lighting: lightingForHour(parts.hour) });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    try {
      const saved = window.localStorage.getItem(LIGHTING_KEY) as LightingChoice | null;
      if (saved && ["auto", "day", "dusk", "night"].includes(saved)) setChoice(saved);
    } catch {
      /* storage blocked: stay on auto */
    }
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("time");
    if (forced === "day" || forced === "dusk" || forced === "night") setChoice(forced);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    engineRef.current?.setLighting(lighting);
  }, [lighting]);

  const chooseLighting = (next: LightingChoice) => {
    setChoice(next);
    try {
      window.localStorage.setItem(LIGHTING_KEY, next);
    } catch {
      /* ignore */
    }
  };

  // ---------- positioning (no React re-render per frame) ----------
  const placeOverlays = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    for (const [id, marker] of markerRefs.current) {
      const anchor = anchorsRef.current.get(id);
      if (!anchor) continue;
      marker.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0)`;
      marker.dataset.placed = anchor.visible ? "true" : "false";
    }
    const current = activeRef.current;
    const chip = chipRef.current;
    if (chip && current) {
      const anchor = anchorsRef.current.get(current.id);
      if (anchor) {
        const w = chip.offsetWidth;
        const x = Math.max(8, Math.min(width - w - 8, anchor.x - w / 2));
        const above = anchor.y - chip.offsetHeight - 22;
        const y = above < 8 ? anchor.y + 22 : above;
        chip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        chip.dataset.below = above < 8 ? "true" : "false";
        chip.style.setProperty("--tail-x", `${(anchor.x - x).toFixed(1)}px`);
      }
    }
    const panel = panelRef.current;
    const open = openRef.current;
    if (panel && open && !panel.dataset.sheet) {
      const anchor = anchorsRef.current.get(open);
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
    engineRef.current?.focus(null);
    const back = returnFocusRef.current ?? (id ? markerRefs.current.get(id) : null);
    returnFocusRef.current = null;
    if (back && document.contains(back)) back.focus({ preventScroll: true });
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
        const styles = getComputedStyle(stage);
        engine = createEngine({
          canvas,
          reducedMotion,
          coarse: isCoarse,
          tokyoLabel: `TOKYO ${getTokyoParts(new Date()).label}`,
          lighting: (stage.dataset.lighting as LightingName) || "day",
          fonts: { mono: styles.getPropertyValue("--r-mono").trim(), sans: styles.getPropertyValue("--r-sans").trim() },
          callbacks: {
            onHover(id, via) {
              if (openRef.current && via === "pointer" && !id) return;
              setActive(id ? { id, via } : null);
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
                setMode("live");
              }
            },
          },
        });
        engineRef.current = engine;
        if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __room: Engine }).__room = engine;
        canvas.addEventListener("webglcontextlost", () => setMode("still"), { once: true });
      } catch (error) {
        console.warn("Pocket Room: falling back to the still image", error);
        setMode("still");
      }
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(() => void boot(), { timeout: 900 });
    else window.setTimeout(() => void boot(), 120);

    const resizeObserver = new ResizeObserver(() => {
      engine?.resize();
      setCompact(stage.clientWidth < 720);
    });
    resizeObserver.observe(stage);
    setCompact(stage.clientWidth < 720);
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
  }, [close, open, setAnchors]);

  // still mode: markers sit at pre-computed positions over the still image
  useEffect(() => {
    if (mode !== "still") return;
    const place = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const set = stage.clientWidth < 720 ? STILL_ANCHORS.mobile : STILL_ANCHORS.desktop;
      setAnchors(
        Object.entries(set).map(([id, [fx, fy]]) => ({ id, x: fx * stage.clientWidth, y: fy * stage.clientHeight, visible: true })),
      );
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [mode, setAnchors]);

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

  useEffect(() => {
    const id = active?.id ?? openId;
    if (!id) return;
    const lit = document.querySelectorAll<HTMLElement>(`[data-room-target="${id}"]`);
    lit.forEach((el) => {
      if (!stageRef.current?.contains(el)) el.dataset.lit = "true";
    });
    return () => lit.forEach((el) => delete el.dataset.lit);
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
  }, [active, openId, placeOverlays]);

  useEffect(() => {
    if (!openId) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
  }, [openId]);

  const markerClick = (event: ReactMouseEvent, spot: RoomHotspot) => {
    if (mode === "loading" && !engineRef.current) {
      // the world is still booting: behave like a plain link
      if (spot.kind === "post" || spot.kind === "writing") return;
    }
    event.preventDefault();
    if (coarse && event.detail > 0 && activeRef.current?.id !== spot.id) {
      setActive({ id: spot.id, via: "touch" });
      engineRef.current?.highlight(spot.id);
      return;
    }
    returnFocusRef.current = markerRefs.current.get(spot.id) ?? null;
    open(spot.id);
  };

  const activeSpot = active ? spotMap.get(active.id) : null;
  const openSpot = openId ? spotMap.get(openId) : null;
  const openProject = openSpot?.projectSlug ? projectMap.get(openSpot.projectSlug) : null;

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

      <div
        className={styles.stage}
        ref={stageRef}
        data-lighting={lighting}
        data-coarse={coarse}
        data-open={openId ? "true" : "false"}
      >
        <picture className={styles.still} aria-hidden="true">
          <source media="(max-width: 719px)" srcSet={`/lab/room/still-${lighting}-mobile.webp`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/lab/room/still-${lighting}-desktop.webp`} alt="" width={1600} height={1200} fetchPriority="high" />
        </picture>
        <canvas className={styles.canvas} ref={canvasRef} aria-hidden="true" />

        <nav className={styles.markers} aria-label="Things in the room">
          {spots.map((spot) => (
            <a
              key={spot.id}
              ref={(el) => {
                if (el) markerRefs.current.set(spot.id, el);
                else markerRefs.current.delete(spot.id);
              }}
              href={fallbackHref(spot)}
              className={styles.marker}
              data-room-target={spot.id}
              data-kind={spot.kind}
              data-active={active?.id === spot.id || openId === spot.id ? "true" : "false"}
              data-placed="false"
              style={{ "--accent": KIND_ACCENT[spot.kind], "--d": `${(spot.fig * 0.4).toFixed(2)}s` } as CSSProperties}
              aria-label={`${figLabel(spot.fig)}, ${spot.object}: ${spotLabel(spot)}`}
              onClick={(event) => markerClick(event, spot)}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                engineRef.current?.highlight(spot.id);
                setActive({ id: spot.id, via: "pointer" });
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "mouse") return;
                engineRef.current?.highlight(null);
                setActive((current) => (current?.id === spot.id ? null : current));
              }}
              onFocus={() => {
                engineRef.current?.highlight(spot.id);
                setActive({ id: spot.id, via: "focus" });
              }}
              onBlur={() => {
                engineRef.current?.highlight(null);
                setActive((current) => (current?.via === "focus" ? null : current));
              }}
            >
              <span aria-hidden="true">{String(spot.fig).padStart(2, "0")}</span>
            </a>
          ))}
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
                Open
              </button>
            ) : (
              <span className={styles.chipHint}>{active?.via === "focus" ? "Enter to open" : "Click to open"}</span>
            )}
          </div>
        ) : null}

        {openSpot ? (
          <div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="false"
            aria-labelledby="room-panel-title"
            data-sheet={compact ? "true" : undefined}
            style={{ "--accent": KIND_ACCENT[openSpot.kind] } as CSSProperties}
          >
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
              {openSpot.kind === "project" && openProject ? <ProjectPanel project={openProject} /> : null}
              {openSpot.kind === "toy" && openSpot.toy ? <ToyPanel toy={openSpot.toy} /> : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.deviceBottom}>
        <ul className={styles.legend} aria-label="Colour key">
          <li style={{ "--accent": "var(--r-orange)" } as CSSProperties}>Writing</li>
          <li style={{ "--accent": "var(--r-blue)" } as CSSProperties}>Projects</li>
          <li style={{ "--accent": "var(--r-green)" } as CSSProperties}>Toys</li>
        </ul>
        <p className={styles.hint}>
          {coarse ? "Tap a number, tap again to open · swipe sideways to turn" : "Hover anything · click to open · drag to turn"}
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
