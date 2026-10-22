import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Soft matte vinyl palette. Everything in the diorama pulls from here.
export const C = {
  cream: "#f3e7d2",
  paper: "#fbf4e6",
  plaster: "#efe0c6",
  plasterShade: "#e2cfb0",
  wood: "#c8905c",
  woodLight: "#ddb07a",
  woodDark: "#8f5f3c",
  floor: "#d8a86e",
  tatami: "#cfc58c",
  roof: "#3d4452",
  roofEdge: "#59606f",
  ink: "#24262c",
  graphite: "#3b3f47",
  steel: "#9aa0a8",
  white: "#f7f4ee",
  orange: "#f26a21",
  red: "#d9503e",
  coral: "#ee8a72",
  yellow: "#f2c84b",
  mustard: "#d9a531",
  blue: "#3f73b8",
  sky: "#9cc3df",
  navy: "#2d3b58",
  denim: "#33445f",
  sage: "#84a17f",
  sageDark: "#6c8a69",
  grass: "#b3bf8a",
  grassDark: "#94a56f",
  moss: "#5f8b4c",
  leaf: "#79a160",
  sakura: "#f3b6c4",
  sakuraDeep: "#e795aa",
  hydrangea: "#8a8fe0",
  hydrangeaPink: "#c99be0",
  asphalt: "#646872",
  sidewalk: "#ddd3c3",
  concrete: "#d4ccbf",
  concreteDark: "#b9b0a2",
  skin: "#f3c9a7",
  skinShade: "#e5ad8c",
  hair: "#3b2b22",
  hairFade: "#a58a78",
  water: "#7fb7cf",
  clay: "#b77a52",
} as const;

type MatOpts = {
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  map?: THREE.Texture;
  flat?: boolean;
};

const matCache = new Map<string, THREE.Material>();

/** Cached matte vinyl material. Same args → same instance, so static meshes can be merged. */
export function mat(color: string, opts: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = JSON.stringify([color, { ...opts, map: opts.map?.uuid }]);
  const cached = matCache.get(key);
  if (cached) return cached as THREE.MeshStandardMaterial;
  const params: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(color),
    roughness: opts.rough ?? 0.62,
    metalness: opts.metal ?? 0,
    side: opts.side ?? THREE.FrontSide,
    flatShading: opts.flat ?? false,
  };
  if (opts.emissive) {
    params.emissive = new THREE.Color(opts.emissive);
    params.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  if (opts.transparent) {
    params.transparent = true;
    params.opacity = opts.opacity ?? 1;
    params.depthWrite = false;
  }
  if (opts.map) params.map = opts.map;
  const material =
    opts.clearcoat !== undefined
      ? new THREE.MeshPhysicalMaterial({ ...params, clearcoat: opts.clearcoat, clearcoatRoughness: 0.35 })
      : new THREE.MeshStandardMaterial(params);
  matCache.set(key, material);
  return material;
}

/** A unique (uncached) clone, for materials we animate. */
export function ownMat(color: string, opts: MatOpts = {}) {
  return mat(color, opts).clone();
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let geometry = geoCache.get(key) as T | undefined;
  if (!geometry) {
    geometry = make();
    geoCache.set(key, geometry);
  }
  return geometry;
}

const q = (value: number) => Math.round(value * 1000) / 1000;

export function rbox(w: number, h: number, d: number, r = 0.05, seg = 3) {
  const radius = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  return cached(`rb${q(w)},${q(h)},${q(d)},${q(radius)},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, radius));
}

export function cyl(rt: number, rb: number, h: number, seg = 20) {
  return cached(`cy${q(rt)},${q(rb)},${q(h)},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
}

export function sphere(r: number, ws = 24, hs = 16) {
  return cached(`sp${q(r)},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
}

export function capsule(r: number, len: number, cap = 6, radial = 14) {
  return cached(`ca${q(r)},${q(len)},${cap},${radial}`, () => new THREE.CapsuleGeometry(r, len, cap, radial));
}

export function cone(r: number, h: number, seg = 16) {
  return cached(`co${q(r)},${q(h)},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
}

export function torus(r: number, tube: number, rs = 10, ts = 28, arc = Math.PI * 2) {
  return cached(`to${q(r)},${q(tube)},${rs},${ts},${q(arc)}`, () => new THREE.TorusGeometry(r, tube, rs, ts, arc));
}

/** Rounded, softly bevelled cylinder (a "puck") — the vinyl toy staple. */
export function puck(r: number, h: number, bevel = 0.03, seg = 28) {
  return cached(`pk${q(r)},${q(h)},${q(bevel)},${seg}`, () => {
    const b = Math.min(bevel, h / 2 - 0.001, r - 0.001);
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, -h / 2)];
    for (let i = 0; i <= 5; i += 1) {
      const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, -h / 2 + b + Math.sin(a) * b));
    }
    for (let i = 0; i <= 5; i += 1) {
      const a = (i / 5) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b));
    }
    pts.push(new THREE.Vector2(0, h / 2));
    return new THREE.LatheGeometry(pts, seg);
  });
}

export function lathe(key: string, points: [number, number][], seg = 24) {
  return cached(`la${key}`, () => new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg));
}

type Place = {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number | [number, number, number];
  cast?: boolean;
  receive?: boolean;
  name?: string;
};

export function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, place: Place = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(place.x ?? 0, place.y ?? 0, place.z ?? 0);
  m.rotation.set(place.rx ?? 0, place.ry ?? 0, place.rz ?? 0);
  if (place.s !== undefined) {
    if (typeof place.s === "number") m.scale.setScalar(place.s);
    else m.scale.set(...place.s);
  }
  m.castShadow = place.cast ?? true;
  m.receiveShadow = place.receive ?? true;
  if (place.name) m.name = place.name;
  return m;
}

export function group(place: Place = {}, ...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.position.set(place.x ?? 0, place.y ?? 0, place.z ?? 0);
  g.rotation.set(place.rx ?? 0, place.ry ?? 0, place.rz ?? 0);
  if (place.s !== undefined) {
    if (typeof place.s === "number") g.scale.setScalar(place.s);
    else g.scale.set(...place.s);
  }
  if (place.name) g.name = place.name;
  if (children.length) g.add(...children);
  return g;
}

/** Mark an object (and children) as animated so the static merger leaves it alone. */
export function dynamic<T extends THREE.Object3D>(object: T): T {
  object.userData.dynamic = true;
  return object;
}

let contactTexture: THREE.Texture | null = null;
function getContactTexture() {
  if (contactTexture) return contactTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(40,28,20,0.55)");
  gradient.addColorStop(0.45, "rgba(40,28,20,0.28)");
  gradient.addColorStop(1, "rgba(40,28,20,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  contactTexture = new THREE.CanvasTexture(canvas);
  contactTexture.colorSpace = THREE.SRGBColorSpace;
  return contactTexture;
}

let contactMaterial: THREE.MeshBasicMaterial | null = null;
/** Soft blob of ambient occlusion under an object — sells the "sitting on the table" feel. */
export function contact(w: number, d: number, place: Place = {}, strength = 1) {
  if (!contactMaterial) {
    contactMaterial = new THREE.MeshBasicMaterial({
      map: getContactTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  }
  const material = strength === 1 ? contactMaterial : contactMaterial.clone();
  if (strength !== 1) material.opacity = strength;
  const m = new THREE.Mesh(cached("contactPlane", () => new THREE.PlaneGeometry(1, 1)), material);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.set(place.x ?? 0, (place.y ?? 0) + 0.004, place.z ?? 0);
  m.rotation.z = place.ry ?? 0;
  m.castShadow = false;
  m.receiveShadow = false;
  m.renderOrder = -1;
  m.userData.contact = true;
  return m;
}

/** Canvas → texture helper for posters, labels and faces. */
export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A thin printed card (poster, label) with a little thickness so it can be outlined. */
export function card(w: number, h: number, texture: THREE.Texture, depth = 0.025, edge: string = C.paper) {
  const front = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75 });
  const side = mat(edge, { rough: 0.8 });
  const geometry = cached(`card${q(w)},${q(h)},${q(depth)}`, () => new THREE.BoxGeometry(w, h, depth));
  const m = new THREE.Mesh(geometry, [side, side, side, side, front, side]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------- paths & sweeps (railway) ----------

export class LoopPath {
  readonly points: THREE.Vector3[];
  readonly lengths: number[];
  readonly length: number;

  constructor(points: THREE.Vector3[]) {
    this.points = points;
    this.lengths = [0];
    for (let i = 1; i <= points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i % points.length];
      this.lengths.push(this.lengths[i - 1] + a.distanceTo(b));
    }
    this.length = this.lengths[this.lengths.length - 1];
  }

  private locate(s: number) {
    const wrapped = ((s % this.length) + this.length) % this.length;
    let lo = 0;
    let hi = this.lengths.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.lengths[mid] <= wrapped) lo = mid;
      else hi = mid;
    }
    const span = this.lengths[hi] - this.lengths[lo] || 1;
    return { i: lo, t: (wrapped - this.lengths[lo]) / span };
  }

  pointAt(s: number, target = new THREE.Vector3()) {
    const { i, t } = this.locate(s);
    const a = this.points[i];
    const b = this.points[(i + 1) % this.points.length];
    return target.copy(a).lerp(b, t);
  }

  tangentAt(s: number, target = new THREE.Vector3()) {
    const a = this.pointAt(s - 0.05);
    const b = this.pointAt(s + 0.05);
    return target.copy(b).sub(a).normalize();
  }

  /** Point offset sideways (in the ground plane) from the centre line. */
  offsetAt(s: number, offset: number, lift = 0, target = new THREE.Vector3()) {
    const p = this.pointAt(s, target);
    const t = this.tangentAt(s);
    const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
    return p.addScaledVector(side, offset).add(new THREE.Vector3(0, lift, 0));
  }
}

/** Sweep a closed 2D profile (x = sideways, y = up) along a closed loop. */
export function sweep(path: LoopPath, profile: [number, number][], samples: number, offset = 0) {
  const positions: number[] = [];
  const indices: number[] = [];
  const n = profile.length;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < samples; i += 1) {
    const s = (i / samples) * path.length;
    const p = path.pointAt(s);
    const t = path.tangentAt(s);
    const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
    const normalUp = new THREE.Vector3().crossVectors(t, side).normalize();
    if (normalUp.y < 0) normalUp.negate();
    for (const [px, py] of profile) {
      const v = p
        .clone()
        .addScaledVector(side, px + offset)
        .addScaledVector(normalUp.lengthSq() > 0 ? normalUp : up, py);
      positions.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < samples; i += 1) {
    const a = i * n;
    const b = ((i + 1) % samples) * n;
    for (let j = 0; j < n; j += 1) {
      const j2 = (j + 1) % n;
      indices.push(a + j, b + j, a + j2, a + j2, b + j, b + j2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rounded rectangle profile for sweeps. */
export function roundedProfile(w: number, h: number, r: number, steps = 3): [number, number][] {
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
    [w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= steps; i += 1) {
      const a = start + (i / steps) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  // Counter-clockwise from the right-top; reverse so faces point outwards.
  return pts.reverse();
}

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Critically-damped-ish spring with a little overshoot for the "boing". */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  constructor(value = 0, public stiffness = 260, public damping = 16) {
    this.value = value;
    this.target = value;
  }
  step(dt: number) {
    const force = (this.target - this.value) * this.stiffness - this.velocity * this.damping;
    this.velocity += force * dt;
    this.value += this.velocity * dt;
    return this.value;
  }
  settled() {
    return Math.abs(this.target - this.value) < 0.0005 && Math.abs(this.velocity) < 0.001;
  }
  snap(value: number) {
    this.value = this.target = value;
    this.velocity = 0;
  }
}
