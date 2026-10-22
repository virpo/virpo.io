import * as THREE from "three";
import { C, canvasTexture, capsule, contact, cone, dynamic, group, mat, mesh, rbox, sphere, torus } from "./kit";

// Peter as a chibi vinyl figure: big head, swept-up dark hair with faded sides,
// prominent ears, a big open grin, sage hoodie with drawstrings, dark jeans,
// white sneakers. Built seated (the writing room pose) facing +z.

const HEAD_R = 0.3;

/** 0 at the top of the head, 180 at the chin; longitude 0 is the front of the face. */
function hairlineLat(lon: number) {
  const a = Math.abs(lon);
  // forehead hairline, a soft temple notch, sideburns down to the ears, a low nape
  if (a < 34) return 38 + (a / 34) * 6;
  if (a < 62) return 44 + ((a - 34) / 28) * 44;
  if (a < 120) return 88 + Math.sin(((a - 62) / 58) * Math.PI) * 6;
  return 88 + ((a - 120) / 60) * 20;
}

function faceTexture() {
  const W = 1024;
  const H = 512;
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = C.skin;
    ctx.fillRect(0, 0, W, H);
    const cx = W * 0.25; // +z faces u = 0.25 on a three.js sphere
    const deg = W / 360;
    const lat = (degrees: number) => (degrees / 180) * H;

    // the faded sides: very short hair, darkest up top, fading into skin above the ears,
    // stippled so it reads as clipper-short hair rather than paint
    const image = ctx.getImageData(0, 0, W, H);
    const px = image.data;
    const skin = new THREE.Color(C.skin);
    const dark = new THREE.Color("#4a372c");
    const mid = new THREE.Color("#8a7466");
    const c = new THREE.Color();
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let y = 0; y < H; y += 1) {
      const la = (y / H) * 180;
      if (la > 112) break;
      for (let x = 0; x < W; x += 1) {
        let lon = (x / W - 0.25) * 360;
        if (lon > 180) lon -= 360;
        if (lon < -180) lon += 360;
        const edge = hairlineLat(lon);
        if (la > edge + 4) continue;
        const into = THREE.MathUtils.clamp((edge + 4 - la) / 14, 0, 1);
        const front = Math.abs(lon) < 40;
        // a crisp hairline on the forehead, a long soft fade on the sides
        const density = front ? THREE.MathUtils.smoothstep(into, 0.15, 0.45) : THREE.MathUtils.smoothstep(into, 0, 1) * 0.92;
        const tone = THREE.MathUtils.clamp((edge - la) / 30, 0, 1);
        c.copy(mid).lerp(dark, tone);
        const grain = 0.75 + rand() * 0.5;
        const k = THREE.MathUtils.clamp(density * grain, 0, 1);
        const i = (y * W + x) * 4;
        // the canvas is sRGB; the colours above are linear
        const r = skin.r + (c.r - skin.r) * k;
        const g = skin.g + (c.g - skin.g) * k;
        const b = skin.b + (c.b - skin.b) * k;
        px[i] = Math.round(linearToSrgb(r) * 255);
        px[i + 1] = Math.round(linearToSrgb(g) * 255);
        px[i + 2] = Math.round(linearToSrgb(b) * 255);
      }
    }
    ctx.putImageData(image, 0, 0);

    // cheeks
    for (const side of [-1, 1]) {
      const g = ctx.createRadialGradient(cx + side * 40 * deg, lat(103), 0, cx + side * 40 * deg, lat(103), 36);
      g.addColorStop(0, "rgba(232,128,112,0.5)");
      g.addColorStop(1, "rgba(232,128,112,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // brows: thick, dark, raised in excitement
    ctx.strokeStyle = "#33241b";
    ctx.lineCap = "round";
    ctx.lineWidth = 13;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 7 * deg, lat(64.5));
      ctx.quadraticCurveTo(cx + side * 17 * deg, lat(59), cx + side * 28 * deg, lat(66));
      ctx.stroke();
    }

    // eyes: white, a warm brown iris, a pupil and a highlight, lids lifted by the grin
    for (const side of [-1, 1]) {
      const ex = cx + side * 17 * deg;
      const ey = lat(79);
      ctx.fillStyle = "#fbf7f1";
      ctx.beginPath();
      ctx.ellipse(ex, ey, 19, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, ey, 19, 15, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#6b4630";
      ctx.beginPath();
      ctx.arc(ex - side * 2, ey + 1, 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c120d";
      ctx.beginPath();
      ctx.arc(ex - side * 2, ey + 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex - side * 2 + 4.5, ey - 4, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "#3a2a20";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 19, 15, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      // smile crease under the eye
      ctx.strokeStyle = "rgba(160,92,70,0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, ey + 9, 17, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    // the big open grin: wide, upper teeth showing, tongue
    const mx = cx;
    const my = lat(97);
    const mw = 35 * deg;
    const mh = 84;
    ctx.fillStyle = "#5e1d20";
    ctx.beginPath();
    ctx.moveTo(mx - mw, my);
    ctx.quadraticCurveTo(mx, my - 6, mx + mw, my);
    ctx.bezierCurveTo(mx + mw * 0.82, my + mh * 1.05, mx - mw * 0.82, my + mh * 1.05, mx - mw, my);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(mx - mw, my - 8);
    ctx.lineTo(mx + mw, my - 8);
    ctx.lineTo(mx + mw * 0.9, my + 18);
    ctx.quadraticCurveTo(mx, my + 26, mx - mw * 0.9, my + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(170,160,150,0.6)";
    ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(mx + i * 19, my - 4);
      ctx.lineTo(mx + i * 19, my + 18);
      ctx.stroke();
    }
    ctx.fillStyle = "#e0767a";
    ctx.beginPath();
    ctx.ellipse(mx, my + mh * 0.95, mw * 0.52, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#4a1618";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - mw, my);
    ctx.bezierCurveTo(mx - mw * 0.82, my + mh * 1.05, mx + mw * 0.82, my + mh * 1.05, mx + mw, my);
    ctx.stroke();
    // laugh lines
    ctx.strokeStyle = "rgba(170,95,70,0.55)";
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(mx + side * (mw + 4), my + 6, 12, side < 0 ? -0.4 : Math.PI - 0.9, side < 0 ? 0.9 : Math.PI + 0.4);
      ctx.stroke();
    }
  });
}

function linearToSrgb(value: number) {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/** Low-poly hair cap: a swept-up textured top that sits on the painted fade. */
function hairCap(radius: number) {
  const geometry = new THREE.SphereGeometry(radius, 40, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const quiff = new THREE.Vector3(0, 0.78, 0.62).normalize();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    dir.copy(v).normalize();
    const theta = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1)));
    const lon = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z));
    // the longer top stops well above the fade on the sides, right at the hairline in front
    const edge = Math.abs(lon) < 40 ? hairlineLat(lon) : Math.min(hairlineLat(lon) - 30, 58);
    if (theta > edge) {
      // tuck everything below the hairline inside the skull
      v.copy(dir).multiplyScalar(radius * 0.93);
    } else {
      const toEdge = THREE.MathUtils.smoothstep(edge - theta, 0, 18);
      const lift = Math.max(0, dir.dot(quiff));
      const swell = 0.028 + Math.pow(lift, 3) * 0.075;
      const clumps = (Math.sin(lon * 0.21 + theta * 0.13) * 0.5 + Math.sin(lon * 0.47 - theta * 0.31) * 0.5) * 0.014;
      v.copy(dir).multiplyScalar(radius * 0.99 + (swell + clumps) * toEdge);
      // sweep the front up and a touch back
      if (dir.z > 0) v.y += Math.pow(lift, 4) * 0.05 * toEdge;
    }
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Builds a limb as a capsule from a to b (local coordinates). */
function limb(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const dir = b.clone().sub(a);
  const length = dir.length();
  const m = mesh(capsule(radius, Math.max(0.001, length - radius * 0.4)), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

export type PeterRig = {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  /** pose blend targets driven by the world */
  state: { look: number; wave: number; typing: number; read: number; cheer: number; glance: number };
  update(t: number, dt: number, lookTarget?: THREE.Vector3): void;
};

export function buildPeter(options: { pose?: "typing" | "reading" } = {}): PeterRig {
  const hoodie = mat(C.sage, { rough: 0.78 });
  const hoodieDark = mat(C.sageDark, { rough: 0.8 });
  const jeans = mat(C.denim, { rough: 0.72 });
  const skin = mat(C.skin, { rough: 0.55 });
  const skinShade = mat(C.skinShade, { rough: 0.6 });
  const hair = mat(C.hair, { rough: 0.7, flat: true });
  const white = mat(C.white, { rough: 0.5 });
  const sole = mat("#d8d4cc", { rough: 0.6 });
  const string = mat("#f4f0e8", { rough: 0.5 });

  const root = dynamic(group({ name: "peter" }));

  // --- legs (seated) ---
  for (const side of [-1, 1]) {
    const x = side * 0.1;
    root.add(limb(new THREE.Vector3(x, 0.44, 0.0), new THREE.Vector3(x, 0.42, 0.27), 0.09, jeans));
    root.add(limb(new THREE.Vector3(x, 0.42, 0.29), new THREE.Vector3(x, 0.1, 0.31), 0.08, jeans));
    const shoe = group({ x, y: 0.05, z: 0.35 });
    shoe.add(mesh(rbox(0.15, 0.09, 0.25, 0.045), white, { y: 0.01 }));
    shoe.add(mesh(rbox(0.155, 0.03, 0.255, 0.012), sole, { y: -0.035 }));
    shoe.add(mesh(rbox(0.1, 0.02, 0.06, 0.01), mat("#cfcac0"), { y: 0.06, z: 0.03 }));
    root.add(shoe);
  }
  root.add(mesh(rbox(0.36, 0.14, 0.3, 0.07), jeans, { y: 0.47, z: 0.02 }));

  // --- torso ---
  const torso = dynamic(group({ y: 0.5, z: 0.0, name: "torso" }));
  root.add(torso);
  torso.add(mesh(rbox(0.46, 0.42, 0.32, 0.13), hoodie, { y: 0.2 }));
  torso.add(mesh(rbox(0.47, 0.065, 0.33, 0.03), hoodieDark, { y: 0.02 }));
  torso.add(mesh(rbox(0.27, 0.13, 0.05, 0.03), hoodieDark, { y: 0.11, z: 0.155 }));
  // hood around the neck + hood bump behind
  torso.add(mesh(torus(0.15, 0.055, 10, 28), hoodie, { y: 0.41, z: -0.01, rx: Math.PI / 2 - 0.12, s: [1.05, 1, 0.55] }));
  torso.add(mesh(sphere(0.15), hoodie, { y: 0.4, z: -0.13, s: [1.15, 0.8, 0.7] }));
  // drawstrings
  for (const side of [-1, 1]) {
    torso.add(mesh(capsule(0.011, 0.12, 3, 6), string, { x: side * 0.05, y: 0.29, z: 0.163 }));
    torso.add(mesh(sphere(0.02, 8, 6), string, { x: side * 0.05, y: 0.22, z: 0.165 }));
  }

  // --- arms (bent, typing on the laptop) ---
  const makeArm = (side: number) => {
    const arm = dynamic(group({ x: side * 0.25, y: 0.36, z: 0.0 }));
    const elbow = new THREE.Vector3(side * 0.03, -0.17, 0.09);
    const hand = new THREE.Vector3(-side * 0.09, -0.14, 0.36);
    arm.add(mesh(sphere(0.085), hoodie, { s: [1, 0.95, 1] }));
    arm.add(limb(new THREE.Vector3(0, 0, 0), elbow, 0.07, hoodie));
    arm.add(limb(elbow, hand.clone().lerp(elbow, 0.22), 0.066, hoodie));
    arm.add(mesh(capsule(0.06, 0.03), hoodieDark, { x: hand.x * 0.8 + elbow.x * 0.2, y: hand.y * 0.8 + elbow.y * 0.2, z: hand.z * 0.8 + elbow.z * 0.2, rx: Math.PI / 2 - 0.15 }));
    arm.add(mesh(sphere(0.058), skin, { x: hand.x, y: hand.y, z: hand.z + 0.01, s: [1, 0.75, 1.15] }));
    torso.add(arm);
    return arm;
  };
  const armR = makeArm(-1); // Peter's right hand is on our left
  const armL = makeArm(1);

  // --- head ---
  const head = dynamic(group({ y: 0.83, z: 0.02, name: "head" }));
  torso.add(head);
  torso.add(mesh(capsule(0.085, 0.08), skin, { y: 0.49 }));
  const sx = 1.0;
  const sy = 1.05;
  const sz = 0.97;
  const skull = mesh(sphere(HEAD_R, 48, 32), new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.55 }), { s: [sx, sy, sz] });
  head.add(skull);
  // chin / jaw volume, narrower than the cranium
  head.add(mesh(sphere(0.19, 24, 16), skin, { y: -0.13, z: 0.07, s: [1.08, 0.72, 0.98] }));
  head.add(mesh(sphere(0.036, 12, 10), skin, { y: -0.015, z: HEAD_R * 0.97, s: [1.0, 0.85, 0.8] }));
  // prominent ears that stick out
  for (const side of [-1, 1]) {
    const ear = group({ x: side * HEAD_R * 0.98, y: -0.02, z: -0.03, ry: side * 0.62 });
    ear.add(mesh(sphere(0.1, 16, 12), skin, { s: [0.42, 1.12, 0.8] }));
    ear.add(mesh(sphere(0.06, 12, 10), skinShade, { x: side * 0.018, s: [0.3, 0.92, 0.6] }));
    head.add(ear);
  }
  // hair: painted fade on the skull + a low-poly swept-up top + a few spiky tufts
  head.add(mesh(hairCap(HEAD_R), hair, { s: [sx * 1.01, sy, sz * 1.01] }));
  const tufts: [number, number, number, number][] = [
    // longitude (0 = front), theta from the top, height, tilt forward
    [-26, 34, 0.08, 0.5],
    [-8, 32, 0.1, 0.55],
    [10, 33, 0.095, 0.55],
    [27, 35, 0.075, 0.5],
    [-17, 20, 0.08, 0.25],
    [3, 18, 0.09, 0.25],
    [20, 21, 0.075, 0.25],
    [-6, 6, 0.065, 0.0],
  ];
  for (const [lonDeg, thetaDeg, height, forward] of tufts) {
    const lon = THREE.MathUtils.degToRad(lonDeg);
    const th = THREE.MathUtils.degToRad(thetaDeg);
    const dir = new THREE.Vector3(Math.sin(th) * Math.sin(lon), Math.cos(th), Math.sin(th) * Math.cos(lon));
    const base = dir.clone().multiplyScalar(HEAD_R * 1.04).multiply(new THREE.Vector3(sx, sy, sz));
    const point = dir.clone().lerp(new THREE.Vector3(0, 0.55, 1).normalize(), forward).normalize();
    const tuft = mesh(cone(0.065, height, 5), hair, { cast: true });
    tuft.position.copy(base).addScaledVector(point, height * 0.3);
    tuft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), point);
    tuft.rotateY(lonDeg * 0.05);
    head.add(tuft);
  }

  root.add(contact(0.9, 0.9, { y: 0.0, z: 0.15 }, 0.8));

  const state = { look: 0, wave: 0, typing: options.pose === "reading" ? 0 : 1, read: options.pose === "reading" ? 1 : 0, cheer: 0, glance: 0 };
  const lookLocal = new THREE.Vector3();
  let yaw = 0;
  let pitch = 0;
  let waveBlend = 0;
  let lookBlend = 0;

  const update = (t: number, dt: number, lookTarget?: THREE.Vector3) => {
    const k = 1 - Math.exp(-dt * 8);
    waveBlend += (state.wave - waveBlend) * (1 - Math.exp(-dt * 7));
    lookBlend += (Math.max(state.look, state.glance) - lookBlend) * (1 - Math.exp(-dt * 6));
    const wave = waveBlend;
    // typing: alternating hands, tiny head bob
    const typeA = Math.sin(t * 17) * 0.05 * state.typing * (1 - lookBlend * 0.85);
    const typeB = Math.sin(t * 17 + 2.1) * 0.05 * state.typing * (1 - lookBlend * 0.85);
    const breathe = Math.sin(t * 1.6) * 0.008;
    torso.position.y = 0.5 + breathe + state.cheer * Math.abs(Math.sin(t * 9)) * 0.05;
    const typing = state.typing * (1 - lookBlend * 0.85) * (1 - wave);
    torso.rotation.x = 0.06 * typing + 0.12 * state.read - 0.05 * lookBlend;

    // wave with his right arm (our left)
    armR.rotation.x = THREE.MathUtils.lerp(typeA, -0.6, wave);
    armR.rotation.z = THREE.MathUtils.lerp(0, -2.35 + Math.sin(t * 10) * 0.32, wave);
    armR.rotation.y = THREE.MathUtils.lerp(0, -0.4, wave);
    armL.rotation.x = typeB + state.cheer * -0.4;
    armL.rotation.z = state.cheer * 1.2;

    // head: looks down at work, or turns to whoever is hovering
    let targetYaw = Math.sin(t * 0.45) * 0.08;
    let targetPitch = 0.2 * state.typing + 0.32 * state.read + Math.sin(t * 17) * 0.012 * state.typing;
    if (lookTarget && lookBlend > 0.01) {
      head.updateWorldMatrix(true, false);
      lookLocal.copy(lookTarget);
      head.parent!.worldToLocal(lookLocal);
      lookLocal.sub(head.position);
      const lookYaw = Math.atan2(lookLocal.x, lookLocal.z);
      const lookPitch = -Math.atan2(lookLocal.y, Math.hypot(lookLocal.x, lookLocal.z));
      targetYaw = THREE.MathUtils.lerp(targetYaw, THREE.MathUtils.clamp(lookYaw, -0.9, 0.9), lookBlend);
      targetPitch = THREE.MathUtils.lerp(targetPitch, THREE.MathUtils.clamp(lookPitch, -0.4, 0.3), lookBlend);
    }
    yaw += (targetYaw - yaw) * k;
    pitch += (targetPitch - pitch) * k;
    head.rotation.set(pitch, yaw, Math.sin(t * 0.7) * 0.03 + wave * 0.12);
  };

  return { root, head, torso, armL, armR, state, update };
}
