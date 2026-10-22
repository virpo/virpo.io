import * as THREE from "three";
import type { BuildContext } from "./context";
import {
  C,
  canvasTexture,
  capsule,
  card,
  cone,
  contact,
  cyl,
  dynamic,
  group,
  lathe,
  mat,
  mesh,
  ownMat,
  puck,
  rbox,
  sphere,
  torus,
} from "./kit";
import { buildPeter, type PeterRig } from "./peter";
import {
  arcadeMarquee,
  arcadeScreen,
  bookSpines,
  buildWeekBanner,
  corkTexture,
  deckKeys,
  kanaPoster,
  laptopScreen,
  notebookCover,
  pegboardTexture,
  tvScreen,
} from "./textures";

// Cutaway two-storey house. Back wall at z = -3.3, left wall at x = -2.3;
// the front (+z) and right (+x) sides are open so the camera sees inside.
export const HOUSE = {
  x0: -2.3,
  x1: 2.7,
  z0: -3.3,
  z1: 0.3,
  /** front edge of the writing-room loft */
  zl: -1.15,
  F0: 0.25,
  slab: 2.0,
  F1: 2.18,
  top: 3.9,
  wall: 0.16,
};

export const NOTEBOOK_COLORS = [C.orange, C.yellow, C.blue];

export function buildHouse(ctx: BuildContext): { root: THREE.Group; peter: PeterRig } {
  const { x0, x1, z0, z1, zl, F0, slab, F1, top, wall } = HOUSE;
  const W = x1 - x0;
  const D = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const root = group({ name: "house" });

  const plaster = mat(C.plaster, { rough: 0.85 });
  const plasterIn = mat("#f6ebd6", { rough: 0.88 });
  const timber = mat(C.woodDark, { rough: 0.7 });
  const floorMat = mat(C.floor, { rough: 0.6 });
  const stone = mat(C.concreteDark, { rough: 0.9 });

  // ---------- structure ----------
  root.add(mesh(rbox(W + 0.3, F0, D + 0.3, 0.06), stone, { x: cx, y: F0 / 2, z: cz }));
  root.add(mesh(rbox(W, 0.06, D, 0.02), floorMat, { x: cx, y: F0 + 0.0, z: cz }));
  // floor plank lines (ground + upper)
  const LD = zl - z0;
  const lz = (z0 + zl) / 2;
  for (let i = 1; i < 9; i += 1) {
    root.add(mesh(rbox(0.012, 0.006, D - 0.1, 0.002), mat("#c4935b"), { x: x0 + (W / 9) * i, y: F0 + 0.032, z: cz, cast: false }));
    root.add(mesh(rbox(0.012, 0.006, LD - 0.1, 0.002), mat("#c4935b"), { x: x0 + (W / 9) * i, y: F1 + 0.002, z: lz, cast: false }));
  }
  // the loft: writing room over the back half, double-height workshop in front
  root.add(mesh(rbox(W, F1 - slab, LD, 0.03), mat(C.woodLight, { rough: 0.65 }), { x: cx, y: (slab + F1) / 2, z: lz }));
  root.add(mesh(rbox(W + 0.04, 0.12, 0.12, 0.025), timber, { x: cx, y: slab + 0.02, z: zl }));
  root.add(mesh(rbox(0.1, 0.1, LD + 0.04, 0.02), timber, { x: x1 - 0.02, y: slab + 0.04, z: lz }));
  root.add(mesh(rbox(0.12, slab - F0, 0.12, 0.025), timber, { x: x1 - 0.06, y: (F0 + slab) / 2, z: zl }));
  // loft railing
  const rail = mat(C.woodDark, { rough: 0.6 });
  for (let x = x0 + 0.35; x < x1 - 0.1; x += 0.42) {
    if (Math.abs(x - 1.25) < 0.3) continue;
    root.add(mesh(rbox(0.04, 0.42, 0.04, 0.012), rail, { x, y: F1 + 0.21, z: zl + 0.04 }));
  }
  root.add(mesh(rbox(1.0 - x0 + 0.05, 0.05, 0.07, 0.02), rail, { x: (x0 + 1.0) / 2 + 0.02, y: F1 + 0.44, z: zl + 0.04 }));
  root.add(mesh(rbox(x1 - 1.5, 0.05, 0.07, 0.02), rail, { x: (1.5 + x1) / 2, y: F1 + 0.44, z: zl + 0.04 }));
  // ladder up to the loft
  const ladder = group({ x: 1.25, y: (F0 + F1) / 2 + 0.12, z: zl + 0.36, rx: -0.33 });
  const ladderH = (F1 - F0) / Math.cos(0.33) + 0.3;
  for (const lx of [-0.18, 0.18]) ladder.add(mesh(rbox(0.05, ladderH, 0.06, 0.015), mat(C.woodLight), { x: lx }));
  for (let i = 0; i < 7; i += 1) ladder.add(mesh(cyl(0.018, 0.018, 0.36, 8), mat(C.wood), { y: -ladderH / 2 + 0.25 + i * ((ladderH - 0.4) / 6), rz: Math.PI / 2 }));
  root.add(ladder);
  // tie beam across the double-height workshop
  root.add(mesh(rbox(W, 0.12, 0.12, 0.025), timber, { x: cx, y: top - 0.32, z: -0.45 }));

  // back wall: ground floor solid, upper with a window opening
  const backZ = z0 + wall / 2;
  const winX0 = 0.78;
  const winX1 = 2.08;
  const winY0 = F1 + 0.6;
  const winY1 = F1 + 1.42;
  root.add(mesh(rbox(W, F1 - F0 + 0.0, wall, 0.03), plaster, { x: cx, y: F0 + (F1 - F0) / 2, z: backZ }));
  const upperH = top - F1;
  root.add(mesh(rbox(winX0 - x0, upperH, wall, 0.03), plaster, { x: (x0 + winX0) / 2, y: F1 + upperH / 2, z: backZ }));
  root.add(mesh(rbox(x1 - winX1, upperH, wall, 0.03), plaster, { x: (x1 + winX1) / 2, y: F1 + upperH / 2, z: backZ }));
  root.add(mesh(rbox(winX1 - winX0, winY0 - F1, wall, 0.02), plaster, { x: (winX0 + winX1) / 2, y: (F1 + winY0) / 2, z: backZ }));
  root.add(mesh(rbox(winX1 - winX0, top - winY1, wall, 0.02), plaster, { x: (winX0 + winX1) / 2, y: (winY1 + top) / 2, z: backZ }));
  // inner face tint so interior reads warmer than exterior
  root.add(mesh(rbox(W - 0.02, F1 - F0 - 0.06, 0.01, 0.004), plasterIn, { x: cx, y: (F0 + F1) / 2, z: z0 + wall + 0.006, cast: false }));

  // left wall (with a gable)
  const leftX = x0 + wall / 2;
  root.add(mesh(rbox(wall, top - F0, D, 0.03), plaster, { x: leftX, y: F0 + (top - F0) / 2, z: cz }));
  root.add(mesh(rbox(0.01, F1 - F0 - 0.06, D - 0.02, 0.004), plasterIn, { x: x0 + wall + 0.006, y: (F0 + F1) / 2, z: cz, cast: false }));
  root.add(mesh(rbox(0.01, top - F1 - 0.04, D - 0.02, 0.004), plasterIn, { x: x0 + wall + 0.006, y: (F1 + top) / 2, z: cz, cast: false }));
  // timber frame posts and beams (Japanese machiya feel)
  const post = (x: number, z: number, y0: number, y1: number) =>
    root.add(mesh(rbox(0.13, y1 - y0, 0.13, 0.025), timber, { x, y: (y0 + y1) / 2, z }));
  post(x0 + 0.02, z1 - 0.04, F0, top);
  post(x1 - 0.04, z0 + 0.02, F0, top);
  post(x0 + 0.02, z0 + 0.02, F0, top);
  root.add(mesh(rbox(0.14, 0.12, D + 0.06, 0.025), timber, { x: x0 + 0.02, y: top, z: cz }));
  root.add(mesh(rbox(W + 0.06, 0.12, 0.14, 0.025), timber, { x: cx, y: top, z: z0 + 0.02 }));
  root.add(mesh(rbox(0.14, 0.1, D, 0.02), timber, { x: x0 + 0.02, y: slab + 0.06, z: cz }));

  // roof: back slope + gable on the left, front slope cut away
  const ridgeZ = cz;
  const ridgeY = top + 1.25;
  const eaveZ = z0 - 0.5;
  const eaveY = top - 0.15;
  const slopeLen = Math.hypot(ridgeZ - eaveZ, ridgeY - eaveY);
  const slopeAng = Math.atan2(ridgeY - eaveY, ridgeZ - eaveZ);
  const roofMat = mat(C.roof, { rough: 0.55 });
  const roof = group({ x: cx, y: (ridgeY + eaveY) / 2, z: (ridgeZ + eaveZ) / 2, rx: -slopeAng });
  roof.add(mesh(rbox(W + 0.7, 0.14, slopeLen + 0.1, 0.05), roofMat));
  for (let i = 0; i < 9; i += 1) {
    roof.add(mesh(capsule(0.05, W + 0.5, 3, 8), mat(C.roofEdge, { rough: 0.5 }), { y: 0.09, z: -slopeLen / 2 + 0.15 + (i * (slopeLen - 0.2)) / 8, rz: Math.PI / 2 }));
  }
  root.add(roof);
  root.add(mesh(capsule(0.1, W + 0.6, 4, 12), mat(C.roofEdge, { rough: 0.5 }), { x: cx, y: ridgeY + 0.05, z: ridgeZ, rz: Math.PI / 2 }));
  // gable triangle
  const gable = new THREE.Shape();
  gable.moveTo(z0, 0);
  gable.lineTo(z1 + 0.0, 0);
  gable.lineTo(ridgeZ, ridgeY - top);
  gable.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gable, { depth: wall, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  root.add(mesh(gableGeo, plaster, { x: x0 + wall, y: top, z: 0, ry: -Math.PI / 2 }));
  // short front roof stub cut at the ridge, shows the roof thickness
  const stub = group({ x: cx, y: ridgeY - 0.22, z: ridgeZ + 0.38, rx: slopeAng });
  stub.add(mesh(rbox(W + 0.7, 0.14, 0.9, 0.05), roofMat));
  root.add(stub);

  buildWorkshop(ctx, root);
  const peter = buildWritingRoom(ctx, root);
  return { root, peter };
}

// ======================= WORKSHOP (ground floor) =======================

function buildWorkshop(ctx: BuildContext, root: THREE.Group) {
  const { x0, z0, zl, F0, slab, top } = HOUSE;
  const backIn = z0 + HOUSE.wall + 0.01;
  const leftIn = x0 + HOUSE.wall + 0.01;
  const wood = mat(C.wood, { rough: 0.6 });
  const woodDark = mat(C.woodDark, { rough: 0.65 });
  const grey = mat("#c9c3b8", { rough: 0.6 });
  const black = mat(C.ink, { rough: 0.45 });

  // rug
  root.add(mesh(rbox(1.8, 0.02, 1.3, 0.01), mat("#c86a4a", { rough: 0.95 }), { x: 0.55, y: F0 + 0.04, z: -0.45, cast: false }));
  root.add(mesh(rbox(1.6, 0.022, 1.1, 0.01), mat("#e7c48f", { rough: 0.95 }), { x: 0.55, y: F0 + 0.042, z: -0.45, cast: false }));

  // workbench along the left wall, in the double-height front of the workshop
  const bench = group({ x: leftIn + 0.37, y: F0, z: -0.55, ry: Math.PI / 2 });
  bench.add(mesh(rbox(1.7, 0.09, 0.72, 0.03), wood, { y: 0.66 }));
  for (const [lx, lz] of [[-0.78, -0.3], [0.78, -0.3], [-0.78, 0.3], [0.78, 0.3]]) bench.add(mesh(rbox(0.08, 0.62, 0.08, 0.02), woodDark, { x: lx, y: 0.31, z: lz }));
  bench.add(mesh(rbox(0.62, 0.48, 0.6, 0.04), grey, { x: 0.42, y: 0.3, z: 0 }));
  for (let i = 0; i < 3; i += 1) bench.add(mesh(rbox(0.54, 0.12, 0.02, 0.01), mat("#b5ada0"), { x: 0.42, y: 0.14 + i * 0.15, z: 0.31 }));
  for (let i = 0; i < 3; i += 1) bench.add(mesh(rbox(0.12, 0.025, 0.02, 0.01), black, { x: 0.42, y: 0.18 + i * 0.15, z: 0.325 }));
  // filament spools
  const spoolColors = [C.orange, C.blue, C.yellow];
  spoolColors.forEach((color, i) => {
    const spool = group({ x: 0.45 + i * 0.16, y: 0.79, z: -0.18, rx: Math.PI / 2, s: 0.75 });
    spool.add(mesh(puck(0.1, 0.1, 0.01), mat(color, { rough: 0.5 })));
    spool.add(mesh(cyl(0.11, 0.11, 0.015, 24), mat("#2c2d33"), { y: 0.055 }));
    spool.add(mesh(cyl(0.11, 0.11, 0.015, 24), mat("#2c2d33"), { y: -0.055 }));
    bench.add(spool);
  });
  bench.add(mesh(rbox(0.42, 0.012, 0.36, 0.005), mat("#2f6b4f"), { x: 0.08, y: 0.712, z: 0.08 }));
  bench.add(contact(2.0, 1.0, { y: 0.0 }, 0.9));
  root.add(bench);

  // pegboard with hanging tools
  const peg = group({ x: leftIn + 0.02, y: F0 + 1.3, z: -0.55, ry: Math.PI / 2 });
  peg.add(card(1.5, 0.72, pegboardTexture(), 0.03, "#c7a576"));
  const toolColors = [C.orange, C.red, C.blue, C.yellow, C.ink, C.sage];
  for (let i = 0; i < 7; i += 1) {
    const tx = -0.6 + i * 0.2;
    const kind = i % 3;
    const color = mat(toolColors[i % toolColors.length], { rough: 0.45 });
    if (kind === 0) {
      peg.add(mesh(capsule(0.025, 0.18, 3, 8), color, { x: tx, y: -0.02, z: 0.05 }));
      peg.add(mesh(rbox(0.035, 0.12, 0.02, 0.008), mat(C.steel, { metal: 0.6, rough: 0.35 }), { x: tx, y: 0.16, z: 0.05 }));
    } else if (kind === 1) {
      peg.add(mesh(torus(0.05, 0.015, 6, 14), color, { x: tx, y: 0.1, z: 0.05 }));
      peg.add(mesh(rbox(0.03, 0.2, 0.02, 0.008), mat(C.steel, { metal: 0.6, rough: 0.35 }), { x: tx, y: -0.05, z: 0.05 }));
    } else {
      peg.add(mesh(rbox(0.12, 0.05, 0.04, 0.015), color, { x: tx, y: 0.14, z: 0.05 }));
      peg.add(mesh(capsule(0.018, 0.16, 3, 6), mat(C.woodLight), { x: tx, y: 0.0, z: 0.05 }));
    }
  }
  root.add(peg);

  // pendant lamp
  const pendant = group({ x: 0.55, y: top - 0.38, z: -0.45 });
  pendant.add(mesh(cyl(0.006, 0.006, 0.95, 4), black, { y: -0.47, cast: false }));
  pendant.add(mesh(lathe("shade", [[0.02, 0], [0.06, -0.02], [0.2, -0.16], [0.21, -0.18], [0, -0.18]], 24), mat("#2f6b4f", { rough: 0.45 }), { y: -0.94 }));
  const bulbMat = ownMat("#fff1cf", { emissive: "#ffd99a", emissiveIntensity: 1 });
  ctx.glow(bulbMat, 0.4, 3.5);
  pendant.add(mesh(sphere(0.055), bulbMat, { y: -1.12, cast: false }));
  const workLight = new THREE.PointLight("#ffcf8f", 0, 5, 1.6);
  workLight.position.set(0, -1.2, 0);
  ctx.lamp(workLight, 0.6, 5);
  pendant.add(workLight);
  root.add(pendant);

  // string lights along the slab edge (bokeh at dusk)
  const bulbs = ownMat("#fff1cf", { emissive: "#ffc477", emissiveIntensity: 1 });
  ctx.glow(bulbs, 0.25, 4.5);
  for (let i = 0; i < 12; i += 1) {
    const t = i / 11;
    root.add(mesh(sphere(0.03, 10, 8), bulbs, { x: x0 + 0.25 + t * 4.4, y: slab - 0.1 - Math.sin(t * Math.PI * 3) * 0.05 - 0.05, z: zl + 0.08, cast: false }));
  }

  // ---- 3D printer (Pegboard Toy) ----
  const printer = group({ x: leftIn + 0.39, y: F0 + 0.705, z: -0.02, ry: Math.PI / 2 });
  const frame = mat("#2a2c33", { rough: 0.4 });
  for (const [px, pz] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) printer.add(mesh(rbox(0.045, 0.62, 0.045, 0.012), frame, { x: px, y: 0.31, z: pz }));
  printer.add(mesh(rbox(0.56, 0.05, 0.5, 0.02), frame, { y: 0.62 }));
  printer.add(mesh(rbox(0.56, 0.08, 0.5, 0.025), frame, { y: 0.04 }));
  printer.add(mesh(rbox(0.16, 0.06, 0.012, 0.005), mat("#7fd0ff", { emissive: "#7fd0ff", emissiveIntensity: 0.8 }), { y: 0.04, z: 0.256 }));
  const bed = dynamic(group({ y: 0.12 }));
  bed.add(mesh(rbox(0.42, 0.02, 0.38, 0.008), mat("#c9c9cf", { metal: 0.3, rough: 0.4 })));
  // the printed pegboard toy grows layer by layer
  const printed = dynamic(group({ y: 0.012 }));
  const plate = mesh(rbox(0.3, 0.04, 0.24, 0.01), mat("#f4efe6"), { y: 0.02 });
  printed.add(plate);
  const pegColors = [C.red, C.yellow, C.blue, C.sage, C.orange, C.hydrangea];
  const pegs: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const p = mesh(cyl(0.022, 0.022, 0.09, 12), mat(pegColors[i], { rough: 0.45 }), { x: -0.1 + (i % 3) * 0.1, y: 0.085, z: -0.05 + Math.floor(i / 3) * 0.1 });
    pegs.push(p);
    printed.add(p);
  }
  bed.add(printed);
  printer.add(bed);
  const gantry = dynamic(group({ y: 0.44 }));
  gantry.add(mesh(rbox(0.52, 0.035, 0.04, 0.01), frame));
  const head = dynamic(group({}));
  head.add(mesh(rbox(0.09, 0.1, 0.08, 0.02), mat(C.orange, { rough: 0.4 })));
  head.add(mesh(cone(0.015, 0.04, 8), mat(C.steel, { metal: 0.7, rough: 0.3 }), { y: -0.07, rx: Math.PI }));
  gantry.add(head);
  printer.add(gantry);
  printer.add(mesh(rbox(0.28, 0.08, 0.02, 0.01), frame, { y: 0.62, z: 0.26 }));
  root.add(printer);
  ctx.spot("printer", printer, { lift: 0.14 });
  ctx.animate((t) => {
    if (ctx.reducedMotion) return;
    const cycle = (t % 14) / 14;
    const grow = Math.min(1, cycle / 0.85);
    plate.scale.y = 0.2 + grow * 0.8;
    plate.position.y = 0.02 * plate.scale.y;
    pegs.forEach((p, i) => {
      const local = THREE.MathUtils.clamp(grow * 6 - i, 0, 1);
      p.scale.set(1, Math.max(0.001, local), 1);
      p.position.y = 0.04 * plate.scale.y + 0.045 * local;
      p.visible = local > 0.01;
    });
    head.position.x = Math.sin(t * 5.3) * 0.15;
    head.position.z = Math.sin(t * 3.7) * 0.11;
    gantry.position.y = 0.2 + grow * 0.06 + (cycle > 0.9 ? (cycle - 0.9) * 2.0 : 0);
    gantry.position.z = 0;
    bed.position.z = Math.sin(t * 2.1) * 0.03;
  });

  // ---- clay figure on a shelf (Prehistoriq) ----
  // sculpting turntable on the bench
  root.add(mesh(puck(0.13, 0.04, 0.012), mat(C.steel, { metal: 0.5, rough: 0.35 }), { x: leftIn + 0.42, y: F0 + 0.73, z: -0.72 }));
  const clay = group({ x: leftIn + 0.42, y: F0 + 0.75, z: -0.72, ry: 0.9, s: 1.25 });
  const clayMat = mat(C.clay, { rough: 0.95 });
  clay.add(mesh(sphere(0.085, 16, 12), clayMat, { y: 0.09, s: [1, 1.2, 0.9] }));
  clay.add(mesh(sphere(0.07, 16, 12), clayMat, { y: 0.24 }));
  clay.add(mesh(sphere(0.035, 10, 8), mat("#8e5636", { rough: 0.95 }), { y: 0.3, z: 0.01, s: [1.6, 0.6, 1.2] }));
  clay.add(mesh(sphere(0.012, 8, 6), mat("#2a1a12"), { x: -0.022, y: 0.25, z: 0.062 }));
  clay.add(mesh(sphere(0.012, 8, 6), mat("#2a1a12"), { x: 0.022, y: 0.25, z: 0.062 }));
  clay.add(mesh(capsule(0.025, 0.06, 3, 8), clayMat, { x: -0.09, y: 0.12, rz: 0.7 }));
  clay.add(mesh(capsule(0.025, 0.06, 3, 8), clayMat, { x: 0.1, y: 0.15, rz: -1.2 }));
  clay.add(mesh(capsule(0.015, 0.2, 3, 6), mat(C.woodDark), { x: 0.16, y: 0.2, rz: -0.2 }));
  clay.add(mesh(sphere(0.032, 10, 8), mat("#9a9a9a", { rough: 0.9, flat: true }), { x: 0.18, y: 0.31 }));
  root.add(clay);
  ctx.spot("clay", clay, { lift: 0.12, pop: 1.15 });
  const clayArm = clay.children[6];
  ctx.animate((t) => {
    if (ctx.reducedMotion) return;
    clay.rotation.y = 0.9 + Math.sin(t * 0.8) * 0.35;
    clayArm.rotation.z = -1.2 + Math.sin(t * 3) * 0.2;
  });

  // ---- TV (YouTLDR) ----
  const tvStand = group({ x: 0.3, y: F0, z: -1.42 });
  tvStand.add(mesh(rbox(0.8, 0.36, 0.48, 0.04), woodDark, { y: 0.18 }));
  tvStand.add(mesh(rbox(0.34, 0.2, 0.02, 0.01), wood, { x: -0.18, y: 0.18, z: 0.24 }));
  tvStand.add(mesh(rbox(0.34, 0.2, 0.02, 0.01), wood, { x: 0.18, y: 0.18, z: 0.24 }));
  tvStand.add(contact(1.0, 0.7, {}, 0.9));
  root.add(tvStand);
  const tv = group({ x: 0.3, y: F0 + 0.36, z: -1.44, ry: 0.15 });
  tv.add(mesh(rbox(0.62, 0.48, 0.44, 0.09), mat("#e8dcc6", { rough: 0.5 }), { y: 0.24 }));
  const screenTex = tvScreen();
  const screenMat = new THREE.MeshStandardMaterial({ map: screenTex, emissive: new THREE.Color("#ffffff"), emissiveMap: screenTex, emissiveIntensity: 0.5, roughness: 0.25 });
  ctx.glow(screenMat, 0.45, 1.3);
  tv.add(mesh(rbox(0.44, 0.33, 0.02, 0.04), screenMat, { x: -0.06, y: 0.26, z: 0.221 }));
  tv.add(mesh(puck(0.035, 0.03, 0.01, 12), mat(C.orange), { x: 0.23, y: 0.32, z: 0.225, rx: Math.PI / 2 }));
  tv.add(mesh(puck(0.035, 0.03, 0.01, 12), mat(C.ink), { x: 0.23, y: 0.2, z: 0.225, rx: Math.PI / 2 }));
  tv.add(mesh(cyl(0.006, 0.006, 0.32, 4), mat(C.steel, { metal: 0.8, rough: 0.3 }), { x: -0.08, y: 0.6, rz: 0.45 }));
  tv.add(mesh(cyl(0.006, 0.006, 0.32, 4), mat(C.steel, { metal: 0.8, rough: 0.3 }), { x: 0.08, y: 0.6, rz: -0.45 }));
  root.add(tv);
  ctx.spot("tv", tv, { lift: 0.14 });

  // ---- arcade cabinet (Levels) ----
  const arcade = group({ x: 2.1, y: F0, z: -0.7, ry: -0.25 });
  const cab = mat("#2c3f8f", { rough: 0.45 });
  arcade.add(mesh(rbox(0.6, 1.0, 0.56, 0.05), cab, { y: 0.5 }));
  arcade.add(mesh(rbox(0.6, 0.62, 0.36, 0.05), cab, { y: 1.18, z: -0.1 }));
  arcade.add(mesh(rbox(0.64, 0.06, 0.6, 0.02), mat(C.ink), { y: 0.03 }));
  const marqueeTex = arcadeMarquee();
  const marquee = new THREE.MeshStandardMaterial({ map: marqueeTex, emissive: new THREE.Color("#ffffff"), emissiveMap: marqueeTex, emissiveIntensity: 0.4, roughness: 0.4 });
  ctx.glow(marquee, 0.35, 1.6);
  arcade.add(mesh(rbox(0.56, 0.16, 0.04, 0.02), marquee, { y: 1.42, z: 0.09 }));
  const scrTex = arcadeScreen();
  const scr = new THREE.MeshStandardMaterial({ map: scrTex, emissive: new THREE.Color("#ffffff"), emissiveMap: scrTex, emissiveIntensity: 0.6, roughness: 0.2 });
  ctx.glow(scr, 0.6, 1.5);
  const screen = mesh(rbox(0.46, 0.38, 0.03, 0.03), scr, { y: 1.12, z: 0.085, rx: -0.18 });
  arcade.add(screen);
  arcade.add(mesh(rbox(0.6, 0.06, 0.3, 0.03), mat(C.ink), { y: 0.84, z: 0.2, rx: 0.25 }));
  arcade.add(mesh(cyl(0.012, 0.012, 0.08, 8), mat(C.ink), { x: -0.12, y: 0.9, z: 0.2 }));
  arcade.add(mesh(sphere(0.035, 12, 10), mat(C.red, { rough: 0.3 }), { x: -0.12, y: 0.95, z: 0.2 }));
  for (let i = 0; i < 3; i += 1) arcade.add(mesh(puck(0.025, 0.025, 0.008, 12), mat([C.yellow, C.orange, "#7fd0ff"][i], { rough: 0.3 }), { x: 0.04 + i * 0.08, y: 0.89, z: 0.21 }));
  arcade.add(mesh(rbox(0.3, 0.12, 0.02, 0.02), mat(C.orange), { y: 0.35, z: 0.285 }));
  arcade.add(contact(0.9, 0.9, {}, 0.9));
  root.add(arcade);
  ctx.spot("arcade", arcade, { lift: 0.14 });

  // ---- cork board (Žltá stopa) on the left wall ----
  const cork = group({ x: leftIn + 0.02, y: F0 + 2.5, z: -0.5, ry: Math.PI / 2 });
  cork.add(card(1.05, 0.72, corkTexture(), 0.035, "#9a6a42"));
  cork.add(mesh(rbox(1.12, 0.06, 0.06, 0.02), woodDark, { y: -0.39 }));
  root.add(cork);
  ctx.spot("corkboard", cork, { lift: 0.1, anchor: new THREE.Vector3(0, 0.42, 0) });

  // ---- tiny stage (AI Build Week) ----
  const stage = group({ x: -0.45, y: F0, z: -0.05 });
  stage.add(mesh(rbox(1.0, 0.14, 0.78, 0.05), mat("#3a3d47", { rough: 0.6 }), { y: 0.07 }));
  stage.add(mesh(rbox(0.94, 0.02, 0.72, 0.02), mat(C.woodLight), { y: 0.145 }));
  const banner = card(0.46, 0.7, buildWeekBanner(), 0.03, "#1f2128");
  banner.position.set(0.22, 0.6, -0.3);
  stage.add(banner);
  stage.add(mesh(rbox(0.05, 0.3, 0.05, 0.01), mat(C.ink), { x: 0.22, y: 0.2, z: -0.33 }));
  stage.add(mesh(cyl(0.012, 0.012, 0.55, 6), mat(C.ink), { x: 0.05, y: 0.43, z: 0.05 }));
  stage.add(mesh(puck(0.07, 0.015, 0.006, 16), mat(C.ink), { x: 0.05, y: 0.16, z: 0.05 }));
  stage.add(mesh(capsule(0.025, 0.04, 3, 8), mat("#5a5d66", { metal: 0.4, rough: 0.35 }), { x: 0.05, y: 0.73, z: 0.07, rx: 0.5 }));
  stage.add(mesh(rbox(0.16, 0.24, 0.14, 0.03), mat(C.ink), { x: -0.32, y: 0.27, z: -0.22 }));
  stage.add(mesh(puck(0.045, 0.01, 0.004, 14), mat("#5a5d66"), { x: -0.32, y: 0.3, z: -0.147, rx: Math.PI / 2 }));
  root.add(stage);
  ctx.spot("stage", stage, { lift: 0.1 });

  // stool
  const stool = group({ x: -1.05, y: F0, z: -0.95 });
  stool.add(mesh(puck(0.16, 0.05, 0.02), mat(C.red), { y: 0.48 }));
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2;
    stool.add(mesh(cyl(0.015, 0.015, 0.48, 6), woodDark, { x: Math.cos(a) * 0.09, y: 0.24, z: Math.sin(a) * 0.09 }));
  }
  stool.add(contact(0.45, 0.45, {}, 0.8));
  root.add(stool);

  // plant in the corner
  root.add(pottedPlant(2.35, F0, 0.05, 0.9));
  // under the loft: storage shelf with colourful bins and a beanbag
  const store = group({ x: -0.5, y: F0, z: backIn + 0.22 });
  store.add(mesh(rbox(2.6, 0.06, 0.42, 0.02), wood, { y: 0.42 }));
  store.add(mesh(rbox(2.6, 0.06, 0.42, 0.02), wood, { y: 0.04 }));
  const bins = [C.orange, C.blue, C.yellow, C.sage, C.coral, C.blue];
  bins.forEach((color, i) => {
    store.add(mesh(rbox(0.36, 0.3, 0.34, 0.04), mat(color, { rough: 0.5 }), { x: -1.05 + i * 0.42, y: 0.23 }));
    store.add(mesh(rbox(0.3, 0.22, 0.3, 0.04), mat(bins[(i + 2) % bins.length], { rough: 0.5 }), { x: -1.05 + i * 0.42, y: 0.57 }));
  });
  root.add(store);
  root.add(mesh(sphere(0.32, 18, 12), mat(C.mustard, { rough: 0.9 }), { x: 1.45, y: F0 + 0.18, z: -2.3, s: [1.1, 0.6, 1] }));
}

// ======================= WRITING ROOM (upper floor) =======================

function buildWritingRoom(ctx: BuildContext, root: THREE.Group): PeterRig {
  const { x0, x1, z0, zl, F1 } = HOUSE;
  const backIn = z0 + HOUSE.wall + 0.01;
  const leftIn = x0 + HOUSE.wall + 0.01;
  const wood = mat(C.wood, { rough: 0.6 });
  const woodLight = mat(C.woodLight, { rough: 0.55 });
  const woodDark = mat(C.woodDark, { rough: 0.65 });

  // rug
  root.add(mesh(rbox(2.1, 0.02, 1.6, 0.01), mat("#3f5a7a", { rough: 0.95 }), { x: 0.05, y: F1 + 0.01, z: -2.2, cast: false }));
  root.add(mesh(rbox(1.9, 0.022, 1.4, 0.01), mat("#e9dcc3", { rough: 0.95 }), { x: 0.05, y: F1 + 0.012, z: -2.2, cast: false }));

  // desk
  const deskTop = F1 + 0.64;
  const desk = group({ x: 0.0, y: F1, z: -1.92 });
  desk.add(mesh(rbox(1.6, 0.07, 0.78, 0.03), woodLight, { y: 0.605 }));
  for (const [lx, lz] of [[-0.72, -0.32], [0.72, -0.32], [-0.72, 0.32], [0.72, 0.32]]) desk.add(mesh(rbox(0.07, 0.58, 0.07, 0.02), woodDark, { x: lx, y: 0.29, z: lz }));
  desk.add(mesh(rbox(0.44, 0.26, 0.66, 0.03), wood, { x: 0.52, y: 0.44, z: 0 }));
  desk.add(mesh(rbox(0.12, 0.025, 0.02, 0.008), mat(C.ink), { x: 0.52, y: 0.44, z: 0.335 }));
  desk.add(contact(1.9, 1.1, { y: 0.0 }, 0.9));
  root.add(desk);

  // chair + Peter
  const chair = group({ x: 0.0, y: F1, z: -2.62 });
  chair.add(mesh(rbox(0.5, 0.07, 0.48, 0.03), mat(C.ink, { rough: 0.5 }), { y: 0.38 }));
  chair.add(mesh(rbox(0.5, 0.55, 0.08, 0.05), mat(C.ink, { rough: 0.5 }), { y: 0.7, z: -0.24, rx: -0.08 }));
  chair.add(mesh(cyl(0.025, 0.025, 0.3, 8), mat(C.steel, { metal: 0.7, rough: 0.3 }), { y: 0.2 }));
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    chair.add(mesh(rbox(0.26, 0.03, 0.04, 0.012), mat(C.graphite), { x: Math.cos(a) * 0.13, y: 0.04, z: Math.sin(a) * 0.13, ry: -a }));
  }
  chair.add(contact(0.8, 0.8, {}, 0.7));
  root.add(chair);
  const peter = buildPeter();
  peter.root.position.set(0.0, F1 - 0.02, -2.56);
  root.add(peter.root);
  ctx.spot("peter", peter.root, { lift: 0.0, pop: 1.04, anchor: new THREE.Vector3(0, 1.85, 0) });

  // laptop (back faces the camera, with a little orange sticker)
  const laptop = group({ x: 0.0, y: deskTop, z: -2.08 });
  laptop.add(mesh(rbox(0.5, 0.025, 0.34, 0.012), mat("#b8bcc4", { metal: 0.5, rough: 0.35 }), { y: 0.012 }));
  const lid = group({ y: 0.02, z: 0.17, rx: 0.3 });
  lid.add(mesh(rbox(0.5, 0.34, 0.02, 0.014), mat("#b8bcc4", { metal: 0.5, rough: 0.35 }), { y: 0.17 }));
  lid.add(mesh(puck(0.04, 0.004, 0.001, 18), mat(C.orange), { y: 0.19, z: 0.012, rx: Math.PI / 2 }));
  const lap = laptopScreen();
  const lapMat = new THREE.MeshStandardMaterial({ map: lap, emissive: new THREE.Color("#ffffff"), emissiveMap: lap, emissiveIntensity: 0.5 });
  ctx.glow(lapMat, 0.4, 1.0);
  lid.add(mesh(rbox(0.46, 0.3, 0.004, 0.002), lapMat, { y: 0.17, z: -0.012 }));
  laptop.add(lid);
  root.add(laptop);
  const screenLight = new THREE.PointLight("#cfe0ff", 0, 1.4, 2);
  screenLight.position.set(0, deskTop + 0.25, -2.25);
  ctx.lamp(screenLight, 0, 1.2);
  root.add(screenLight);

  // mug with steam
  const mug = group({ x: 0.42, y: deskTop, z: -1.68 });
  mug.add(mesh(lathe("mug", [[0, 0], [0.06, 0], [0.065, 0.02], [0.065, 0.13], [0.055, 0.13], [0.055, 0.03], [0, 0.03]], 20), mat(C.white, { rough: 0.35 })));
  mug.add(mesh(torus(0.035, 0.012, 8, 14), mat(C.white, { rough: 0.35 }), { x: 0.075, y: 0.07, ry: 0 }));
  mug.add(mesh(cyl(0.055, 0.055, 0.005, 16), mat("#6b3f24"), { y: 0.11 }));
  root.add(mug);
  const steamMat = ownMat("#ffffff", { transparent: true, opacity: 0.5, rough: 1 });
  const steam = dynamic(group({ x: 0.42, y: deskTop + 0.14, z: -1.68 }));
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i += 1) {
    const puff = mesh(sphere(0.03, 10, 8), steamMat.clone(), { cast: false, receive: false });
    puffs.push(puff);
    steam.add(puff);
  }
  root.add(steam);
  ctx.animate((t) => {
    puffs.forEach((puff, i) => {
      const p = ctx.reducedMotion ? 0.3 + i * 0.15 : ((t * 0.35 + i / 5) % 1);
      puff.position.set(Math.sin(p * 6 + i) * 0.03, p * 0.32, Math.cos(p * 5 + i) * 0.02);
      puff.scale.setScalar(0.6 + p * 1.4);
      (puff.material as THREE.MeshStandardMaterial).opacity = Math.sin(p * Math.PI) * 0.45;
    });
  });

  // desk lamp
  const lamp = group({ x: 0.66, y: deskTop, z: -2.15 });
  lamp.add(mesh(puck(0.09, 0.03, 0.01), mat(C.orange)));
  lamp.add(mesh(cyl(0.012, 0.012, 0.36, 6), mat(C.ink), { y: 0.18, z: 0.05, rx: 0.3 }));
  lamp.add(mesh(cyl(0.012, 0.012, 0.28, 6), mat(C.ink), { y: 0.38, z: 0.12, rx: -0.9 }));
  const lampHead = group({ y: 0.42, z: 0.26, rx: 0.9 });
  lampHead.add(mesh(lathe("lamphead", [[0.02, 0.05], [0.04, 0.04], [0.09, -0.04], [0.0, -0.04]], 18), mat(C.orange, { rough: 0.45 })));
  const lampBulb = ownMat("#fff6dd", { emissive: "#ffdf9e", emissiveIntensity: 1 });
  ctx.glow(lampBulb, 0.6, 4);
  lampHead.add(mesh(sphere(0.035, 10, 8), lampBulb, { y: -0.035, cast: false }));
  lamp.add(lampHead);
  root.add(lamp);
  const deskLight = new THREE.PointLight("#ffcf8a", 0, 3.2, 1.5);
  deskLight.position.set(0.55, deskTop + 0.35, -1.85);
  ctx.lamp(deskLight, 0.3, 4.2);
  root.add(deskLight);

  // stream deck (CMUX Deck)
  const deck = group({ x: 0.3, y: deskTop, z: -1.78, ry: -0.35 });
  deck.add(mesh(rbox(0.26, 0.05, 0.17, 0.02), mat("#1d1e23", { rough: 0.35 }), { y: 0.03, rx: -0.25 }));
  const keyTex = deckKeys();
  const keyMat = new THREE.MeshStandardMaterial({ map: keyTex, emissive: new THREE.Color("#ffffff"), emissiveMap: keyTex, emissiveIntensity: 0.7, roughness: 0.35 });
  ctx.glow(keyMat, 0.7, 1.8);
  deck.add(mesh(rbox(0.22, 0.006, 0.13, 0.003), keyMat, { y: 0.058, z: 0.006, rx: -0.25 }));
  deck.add(mesh(rbox(0.05, 0.08, 0.06, 0.02), mat("#1d1e23"), { y: 0.03, z: -0.09 }));
  root.add(deck);
  ctx.spot("deck", deck, { lift: 0.12, pop: 1.25 });

  // three notebooks = the three newest posts
  NOTEBOOK_COLORS.forEach((color, i) => {
    const nb = group({ x: -0.72 + i * 0.22, y: deskTop, z: -1.8 + i * 0.03, ry: 0.42 - i * 0.08 });
    nb.add(card(0.26, 0.33, notebookCover(color, i), 0.06, "#f4efe6"));
    nb.children[0].position.y = 0.165;
    nb.children[0].rotation.x = -0.1 + i * 0.04;
    nb.add(mesh(rbox(0.012, 0.33, 0.062, 0.005), mat(color, { rough: 0.6 }), { x: -0.13, y: 0.165, rx: -0.1 + i * 0.04 }));
    root.add(nb);
    const fan = [new THREE.Vector3(-0.2, 0.44, 0), new THREE.Vector3(0, 0.7, 0), new THREE.Vector3(0.26, 0.44, 0)][i];
    ctx.spot(`post-${i}`, nb, { lift: 0.16, pop: 1.12, anchor: fan });
  });
  root.add(contact(0.7, 0.4, { x: -0.52, y: deskTop, z: -1.76 }, 0.6));

  // bookshelf on the left wall (All writing)
  const shelf = group({ x: leftIn + 0.22, y: F1, z: -2.52 });
  shelf.add(mesh(rbox(0.42, 1.5, 1.05, 0.03), wood, { y: 0.75 }));
  shelf.add(mesh(rbox(0.36, 1.4, 0.97, 0.02), mat("#a87448", { rough: 0.7 }), { x: 0.04, y: 0.75 }));
  const spines = [bookSpines(1), bookSpines(4), bookSpines(7), bookSpines(2)];
  for (let r = 0; r < 4; r += 1) {
    const y = 0.08 + r * 0.35;
    shelf.add(mesh(rbox(0.4, 0.035, 1.0, 0.01), wood, { x: 0.02, y }));
    const books = new THREE.MeshStandardMaterial({ map: spines[r], roughness: 0.7, transparent: true, alphaTest: 0.5 });
    const row = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.24), books);
    row.position.set(0.215, y + 0.135, 0);
    row.rotation.y = Math.PI / 2;
    shelf.add(row);
    shelf.add(mesh(rbox(0.3, 0.2, 0.92 - (r % 2) * 0.2, 0.02), mat(["#d36a3a", "#e1c070", "#5c80b0", "#8fa98a"][r], { rough: 0.7 }), { x: 0.0, y: y + 0.12, z: -(r % 2) * 0.1 }));
  }
  shelf.add(pottedPlant(0.05, 1.5, 0.25, 0.55));
  shelf.add(contact(0.8, 1.3, {}, 0.8));
  root.add(shelf);
  ctx.spot("bookshelf", shelf, { lift: 0.08, pop: 1.03, anchor: new THREE.Vector3(0.1, 1.72, 0) });

  // round mirror on the left wall (Face)
  const mirror = group({ x: leftIn + 0.03, y: F1 + 1.05, z: -1.58, ry: Math.PI / 2 });
  mirror.add(mesh(torus(0.27, 0.045, 12, 40), mat(C.woodLight, { rough: 0.5 })));
  mirror.add(mesh(cyl(0.26, 0.26, 0.02, 40), mat("#dfe9ef", { metal: 0.9, rough: 0.08 }), { rx: Math.PI / 2 }));
  mirror.add(mesh(capsule(0.012, 0.18, 3, 6), mat("#ffffff", { rough: 0.2, transparent: true, opacity: 0.55 }), { x: -0.08, y: 0.08, z: 0.015, rz: -0.7, cast: false }));
  root.add(mirror);
  ctx.spot("mirror", mirror, { lift: 0.1, anchor: new THREE.Vector3(0, 0.36, 0) });

  // hiragana poster (Kana)
  const poster = group({ x: -0.95, y: F1 + 1.05, z: backIn + 0.02 });
  const kana = card(0.62, 0.82, kanaPoster(), 0.02);
  poster.add(kana);
  poster.add(mesh(sphere(0.02, 8, 6), mat(C.red), { x: -0.27, y: 0.37, z: 0.02, cast: false }));
  poster.add(mesh(sphere(0.02, 8, 6), mat(C.red), { x: 0.27, y: 0.37, z: 0.02, cast: false }));
  root.add(poster);
  ctx.spot("kana", poster, { lift: 0.1, anchor: new THREE.Vector3(0, 0.48, 0) });

  // window (Shinkansen window)
  const win = group({ x: 1.43, y: F1 + 1.01, z: backIn - 0.06 });
  const frame = mat("#7a4f31", { rough: 0.6 });
  win.add(mesh(rbox(1.36, 0.08, 0.2, 0.02), frame, { y: 0.44 }));
  win.add(mesh(rbox(1.42, 0.07, 0.34, 0.02), frame, { y: -0.44, z: 0.06 }));
  win.add(mesh(rbox(0.08, 0.86, 0.2, 0.02), frame, { x: -0.66 }));
  win.add(mesh(rbox(0.08, 0.86, 0.2, 0.02), frame, { x: 0.66 }));
  win.add(mesh(rbox(0.04, 0.82, 0.08, 0.01), frame, { x: 0 }));
  win.add(mesh(rbox(1.3, 0.035, 0.08, 0.01), frame, { y: 0.05 }));
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dff1ff", roughness: 0.05, transmission: 0, transparent: true, opacity: 0.12, depthWrite: false });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.82), glass);
  pane.castShadow = false;
  win.add(pane);
  // little sill plant
  win.add(mesh(cyl(0.05, 0.04, 0.08, 12), mat(C.coral), { x: 0.42, y: -0.36, z: 0.12 }));
  win.add(mesh(sphere(0.07, 12, 10), mat(C.leaf), { x: 0.42, y: -0.27, z: 0.12 }));
  root.add(win);
  ctx.spot("window", win, { lift: 0.0, pop: 1.04, anchor: new THREE.Vector3(0, 0.52, 0) });

  // sideboard + old radio (Mood Radio)
  const side = group({ x: x1 - 0.42, y: F1, z: -2.78 });
  side.add(mesh(rbox(0.7, 0.5, 0.5, 0.04), woodDark, { y: 0.25 }));
  side.add(mesh(rbox(0.3, 0.36, 0.02, 0.02), wood, { x: -0.16, y: 0.25, z: 0.25 }));
  side.add(mesh(rbox(0.3, 0.36, 0.02, 0.02), wood, { x: 0.16, y: 0.25, z: 0.25 }));
  side.add(contact(0.9, 0.7, {}, 0.8));
  root.add(side);
  const radio = group({ x: x1 - 0.42, y: F1 + 0.5, z: -2.78, ry: 0.3 });
  radio.add(mesh(rbox(0.5, 0.3, 0.2, 0.06), mat("#b5623a", { rough: 0.5 }), { y: 0.15 }));
  radio.add(mesh(rbox(0.28, 0.2, 0.02, 0.03), mat("#e8d7b5", { rough: 0.8 }), { x: -0.08, y: 0.15, z: 0.1 }));
  for (let i = 0; i < 4; i += 1) radio.add(mesh(rbox(0.24, 0.012, 0.01, 0.004), mat("#a08a6a"), { x: -0.08, y: 0.09 + i * 0.04, z: 0.112, cast: false }));
  radio.add(mesh(puck(0.04, 0.03, 0.01, 14), mat(C.cream), { x: 0.16, y: 0.2, z: 0.1, rx: Math.PI / 2 }));
  radio.add(mesh(puck(0.03, 0.03, 0.01, 14), mat(C.cream), { x: 0.16, y: 0.09, z: 0.1, rx: Math.PI / 2 }));
  radio.add(mesh(capsule(0.012, 0.36, 3, 6), mat(C.steel, { metal: 0.8, rough: 0.3 }), { x: 0.18, y: 0.45, z: -0.04, rz: -0.35 }));
  const radioLed = ownMat("#ffb35a", { emissive: "#ff9a3a", emissiveIntensity: 1 });
  ctx.glow(radioLed, 0.8, 3);
  radio.add(mesh(sphere(0.014, 8, 6), radioLed, { x: 0.16, y: 0.26, z: 0.1, cast: false }));
  root.add(radio);
  ctx.spot("radio", radio, { lift: 0.14, pop: 1.1 });
  // radio notes bob gently
  ctx.animate((t) => {
    if (ctx.reducedMotion) return;
    radio.children[0].scale.y = 1 + Math.max(0, Math.sin(t * 8)) * 0.015;
  });

  // hydrangea pot at the front-right corner (Bloom)
  const bloom = group({ x: x1 - 0.42, y: F1, z: zl - 0.42 });
  bloom.add(mesh(lathe("bigpot", [[0, 0], [0.2, 0], [0.26, 0.05], [0.28, 0.34], [0.3, 0.38], [0.24, 0.38], [0, 0.36]], 24), mat("#3d5f8a", { rough: 0.4 })));
  bloom.add(mesh(sphere(0.22, 14, 10), mat(C.moss), { y: 0.42, s: [1.1, 0.6, 1.1] }));
  const heads: [number, number, number, string][] = [
    [0, 0.62, 0, C.hydrangea],
    [-0.15, 0.52, 0.1, C.hydrangeaPink],
    [0.16, 0.54, 0.06, "#7aa6e8"],
    [0.03, 0.52, -0.16, C.hydrangea],
    [0.08, 0.5, 0.18, "#a9a3ee"],
  ];
  for (const [hx, hy, hz, color] of heads) {
    const flower = group({ x: hx, y: hy, z: hz });
    flower.add(mesh(sphere(0.12, 14, 10), mat(color, { rough: 0.7, flat: true })));
    for (let k = 0; k < 6; k += 1) {
      const a = (k / 6) * Math.PI * 2;
      flower.add(mesh(sphere(0.05, 8, 6), mat(color, { rough: 0.7, flat: true }), { x: Math.cos(a) * 0.1, y: 0.03 + (k % 2) * 0.03, z: Math.sin(a) * 0.1 }));
    }
    bloom.add(flower);
  }
  for (let k = 0; k < 5; k += 1) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    bloom.add(mesh(sphere(0.09, 10, 6), mat(C.leaf), { x: Math.cos(a) * 0.22, y: 0.44, z: Math.sin(a) * 0.22, s: [1, 0.35, 0.6], ry: -a }));
  }
  bloom.add(contact(0.8, 0.8, {}, 0.8));
  root.add(bloom);
  ctx.spot("bloom", bloom, { lift: 0.16 });

  // small floor plant and a cushion
  root.add(pottedPlant(-1.55, F1, -1.5, 0.75));
  void x1;
  return peter;
}

export function pottedPlant(x: number, y: number, z: number, s = 1) {
  const g = group({ x, y, z, s });
  g.add(mesh(lathe("pot", [[0, 0], [0.11, 0], [0.14, 0.18], [0.15, 0.2], [0, 0.2]], 18), mat(C.coral, { rough: 0.6 })));
  const leaf = mat(C.leaf, { rough: 0.7 });
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    g.add(mesh(sphere(0.1, 10, 8), leaf, { x: Math.cos(a) * 0.07, y: 0.32 + (i % 2) * 0.08, z: Math.sin(a) * 0.07, s: [0.7, 1.3, 0.4], ry: -a, rz: Math.cos(a) * 0.4, rx: Math.sin(a) * 0.4 }));
  }
  g.add(contact(0.4, 0.4, {}, 0.7));
  return g;
}

export const _unused = { canvasTexture };
