import * as THREE from "three";
import type { BuildContext } from "./context";
import { C, LoopPath, capsule, card, contact, cyl, dynamic, group, mat, mesh, ownMat, puck, rbox, roundedProfile, sphere, sweep } from "./kit";
import { stationSign } from "./textures";

// A double-track loop around the plinth: at ground level in front (with a
// station and two level crossings), climbing onto a viaduct behind the house so
// trains glide past the upstairs window.

const CENTER_Z = -0.15;
const A = 6.2;
const B = 4.25;
const EXP = 4.6;
export const TRACK_OFFSET = 0.24;
const RAIL_TOP = 0.1;

export function trackHeight(z: number) {
  return 1.62 * (1 - THREE.MathUtils.smoothstep(z, -3.1, 0.9));
}

function buildPath() {
  const pts: THREE.Vector3[] = [];
  const N = 480;
  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / EXP) * A;
    const z = CENTER_Z + Math.sign(s) * Math.pow(Math.abs(s), 2 / EXP) * B;
    pts.push(new THREE.Vector3(x, trackHeight(z), z));
  }
  return new LoopPath(pts);
}

type Train = {
  cars: THREE.Group[];
  carLen: number;
  gap: number;
  offset: number;
  s: number;
  speed: number;
  cruise: number;
  dir: 1 | -1;
  station?: { s: number; dwell: number; waiting: number; leaving: number };
};

export type Railway = {
  root: THREE.Group;
  path: LoopPath;
  /** world-space position of the shinkansen's lead car */
  leadPosition(target: THREE.Vector3): THREE.Vector3;
  /** Level crossings on the street (z ≈ 1.5): road traffic waits while the barriers are down. */
  crossings: { x: number; closed(): boolean }[];
  update(t: number, dt: number): void;
};

function wrapDelta(a: number, b: number, length: number) {
  let d = (a - b) % length;
  if (d > length / 2) d -= length;
  if (d < -length / 2) d += length;
  return d;
}

function findS(path: LoopPath, predicate: (p: THREE.Vector3) => number) {
  let best = 0;
  let bestScore = Infinity;
  for (let i = 0; i < 2000; i += 1) {
    const s = (i / 2000) * path.length;
    const score = predicate(path.pointAt(s));
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function bogie(y: number, z: number) {
  const g = group({ y, z });
  g.add(mesh(rbox(0.25, 0.07, 0.26, 0.02), mat("#3a3c42", { rough: 0.5 })));
  const wheel = mat("#5c5f66", { metal: 0.5, rough: 0.35 });
  for (const wx of [-0.12, 0.12]) for (const wz of [-0.08, 0.08]) g.add(mesh(cyl(0.045, 0.045, 0.03, 14), wheel, { x: wx, y: -0.03, z: wz, rz: Math.PI / 2 }));
  return g;
}

export function shinkansenCar(kind: "lead" | "mid" | "tail", len: number) {
  const car = dynamic(group({}));
  const body = group({ y: 0.27 });
  car.add(body);
  const white = mat("#f8f8f5", { rough: 0.3, clearcoat: 0.6 });
  const blue = mat("#1f5fb5", { rough: 0.35 });
  const dark = mat("#26324a", { rough: 0.2, metal: 0.2 });
  const isEnd = kind !== "mid";
  const bodyLen = isEnd ? len * 0.68 : len;
  const bodyZ = isEnd ? -(len - bodyLen) / 2 * (kind === "lead" ? 1 : -1) : 0;
  body.add(mesh(rbox(0.34, 0.32, bodyLen, 0.11), white, { z: bodyZ }));
  body.add(mesh(rbox(0.345, 0.035, bodyLen - 0.04, 0.015), blue, { y: -0.07, z: bodyZ }));
  body.add(mesh(rbox(0.346, 0.055, bodyLen - 0.18, 0.02), dark, { y: 0.045, z: bodyZ }));
  if (isEnd) {
    const sign = kind === "lead" ? 1 : -1;
    const noseLen = len - bodyLen;
    const nose = mesh(sphere(0.17, 28, 18), white, { z: sign * (bodyLen / 2 - 0.02) + bodyZ, y: -0.03, s: [1.0, 0.82, (noseLen + 0.1) / 0.17] });
    body.add(nose);
    body.add(mesh(sphere(0.1, 20, 12), dark, { z: sign * (bodyLen / 2 + 0.04) + bodyZ, y: 0.06, s: [1.2, 0.55, 1.5] }));
    body.add(mesh(rbox(0.3, 0.035, noseLen * 0.9, 0.015), blue, { z: sign * (bodyLen / 2 + noseLen * 0.35) + bodyZ, y: -0.07, s: [1, 1, 1] }));
    const lampMat = ownMat("#fff6dc", { emissive: "#fff1c4", emissiveIntensity: 1.5 });
    body.add(mesh(sphere(0.022, 8, 6), lampMat, { x: -0.08, z: sign * (bodyLen / 2 + noseLen * 0.72) + bodyZ, y: -0.06, cast: false }));
    body.add(mesh(sphere(0.022, 8, 6), lampMat, { x: 0.08, z: sign * (bodyLen / 2 + noseLen * 0.72) + bodyZ, y: -0.06, cast: false }));
  } else {
    // pantograph
    const pan = group({ y: 0.18 });
    pan.add(mesh(rbox(0.12, 0.02, 0.1, 0.008), mat("#3a3c42")));
    pan.add(mesh(cyl(0.008, 0.008, 0.14, 5), mat("#3a3c42"), { y: 0.06, z: 0.03, rx: 0.6 }));
    pan.add(mesh(rbox(0.2, 0.012, 0.025, 0.005), mat("#3a3c42"), { y: 0.12, z: 0.07 }));
    body.add(pan);
  }
  car.add(bogie(0.075, len / 2 - 0.2));
  car.add(bogie(0.075, -len / 2 + 0.2));
  // moving trains stay out of the frozen shadow map; a soft blob grounds them instead
  car.add(contact(0.5, len * 1.02, { y: -0.004 }, 0.75));
  car.userData.noShadow = true;
  return car;
}

function localCar(kind: "lead" | "mid" | "tail", len: number) {
  const car = dynamic(group({}));
  const body = group({ y: 0.28 });
  car.add(body);
  const cream = mat("#f1ead8", { rough: 0.4, clearcoat: 0.4 });
  const green = mat("#2f9e6a", { rough: 0.4 });
  const dark = mat("#2c3340", { rough: 0.2, metal: 0.2 });
  body.add(mesh(rbox(0.34, 0.34, len, 0.06), cream));
  body.add(mesh(rbox(0.345, 0.05, len - 0.02, 0.015), green, { y: -0.075 }));
  body.add(mesh(rbox(0.346, 0.09, len - 0.14, 0.02), dark, { y: 0.06 }));
  for (const dz of [-len * 0.25, len * 0.25]) body.add(mesh(rbox(0.348, 0.22, 0.09, 0.015), mat(C.orange, { rough: 0.45 }), { y: 0.0, z: dz }));
  body.add(mesh(rbox(0.3, 0.04, len - 0.1, 0.02), mat("#cfc8b6"), { y: 0.18 }));
  if (kind !== "mid") {
    const sign = kind === "lead" ? 1 : -1;
    body.add(mesh(rbox(0.28, 0.12, 0.02, 0.02), dark, { y: 0.06, z: sign * (len / 2 + 0.004) }));
    const lampMat = ownMat("#fff6dc", { emissive: "#fff1c4", emissiveIntensity: 1.4 });
    for (const lx of [-0.1, 0.1]) body.add(mesh(sphere(0.02, 8, 6), lampMat, { x: lx, y: -0.08, z: sign * (len / 2 + 0.006), cast: false }));
  }
  car.add(bogie(0.075, len / 2 - 0.2));
  car.add(bogie(0.075, -len / 2 + 0.2));
  // moving trains stay out of the frozen shadow map; a soft blob grounds them instead
  car.add(contact(0.5, len * 1.02, { y: -0.004 }, 0.75));
  car.userData.noShadow = true;
  return car;
}

export function buildRailway(ctx: BuildContext): Railway {
  const root = group({ name: "railway" });
  const path = buildPath();
  const concrete = mat(C.concrete, { rough: 0.85 });
  const concreteDark = mat(C.concreteDark, { rough: 0.9 });

  // deck + parapets + ballast
  const deck = new THREE.Mesh(sweep(path, roundedProfile(1.08, 0.2, 0.05), 420, 0), concrete);
  deck.position.y = -0.06;
  deck.castShadow = true;
  deck.receiveShadow = true;
  root.add(deck);
  const ballast = new THREE.Mesh(sweep(path, roundedProfile(0.92, 0.06, 0.02), 420, 0), mat("#9b9286", { rough: 1 }));
  ballast.position.y = 0.05;
  ballast.receiveShadow = true;
  root.add(ballast);
  for (const side of [-1, 1]) {
    const parapet = new THREE.Mesh(sweep(path, roundedProfile(0.05, 0.12, 0.02), 420, side * 0.52), concreteDark);
    parapet.position.y = 0.08;
    parapet.castShadow = true;
    parapet.receiveShadow = true;
    root.add(parapet);
  }
  // rails
  const railMat = mat("#7d7f86", { metal: 0.6, rough: 0.35 });
  for (const track of [-TRACK_OFFSET, TRACK_OFFSET]) {
    for (const r of [-0.085, 0.085]) {
      const rail = new THREE.Mesh(sweep(path, roundedProfile(0.025, 0.03, 0.008, 1), 420, track + r), railMat);
      rail.position.y = RAIL_TOP - 0.015;
      rail.receiveShadow = true;
      root.add(rail);
    }
  }
  // sleepers
  const spacing = 0.13;
  const perTrack = Math.floor(path.length / spacing);
  const sleepers = new THREE.InstancedMesh(rbox(0.25, 0.025, 0.05, 0.008), mat("#6e6457", { rough: 0.9 }), perTrack * 2);
  const dummy = new THREE.Object3D();
  let k = 0;
  for (const track of [-TRACK_OFFSET, TRACK_OFFSET]) {
    for (let i = 0; i < perTrack; i += 1) {
      const s = i * spacing;
      path.offsetAt(s, track, 0.075, dummy.position);
      const ahead = path.offsetAt(s + 0.05, track, 0.075);
      dummy.lookAt(ahead);
      dummy.updateMatrix();
      sleepers.setMatrixAt(k, dummy.matrix);
      k += 1;
    }
  }
  sleepers.receiveShadow = true;
  root.add(sleepers);

  // viaduct pillars where the deck is lifted
  for (let s = 0; s < path.length; s += 0.95) {
    const p = path.pointAt(s);
    if (p.y < 0.45) continue;
    const t = path.tangentAt(s);
    const height = p.y - 0.15;
    const pillar = group({ x: p.x, z: p.z, ry: Math.atan2(t.x, t.z) });
    pillar.add(mesh(rbox(0.22, height, 0.22, 0.06), concrete, { y: height / 2 }));
    pillar.add(mesh(rbox(0.95, 0.1, 0.26, 0.04), concreteDark, { y: height - 0.05 }));
    root.add(pillar);
  }

  // ---- station on the front straight ----
  const stationS = findS(path, (p) => Math.abs(p.x + 2.4) + (p.z < 0 ? 100 : 0));
  const sp = path.pointAt(stationS);
  const platform = group({ x: sp.x, z: sp.z - TRACK_OFFSET - 0.5 });
  platform.add(mesh(rbox(2.4, 0.24, 0.5, 0.04), mat(C.concrete), { y: 0.12 }));
  platform.add(mesh(rbox(2.4, 0.02, 0.06, 0.01), mat(C.yellow), { y: 0.245, z: 0.21 }));
  for (const px of [-0.8, 0.8]) platform.add(mesh(cyl(0.025, 0.025, 0.62, 8), mat(C.graphite), { x: px, y: 0.55, z: -0.1 }));
  platform.add(mesh(rbox(2.0, 0.05, 0.52, 0.03), mat(C.blue, { rough: 0.5 }), { y: 0.88, z: 0.0, rx: -0.12 }));
  const sign = card(0.6, 0.15, stationSign(), 0.03, "#f6f4ef");
  sign.position.set(0, 0.7, -0.08);
  platform.add(sign);
  platform.add(mesh(rbox(0.5, 0.08, 0.16, 0.03), mat(C.woodLight), { x: 0.4, y: 0.38, z: -0.12 }));
  root.add(platform);

  // ---- level crossings where the road meets the loop ----
  const crossings = [
    findS(path, (p) => Math.abs(p.z - 1.5) + (p.x < 0 ? 100 : 0)),
    findS(path, (p) => Math.abs(p.z - 1.5) + (p.x > 0 ? 100 : 0)),
  ];
  type Barrier = { arm: THREE.Group; lamps: THREE.MeshStandardMaterial[]; s: number; angle: number };
  const barriers: Barrier[] = [];
  for (const s of crossings) {
    const p = path.pointAt(s);
    const t = path.tangentAt(s);
    const side = new THREE.Vector3(-t.z, 0, t.x).normalize();
    for (const dir of [-1, 1]) {
      const base = p.clone().addScaledVector(side, dir * 0.78).addScaledVector(t, dir * 0.7);
      const unit = group({ x: base.x, z: base.z, ry: Math.atan2(t.x, t.z) + (dir < 0 ? Math.PI : 0) });
      unit.add(mesh(cyl(0.03, 0.035, 0.75, 10), mat("#f4f1ea"), { y: 0.375 }));
      unit.add(mesh(rbox(0.16, 0.12, 0.1, 0.03), mat(C.ink), { y: 0.62 }));
      const lampA = ownMat("#5a1a14", { emissive: "#ff2a12", emissiveIntensity: 0 });
      const lampB = ownMat("#5a1a14", { emissive: "#ff2a12", emissiveIntensity: 0 });
      unit.add(mesh(sphere(0.035, 10, 8), lampA, { x: -0.05, y: 0.62, z: 0.055, cast: false }));
      unit.add(mesh(sphere(0.035, 10, 8), lampB, { x: 0.05, y: 0.62, z: 0.055, cast: false }));
      unit.add(mesh(rbox(0.22, 0.06, 0.02, 0.01), mat(C.yellow), { y: 0.78, rz: 0.6 }));
      unit.add(mesh(rbox(0.22, 0.06, 0.02, 0.01), mat(C.yellow), { y: 0.78, rz: -0.6 }));
      unit.add(mesh(rbox(0.12, 0.14, 0.12, 0.03), mat(C.ink), { y: 0.25, x: 0.08 }));
      const arm = dynamic(group({ x: 0.1, y: 0.28 }));
      arm.userData.noShadow = true;
      const stripes = group({ x: 0.0 });
      for (let i = 0; i < 6; i += 1) stripes.add(mesh(rbox(0.12, 0.035, 0.035, 0.012), mat(i % 2 ? C.ink : C.yellow, { rough: 0.45 }), { x: 0.06 + i * 0.12 }));
      arm.add(stripes);
      arm.rotation.y = Math.PI / 2;
      unit.add(arm);
      root.add(unit);
      barriers.push({ arm, lamps: [lampA, lampB], s, angle: 1.4 });
    }
  }

  // ---- trains ----
  const shinLen = 1.05;
  const shin: Train = {
    cars: [shinkansenCar("lead", shinLen * 1.15), shinkansenCar("mid", shinLen), shinkansenCar("mid", shinLen), shinkansenCar("tail", shinLen * 1.15)],
    carLen: shinLen,
    gap: 0.06,
    offset: -TRACK_OFFSET,
    s: path.length * 0.62,
    speed: 3.3,
    cruise: 3.3,
    dir: 1,
  };
  const localLen = 0.92;
  const local: Train = {
    cars: [localCar("lead", localLen), localCar("mid", localLen), localCar("tail", localLen)],
    carLen: localLen,
    gap: 0.06,
    offset: TRACK_OFFSET,
    s: stationS + 0.9,
    speed: 0,
    cruise: 1.55,
    dir: -1,
    station: { s: stationS - 1.38, dwell: 3.2, waiting: 0, leaving: 0 },
  };
  // the local train's middle car should stop at the platform centre
  if (local.station) local.station.s = stationS + local.dir * (localLen + local.gap);
  const trains = [shin, local];
  for (const train of trains) for (const car of train.cars) root.add(car);

  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const placeTrain = (train: Train) => {
    const step = train.carLen + train.gap;
    train.cars.forEach((car, i) => {
      const len = i === 0 || i === train.cars.length - 1 ? train.carLen * 1.0 : train.carLen;
      const centre = train.s - train.dir * (i * step + train.carLen / 2);
      path.offsetAt(centre + train.dir * (len / 2 - 0.2), train.offset, RAIL_TOP - 0.02, pa);
      path.offsetAt(centre - train.dir * (len / 2 - 0.2), train.offset, RAIL_TOP - 0.02, pb);
      car.position.copy(pa).add(pb).multiplyScalar(0.5);
      car.lookAt(pa);
    });
  };

  const stepTrain = (train: Train, dt: number) => {
    const st = train.station;
    if (st) {
      const ahead = wrapDelta((st.s - train.s) * train.dir, 0, path.length);
      if (st.waiting > 0) {
        st.waiting -= dt;
        train.speed = 0;
        if (st.waiting <= 0) st.leaving = 1;
      } else if (ahead > 0 && ahead < 2.2 && st.leaving <= 0) {
        train.speed = Math.max(0.12, train.cruise * Math.sqrt(ahead / 2.2));
        if (ahead < 0.03) {
          st.waiting = st.dwell;
          train.speed = 0;
        }
      } else {
        train.speed = Math.min(train.cruise, train.speed + dt * 0.9);
        if (st.leaving > 0 && ahead < -0.5) st.leaving = 0;
        if (st.leaving > 0) st.leaving -= dt * 0.2;
      }
    }
    train.s = (train.s + train.dir * train.speed * dt + path.length) % path.length;
  };

  for (const train of trains) placeTrain(train);

  const update = (t: number, dt: number) => {
    if (!ctx.reducedMotion) {
      for (const train of trains) {
        stepTrain(train, Math.min(dt, 0.05));
        placeTrain(train);
      }
    }
    for (const barrier of barriers) {
      let near = false;
      for (const train of trains) {
        const step = train.carLen + train.gap;
        const length = train.cars.length * step;
        // occupied span along the track, plus a warning distance ahead of the nose
        const fromNose = wrapDelta((train.s - barrier.s) * train.dir, 0, path.length);
        if (fromNose > -3.0 && fromNose < length + 0.6) near = true;
      }
      const target = near ? 0 : 1.45;
      barrier.angle += (target - barrier.angle) * (1 - Math.exp(-dt * 3.5));
      barrier.arm.rotation.z = barrier.angle;
      const blink = near ? (Math.floor(t * 3) % 2) : -1;
      barrier.lamps[0].emissiveIntensity = blink === 0 ? 6 : 0;
      barrier.lamps[1].emissiveIntensity = blink === 1 ? 6 : 0;
    }
  };

  const crossingInfo = crossings.map((s) => {
    const p = path.pointAt(s);
    const own = barriers.filter((b) => b.s === s);
    return { x: p.x, closed: () => own.some((b) => b.angle < 1.2) };
  });

  return {
    root,
    path,
    crossings: crossingInfo,
    leadPosition(target) {
      return target.copy(shin.cars[0].position);
    },
    update,
  };
}

export const _railKit = { capsule, puck };
