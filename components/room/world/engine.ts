import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createPostPass } from "./post";
import { setTextureFonts } from "./textures";
import { hotspotById } from "../hotspots";
import { buildWorld, type LightingName, type World } from "./world";

export type Anchor = { id: string; x: number; y: number; visible: boolean };

export type EngineCallbacks = {
  /** Fired when the pointer hovers a different object in the world (null = nothing). */
  onHover(id: string | null, via: "pointer" | "touch"): void;
  /** Fired when a world object is clicked/tapped to open. */
  onSelect(id: string): void;
  /** Projected marker anchors in CSS pixels relative to the canvas, every rendered frame. */
  onFrame(anchors: Anchor[]): void;
  onTapEmpty(): void;
};

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
  coarse: boolean;
  tokyoLabel: string;
  lighting: LightingName;
  fonts?: { mono?: string; sans?: string };
  callbacks: EngineCallbacks;
};

export type Engine = {
  /** Highlight an object from outside the world (list hover, keyboard focus). */
  highlight(id: string | null): void;
  /** Gently push the camera towards an object while its panel is open. */
  focus(id: string | null): void;
  setLighting(name: LightingName): void;
  resize(): void;
  setVisible(visible: boolean): void;
  anchors(): Anchor[];
  stats(): { fps: number; cap: number; draws: number; dpr: number; taps: number; shadowUpdates: number; why: string; hover: string | null; move: string };
  debugCamera(position: [number, number, number], target: [number, number, number]): void;
  /** Debug/tooling: frame one object (used to render the project thumbnails). */
  frameSpot(id: string, zoom?: number): void;
  /** Debug/tooling: where an object's focus point (plus dy world units) is in client pixels. */
  screenOf(id: string, dy?: number): { x: number; y: number } | null;
  /** Debug/tooling: what the pointer would hover at a client point. */
  pickAt(x: number, y: number): string | null;
  dispose(): void;
  world: World;
};

const AZIMUTH = 0.52;
const ELEVATION = 0.36;

export function createEngine(options: EngineOptions): Engine {
  const { canvas, callbacks } = options;
  if (options.fonts) setTextureFonts(options.fonts.mono, options.fonts.sans);
  const mobile = options.coarse || Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance", stencil: false });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // The shadow map is frozen: it only re-renders when lighting changes, an object
  // springs up on hover, or the canvas resizes. Moving things (trains, the printer
  // head, the cat) don't cast into it; they carry soft contact blobs instead.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const maxDpr = mobile ? 1.6 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const post = createPostPass(renderer, mobile ? 0 : 4);

  const world = buildWorld({ reducedMotion: options.reducedMotion, mobile, tokyoLabel: options.tokyoLabel, shadowSize: mobile ? 1024 : 2048 });
  world.setLighting(options.lighting, true);
  const { scene } = world;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 80);
  const view = {
    azimuth: AZIMUTH,
    elevation: ELEVATION,
    targetAzimuth: AZIMUTH,
    targetElevation: ELEVATION,
    distance: 30,
    baseDistance: 30,
    target: new THREE.Vector3(0, 1.0, -0.2),
    baseTarget: new THREE.Vector3(0, 1.0, -0.2),
    focusTarget: null as THREE.Vector3 | null,
    parallaxX: 0,
    parallaxY: 0,
    zoom: 1,
  };

  // Points that must stay on screen whatever the aspect ratio.
  const landscapePoints = [
    new THREE.Vector3(-5.6, 0, 2.6),
    new THREE.Vector3(5.6, 0, 2.6),
    new THREE.Vector3(0.2, 5.25, -1.5),
    new THREE.Vector3(-4.6, 0, -2.4),
    new THREE.Vector3(4.4, 0.2, -3.2),
    new THREE.Vector3(-1.0, -0.2, 4.0),
  ];
  // portrait: frame the house itself, let the street and plinth bleed off the sides
  const portraitPoints = [
    new THREE.Vector3(-2.5, 0.2, 0.5),
    new THREE.Vector3(3.9, 0.0, 0.9),
    new THREE.Vector3(0.2, 5.25, -1.5),
    new THREE.Vector3(-2.4, 0.3, -3.3),
    new THREE.Vector3(2.8, 0.3, -3.3),
    new THREE.Vector3(0.4, 0.0, 2.1),
  ];
  let framePoints = landscapePoints;
  const tmp = new THREE.Vector3();

  const placeCamera = () => {
    const d = view.distance * view.zoom;
    const target = view.focusTarget ? view.baseTarget.clone().lerp(view.focusTarget, 0.32) : view.baseTarget;
    view.target.lerp(target, 1);
    const az = view.azimuth + view.parallaxX * 0.035;
    const el = view.elevation + view.parallaxY * 0.02;
    camera.position.set(
      view.target.x + Math.sin(az) * Math.cos(el) * d,
      view.target.y + Math.sin(el) * d,
      view.target.z + Math.cos(az) * Math.cos(el) * d,
    );
    camera.lookAt(view.target);
    camera.updateMatrixWorld();
  };

  const fitCamera = () => {
    // binary search the distance so every frame point fits with a margin,
    // then recentre vertically on the projected bounds.
    framePoints = camera.aspect < 1.05 ? portraitPoints : landscapePoints;
    const margin = camera.aspect < 1.05 ? 0.97 : 0.95;
    view.baseTarget.set(0, 1.0, -0.2);
    for (let pass = 0; pass < 2; pass += 1) {
      let lo = 8;
      let hi = 120;
      for (let i = 0; i < 22; i += 1) {
        const mid = (lo + hi) / 2;
        view.distance = mid;
        view.target.copy(view.baseTarget);
        placeCamera();
        let fits = true;
        for (const p of framePoints) {
          tmp.copy(p).project(camera);
          if (Math.abs(tmp.x) > margin || Math.abs(tmp.y) > margin) fits = false;
        }
        if (fits) hi = mid;
        else lo = mid;
      }
      view.distance = hi;
      placeCamera();
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of framePoints) {
        tmp.copy(p).project(camera);
        minY = Math.min(minY, tmp.y);
        maxY = Math.max(maxY, tmp.y);
      }
      const offset = (minY + maxY) / 2;
      // shift target along the camera's up vector to recentre
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const worldPerNdc = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * view.distance;
      view.baseTarget.addScaledVector(up, offset * worldPerNdc);
    }
    view.baseDistance = view.distance;
    view.target.copy(view.baseTarget);
    placeCamera();
  };

  let width = 1;
  let height = 1;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);
    post.setSize(pw, ph);
    world.setOutlineResolution(pw, ph, dpr);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitCamera();
    dirty = true;
  };

  // ---------- picking ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickables = world.spots.flatMap((spot) => spot.pickables);
  const ownerOf = new Map<THREE.Object3D, string>();
  for (const spot of world.spots) for (const p of spot.pickables) ownerOf.set(p, spot.id);

  const owner = (object: THREE.Object3D) => {
    for (let o: THREE.Object3D | null = object; o; o = o.parent) {
      const id = ownerOf.get(o);
      if (id) return id;
    }
    return null;
  };
  /** Ray distance to a spot in its resting pose (not lifted, not popped), or null if the ray misses it. */
  const restDistance = (id: string) => {
    const spot = world.spotById.get(id);
    if (!spot) return null;
    const y = spot.object.position.y;
    const scale = spot.object.scale.clone();
    spot.object.position.y = spot.base.y;
    spot.object.scale.copy(spot.baseScale);
    spot.object.updateMatrixWorld(true);
    const hit = raycaster.intersectObjects(spot.pickables, false)[0];
    spot.object.position.y = y;
    spot.object.scale.copy(scale);
    spot.object.updateMatrixWorld(true);
    return hit ? hit.distance : null;
  };
  const pick = (clientX: number, clientY: number, fuzzy: boolean): string | null => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    // Peter's invisible capsule (head + shoulders) wins over the furniture around him (desk,
    // laptop, chair, wall), but never over another clickable object that is really in front
    const proxy = hits.find((h) => h.object.userData.proxy);
    if (proxy) {
      const blocker = hits.find((h) => h !== proxy && h.distance < proxy.distance && owner(h.object) && owner(h.object) !== "peter");
      if (!blocker) return owner(proxy.object);
    }
    const hit = hits.find((h) => !h.object.userData.proxy);
    // hysteresis: a hovered object springs up and pops; keep it hovered while the cursor
    // is still over where it rests, or it would flicker as it jumps out from under the cursor
    if (!fuzzy && pointerHover && pointerHover !== "peter") {
      const rest = restDistance(pointerHover);
      if (rest !== null && (!hit || rest <= hit.distance + 0.05)) return pointerHover;
    }
    if (hit) {
      const id = owner(hit.object);
      if (id) return id;
    }
    if (!fuzzy) return null;
    // touch: forgive near misses by snapping to the closest marker
    let best: string | null = null;
    let bestDist = 34;
    for (const a of currentAnchors) {
      const d = Math.hypot(a.x - (clientX - rect.left), a.y - (clientY - rect.top));
      if (a.visible && d < bestDist) {
        bestDist = d;
        best = a.id;
      }
    }
    return best;
  };

  // ---------- state ----------
  let pointerHover: string | null = null;
  let externalHover: string | null = null;
  let armed: string | null = null;
  let focusId: string | null = null;
  const lookTarget = new THREE.Vector3();
  let dirty = true;
  let pointerInside = false;
  let glance: THREE.Vector3 | null = null;
  let lastInput = performance.now();

  const applyActive = () => {
    const active = externalHover ?? pointerHover ?? armed;
    // "desk" = the three notebooks together (the shared marker on phones)
    const isActive = (id: string) => id === active || (active === "desk" && id.startsWith("post-"));
    for (const spot of world.spots) spot.active = isActive(spot.id) || spot.id === focusId;
    world.peter.state.look = active === "peter" || focusId === "peter" ? 1 : 0;
    // hover something in the writing room and Peter glances at it
    const near = active && active !== "peter" ? world.spotById.get(active === "desk" ? "post-1" : active) : null;
    glance = near && hotspotById.get(near.id)?.zone === "Writing room" ? near.focus : null;
    dirty = true;
  };

  // ---------- input ----------
  type Drag = { id: number; x: number; y: number; startAz: number; startEl: number; moved: boolean; type: string };
  let drag: Drag | null = null;
  let lastMove: { x: number; y: number } | null = null;

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startAz: view.targetAzimuth, startEl: view.targetElevation, moved: false, type: event.pointerType };
  };
  const onPointerMove = (event: PointerEvent) => {
    if (drag && drag.id === event.pointerId) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 7) {
        // on touch, only take horizontal drags; vertical ones scroll the page
        if (drag.type !== "mouse" && Math.abs(dy) > Math.abs(dx)) {
          drag = null;
          return;
        }
        drag.moved = true;
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (drag.moved) {
        view.targetAzimuth = THREE.MathUtils.clamp(drag.startAz - dx * 0.006, AZIMUTH - 0.55, AZIMUTH + 0.55);
        if (drag.type === "mouse") view.targetElevation = THREE.MathUtils.clamp(drag.startEl + dy * 0.003, ELEVATION - 0.16, ELEVATION + 0.2);
        canvas.style.cursor = "grabbing";
        dirty = true;
        return;
      }
    }
    if (event.pointerType === "mouse") {
      lastMove = { x: event.clientX, y: event.clientY };
      pointerInside = true;
      const rect = canvas.getBoundingClientRect();
      view.parallaxX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      view.parallaxY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    }
  };
  const onPointerUp = (event: PointerEvent) => {
    const wasDrag = drag?.moved;
    const type = drag?.type ?? event.pointerType;
    drag = null;
    canvas.style.cursor = "";
    if (wasDrag) return;
    if (type === "mouse") {
      const id = pick(event.clientX, event.clientY, false);
      if (id) callbacks.onSelect(id);
      return;
    }
    const id = pick(event.clientX, event.clientY, true);
    if (!id) {
      armed = null;
      applyActive();
      callbacks.onTapEmpty();
      return;
    }
    if (armed === id) {
      callbacks.onSelect(id);
    } else {
      armed = id;
      applyActive();
      callbacks.onHover(id, "touch");
    }
  };
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    // a pointer that jumps straight onto an object should light it up immediately
    lastMove = { x: event.clientX, y: event.clientY };
    pointerInside = true;
    kick();
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    lastMove = null;
    pointerInside = false;
    view.parallaxX = 0;
    view.parallaxY = 0;
    if (pointerHover) {
      pointerHover = null;
      applyActive();
      callbacks.onHover(null, "pointer");
    }
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerenter", onPointerEnter);

  // ---------- loop ----------
  let currentAnchors: Anchor[] = [];
  const computeAnchors = () => {
    const out: Anchor[] = [];
    for (const spot of world.spots) {
      tmp.copy(spot.anchor);
      spot.object.localToWorld(tmp);
      tmp.project(camera);
      out.push({ id: spot.id, x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 });
    }
    currentAnchors = out;
    return out;
  };

  const focusDistance = { value: 30, target: 30 };
  const focusY = { value: 0.5, target: 0.5 };
  const focusVec = new THREE.Vector3();
  const uniforms = post.material.uniforms;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let slowFrames = 0;
  let frames = 0;
  let lastRender = 0;
  let wasSettling = true;
  // quality ladder for slow GPUs: fewer bokeh taps first, then a lower pixel ratio
  let taps = mobile ? 28 : 44;
  const slowParam = new URLSearchParams(window.location.search).get("slow");
  const debugSlowMs = slowParam ? Number(slowParam) || 30 : 0;
  const noDof = new URLSearchParams(window.location.search).has("nodof");
  const debugStats = new URLSearchParams(window.location.search).has("debug");
  const stats = { fps: 0, cap: 60, draws: 0, dpr, taps, shadowUpdates: 0, why: "", hover: "" as string | null, move: "" };
  let fpsFrames = 0;
  let fpsStart = performance.now();

  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    // Cap at 60 fps; drop to 30 when nobody is interacting with the world
    // (pointer elsewhere, nothing springing, no drag): the trains still run.
    const interacting = pointerInside || drag !== null || now - lastInput < 2500 || wasSettling || focusId !== null || externalHover !== null || armed !== null;
    const cap = interacting ? 60 : 30;
    stats.cap = cap;
    if (!dirty && now - lastRender < 1000 / cap - 2.5) {
      schedule();
      return;
    }
    lastRender = now;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    elapsed += dt;
    if (debugSlowMs) {
      const until = performance.now() + debugSlowMs;
      while (performance.now() < until) {
        /* simulate a slow GPU for testing the quality ladder */
      }
    }

    // hover picking (mouse) once per frame
    if (debugStats) stats.move = lastMove ? `${Math.round(lastMove.x)},${Math.round(lastMove.y)}${drag ? " drag" : ""}` : "none";
    if (lastMove && !drag) {
      const id = pick(lastMove.x, lastMove.y, false);
      stats.hover = id;
      if (id !== pointerHover) {
        pointerHover = id;
        applyActive();
        callbacks.onHover(id, "pointer");
      }
      canvas.style.cursor = id ? "pointer" : "grab";
    }

    // camera easing
    // reduced motion: no easing anywhere, everything snaps
    const k = options.reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
    view.azimuth += (view.targetAzimuth - view.azimuth) * k;
    view.elevation += (view.targetElevation - view.elevation) * k;
    const zoomTarget = focusId ? 0.86 : 1;
    view.zoom += (zoomTarget - view.zoom) * k;
    if (focusId) {
      const spot = world.spotById.get(focusId);
      view.focusTarget = spot ? spot.focus : null;
    } else view.focusTarget = null;
    const desired = view.focusTarget ? view.baseTarget.clone().lerp(view.focusTarget, 0.3) : view.baseTarget;
    view.target.lerp(desired, k);
    // no pointer parallax: things must stay exactly under the cursor (drag turns the room instead)
    const az = view.azimuth;
    const el = view.elevation;
    const d = view.distance * view.zoom;
    camera.position.set(view.target.x + Math.sin(az) * Math.cos(el) * d, view.target.y + Math.sin(el) * d, view.target.z + Math.cos(az) * Math.cos(el) * d);
    camera.lookAt(view.target);
    camera.updateMatrixWorld();

    // world animation
    if (glance && world.peter.state.look < 1) {
      lookTarget.copy(glance);
      world.peter.state.glance = 0.75;
    } else {
      lookTarget.copy(camera.position);
      world.peter.state.glance = 0;
    }
    world.update(elapsed, dt);
    world.peter.update(options.reducedMotion ? 0 : elapsed, dt, lookTarget);

    // focus pull: snap the focal plane onto whatever is active
    const active = world.spots.find((s) => s.active);
    if (active) {
      focusVec.copy(active.focus);
      focusVec.y += active.spring.value * active.lift;
    } else focusVec.set(0.2, 1.9, -1.4);
    const camDist = focusVec.distanceTo(camera.position);
    focusDistance.target = camDist;
    focusVec.project(camera);
    focusY.target = focusVec.y * 0.5 + 0.5;
    const fk = options.reducedMotion ? 1 : 1 - Math.exp(-dt * (active ? 9 : 3));
    focusDistance.value += (focusDistance.target - focusDistance.value) * fk;
    focusY.value += (focusY.target - focusY.value) * fk;

    uniforms.cameraNear.value = camera.near;
    uniforms.cameraFar.value = camera.far;
    uniforms.focusDist.value = focusDistance.value;
    uniforms.focusY.value = focusY.value;
    const res = uniforms.resolution.value as THREE.Vector2;
    uniforms.maxBlur.value = Math.max(5, Math.min(11, res.y / 95));
    uniforms.aperture.value = noDof ? 0 : mobile ? 2.8 : 4.8;
    uniforms.tilt.value = noDof ? 0 : mobile ? 0.8 : 1.0;
    uniforms.time.value = elapsed;
    uniforms.taps.value = taps;
    (uniforms.bgTop.value as THREE.Color).copy(world.background.top);
    (uniforms.bgBottom.value as THREE.Color).copy(world.background.bottom);
    (uniforms.bgGlow.value as THREE.Color).copy(world.background.glow);

    const springing = world.spots.some((s) => !s.spring.settled());
    if (springing || world.lightingBusy() || world.peter.state.wave > 0) renderer.shadowMap.needsUpdate = true;
    if (renderer.shadowMap.needsUpdate) stats.shadowUpdates += 1;
    renderer.info.autoReset = false;
    renderer.info.reset();
    renderer.setRenderTarget(post.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(post.scene, post.camera);
    stats.draws = renderer.info.render.calls;
    callbacks.onFrame(computeAnchors());

    // adaptive quality: if frames keep taking much longer than the cap allows,
    // step down the bokeh taps, then the pixel ratio (never below 1)
    frames += 1;
    if (dt * 1000 > (1000 / cap) * 1.55) slowFrames += 1;
    if (frames >= 60) {
      if (slowFrames > 30) {
        if (taps > 24) taps = 24;
        else if (dpr > 1) {
          dpr = Math.max(1, dpr - 0.25);
          resize();
        }
        stats.taps = taps;
        stats.dpr = dpr;
      }
      frames = 0;
      slowFrames = 0;
    }
    fpsFrames += 1;
    if (now - fpsStart > 1000) {
      stats.fps = Math.round((fpsFrames * 1000) / (now - fpsStart));
      fpsFrames = 0;
      fpsStart = now;
    }

    const settling = springing || world.lightingBusy() || Math.abs(view.targetAzimuth - view.azimuth) > 1e-4 || Math.abs(view.targetElevation - view.elevation) > 1e-4 || Math.abs(view.zoom - zoomTarget) > 1e-4 || Math.abs(focusDistance.target - focusDistance.value) > 0.01;
    wasSettling = settling;
    if (debugStats) stats.why = settling ? [springing && "spring", world.lightingBusy() && "light", Math.abs(view.targetAzimuth - view.azimuth) > 1e-4 && "az", Math.abs(view.targetElevation - view.elevation) > 1e-4 && "el", Math.abs(view.zoom - zoomTarget) > 1e-4 && "zoom", Math.abs(focusDistance.target - focusDistance.value) > 0.01 && `focus ${focusDistance.target.toFixed(3)}/${focusDistance.value.toFixed(3)}`].filter(Boolean).join(",") : dirty ? "dirty" : "";
    if (!options.reducedMotion || settling || dirty) {
      dirty = false;
      schedule();
    }
  };
  const schedule = () => {
    if (!raf && visible) {
      raf = requestAnimationFrame((now) => frame(now));
    }
  };

  resize();
  // reduced motion: still render once, then only on demand
  schedule();

  const kick = () => {
    dirty = true;
    lastInput = performance.now();
    if (!raf) last = performance.now();
    schedule();
  };
  canvas.addEventListener("pointermove", kick);
  canvas.addEventListener("pointerdown", kick);

  return {
    world,
    highlight(id) {
      externalHover = id;
      applyActive();
      kick();
    },
    focus(id) {
      focusId = id;
      if (!id) armed = null;
      applyActive();
      kick();
    },
    setLighting(name) {
      world.setLighting(name);
      kick();
    },
    resize() {
      resize();
      renderer.shadowMap.needsUpdate = true;
      kick();
    },
    setVisible(next) {
      if (next === visible) return;
      visible = next;
      if (visible) kick();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    anchors: () => currentAnchors,
    stats: () => ({ ...stats, fps: performance.now() - lastRender > 600 ? 0 : stats.fps }),
    pickAt(x, y) {
      return pick(x, y, false);
    },
    screenOf(id, dy = 0) {
      const spot = world.spotById.get(id);
      if (!spot) return null;
      const p = spot.focus.clone();
      p.y += dy;
      p.project(camera);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (p.x * 0.5 + 0.5) * rect.width, y: rect.top + (-p.y * 0.5 + 0.5) * rect.height };
    },
    frameSpot(id, zoom = 1) {
      const spot = world.spotById.get(id);
      if (!spot) return;
      const box = new THREE.Box3().setFromObject(spot.object);
      const center = box.getCenter(new THREE.Vector3());
      const size = Math.max(0.5, box.getSize(new THREE.Vector3()).length());
      const d = (size * 2.3 + 0.8) / zoom;
      const az = AZIMUTH + 0.08;
      const el = 0.3;
      this.debugCamera([center.x + Math.sin(az) * Math.cos(el) * d, center.y + Math.sin(el) * d, center.z + Math.cos(az) * Math.cos(el) * d], [center.x, center.y, center.z]);
    },
    debugCamera(position, target) {
      view.targetAzimuth = view.azimuth = Math.atan2(position[0] - target[0], position[2] - target[2]);
      const dx = position[0] - target[0];
      const dy = position[1] - target[1];
      const dz = position[2] - target[2];
      const d = Math.hypot(dx, dy, dz);
      view.targetElevation = view.elevation = Math.asin(dy / d);
      view.baseTarget.set(...target);
      view.target.set(...target);
      view.distance = d;
      kick();
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointermove", kick);
      canvas.removeEventListener("pointerdown", kick);
      world.dispose();
      envTexture.dispose();
      post.dispose();
      renderer.dispose();
    },
  };
}
