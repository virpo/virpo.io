"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { playClick } from "./clicks";
import { RoomScene } from "./scene/RoomScene";
import { readingPose, TIME_CHOICES, TIME_KEY, timeForHour, tokyoHour, type TimeChoice, type TimeOfDay } from "./scene/life";
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
  window: "Shinkansen window",
  face: "Mirror",
  kana: "Hiragana cards",
  sounds: "Sounds of Japan",
  bloom: "Bloom forecast",
};

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
  const [allTags, setAllTags] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [knob, setKnob] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [progress, setProgress] = useState(0);
  const [turning, setTurning] = useState(false);

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
    const resolve = () => setTime(timeChoice === "auto" ? timeForHour(tokyoHour()) : timeChoice);
    resolve();
    if (timeChoice !== "auto") return;
    const id = window.setInterval(resolve, 60_000);
    return () => window.clearInterval(id);
  }, [timeChoice]);

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
        return post ? roomPostHref(post.slug) : "/room/writing/";
      }
      if (item.kind === "writing") return "/room/writing/";
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

  const appFor = (item: RoomObject): RoomAppId | null => {
    if (item.kind === "toy" && item.toy) return item.toy;
    if (item.kind === "project" && item.projectSlug) return `project:${item.projectSlug}`;
    if (item.kind === "about") return "about";
    return null;
  };

  const openApp = useCallback((next: RoomAppId, from: string | null) => {
    setApp(next);
    setAppFrom(from);
    setHover(null);
    setLabelOpen(false);
    const title = next.startsWith("project:") ? projects.find((project) => `project:${project.slug}` === next)?.title : next === "about" ? "About Peter" : APP_TITLES[next as RoomToyId];
    setAnnounce(`${title ?? "App"} open on the device screen. Press Escape or Back to return to the room.`);
  }, [projects]);

  const open = useCallback(
    (item: RoomObject) => {
      const next = appFor(item);
      if (next) return openApp(next, item.id);
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
    setAnnounce("Back in the room.");
    if (from) {
      setSelected(from);
      requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-hit="${from}"]`)?.focus({ preventScroll: true }));
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
    if (item) setAnnounce(`${figLabel(item.fig)}, ${item.name}: ${titleFor(item)}`);
    if (focus) rootRef.current?.querySelector<HTMLElement>(`[data-hit="${id}"]`)?.focus({ preventScroll: true });
  }, [titleFor]);

  const press = (id: string, kind: "down" | "knob" = "down") => {
    setPressed(id);
    window.setTimeout(() => setPressed((current) => (current === id ? null : current)), 150);
    playClick(kind);
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
  };

  const turnKnob = (step: 1 | -1) => {
    setKnob((value) => value + step * 30);
    if (app) return appAction(step === 1 ? "next" : "prev");
    select(cycle(lit, step).id);
  };

  const cycleTime = () => {
    const next = TIME_CHOICES[(TIME_CHOICES.indexOf(timeChoice) + 1) % TIME_CHOICES.length];
    setTimeChoice(next);
    try {
      window.localStorage.setItem(TIME_KEY, next);
    } catch {
      /* ignore */
    }
    setAnnounce(`Light: ${TIME_LABEL[next]}`);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!hero || event.altKey || event.metaKey || event.ctrlKey) return;
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    const arrows: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (event.key === "Escape") {
      if (app || selected) {
        event.preventDefault();
        back();
      }
      return;
    }
    if (arrows[event.key] && (!app || !target.closest("[data-app-body]"))) {
      event.preventDefault();
      move(arrows[event.key]);
    }
  };

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
      setAnnounce(`${figLabel(item.fig)}, ${item.name}: ${titleFor(item)}. Tap again to open.`);
      return;
    }
    const next = appFor(item);
    if (next) {
      event.preventDefault();
      openApp(next, item.id);
      return;
    }
    // posts and the bookshelf are plain links: let the browser follow them
    if (!viaLink) open(item);
  };

  const appItem = appFrom ? objectById.get(appFrom) : null;
  const origin = appItem ? appItem.hit ?? appItem.box : null;
  const appOrigin = origin ? `${(((origin[0] + origin[2] / 2) / PLATE_W) * 100).toFixed(1)}% ${(((origin[1] + origin[3] / 2) / PLATE_H) * 100).toFixed(1)}%` : "50% 50%";
  const appTitle = app ? (app.startsWith("project:") ? projects.find((project) => `project:${project.slug}` === app)?.title : app === "about" ? "About" : APP_TITLES[app as RoomToyId]) : null;

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
      onHover={(id) => {
        setHover(id);
        if (id) setLabelOpen(false);
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
      <svg className={styles.lanyard} viewBox="0 0 70 410" aria-hidden="true">
        <defs>
          <pattern id="room-braid" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <rect width="6" height="6" fill="#e1692a" />
            <rect width="3" height="6" fill="#f49a58" />
            <rect y="2.4" width="6" height="0.9" fill="#a9440f" opacity="0.55" />
          </pattern>
        </defs>
        <path className={styles.cord} d="M37 34 C 22 52, 15 120, 15 240 C 15 330, 17 392, 29 401 C 41 409, 45 378, 43 326 C 41 250, 36 130, 41 66" />
        <path className={styles.cordBraid} d="M37 34 C 22 52, 15 120, 15 240 C 15 330, 17 392, 29 401 C 41 409, 45 378, 43 326 C 41 250, 36 130, 41 66" />
        <rect className={styles.sleeve} x="13" y="238" width="33" height="44" rx="7" />
        <rect className={styles.sleeveHi} x="16" y="242" width="6" height="36" rx="3" />
      </svg>
      <div className={styles.stand} aria-hidden="true" />
      <div className={styles.shadow} aria-hidden="true" />

      <div className={styles.body}>
        <div className={styles.side} aria-hidden="true">
          <i className={styles.sideSlots} />
        </div>
        <button type="button" className={styles.sideButton} onClick={hero ? cycleTime : undefined} aria-label={`Light in the room: ${TIME_LABEL[timeChoice]}. Change`} title={`Light: ${TIME_LABEL[timeChoice]}`} {...btn("side")} />

        <div className={styles.face}>
          <div className={styles.bezel}>
            <div className={styles.screen} ref={screenRef} data-time={time}>
              {hero ? (
                scene
              ) : (
                <a className={styles.dockLink} href="/room/" aria-label="Mini Peter reading this post in the Pocket Room. Go to the room">
                  <span className={styles.strip}>
                    <span className={styles.stripScene}>{scene}</span>
                  </span>
                </a>
              )}
              {app ? (
                <section className={styles.app} data-app={app} style={{ transformOrigin: appOrigin }} aria-label={appTitle ?? "App"}>
                  <header className={styles.appBar}>
                    <button type="button" className={styles.appBack} onClick={closeApp}>
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
                />
              ))}
            </div>
            <button type="button" className={styles.round} aria-label={hero ? "Open the selected object" : undefined} onClick={hero ? () => (press("round"), primary()) : undefined} {...btn("round")}>
              <i />
            </button>
            <div className={styles.pill}>
              <button type="button" className={styles.pillKey} aria-label={hero ? (allTags ? "Hide all Fig. numbers" : "Show all Fig. numbers") : undefined} aria-pressed={hero ? allTags : undefined} onClick={hero ? () => (press("menu"), setAllTags((value) => !value)) : undefined} {...btn("menu")}>
                <i className={styles.menuIcon} />
              </button>
              <button type="button" className={styles.pillKey} aria-label={hero ? (app ? "Back to the room" : "Clear the selection") : undefined} onClick={hero ? () => (press("stop"), back()) : undefined} {...btn("stop")}>
                <i className={styles.stopIcon} />
              </button>
            </div>
            <i className={styles.grille} aria-hidden="true" />
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
              <i className={styles.knobCap} />
            </button>
          </div>
        </div>
      </div>
      <p className={styles.sr} aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
