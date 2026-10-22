import * as THREE from "three";
import { C, canvasTexture, capsule, contact, cone, dynamic, group, mat, mesh, rbox, sphere, torus } from "./kit";

// Peter as a chibi vinyl figure: big head, swept-up dark hair with faded sides,
// prominent ears, a big open grin, sage hoodie with drawstrings, dark jeans,
// white sneakers. Built seated (the writing room pose) facing +z.

const HEAD_R = 0.3;

function faceTexture() {
  const W = 1024;
  const H = 512;
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = C.skin;
    ctx.fillRect(0, 0, W, H);
    const cx = W * 0.25; // +z faces u = 0.25 on a three.js sphere
    const deg = W / 360;
    const lat = (degrees: number) => (degrees / 180) * H;

    // cheeks
    for (const side of [-1, 1]) {
      const g = ctx.createRadialGradient(cx + side * 40 * deg, lat(100), 0, cx + side * 40 * deg, lat(100), 34);
      g.addColorStop(0, "rgba(232,128,112,0.5)");
      g.addColorStop(1, "rgba(232,128,112,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // brows: thick, raised, a little arched
    ctx.strokeStyle = "#3a2a20";
    ctx.lineCap = "round";
    ctx.lineWidth = 11;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 8 * deg, lat(70));
      ctx.quadraticCurveTo(cx + side * 18 * deg, lat(64.5), cx + side * 28 * deg, lat(69));
      ctx.stroke();
    }

    // eyes: dark, slightly squinted by the grin, with a highlight
    for (const side of [-1, 1]) {
      const ex = cx + side * 17 * deg;
      const ey = lat(80);
      ctx.fillStyle = "#2a1d17";
      ctx.beginPath();
      ctx.ellipse(ex, ey, 13, 15.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b4a36";
      ctx.beginPath();
      ctx.ellipse(ex, ey + 2, 8, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c120d";
      ctx.beginPath();
      ctx.ellipse(ex, ey + 2, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex + 4.5, ey - 5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      // lower lid smile crease
      ctx.strokeStyle = "rgba(160,92,70,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ex, ey + 6, 13, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    // big open grin
    const mx = cx;
    const my = lat(98);
    const mw = 33 * deg;
    const mh = 70;
    ctx.fillStyle = "#6a2324";
    ctx.beginPath();
    ctx.moveTo(mx - mw, my);
    ctx.quadraticCurveTo(mx, my + 8, mx + mw, my);
    ctx.bezierCurveTo(mx + mw * 0.85, my + mh * 1.05, mx - mw * 0.85, my + mh * 1.05, mx - mw, my);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(mx - mw, my - 4, mw * 2, 20);
    ctx.strokeStyle = "rgba(180,170,160,0.7)";
    ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(mx + i * 18, my + 2);
      ctx.lineTo(mx + i * 18, my + 15);
      ctx.stroke();
    }
    ctx.fillStyle = "#e0767a";
    ctx.beginPath();
    ctx.ellipse(mx, my + mh * 0.92, mw * 0.5, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#5a1d1e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - mw, my);
    ctx.quadraticCurveTo(mx, my + 8, mx + mw, my);
    ctx.stroke();
    // dimples
    ctx.strokeStyle = "rgba(170,95,70,0.55)";
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(mx + side * (mw + 6), my + 4, 8, side < 0 ? -0.2 : Math.PI - 0.8, side < 0 ? 0.8 : Math.PI + 0.2);
      ctx.stroke();
    }
  });
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
  state: { look: number; wave: number; typing: number; read: number; cheer: number };
  update(t: number, dt: number, lookTarget?: THREE.Vector3): void;
};

export function buildPeter(options: { pose?: "typing" | "reading" } = {}): PeterRig {
  const hoodie = mat(C.sage, { rough: 0.78 });
  const hoodieDark = mat(C.sageDark, { rough: 0.8 });
  const jeans = mat(C.denim, { rough: 0.72 });
  const skin = mat(C.skin, { rough: 0.55 });
  const skinShade = mat(C.skinShade, { rough: 0.6 });
  const hair = mat(C.hair, { rough: 0.7, flat: true });
  const hairFade = mat(C.hairFade, { rough: 0.85 });
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
  const torso = group({ y: 0.5, z: 0.0, name: "torso" });
  root.add(torso);
  torso.add(mesh(rbox(0.46, 0.42, 0.32, 0.13), hoodie, { y: 0.2 }));
  torso.add(mesh(rbox(0.47, 0.065, 0.33, 0.03), hoodieDark, { y: 0.02 }));
  torso.add(mesh(rbox(0.27, 0.13, 0.05, 0.03), hoodieDark, { y: 0.11, z: 0.155 }));
  // hood around the neck + hood bump behind
  torso.add(mesh(torus(0.14, 0.06, 10, 24), hoodie, { y: 0.41, z: -0.02, rx: Math.PI / 2 }));
  torso.add(mesh(sphere(0.15), hoodie, { y: 0.4, z: -0.13, s: [1.15, 0.8, 0.7] }));
  // drawstrings
  for (const side of [-1, 1]) {
    torso.add(mesh(capsule(0.011, 0.12, 3, 6), string, { x: side * 0.05, y: 0.29, z: 0.163 }));
    torso.add(mesh(sphere(0.02, 8, 6), string, { x: side * 0.05, y: 0.22, z: 0.165 }));
  }
  torso.add(mesh(capsule(0.06, 0.05), skin, { y: 0.44 }));

  // --- arms (bent, typing on the laptop) ---
  const makeArm = (side: number) => {
    const arm = group({ x: side * 0.25, y: 0.36, z: 0.0 });
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
  const head = group({ y: 0.95, z: 0.02, name: "head" });
  torso.add(head);
  const skull = mesh(sphere(HEAD_R, 48, 32), new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.55 }), {
    s: [1.02, 0.97, 0.95],
  });
  head.add(skull);
  // chin / jaw volume to make it less of a ball
  head.add(mesh(sphere(0.2, 24, 16), skin, { y: -0.12, z: 0.06, s: [1.15, 0.7, 1] }));
  head.add(mesh(sphere(0.036, 12, 10), skin, { y: -0.015, z: HEAD_R * 0.95, s: [1.0, 0.85, 0.8] }));
  for (const side of [-1, 1]) {
    const ear = group({ x: side * HEAD_R * 0.97, y: -0.01, z: -0.02, ry: side * 0.45 });
    ear.add(mesh(sphere(0.09, 16, 12), skin, { s: [0.42, 1.08, 0.78] }));
    ear.add(mesh(sphere(0.055, 12, 10), skinShade, { x: side * 0.016, s: [0.3, 0.9, 0.6] }));
    head.add(ear);
  }
  // hair: faded sides + darker cap + swept-up spiky top
  const sx = 1.02;
  const fade = new THREE.SphereGeometry(HEAD_R * 1.018, 40, 16, Math.PI / 2 + 0.82, Math.PI * 2 - 1.64, 0.24 * Math.PI, 0.25 * Math.PI);
  head.add(mesh(fade, hairFade, { s: [sx, 0.97, 0.95] }));
  const cap = new THREE.SphereGeometry(HEAD_R * 1.04, 40, 14, 0, Math.PI * 2, 0, 0.3 * Math.PI);
  head.add(mesh(cap, hair, { s: [sx, 0.97, 0.97] }));
  // volume on top, then a few chunky tufts swept up and back from the hairline
  head.add(mesh(sphere(HEAD_R * 0.86, 28, 16), hair, { y: HEAD_R * 0.6, z: -0.04, rx: -0.3, s: [1.08, 0.5, 1.04] }));
  const tufts: [number, number, number, number, number][] = [
    // theta, phi offset, height, tilt back, twist
    [30, -38, 0.13, 0.55, -0.2],
    [31, -14, 0.17, 0.6, 0.1],
    [31, 12, 0.18, 0.62, -0.1],
    [30, 36, 0.14, 0.55, 0.25],
    [20, -26, 0.15, 0.72, 0.15],
    [19, 2, 0.17, 0.75, -0.15],
    [20, 28, 0.15, 0.7, 0.1],
    [9, -12, 0.12, 0.85, 0.3],
    [9, 16, 0.12, 0.85, -0.3],
  ];
  for (const [theta, phiOff, height, tiltBack, twist] of tufts) {
    const th = THREE.MathUtils.degToRad(theta);
    const ph = Math.PI / 2 + THREE.MathUtils.degToRad(phiOff);
    const r = HEAD_R * 1.02;
    const pos = new THREE.Vector3(-Math.cos(ph) * Math.sin(th) * r * sx, Math.cos(th) * r * 0.97 + 0.03, Math.sin(ph) * Math.sin(th) * r * 0.97);
    const normal = pos.clone().normalize();
    const dir = normal
      .clone()
      .lerp(new THREE.Vector3(Math.sin(twist) * 0.4, 0.75, -1).normalize(), tiltBack * 0.6)
      .normalize();
    const tuft = mesh(cone(0.085, height, 5), hair, { cast: true });
    tuft.position.copy(pos).addScaledVector(dir, height * 0.25);
    tuft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    tuft.rotateY(twist * 3);
    head.add(tuft);
  }

  root.add(contact(0.9, 0.9, { y: 0.0, z: 0.15 }, 0.8));

  const state = { look: 0, wave: 0, typing: options.pose === "reading" ? 0 : 1, read: options.pose === "reading" ? 1 : 0, cheer: 0 };
  const lookLocal = new THREE.Vector3();
  let yaw = 0;
  let pitch = 0;
  let waveBlend = 0;
  let lookBlend = 0;

  const update = (t: number, dt: number, lookTarget?: THREE.Vector3) => {
    const k = 1 - Math.exp(-dt * 8);
    waveBlend += (state.wave - waveBlend) * (1 - Math.exp(-dt * 7));
    lookBlend += (state.look - lookBlend) * (1 - Math.exp(-dt * 6));
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
