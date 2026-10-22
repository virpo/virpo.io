import * as THREE from "three";
import type { BuildContext } from "./context";
import { C, capsule, card, cone, contact, cyl, dynamic, group, lathe, mat, mesh, ownMat, puck, rbox, sphere } from "./kit";
import { konbiniSign, konbiniWindow, plinthLabel, vendingPanel } from "./textures";
import { pottedPlant } from "./house";

export const PLINTH = { w: 14.6, d: 10.6 };

export function buildScenery(ctx: BuildContext, tokyoLabel: string) {
  const root = group({ name: "scenery" });

  // ---------- plinth (capsule-toy display base) ----------
  const base = mat("#ece3d3", { rough: 0.55 });
  root.add(mesh(rbox(PLINTH.w, 0.62, PLINTH.d, 0.26, 4), base, { y: -0.36 }));
  root.add(mesh(rbox(PLINTH.w + 0.12, 0.14, PLINTH.d + 0.12, 0.07, 3), mat("#2a2b30", { rough: 0.5 }), { y: -0.62 }));
  const label = card(6.2, 0.36, plinthLabel(tokyoLabel), 0.02, "#2a2b30");
  label.position.set(-2.6, -0.33, PLINTH.d / 2 + 0.01);
  root.add(label);
  // grass top
  root.add(mesh(rbox(PLINTH.w - 0.3, 0.1, PLINTH.d - 0.3, 0.08, 3), mat(C.grass, { rough: 0.95 }), { y: -0.04 }));

  // ---------- street ----------
  const asphalt = mat(C.asphalt, { rough: 0.9 });
  const pave = mat(C.sidewalk, { rough: 0.9 });
  root.add(mesh(rbox(PLINTH.w - 0.3, 0.05, 1.1, 0.02), asphalt, { y: 0.02, z: 1.5 }));
  for (let x = -6.4; x < 6.5; x += 0.8) {
    if (Math.abs(x - 0.4) < 0.6) continue;
    root.add(mesh(rbox(0.38, 0.006, 0.05, 0.002), mat("#f3efe6"), { x, y: 0.047, z: 1.5, cast: false }));
  }
  for (let i = 0; i < 6; i += 1) root.add(mesh(rbox(0.12, 0.006, 0.9, 0.002), mat("#f3efe6"), { x: 0.0 + i * 0.2, y: 0.047, z: 1.5, cast: false }));
  root.add(mesh(rbox(PLINTH.w - 0.3, 0.07, 0.62, 0.02), pave, { y: 0.03, z: 0.63 }));
  root.add(mesh(rbox(PLINTH.w - 0.3, 0.07, 0.5, 0.02), pave, { y: 0.03, z: 2.3 }));
  root.add(mesh(rbox(PLINTH.w - 0.3, 0.09, 0.06, 0.02), mat(C.concreteDark), { y: 0.04, z: 0.95 }));
  root.add(mesh(rbox(PLINTH.w - 0.3, 0.09, 0.06, 0.02), mat(C.concreteDark), { y: 0.04, z: 2.05 }));

  // ---------- river under the viaduct ----------
  root.add(mesh(rbox(8.4, 0.05, 1.1, 0.04), mat(C.water, { rough: 0.15, metal: 0.1 }), { x: 1.6, y: -0.0, z: -4.25, cast: false }));
  for (const z of [-4.85, -3.65]) root.add(mesh(rbox(8.5, 0.14, 0.14, 0.05), mat(C.concreteDark), { x: 1.6, y: 0.04, z }));
  // stepping stones
  for (let i = 0; i < 5; i += 1) root.add(mesh(sphere(0.12, 10, 6), mat("#bdb4a6", { rough: 0.9 }), { x: -1.2 + i * 0.32, y: 0.02, z: -4.25 + (i % 2) * 0.12, s: [1, 0.35, 0.9] }));

  // ---------- konbini ----------
  const konbini = group({ x: -4.35, z: -1.05 });
  konbini.add(mesh(rbox(2.3, 1.55, 1.9, 0.06), mat("#f6f4ef", { rough: 0.6 }), { y: 0.8 }));
  konbini.add(mesh(rbox(2.4, 0.08, 2.0, 0.03), mat("#d9d4ca"), { y: 1.6 }));
  const signTex = konbiniSign();
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: new THREE.Color("#ffffff"), emissiveMap: signTex, emissiveIntensity: 0.3, roughness: 0.4 });
  ctx.glow(signMat, 0.25, 1.4);
  konbini.add(mesh(rbox(2.32, 0.28, 0.04, 0.02), signMat, { y: 1.38, z: 0.96 }));
  const winTex = konbiniWindow();
  const winMat = new THREE.MeshStandardMaterial({ map: winTex, emissive: new THREE.Color("#ffffff"), emissiveMap: winTex, emissiveIntensity: 0.4, roughness: 0.15 });
  ctx.glow(winMat, 0.35, 1.6);
  konbini.add(mesh(rbox(1.3, 0.85, 0.03, 0.02), winMat, { x: -0.38, y: 0.6, z: 0.955 }));
  konbini.add(mesh(rbox(0.55, 0.95, 0.03, 0.02), mat("#cfe6ee", { rough: 0.1, emissive: "#fff6dc", emissiveIntensity: 0.6 }), { x: 0.72, y: 0.6, z: 0.955 }));
  konbini.add(mesh(rbox(0.04, 0.95, 0.05, 0.01), mat(C.graphite), { x: 0.72, y: 0.6, z: 0.97 }));
  konbini.add(mesh(rbox(0.5, 0.18, 0.3, 0.04), mat("#cfcac0"), { x: 0.5, y: 1.72, z: -0.3 }));
  konbini.add(mesh(rbox(0.36, 0.3, 0.3, 0.04), mat("#b8b2a6"), { x: -0.5, y: 1.78, z: -0.4 }));
  konbini.add(contact(2.8, 2.4, {}, 0.8));
  // little bike + crates out front
  konbini.add(mesh(rbox(0.4, 0.22, 0.3, 0.03), mat(C.blue), { x: -0.95, y: 0.11, z: 1.25 }));
  konbini.add(mesh(rbox(0.4, 0.22, 0.3, 0.03), mat(C.yellow), { x: -0.95, y: 0.33, z: 1.25 }));
  root.add(konbini);
  const storeLight = new THREE.PointLight("#fff2d6", 0, 3.5, 1.5);
  storeLight.position.set(-4.35, 0.9, 0.3);
  ctx.lamp(storeLight, 0, 3.2);
  root.add(storeLight);

  // ---------- vending machine (Japan sounds) ----------
  const vend = group({ x: 3.55, y: 0.065, z: 0.55, ry: -0.1 });
  vend.add(mesh(rbox(0.66, 1.2, 0.48, 0.07), mat(C.red, { rough: 0.35, clearcoat: 0.5 }), { y: 0.6 }));
  const panelTex = vendingPanel();
  const panel = new THREE.MeshStandardMaterial({ map: panelTex, emissive: new THREE.Color("#ffffff"), emissiveMap: panelTex, emissiveIntensity: 0.55, roughness: 0.1 });
  ctx.glow(panel, 0.5, 1.8);
  vend.add(mesh(rbox(0.52, 0.66, 0.03, 0.03), panel, { y: 0.8, z: 0.235 }));
  vend.add(mesh(rbox(0.56, 0.06, 0.04, 0.02), mat(C.white), { y: 0.42, z: 0.24 }));
  vend.add(mesh(rbox(0.4, 0.12, 0.05, 0.03), mat(C.ink), { y: 0.18, z: 0.235 }));
  vend.add(mesh(rbox(0.06, 0.12, 0.03, 0.01), mat("#d4d7dc", { metal: 0.6, rough: 0.3 }), { x: 0.2, y: 0.36, z: 0.25 }));
  vend.add(contact(0.9, 0.8, {}, 0.9));
  root.add(vend);
  ctx.spot("vending", vend, { lift: 0.16 });
  const vendLight = new THREE.PointLight("#e8f3ff", 0, 2.4, 1.6);
  vendLight.position.set(3.55, 0.8, 1.0);
  ctx.lamp(vendLight, 0, 2.2);
  root.add(vendLight);
  // recycle bins next to it
  root.add(mesh(rbox(0.2, 0.36, 0.2, 0.05), mat(C.blue, { rough: 0.4 }), { x: 4.05, y: 0.25, z: 0.6 }));
  root.add(mesh(rbox(0.2, 0.36, 0.2, 0.05), mat(C.yellow, { rough: 0.4 }), { x: 4.3, y: 0.25, z: 0.6 }));

  // ---------- cat ----------
  const cat = dynamic(group({ x: -2.7, y: 0.065, z: 0.72, ry: 0.5 }));
  const fur = mat("#e7a35c", { rough: 0.85 });
  const furLight = mat("#fbf1e2", { rough: 0.85 });
  cat.add(mesh(sphere(0.13, 16, 12), fur, { y: 0.12, s: [0.9, 1.0, 1.2] }));
  cat.add(mesh(sphere(0.08, 12, 10), furLight, { y: 0.11, z: 0.1, s: [0.9, 1, 0.6] }));
  const catHead = dynamic(group({ y: 0.28, z: 0.06 }));
  catHead.add(mesh(sphere(0.1, 16, 12), fur, { s: [1.1, 0.95, 1] }));
  catHead.add(mesh(cone(0.04, 0.08, 4), fur, { x: -0.06, y: 0.09, rz: 0.3 }));
  catHead.add(mesh(cone(0.04, 0.08, 4), fur, { x: 0.06, y: 0.09, rz: -0.3 }));
  catHead.add(mesh(sphere(0.045, 10, 8), furLight, { y: -0.03, z: 0.07, s: [1.2, 0.8, 0.8] }));
  const eyeMat = mat("#2a2a2a", { rough: 0.3 });
  const eyes = [mesh(sphere(0.014, 8, 6), eyeMat, { x: -0.035, y: 0.015, z: 0.088 }), mesh(sphere(0.014, 8, 6), eyeMat, { x: 0.035, y: 0.015, z: 0.088 })];
  for (const eye of eyes) eye.userData.keep = true;
  catHead.add(...eyes);
  cat.add(catHead);
  const tail = dynamic(group({ y: 0.06, z: -0.13 }));
  tail.add(mesh(capsule(0.025, 0.2, 3, 8), fur, { y: 0.1, z: -0.02, rx: -0.4 }));
  cat.add(tail);
  cat.add(contact(0.45, 0.45, {}, 0.8));
  cat.userData.noShadow = true;
  root.add(cat);
  ctx.animate((t) => {
    if (ctx.reducedMotion) return;
    tail.rotation.z = Math.sin(t * 2.2) * 0.5;
    catHead.rotation.y = Math.sin(t * 0.3) * 0.5;
    const blink = t % 4.2 < 0.12 ? 0.15 : 1;
    eyes.forEach((e) => e.scale.set(1, blink, 1));
  });

  // ---------- street lamps ----------
  const lampPositions: [number, number][] = [
    [1.65, 2.35],
    [-3.0, 2.35],
    [5.4, 0.62],
  ];
  const lampBulb = ownMat("#fff3d6", { emissive: "#ffd08a", emissiveIntensity: 1 });
  ctx.glow(lampBulb, 0.0, 6);
  for (const [lx, lz] of lampPositions) {
    const lamp = group({ x: lx, z: lz });
    lamp.add(mesh(cyl(0.035, 0.045, 1.7, 10), mat(C.graphite), { y: 0.85 }));
    lamp.add(mesh(capsule(0.03, 0.3, 3, 8), mat(C.graphite), { y: 1.7, z: -0.15, rx: Math.PI / 2 }));
    lamp.add(mesh(rbox(0.16, 0.06, 0.24, 0.03), mat(C.graphite), { y: 1.68, z: -0.32 }));
    lamp.add(mesh(rbox(0.12, 0.02, 0.2, 0.01), lampBulb, { y: 1.645, z: -0.32, cast: false }));
    lamp.add(contact(0.35, 0.35, {}, 0.7));
    root.add(lamp);
    const light = new THREE.PointLight("#ffcf8a", 0, 3.2, 1.6);
    light.position.set(lx, 1.5, lz - 0.32);
    ctx.lamp(light, 0, 3.6);
    root.add(light);
  }

  // utility pole with a transformer (very Japan)
  const pole = group({ x: 5.0, z: 2.4 });
  pole.add(mesh(cyl(0.06, 0.08, 3.4, 12), mat(C.concrete), { y: 1.7 }));
  pole.add(mesh(rbox(0.7, 0.05, 0.05, 0.02), mat(C.graphite), { y: 3.1 }));
  pole.add(mesh(rbox(0.5, 0.05, 0.05, 0.02), mat(C.graphite), { y: 2.85 }));
  pole.add(mesh(cyl(0.11, 0.11, 0.3, 14), mat("#8c9299"), { y: 2.5, x: 0.16 }));
  pole.add(mesh(rbox(0.06, 0.5, 0.02, 0.01), mat(C.yellow), { y: 1.0, z: 0.07 }));
  root.add(pole);

  // ---------- trees, bushes, flowers ----------
  const tree = (x: number, z: number, s: number, color: string, colorB: string) => {
    const g = group({ x, z, s });
    g.add(mesh(cyl(0.07, 0.1, 1.0, 10), mat(C.woodDark), { y: 0.5 }));
    g.add(mesh(cyl(0.035, 0.04, 0.4, 6), mat(C.woodDark), { x: 0.12, y: 0.8, rz: -0.6 }));
    g.add(mesh(sphere(0.55, 18, 14), mat(color, { rough: 0.8 }), { y: 1.3 }));
    g.add(mesh(sphere(0.4, 16, 12), mat(colorB, { rough: 0.8 }), { x: 0.42, y: 1.05, z: 0.1 }));
    g.add(mesh(sphere(0.36, 16, 12), mat(color, { rough: 0.8 }), { x: -0.38, y: 1.1, z: 0.18 }));
    g.add(mesh(sphere(0.3, 14, 10), mat(colorB, { rough: 0.8 }), { x: 0.05, y: 1.72, z: -0.15 }));
    g.add(contact(1.6, 1.6, {}, 0.6));
    root.add(g);
    return g;
  };
  tree(-5.4, -2.6, 1.1, C.sakura, C.sakuraDeep);
  tree(-4.7, 3.25, 0.8, C.sakura, C.sakuraDeep);
  tree(4.5, -1.25, 0.85, C.leaf, "#5d9550");
  tree(5.4, 3.35, 0.8, C.leaf, "#83b56a");
  tree(-3.9, -3.3, 0.9, "#7fb062", C.leaf);
  tree(-0.6, 3.35, 0.6, "#7fb062", C.leaf);
  const bush = mat("#6f9e57", { rough: 0.9 });
  for (let i = 0; i < 11; i += 1) {
    const x = -6.2 + i * 1.22;
    if (Math.abs(x + 2.4) < 1.4) continue;
    root.add(mesh(sphere(0.26, 12, 10), bush, { x, y: 0.12, z: 2.85 + (i % 2) * 0.08, s: [1.4, 0.8, 0.9] }));
  }
  const flowerColors = [C.yellow, C.coral, "#ffffff", C.hydrangea];
  for (let i = 0; i < 26; i += 1) {
    const x = 0.6 + (i % 13) * 0.33;
    const z = 3.25 + Math.floor(i / 13) * 0.28 + ((i * 37) % 10) * 0.01;
    root.add(mesh(cyl(0.006, 0.006, 0.16, 4), mat(C.moss), { x, y: 0.08, z, cast: false }));
    root.add(mesh(sphere(0.045, 8, 6), mat(flowerColors[i % 4], { rough: 0.7 }), { x, y: 0.17, z }));
  }
  root.add(pottedPlant(-1.9, 0.065, 0.62, 0.8));
  root.add(pottedPlant(2.9, 0.065, 0.55, 0.7));

  // ---------- a toy Mount Fuji on the back corner (forced perspective) ----------
  const fuji = group({ x: 4.55, y: 0.0, z: -3.2, s: [0.22, 0.36, 0.22], ry: 0.4 });
  fuji.add(mesh(lathe("fuji", [[0, 0], [7.2, 0], [5.5, 0.9], [3.3, 2.6], [1.5, 4.6], [0.9, 5.2], [0, 5.25]], 40), mat("#8fa3cc", { rough: 0.7 })));
  fuji.add(mesh(lathe("fujisnow", [[0, 3.6], [2.3, 3.6], [1.98, 3.85], [1.47, 4.62], [0.92, 5.22], [0, 5.29]], 40), mat("#f7f8fb", { rough: 0.6 })));
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    fuji.add(mesh(sphere(0.5, 10, 8), mat("#f7f8fb", { rough: 0.6 }), { x: Math.cos(a) * 2.25, y: 3.45 - (i % 3) * 0.25, z: Math.sin(a) * 2.25, s: [0.9, 1.4, 0.9] }));
  }
  root.add(fuji);
  root.add(contact(3.6, 3.6, { x: 4.55, z: -3.2 }, 0.7));

  const clouds: THREE.Group[] = [];
  const cloudMat = mat("#ffffff", { rough: 0.95 });
  const cloudSeeds: [number, number, number, number][] = [
    [-6.5, 4.9, -6.2, 0.95],
    [-1.0, 5.6, -7.4, 1.15],
    [4.6, 4.7, -6.0, 0.85],
    [9.5, 5.3, -7.0, 1.05],
    [-11, 5.8, -7.8, 1.2],
  ];
  for (const [x, y, z, s] of cloudSeeds) {
    const c = dynamic(group({ x, y, z, s }));
    c.add(mesh(sphere(0.6, 16, 12), cloudMat, { cast: false, receive: false }));
    c.add(mesh(sphere(0.45, 14, 10), cloudMat, { x: 0.65, y: -0.12, cast: false, receive: false }));
    c.add(mesh(sphere(0.42, 14, 10), cloudMat, { x: -0.62, y: -0.15, cast: false, receive: false }));
    c.add(mesh(sphere(0.35, 12, 10), cloudMat, { x: 0.25, y: 0.35, cast: false, receive: false }));
    c.add(mesh(capsule(0.3, 1.4, 4, 12), cloudMat, { y: -0.3, rz: Math.PI / 2, cast: false, receive: false }));
    c.userData.baseY = y;
    clouds.push(c);
    root.add(c);
  }

  // distant town lights — become bokeh discs at dusk
  // (one instanced draw for all of them)
  const townColors = ["#ffcf8a", "#ffe2b0", "#ffb26b", "#fff1d6", "#ffd9a0"];
  const townMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, toneMapped: true });
  const TOWN = 46;
  const town = new THREE.InstancedMesh(sphere(0.07, 8, 6), townMat, TOWN);
  town.castShadow = false;
  town.receiveShadow = false;
  const townDummy = new THREE.Object3D();
  for (let i = 0; i < TOWN; i += 1) {
    townDummy.position.set(-14 + ((i * 7.3) % 28), -0.9 + ((i * 3.1) % 2.6), -10.5 - ((i * 5.7) % 4));
    townDummy.scale.setScalar(0.8 + ((i * 13) % 7) * 0.08);
    townDummy.updateMatrix();
    town.setMatrixAt(i, townDummy.matrix);
    town.setColorAt(i, new THREE.Color(townColors[i % 5]).multiplyScalar(3));
  }
  town.visible = false;
  root.add(town);
  // petals drifting from the sakura trees
  const petalCount = ctx.mobile ? 18 : 36;
  const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 6), mat(C.sakura, { rough: 0.8, side: THREE.DoubleSide }), petalCount);
  petals.castShadow = false;
  const seeds = Array.from({ length: petalCount }, (_, i) => ({
    x: (i % 2 ? -5.4 : -4.7) + Math.sin(i * 12.9) * 0.8,
    z: (i % 2 ? -2.6 : 3.25) + Math.cos(i * 7.7) * 0.8,
    phase: (i * 0.137) % 1,
    speed: 0.08 + ((i * 31) % 10) * 0.008,
  }));
  const dummy = new THREE.Object3D();
  root.add(dynamic(petals));

  ctx.animate((t, dt, light) => {
    for (const c of clouds) {
      if (!ctx.reducedMotion) {
        c.position.x += dt * 0.12;
        if (c.position.x > 13) c.position.x = -13;
        c.position.y = (c.userData.baseY as number) + Math.sin(t * 0.4 + c.position.z) * 0.1;
      }
    }
    const lit = THREE.MathUtils.smoothstep(light.night + light.dusk * 0.6, 0.15, 0.7);
    townMat.opacity = lit * (0.85 + 0.15 * Math.sin(t * 0.7));
    town.visible = lit > 0.01;
    for (let i = 0; i < petalCount; i += 1) {
      const sd = seeds[i];
      const p = ctx.reducedMotion ? sd.phase : (sd.phase + t * sd.speed) % 1;
      dummy.position.set(sd.x + Math.sin(p * 9 + i) * 0.35 + p * 0.8, 1.7 - p * 1.7, sd.z + Math.cos(p * 7 + i) * 0.25);
      dummy.rotation.set(p * 9 + i, p * 6, 0);
      const fade = Math.min(1, (1 - p) * 6);
      dummy.scale.setScalar(Math.max(0.001, fade));
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
  });

  return { root, plinthLabelCard: label };
}

export const _sceneryKit = { puck };
