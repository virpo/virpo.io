"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { playClick } from "./clicks";
import { RoomScene } from "./scene/RoomScene";
import { readingPose, TIME_CHOICES, TIME_KEY, timeForHour, tokyoClock, tokyoHour, type TimeChoice, type TimeOfDay } from "./scene/life";
import { cycle, figLabel, neighbour, objectById, objectForProject, PLATE_H, PLATE_W, ROOM_OBJECTS, roomPostHref, type RoomAppId, type RoomObject, type RoomToyId } from "./scene/objects";
import { AboutApp, BloomApp, KanaApp, MirrorApp, ProjectApp, RadioApp, WindowApp, type AppAbout, type AppProject } from "./screens/Apps";
import styles from "./device.module.css";

export type DevicePost = { slug: string; title: string; date: string };

type Props = {
  variant?: "hero" | "dock";
  posts: readonly DevicePost[];
  projects?: readonly AppProject[];
  about?: AppAbout;
  /** dock: id of the article whose reading progress drives mini-Peter */
  progressTarget?: string;
};

const APP_TITLES: Record<RoomToyId, string> = {
  window: "Shinkansen view",
  face: "Face tracker",
  kana: "Kana cards",
  sounds: "Sounds of Japan",
  bloom: "Japan blooming forecast",
};

/** z of each slab of the case, in cqw (the face sits in front at +6) */
const SLABS = [-6, -4, -2, 0, 2, 4];
// the controls are solid too: wall layers under each key cap, knurled rings stacked into the knob,
// and a microSD card a few layers thick
const KNOB_RINGS = Array.from({ length: 16 }, (_, r) => r);
const SD_LAYERS = [0, 1, 2];
const GRILLE = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const VENTS = [0, 1, 2, 3, 4, 5];
// the soft loop: out of the slider, down round the hand and back up into it
const STRAP = "M18 178 C 13 220, 12 270, 13 310 C 14 350, 17 392, 28 401 C 40 409, 44 378, 41 330 C 38 280, 32 220, 26 178";
const STRAP_CLASSES = ["cord", "cordBody", "cordTwist", "cordShade", "cordShine"] as const;

function Walls({ n = 4 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, index) => (
        <i key={index} className={styles.wall} style={{ "--w": index + 1, "--n": n } as CSSProperties} aria-hidden="true" />
      ))}
    </>
  );
}

const TIME_LABEL: Record<TimeChoice, string> = { auto: "Tokyo time", morning: "Morning", day: "Day", evening: "Evening", night: "Night" };

const media = (query: string) => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;

function readTimeChoice(): TimeChoice {
  try {
    const saved = window.localStorage.getItem(TIME_KEY) as TimeChoice | null;
    if (saved && TIME_CHOICES.includes(saved)) return saved;
  } catch {
    /* storage blocked */
  }
  return "auto";
}

export function Device({ variant = "hero", posts, projects = [], about, progressTarget }: Props) {
  const router = useRouter();
  const hero = variant === "hero";
  const rootRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [external, setExternal] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [labelOpen, setLabelOpen] = useState(false);
  const [app, setApp] = useState<RoomAppId | null>(null);
  const [appFrom, setAppFrom] = useState<string | null>(null);
  const [timeChoice, setTimeChoice] = useState<TimeChoice>("auto");
  const [time, setTime] = useState<TimeOfDay>("day");
  const [touch, setTouch] = useState(false);
  const touchRef = useRef(false);
  touchRef.current = touch;
  const [allTags, setAllTags] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [knob, setKnob] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [progress, setProgress] = useState(0);
  const [turning, setTurning] = useState(false);
  const [clock, setClock] = useState<string | null>(null);
  // the bezel briefly says what the side button just did
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef(0);

  const lit = hover ?? external ?? selected;

  // ---- environment: touch, reduced motion, visibility, Tokyo light ----
  useEffect(() => {
    setTouch(media("(hover: none)") || media("(pointer: coarse)"));
    setReduced(media("(prefers-reduced-motion: reduce)"));
    setTimeChoice(readTimeChoice());
    const root = rootRef.current;
    let onScreen = true;
    const update = () => setPaused(!onScreen || document.visibilityState === "hidden");
    const observer = typeof IntersectionObserver === "function" && root ? new IntersectionObserver(([entry]) => ((onScreen = entry.isIntersecting), update())) : null;
    if (observer && root) observer.observe(root);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const resolve = () => {
      setTime(timeChoice === "auto" ? timeForHour(tokyoHour()) : timeChoice);
      setClock(tokyoClock());
    };
    resolve();
    const id = window.setInterval(resolve, 15_000);
    return () => window.clearInterval(id);
  }, [timeChoice]);

  // ---- the device leans a little towards the pointer (desktop only) ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !media("(hover: hover) and (pointer: fine)") || media("(prefers-reduced-motion: reduce)")) return;
    let frame = 0;
    let x = 0.5;
    let y = 0.5;
    const apply = () => {
      frame = 0;
      root.style.setProperty("--tx", (x - 0.5).toFixed(3));
      root.style.setProperty("--ty", (y - 0.5).toFixed(3));
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX / window.innerWidth;
      y = event.clientY / window.innerHeight;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // ---- hover links both ways with the plain lists on the page ----
  useEffect(() => {
    if (!hero) return;
    const target = (event: Event) => (event.target instanceof Element ? event.target.closest<HTMLElement>("[data-room-target]") : null);
    const inside = (el: Element | null) => Boolean(el && rootRef.current?.contains(el));
    const over = (event: Event) => {
      const el = target(event);
      if (el && !inside(el)) setExternal(el.dataset.roomTarget ?? null);
    };
    const out = (event: Event) => {
      const el = target(event);
      if (el && !inside(el)) setExternal(null);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("focusin", over);
    document.addEventListener("focusout", out);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("focusin", over);
      document.removeEventListener("focusout", out);
    };
  }, [hero]);

  useEffect(() => {
    if (!hero) return;
    const lift = hover ?? selected;
    document.querySelectorAll<HTMLElement>("[data-room-target]").forEach((el) => {
      if (rootRef.current?.contains(el)) return;
      if (lift && el.dataset.roomTarget === lift) el.setAttribute("data-room-lit", "");
      else el.removeAttribute("data-room-lit");
    });
  }, [hero, hover, selected]);

  // ---- dock: reading progress drives mini-Peter ----
  useEffect(() => {
    if (!progressTarget) return;
    const article = document.getElementById(progressTarget);
    if (!article) return;
    let frame = 0;
    let lastStep = 0;
    let turnTimer = 0;
    const measure = () => {
      frame = 0;
      // 0 at the top of the article, 1 once its last line is on screen
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const value = Math.max(0, Math.min(1, total > 0 ? -rect.top / total : 1));
      setProgress(value);
      const step = Math.floor(value * 7);
      if (step !== lastStep) {
        lastStep = step;
        setTurning(true);
        window.clearTimeout(turnTimer);
        turnTimer = window.setTimeout(() => setTurning(false), 650);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(turnTimer);
    };
  }, [progressTarget]);

  // ---- open things ----
  const hrefFor = useCallback(
    (item: RoomObject) => {
      if (item.kind === "post") {
        const post = posts[item.postIndex ?? 0];
        return post ? roomPostHref(post.slug) : "/blog/";
      }
      if (item.kind === "writing") return "/blog/";
      if (item.kind === "project") return projects.find((project) => project.slug === item.projectSlug)?.href ?? "#projects";
      if (item.kind === "about") return "#about";
      return `#toy-${item.toy}`;
    },
    [posts, projects],
  );

  const titleFor = useCallback(
    (item: RoomObject) => {
      if (item.kind === "post") return posts[item.postIndex ?? 0]?.title ?? item.goes;
      return item.goes;
    },
    [posts],
  );

  // a project's name alone says little ("Žltá stopa"), so its label adds its two tags
  const noteFor = useCallback(
    (item: RoomObject) => {
      if (item.kind !== "project") return undefined;
      const project = projects.find((entry) => entry.slug === item.projectSlug);
      return project && item.goes === project.title ? project.tags?.join(", ") : undefined;
    },
    [projects],
  );

  const appFor = (item: RoomObject): RoomAppId | null => {
    if (item.kind === "toy" && item.toy) return item.toy;
    if (item.kind === "project" && item.projectSlug) return `project:${item.projectSlug}`;
    if (item.kind === "about") return "about";
    return null;
  };

  // Keyboard users get focus back on the object they opened; pointer users get a clean room.
  const openedByKeys = useRef(false);

  const openApp = useCallback((next: RoomAppId, from: string | null, byKeys = false) => {
    openedByKeys.current = byKeys;
    setApp(next);
    setAppFrom(from);
    setHover(null);
    setSelected(null);
    setLabelOpen(false);
    const title = next.startsWith("project:") ? projects.find((project) => `project:${project.slug}` === next)?.title : next === "about" ? "About Peter" : APP_TITLES[next as RoomToyId];
    setAnnounce(`${title ?? "App"} open on the device screen. Press Escape or Back to return to the room.`);
    // keyboard: focus goes into the app, onto its way back
    if (byKeys) requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("[data-app-back]")?.focus({ preventScroll: true }));
  }, [projects]);

  const open = useCallback(
    (item: RoomObject, byKeys = false) => {
      const next = appFor(item);
      if (next) return openApp(next, item.id, byKeys);
      const href = hrefFor(item);
      if (href.startsWith("/")) router.push(href);
      else window.location.assign(href);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hrefFor, openApp, router],
  );

  const closeApp = useCallback(() => {
    if (!app) return;
    const from = appFrom;
    setApp(null);
    setHover(null);
    setSelected(null);
    setLabelOpen(false);
    setAnnounce("Back in the room.");
    if (from && openedByKeys.current) {
      // keyboard: back on the object you opened, so the arrows carry on from there
      setSelected(from);
      requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-hit="${from}"]`)?.focus({ preventScroll: true }));
    } else if (document.activeElement instanceof HTMLElement && rootRef.current?.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }, [app, appFrom]);

  // open a toy from a link elsewhere on the page (#toy-window, #toy-face, …)
  useEffect(() => {
    if (!hero) return;
    const fromHash = () => {
      const match = /^#toy-(window|face|kana|sounds|bloom)$/.exec(window.location.hash);
      if (match) {
        const item = ROOM_OBJECTS.find((entry) => entry.toy === match[1]);
        openApp(match[1] as RoomToyId, item?.id ?? null);
        rootRef.current?.scrollIntoView({ block: "center", behavior: media("(prefers-reduced-motion: reduce)") ? "auto" : "smooth" });
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [hero, openApp]);

  // ---- selection (d-pad, knob, keyboard) ----
  const select = useCallback((id: string, focus = true) => {
    setSelected(id);
    setHover(null);
    const item = objectById.get(id);
    if (item) setAnnounce(`${figLabel(item.fig)}, ${titleFor(item)}`);
    // on touch the d-pad and knob show the label with its Open button, like a first tap does
    if (touchRef.current) setLabelOpen(true);
    if (focus) rootRef.current?.querySelector<HTMLElement>(`[data-hit="${id}"]`)?.focus({ preventScroll: true });
  }, [titleFor]);

  const press = (id: string, kind: "down" | "knob" = "down") => {
    setPressed(id);
    window.setTimeout(() => setPressed((current) => (current === id ? null : current)), 150);
    playClick(kind);
    // a tiny tick under the thumb where phones support it
    if (touch && typeof navigator.vibrate === "function") navigator.vibrate(kind === "knob" ? 4 : 7);
  };

  const appAction = (which: "primary" | "prev" | "next") => {
    const el = screenRef.current?.querySelector<HTMLElement>(`[data-app] [data-${which}]:not(:disabled)`);
    el?.click();
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (app) {
      if (direction === "left") appAction("prev");
      else if (direction === "right") appAction("next");
      else screenRef.current?.querySelector("[data-app-body]")?.scrollBy({ top: direction === "up" ? -60 : 60, behavior: "smooth" });
      return;
    }
    select(neighbour(lit, direction).id);
  };

  const primary = () => {
    if (app) return appAction("primary");
    const id = selected ?? hover;
    if (!id) return select(ROOM_OBJECTS[0].id);
    const item = objectById.get(id);
    if (item) open(item);
  };

  const back = () => {
    if (app) return closeApp();
    setSelected(null);
    setLabelOpen(false);
    setAnnounce("Selection cleared.");
    // nothing is selected, so don't leave focus on an object with no visible ring
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.matches("[data-hit]")) active.blur();
  };

  // when keyboard focus leaves the device, the selection goes with it
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !hero) return;
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && root.contains(next)) return;
      if (next instanceof Node) setSelected(null);
    };
    root.addEventListener("focusout", onFocusOut);
    return () => root.removeEventListener("focusout", onFocusOut);
  }, [hero]);

  const turnKnob = (step: 1 | -1) => {
    setKnob((value) => value + step * 30);
    if (app) return appAction(step === 1 ? "next" : "prev");
    select(cycle(lit, step).id);
  };

  const cycleTime = () => {
    let next = TIME_CHOICES[(TIME_CHOICES.indexOf(timeChoice) + 1) % TIME_CHOICES.length];
    // skip a choice that looks the same as now, so every press visibly changes the light
    if (next !== "auto" && next === time) next = TIME_CHOICES[(TIME_CHOICES.indexOf(next) + 1) % TIME_CHOICES.length];
    setFlash(`Light: ${TIME_LABEL[next]}`);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
    setTimeChoice(next);
    try {
      window.localStorage.setItem(TIME_KEY, next);
    } catch {
      /* ignore */
    }
    setAnnounce(`Light: ${TIME_LABEL[next]}`);
  };

  // with a figure open, ← → step to the previous or next figure that opens on the screen
  // (the notebooks and the bookshelf are links to other pages, so they are skipped)
  const stepApp = (step: 1 | -1) => {
    let item = cycle(appFrom, step);
    for (let guard = 0; guard < ROOM_OBJECTS.length && !appFor(item); guard += 1) item = cycle(item.id, step);
    const next = appFor(item);
    if (next) openApp(next, item.id, true);
  };

  /*
   * Keys. ← → browse the figures in number order (and step between open figures), ↑ ↓ move
   * the cursor round the room, Enter opens, Escape goes back. ← → Enter and Escape work from
   * anywhere on the page while the device is on screen, so you don't have to click into it first;
   * ↑ ↓ only inside the device, so the page still scrolls.
   */
  const handleKey = (event: KeyboardEvent | ReactKeyboardEvent, inside: boolean) => {
    const target = event.target as HTMLElement;
    if (event.key === "Escape") {
      if (app || selected) {
        event.preventDefault();
        press("stop");
        back();
      }
      return;
    }
    // inside an open app's own controls, the keys belong to the app
    if (app && target.closest?.("[data-app-body]")) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      // the d-pad key moves under your finger even when you use the arrow keys
      press(step === 1 ? "right" : "left");
      if (app) stepApp(step);
      else select(cycle(lit, step).id, inside);
      return;
    }
    if (!inside) {
      if (event.key === "Enter" && !app && selected && target === document.body) {
        event.preventDefault();
        press("round");
        primary();
      }
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? "up" : "down";
      press(direction);
      move(direction);
    }
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!hero || event.altKey || event.metaKey || event.ctrlKey) return;
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    handleKey(event, true);
  };

  const keyRef = useRef(handleKey);
  keyRef.current = handleKey;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    if (!hero) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey || pausedRef.current) return;
      const target = event.target as HTMLElement | null;
      if (!target || rootRef.current?.contains(target)) return;
      if (target.closest("input, textarea, select, [contenteditable], [role=slider], [role=tablist]")) return;
      keyRef.current(event, false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hero]);

  // knob: wheel and drag turn it, a click turns one notch
  const knobRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ angle: number; moved: boolean } | null>(null);
  useEffect(() => {
    const el = knobRef.current;
    if (!el || !hero) return;
    let acc = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      acc += event.deltaY;
      if (Math.abs(acc) > 40) {
        turnKnobRef.current(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hero]);
  const turnKnobRef = useRef(turnKnob);
  turnKnobRef.current = turnKnob;

  const angleOf = (event: { clientX: number; clientY: number }) => {
    const rect = knobRef.current!.getBoundingClientRect();
    return (Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180) / Math.PI;
  };

  // ---- the scene's own events ----
  const onActivate = (item: RoomObject, event: MouseEvent<HTMLElement>, pointer: string, viaLink: boolean) => {
    if (pointer !== "mouse" && pointer !== "pen" && touch && (selected !== item.id || !labelOpen)) {
      event.preventDefault();
      setSelected(item.id);
      setLabelOpen(true);
      setAnnounce(`${figLabel(item.fig)}, ${titleFor(item)}. Tap again to open.`);
      return;
    }
    const next = appFor(item);
    if (next) {
      event.preventDefault();
      // a click with detail 0 came from Enter on the focused object
      openApp(next, item.id, event.detail === 0);
      return;
    }
    // posts and the bookshelf are plain links: let the browser follow them
    if (!viaLink) open(item);
  };

  const appItem = appFrom ? objectById.get(appFrom) : null;
  const origin = appItem ? appItem.hit ?? appItem.box : null;
  const appOrigin = origin ? `${(((origin[0] + origin[2] / 2) / PLATE_W) * 100).toFixed(1)}% ${(((origin[1] + origin[3] / 2) / PLATE_H) * 100).toFixed(1)}%` : "50% 50%";
  const appTitle = app ? (app.startsWith("project:") ? projects.find((project) => `project:${project.slug}` === app)?.title : app === "about" ? "About me" : APP_TITLES[app as RoomToyId]) : null;

  let appBody: ReactNode = null;
  if (app === "window") appBody = <WindowApp reducedMotion={reduced} />;
  else if (app === "face") appBody = <MirrorApp />;
  else if (app === "kana") appBody = <KanaApp />;
  else if (app === "sounds") appBody = <RadioApp moodRadio={projects.find((project) => project.slug === "mood-radio")} />;
  else if (app === "bloom") appBody = <BloomApp />;
  else if (app === "about" && about) appBody = <AboutApp about={about} />;
  else if (app?.startsWith("project:")) {
    const slug = app.slice("project:".length);
    const project = projects.find((entry) => entry.slug === slug);
    const item = objectForProject(slug);
    if (project && item) appBody = <ProjectApp project={project} layer={item.layer} object={item.name} />;
  }

  const pose = hero ? null : readingPose(progress, turning);
  const btn = (id: string, extra: Record<string, unknown> = {}) => ({
    "data-pressed": pressed === id ? "true" : undefined,
    tabIndex: hero ? undefined : -1,
    ...extra,
  });

  const scene = (
    <RoomScene
      active={hero && !app ? lit : null}
      label={hero && !app ? (touch ? (labelOpen ? selected : null) : lit) : null}
      labelOpen={touch && labelOpen}
      interactive={hero}
      decorative={!hero}
      tagsOn={hero && (touch || allTags)}
      pose={pose}
      time={time}
      paused={paused || Boolean(app)}
      reducedMotion={reduced}
      hrefFor={hrefFor}
      titleFor={titleFor}
      blocked={Boolean(app)}
      noteFor={noteFor}
      onHover={(id) => {
        setHover(id);
        if (id) {
          // the mouse always wins over a d-pad or keyboard selection
          setSelected(null);
          setLabelOpen(false);
        }
      }}
      onFocusObject={(id) => {
        setSelected(id);
      }}
      onActivate={onActivate}
      onOpenLabel={(id) => {
        const item = objectById.get(id);
        if (item) open(item);
      }}
      priority={hero}
    />
  );

  return (
    <div
      ref={rootRef}
      className={styles.wrap}
      data-variant={variant}
      data-app={app ? "open" : undefined}
      onKeyDown={onKeyDown}
      style={{ "--knob": `${knob}deg`, "--progress": progress.toFixed(3) } as CSSProperties}
    >
      <div className={styles.shadow} aria-hidden="true" />

      <div className={styles.body}>
        {/* the case is a stack of slabs, so its thickness shows when it turns */}
        {SLABS.map((z) => (
          <i key={z} className={styles.slab} style={{ "--z": `${z}cqw` } as CSSProperties} aria-hidden="true" />
        ))}
        <div className={styles.stand} aria-hidden="true" />
        {/* a wrist strap: a thin, strong cord through the lug, a smooth plastic slider, then the
            soft braided loop that goes round your hand */}
        <svg className={styles.lanyard} viewBox="0 0 70 410" aria-hidden="true">
          <g className={styles.thin}>
            <path d="M30 124 C 27 134, 23 142, 20 152" />
            <path d="M30 124 C 29 135, 27 143, 25 152" />
          </g>
          <g className={styles.thinShine}>
            <path d="M30 124 C 27 134, 23 142, 20 152" />
            <path d="M30 124 C 29 135, 27 143, 25 152" />
          </g>
          {STRAP_CLASSES.map((name) => (
            <path key={name} className={styles[name]} d={STRAP} />
          ))}
          <rect className={styles.slider} x="13.5" y="148" width="17" height="34" rx="8.5" />
          <rect className={styles.sliderShine} x="16.5" y="152" width="3.8" height="25" rx="1.9" />
          <path className={styles.sliderSeam} d="M15 165 H 29" />
          <rect className={styles.lug} x="25" y="117" width="9" height="11" rx="3.5" />
          <circle className={styles.lugHole} cx="29.5" cy="122.5" r="1.7" />
        </svg>
        {/* a microSD card half in its slot */}
        <div className={styles.sd} aria-hidden="true">
          {SD_LAYERS.map((l) => (
            <i key={l} style={{ "--l": l } as CSSProperties} />
          ))}
        </div>
        {/* the left side of the case, with the light button on it */}
        <div className={styles.side} aria-hidden={hero ? undefined : true} inert={!hero || undefined}>
          <i className={styles.sideSlots} aria-hidden="true">
            {VENTS.map((vent) => (
              <i key={vent} />
            ))}
          </i>
          <i className={styles.sdSlot} aria-hidden="true" />
          <button type="button" className={styles.sideButton} onClick={hero ? () => (press("side"), cycleTime()) : undefined} aria-label={`Light in the room: ${TIME_LABEL[timeChoice]}. Change`} title={`Light: ${TIME_LABEL[timeChoice]}`} {...btn("side")}>
            <Walls n={8} />
          </button>
        </div>

        <div className={styles.face}>
          <div className={styles.bezel}>
            <div className={styles.screen} ref={screenRef} data-time={time}>
              {hero ? (
                scene
              ) : (
                <a className={styles.dockLink} href="/" aria-label="Mini Peter reading this post in the Pocket Room. Go to the room">
                  <span className={styles.strip}>
                    <span className={styles.stripScene}>{scene}</span>
                  </span>
                </a>
              )}
              {app ? (
                <section key={app} className={styles.app} data-app={app} style={{ transformOrigin: appOrigin }} aria-label={appTitle ?? "App"}>
                  <header className={styles.appBar}>
                    <button type="button" className={styles.appBack} onClick={closeApp} data-app-back>
                      <span aria-hidden="true">←</span> Room
                    </button>
                    <p>
                      {appItem ? <span>{figLabel(appItem.fig)}</span> : null}
                      {appTitle}
                    </p>
                    <kbd aria-hidden="true">esc</kbd>
                  </header>
                  <div className={styles.appBody} data-app-body>
                    {appBody}
                  </div>
                </section>
              ) : null}
              <i className={styles.glare} aria-hidden="true" />
            </div>
            <span className={styles.model} aria-hidden="true">
              PR-03<span className={styles.modelSquare}> pocket room</span>
              <span className={styles.modelTall}> mini</span>
              <span className={styles.modelWide}> wide</span>
            </span>
            {/* the light in the room follows Tokyo, so the bezel says what time it is there */}
            {clock ? (
              <span className={styles.clock} title="Time in Tokyo, where the room is">
                {flash ?? `Tokyo ${clock}`}
              </span>
            ) : null}
          </div>

          <div className={styles.progress} aria-hidden={hero ? true : undefined} role={hero ? undefined : "progressbar"} aria-label={hero ? undefined : "Reading progress"} aria-valuenow={hero ? undefined : Math.round(progress * 100)} aria-valuemin={hero ? undefined : 0} aria-valuemax={hero ? undefined : 100}>
            <i />
          </div>

          <div className={styles.controls} aria-hidden={hero ? undefined : true}>
            <div className={styles.dpad} role={hero ? "group" : undefined} aria-label={hero ? "Move the selection" : undefined}>
              {(["up", "right", "down", "left"] as const).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  className={styles.dkey}
                  data-dir={direction}
                  aria-label={hero ? `Select the object ${direction === "up" ? "above" : direction === "down" ? "below" : `to the ${direction}`}` : undefined}
                  onClick={hero ? () => (press(direction), move(direction)) : undefined}
                  {...btn(direction)}
                >
                  <Walls />
                </button>
              ))}
            </div>
            <button type="button" className={styles.round} aria-label={hero ? "Open the selected object" : undefined} onClick={hero ? () => (press("round"), primary()) : undefined} {...btn("round")}>
              <i className={styles.roundDot} />
              <Walls />
            </button>
            <div className={styles.pill}>
              <button type="button" className={styles.pillKey} aria-label={hero ? (allTags ? "Hide all Fig. numbers" : "Show all Fig. numbers") : undefined} aria-pressed={hero ? allTags : undefined} onClick={hero ? () => (press("menu"), setAllTags((value) => !value)) : undefined} {...btn("menu")}>
                <i className={styles.menuIcon} />
                <Walls />
              </button>
              <button type="button" className={styles.pillKey} aria-label={hero ? (app ? "Back to the room" : "Clear the selection") : undefined} onClick={hero ? () => (press("stop"), back()) : undefined} {...btn("stop")}>
                <i className={styles.stopIcon} />
                <Walls />
              </button>
            </div>
            <i className={styles.grille} aria-hidden="true">
              {GRILLE.map((hole) => (
                <i key={hole} />
              ))}
            </i>
            <button
              ref={knobRef}
              type="button"
              className={styles.knob}
              aria-label={hero ? "Turn to browse the objects in the room" : undefined}
              onPointerDown={(event) => {
                if (!hero) return;
                drag.current = { angle: angleOf(event), moved: false };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const state = drag.current;
                if (!state) return;
                let delta = angleOf(event) - state.angle;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                if (Math.abs(delta) > 28) {
                  state.moved = true;
                  state.angle = angleOf(event);
                  press("knob", "knob");
                  turnKnob(delta > 0 ? 1 : -1);
                }
              }}
              onPointerUp={() => {
                const state = drag.current;
                drag.current = null;
                if (state && !state.moved) {
                  press("knob", "knob");
                  turnKnob(1);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  press("knob", "knob");
                  turnKnob(event.shiftKey ? -1 : 1);
                }
              }}
              {...btn("knob")}
            >
              {KNOB_RINGS.map((r) => (
                <i key={r} className={r === KNOB_RINGS.length - 1 ? `${styles.ring} ${styles.ringTop}` : styles.ring} style={{ "--r": r } as CSSProperties} />
              ))}
              <i className={styles.knobCap}>
                <i className={styles.knobMark} />
              </i>
            </button>
            <span className={styles.legend} aria-hidden="true">
              <span data-for="dpad">move</span>
              <span data-for="round">open</span>
              <span data-for="pill">figs · back</span>
              <span data-for="knob">browse</span>
            </span>
          </div>
        </div>
      </div>
      <p className={styles.sr} aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
