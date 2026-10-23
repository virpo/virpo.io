"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { LAYERS } from "./layers";
import { nextTrain, POSES, type Pose, type TimeOfDay, type Train } from "./life";
import { boxStyle, figLabel, hullClip, objectById, pickAt, PLATE_H, PLATE_W, ROOM_OBJECTS, type RoomObject } from "./objects";
import styles from "./scene.module.css";

const SRC = "/lab/room";

/** Hit order, back to front: small things painted in front of big ones win. */
const HIT_ORDER = ["window", "kana", "cork", "aiposter", "hydrangea", "printer", "mirror", "bookshelf", "radio", "tv", "arcade", "peter", "deck", "post-2", "post-1", "post-0"];
const HITS = HIT_ORDER.map((id) => objectById.get(id)!).filter(Boolean);

/** Paint order of the object layers (the plate is under all of them). */
const PAINT_ORDER = ["window", "kana", "cork", "aiposter", "mirror", "radio", "clay", "printer", "tv", "hydrangea", "arcade", "bookshelf", "deck", "post-2", "post-1", "post-0"];

/**
 * Clean outlines for the lifted copy of each object, in % of its box. The cut-outs carry slivers of
 * whatever stood next to them (a leaf, a shelf edge); these polygons trim them so the ink-and-orange
 * outline traces the object itself.
 */
const CUT: Record<string, string> = {
  arcade: "13% 6%, 92% 2%, 98% 10%, 98% 86%, 60% 96%, 16% 95%, 9% 72%, 9% 40%",
  bookshelf: "8% 22%, 30% 10%, 75% 12%, 92% 24%, 92% 90%, 60% 97%, 12% 97%, 6% 80%",
  cork: "9% 3%, 100% 1%, 100% 99%, 9% 99%",
  deck: "18% 12%, 78% 10%, 96% 60%, 86% 86%, 22% 90%, 12% 70%",
  hydrangea: "18% 30%, 25% 8%, 50% 2%, 85% 5%, 100% 25%, 96% 50%, 75% 60%, 72% 95%, 55% 100%, 35% 95%, 30% 65%, 10% 58%, 8% 45%",
  printer: "4% 3%, 97% 4%, 97% 93%, 82% 99%, 16% 99%, 3% 93%",
  radio: "8% 38%, 22% 22%, 30% 21%, 84% 3%, 89% 7%, 52% 31%, 96% 33%, 98% 95%, 92% 100%, 11% 100%, 8% 90%",
  tv: "6% 22%, 40% 3%, 96% 8%, 96% 85%, 70% 97%, 12% 95%, 4% 80%",
  window: "0% 0%, 100% 22%, 100% 90%, 80% 100%, 0% 84%",
};

/** Painted pieces that are not clickable (yet), drawn as plain layers. */
const DECOR: Record<string, { layer: string; box: readonly [number, number, number, number] }> = {
  clay: { layer: "obj-clay", box: LAYERS.objects.clay },
};

/** Where each Fig. tag sits, in plate pixels (defaults to the top centre of the object). */
const TAG_AT: Record<string, [number, number]> = {
  peter: [470, 372],
  window: [800, 110],
  "post-0": [790, 612],
  "post-1": [868, 572],
  "post-2": [948, 540],
  kana: [430, 70],
  cork: [44, 252],
  hydrangea: [1150, 470],
  printer: [262, 410],
  aiposter: [1290, 168],
  bookshelf: [930, 630],
  deck: [616, 468],
  clay: [296, 128],
};

const [GX0, GY0, GX1, GY1] = LAYERS.glass;
const WINDOW_BOX = LAYERS.objects.window;
/** The view outside: source pixels shown at this scale, offset so the viaduct sits mid-window. */
const VIEW_SCALE = 0.52;
const VIEW_SRC_Y = 60;
const VIEW = { w: LAYERS.view.w * VIEW_SCALE, h: LAYERS.view.h * VIEW_SCALE };
const TRACK_Y = (LAYERS.view.track - VIEW_SRC_Y) * VIEW_SCALE; // from the top of the glass

const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(3)}%`;

export type SceneProps = {
  /** highlighted object (hover, d-pad or a linked list item) */
  active?: string | null;
  /** object whose label tag shows (usually = active) */
  label?: string | null;
  /** label shows an Open button (touch: first tap selects, second opens) */
  labelOpen?: boolean;
  /** the room listens to pointer and keyboard, renders hit areas */
  interactive?: boolean;
  /** Fig. tags always on (touch) */
  tagsOn?: boolean;
  pose?: Pose | null;
  time: TimeOfDay;
  paused?: boolean;
  reducedMotion?: boolean;
  /** ms between trains is shorter in the window toy etc. */
  hrefFor?: (item: RoomObject) => string;
  titleFor?: (item: RoomObject) => string;
  /** a few quiet words after the title, for names that don't explain themselves */
  noteFor?: (item: RoomObject) => string | undefined;
  onHover?: (id: string | null) => void;
  onFocusObject?: (id: string) => void;
  /** viaLink: the event came from the object's own link (so the browser can follow it) */
  onActivate?: (item: RoomObject, event: MouseEvent<HTMLElement>, pointer: string, viaLink: boolean) => void;
  onOpenLabel?: (id: string) => void;
  onTrain?: (train: Train | null) => void;
  /** crop of the plate to show (plate pixels), for the post-page strip */
  frame?: readonly [number, number, number, number];
  /** decorative copy (no hit areas, hidden from assistive tech) */
  decorative?: boolean;
  priority?: boolean;
};

function Layer({ id, src, box, className, children, style }: { id: string; src?: string; box: readonly [number, number, number, number]; className?: string; children?: React.ReactNode; style?: CSSProperties }) {
  const cut = CUT[id];
  const content = (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" draggable={false} decoding="async" />
      ) : null}
      {children}
    </>
  );
  return (
    <>
      {/* a still copy stays put under a lifted object, so lifting never leaves a hole */}
      {cut && src ? (
        <div className={styles.ghost} style={boxStyle(box)} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} decoding="async" />
        </div>
      ) : null}
      <div className={`${styles.obj} ${className ?? ""}`} data-obj={id} style={{ ...boxStyle(box), ...style }}>
        {cut ? (
          <div className={styles.cut} style={{ clipPath: `polygon(${cut})` }}>
            {content}
          </div>
        ) : (
          content
        )}
      </div>
    </>
  );
}

function relBox(inner: readonly number[], outer: readonly number[]) {
  return {
    left: pct(inner[0] - outer[0], outer[2]),
    top: pct(inner[1] - outer[1], outer[3]),
    width: pct(inner[2], outer[2]),
    height: pct(inner[3], outer[3]),
  };
}

export function RoomScene({
  active = null,
  label = null,
  labelOpen = false,
  interactive = true,
  tagsOn = false,
  pose = null,
  time,
  paused = false,
  reducedMotion = false,
  hrefFor,
  titleFor,
  noteFor,
  onHover,
  onFocusObject,
  onActivate,
  onOpenLabel,
  onTrain,
  frame,
  decorative = false,
  priority = false,
}: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef("mouse");
  const [train, setTrain] = useState<Train | null>(null);
  const [idlePose, setIdlePose] = useState<Pose>("typing");
  const onTrainRef = useRef(onTrain);
  onTrainRef.current = onTrain;

  // The timetable. Trains only run while the room is visible and motion is allowed.
  useEffect(() => {
    if (paused || reducedMotion) return;
    let timer = 0;
    let last: Train | null = null;
    const schedule = () => {
      const [delay, next] = nextTrain(last);
      timer = window.setTimeout(() => {
        last = next;
        setTrain(next);
        onTrainRef.current?.(next);
        timer = window.setTimeout(() => {
          setTrain(null);
          onTrainRef.current?.(null);
          schedule();
        }, next.ms + 200);
      }, delay);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      setTrain(null);
    };
  }, [paused, reducedMotion]);

  // Peter at work: mostly typing, now and then a sip from the mug, a look at the passing train.
  useEffect(() => {
    if (paused || reducedMotion) return;
    let timer = 0;
    const loop = () => {
      timer = window.setTimeout(() => {
        setIdlePose("mug");
        timer = window.setTimeout(() => {
          setIdlePose("typing");
          loop();
        }, 3600);
      }, 9000 + Math.random() * 7000);
    };
    loop();
    return () => window.clearTimeout(timer);
  }, [paused, reducedMotion]);

  const glancing = train && train.kind === "shinkansen" && idlePose === "typing";
  const shownPose: Pose = pose ?? (active === "peter" ? "wave" : glancing ? "window" : idlePose);

  // soft parallax for the view outside
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerType.current = event.pointerType;
    if (reducedMotion || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rootRef.current.style.setProperty("--px", x.toFixed(3));
    rootRef.current.style.setProperty("--py", y.toFixed(3));
  };

  const sceneStyle: CSSProperties = frame
    ? {
        width: pct(PLATE_W, frame[2]),
        height: pct(PLATE_H, frame[3]),
        left: pct(-frame[0], frame[2]),
        top: pct(-frame[1], frame[3]),
      }
    : {};

  const labelItem = label ? objectById.get(label) : null;
  const peterBox = LAYERS.sprites["peter-typing"];
  const part = LAYERS.sprites.part;
  const printer = LAYERS.objects.printer;

  return (
    <div
      ref={rootRef}
      className={styles.viewport}
      data-time={time}
      data-paused={paused || reducedMotion ? "true" : "false"}
      data-active={active ?? undefined}
      data-tags={tagsOn ? "on" : undefined}
      data-framed={frame ? "true" : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerDown={(event) => {
        pointerType.current = event.pointerType;
      }}
      onPointerLeave={() => onHover?.(null)}
      aria-hidden={decorative ? true : undefined}
    >
      <div className={styles.scene} style={sceneStyle}>
        {/* the plate: the empty room, glass cut out */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.plate}
          src={`${SRC}/plate.webp`}
          srcSet={`${SRC}/plate-800.webp 800w, ${SRC}/plate.webp 1365w`}
          sizes={frame ? "300px" : "(max-width: 760px) 92vw, 560px"}
          width={PLATE_W}
          height={PLATE_H}
          alt=""
          draggable={false}
          fetchPriority={priority ? "high" : undefined}
        />

        {/* object layers, painted in depth order */}
        {PAINT_ORDER.map((id) => {
          const decor = DECOR[id];
          if (decor) return <Layer key={id} id={id} src={`${SRC}/${decor.layer}.webp`} box={decor.box} />;
          const item = objectById.get(id);
          if (!item) return null;
          if (id === "window") {
            return (
              <Layer key={id} id={id} box={WINDOW_BOX} className={styles.windowObj}>
                <div className={styles.glass} style={{ ...relBox([GX0, GY0, GX1 - GX0, GY1 - GY0], WINDOW_BOX), maskImage: `url(${SRC}/glass-mask.png)`, WebkitMaskImage: `url(${SRC}/glass-mask.png)` }}>
                  <div className={styles.outside} style={{ width: pct(VIEW.w, GX1 - GX0), height: pct(VIEW.h, GY1 - GY0), top: pct(-VIEW_SRC_Y * VIEW_SCALE, GY1 - GY0), left: pct(-(VIEW.w - (GX1 - GX0)) / 2, GX1 - GX0) }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${SRC}/view.webp`} alt="" draggable={false} decoding="async" />
                  </div>
                  {train ? (
                    <div
                      key={train.id}
                      className={styles.train}
                      data-kind={train.kind}
                      data-dir={train.dir}
                      style={
                        {
                          "--ms": `${train.ms}ms`,
                          top: pct(TRACK_Y - (train.kind === "shinkansen" ? 60 : 54), GY1 - GY0),
                          height: pct(train.kind === "shinkansen" ? 60 : 54, GY1 - GY0),
                        } as CSSProperties
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${SRC}/train-${train.kind}.webp`}
                        alt=""
                        draggable={false}
                        style={{ width: pct(train.kind === "shinkansen" ? (60 * LAYERS.trains.shinkansen[0]) / LAYERS.trains.shinkansen[1] : (54 * LAYERS.trains.local[0]) / LAYERS.trains.local[1], GX1 - GX0) }}
                      />
                    </div>
                  ) : null}
                  <i className={styles.glassShine} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.frame} src={`${SRC}/obj-window.webp`} alt="" draggable={false} decoding="async" />
              </Layer>
            );
          }
          if (id === "printer") {
            return (
              <Layer key={id} id={id} src={`${SRC}/${item.layer}.webp`} box={item.box}>
                <div className={styles.part} style={relBox(part, printer)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${SRC}/part.webp`} alt="" draggable={false} />
                  <i className={styles.nozzle} />
                </div>
              </Layer>
            );
          }
          return <Layer key={id} id={id} src={`${SRC}/${item.layer}.webp`} box={item.box} className={id === "hydrangea" ? styles.sway : undefined} />;
        })}

        {/* Peter, one painted pose at a time */}
        <div className={styles.obj} data-obj="peter" data-pose={shownPose} style={boxStyle(peterBox)}>
          {POSES.map((name) => {
            const box = LAYERS.sprites[`peter-${name}`];
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={name}
                className={styles.pose}
                data-on={name === shownPose ? "true" : "false"}
                src={`${SRC}/peter-${name}.webp`}
                alt=""
                draggable={false}
                decoding="async"
                loading={name === "typing" || name === "reading" ? undefined : "lazy"}
                style={relBox(box, peterBox)}
              />
            );
          })}
        </div>

        {/* little life */}
        <Layer id="plant" src={`${SRC}/obj-plant.webp`} box={LAYERS.objects.plant} className={styles.plant} />
        <Layer id="cat" src={`${SRC}/cat.webp`} box={LAYERS.sprites.cat} className={styles.cat} />
        <div className={styles.steam} aria-hidden="true" style={boxStyle([772, 448, 40, 56])}>
          <i />
          <i />
          <i />
        </div>
        <div className={styles.light} aria-hidden="true">
          <i className={styles.lamp} style={{ left: pct(655, PLATE_W), top: pct(372, PLATE_H) }} />
          <i className={styles.screenGlow} style={{ left: pct(665, PLATE_W), top: pct(478, PLATE_H) }} />
        </div>

        <div className={styles.dim} aria-hidden="true" />

        {/* Fig. tags: the idle hint that these things open something */}
        {!decorative ? (
          <div className={styles.tags} aria-hidden="true">
            {ROOM_OBJECTS.map((item, index) => {
              const [x, y, w] = item.box;
              const [tx, ty] = TAG_AT[item.id] ?? [x + w / 2, y + 8];
              return (
                <span key={item.id} className={styles.tag} data-for={item.id} data-on={active === item.id ? "true" : undefined} style={{ left: pct(tx, PLATE_W), top: pct(ty, PLATE_H), animationDelay: `${index * 90}ms` }}>
                  {String(item.fig).padStart(2, "0")}
                </span>
              );
            })}
          </div>
        ) : null}

        {/* hit areas: real links, so the room works with Tab and Enter (and without JavaScript) */}
        {interactive && !decorative ? (
          <div
            className={styles.hits}
            onClick={(event) => {
              // a tap between objects: pick the nearest one (fingers are bigger than a radio)
              if (pointerType.current === "mouse") return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * PLATE_W;
              const y = ((event.clientY - rect.top) / rect.height) * PLATE_H;
              const item = pickAt(x, y);
              if (item) onActivate?.(item, event, pointerType.current, false);
            }}
          >
            {HITS.map((item) => (
              <a
                key={item.id}
                className={styles.hit}
                data-hit={item.id}
                href={hrefFor?.(item) ?? "#"}
                aria-label={`${figLabel(item.fig)}, ${titleFor?.(item) ?? item.goes}`}
                style={{ ...boxStyle(item.hit ?? item.box), clipPath: hullClip(item.hull) }}
                onPointerEnter={(event) => {
                  pointerType.current = event.pointerType;
                  if (event.pointerType === "mouse" || event.pointerType === "pen") onHover?.(item.id);
                }}
                onFocus={(event) => {
                  // only keyboard focus selects; a mouse click also focuses the link in Chrome
                  if (event.currentTarget.matches(":focus-visible")) onFocusObject?.(item.id);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onActivate?.(item, event, pointerType.current, true);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {labelItem && !decorative ? <Label item={labelItem} frame={frame} open={labelOpen} title={titleFor?.(labelItem) ?? labelItem.goes} note={noteFor?.(labelItem)} onOpen={() => onOpenLabel?.(labelItem.id)} /> : null}
    </div>
  );
}

function Label({ item, open, title, note, onOpen, frame }: { item: RoomObject; open: boolean; title: string; note?: string; onOpen: () => void; frame?: readonly [number, number, number, number] }) {
  const [x, y, w, h] = item.hit ?? item.box;
  const fx = frame ? frame[0] : 0;
  const fy = frame ? frame[1] : 0;
  const fw = frame ? frame[2] : PLATE_W;
  const fh = frame ? frame[3] : PLATE_H;
  const cx = (x + w / 2 - fx) / fw;
  const top = (y - fy) / fh;
  const below = top < 0.2;
  const ay = below ? (y + h - fy) / fh : top;
  const align = cx < 0.24 ? "start" : cx > 0.76 ? "end" : "center";
  return (
    <div
      className={styles.label}
      data-align={align}
      data-below={below ? "true" : undefined}
      role="status"
      style={{ left: `${(Math.min(0.97, Math.max(0.03, cx)) * 100).toFixed(2)}%`, top: `${(Math.min(0.96, Math.max(0.04, ay)) * 100).toFixed(2)}%` }}
    >
      <span className={styles.labelFig}>{figLabel(item.fig)}</span>
      <span className={styles.labelText}>
        {title}
        {note ? <span className={styles.labelNote}>{note}</span> : null}
      </span>
      {open ? (
        <button type="button" className={styles.labelOpen} onClick={onOpen}>
          Open
        </button>
      ) : null}
    </div>
  );
}
