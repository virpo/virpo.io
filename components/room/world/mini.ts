import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { C, canvasTexture, card, contact, cyl, group, lathe, mat, mesh, ownMat, puck, rbox, sphere, torus } from "./kit";
import { buildPeter } from "./peter";
import { shinkansenCar } from "./railway";
import { kanaPoster, setTextureFonts } from "./textures";

// A calm little corner of the Pocket Room for the post page margin:
// mini-Peter reads this post, turns a page as you scroll, a shinkansen slides
// past the window behind him, and he looks up and waves when you reach the end.

export type MiniRoom = {
  setProgress(progress: number): void;
  resize(): void;
  setVisible(visible: boolean): void;
  dispose(): void;
};

function windowView() {
  return canvasTexture(512, 256, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, "#9cc8e6");
    sky.addColorStop(0.7, "#e4eff2");
    sky.addColorStop(1, "#f3efe2");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 256);
    // Fuji
    ctx.fillStyle = "#8ea3cc";
    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.lineTo(250, 92);
    ctx.lineTo(276, 92);
    ctx.lineTo(380, 200);
    ctx.fill();
    ctx.fillStyle = "#f8f9fb";
    ctx.beginPath();
    ctx.moveTo(222, 122);
    ctx.lineTo(250, 92);
    ctx.lineTo(276, 92);
    ctx.lineTo(306, 124);
    ctx.lineTo(288, 118);
    ctx.lineTo(274, 128);
    ctx.lineTo(260, 116);
    ctx.lineTo(244, 128);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b8c9a8";
    ctx.beginPath();
    ctx.ellipse(90, 230, 190, 60, 0, 0, Math.PI * 2);
    ctx.ellipse(430, 236, 210, 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const [x, y, r] of [[80, 60, 18], [104, 54, 24], [130, 62, 16], [390, 40, 16], [412, 34, 22]] as const) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function createMiniRoom(canvas: HTMLCanvasElement, options: { reducedMotion: boolean; bookColor?: string; fonts?: { mono?: string; sans?: string } }): MiniRoom {
  if (options.fonts) setTextureFonts(options.fonts.mono, options.fonts.sans);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  // everything outside the window lives in its own scene, drawn through a scissor
  const outside = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();

  // ---- the room corner on its little plinth ----
  const W = 3.4;
  const D = 2.3;
  const plaster = mat(C.plaster, { rough: 0.85 });
  scene.add(mesh(rbox(W + 0.3, 0.32, D + 0.3, 0.12), mat("#ece3d3", { rough: 0.55 }), { y: -0.16 }));
  scene.add(mesh(rbox(W + 0.36, 0.06, D + 0.36, 0.03), mat("#2a2b30"), { y: -0.33 }));
  scene.add(mesh(rbox(W, 0.06, D, 0.02), mat(C.floor, { rough: 0.6 }), { y: 0.03 }));
  const backZ = -D / 2;
  const wy0 = 1.05;
  const wy1 = 1.95;
  const wx0 = 0.15;
  const wx1 = 1.35;
  const H = 2.45;
  const wall = 0.12;
  scene.add(mesh(rbox(wx0 + W / 2, H, wall, 0.02), plaster, { x: (-W / 2 + wx0) / 2, y: H / 2, z: backZ }));
  scene.add(mesh(rbox(W / 2 - wx1, H, wall, 0.02), plaster, { x: (wx1 + W / 2) / 2, y: H / 2, z: backZ }));
  scene.add(mesh(rbox(wx1 - wx0, wy0, wall, 0.02), plaster, { x: (wx0 + wx1) / 2, y: wy0 / 2, z: backZ }));
  scene.add(mesh(rbox(wx1 - wx0, H - wy1, wall, 0.02), plaster, { x: (wx0 + wx1) / 2, y: (wy1 + H) / 2, z: backZ }));
  scene.add(mesh(rbox(wall, H, D, 0.02), plaster, { x: -W / 2, y: H / 2, z: 0 }));
  const frameMat = mat("#7a4f31", { rough: 0.6 });
  const wcx = (wx0 + wx1) / 2;
  const wcy = (wy0 + wy1) / 2;
  scene.add(mesh(rbox(wx1 - wx0 + 0.1, 0.07, 0.2, 0.02), frameMat, { x: wcx, y: wy1, z: backZ }));
  scene.add(mesh(rbox(wx1 - wx0 + 0.16, 0.06, 0.3, 0.02), frameMat, { x: wcx, y: wy0, z: backZ + 0.05 }));
  scene.add(mesh(rbox(0.07, wy1 - wy0, 0.2, 0.02), frameMat, { x: wx0, y: wcy, z: backZ }));
  scene.add(mesh(rbox(0.07, wy1 - wy0, 0.2, 0.02), frameMat, { x: wx1, y: wcy, z: backZ }));
  scene.add(mesh(rbox(0.035, wy1 - wy0, 0.08, 0.01), frameMat, { x: wcx, y: wcy, z: backZ }));
  // the view outside: painted backdrop + a viaduct the train runs on
  const view = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: windowView(), toneMapped: false }));
  view.position.set(wcx, wcy + 0.15, backZ - 1.3);
  outside.add(view);
  outside.add(mesh(rbox(8, 0.12, 0.5, 0.03), mat(C.concrete), { x: 0, y: 0.98, z: backZ - 0.65, cast: false }));
  for (let x = -3; x <= 3; x += 1.2) outside.add(mesh(rbox(0.14, 0.95, 0.14, 0.03), mat(C.concreteDark), { x, y: 0.47, z: backZ - 0.65, cast: false }));
  outside.add(new THREE.HemisphereLight("#fff6e6", "#9c8a6c", 1.4));
  const outSun = new THREE.DirectionalLight("#fff1dc", 2.2);
  outSun.position.set(3, 5, 4);
  outside.add(outSun);
  outside.environment = env;
  outside.environmentIntensity = 0.45;
  const train = group({ y: 1.0, z: backZ - 0.65 });
  const cars = [shinkansenCar("lead", 1.2), shinkansenCar("mid", 1.05), shinkansenCar("tail", 1.2)];
  cars.forEach((car, i) => {
    car.position.x = -i * 1.15;
    car.rotation.y = Math.PI / 2;
    train.add(car);
  });
  train.scale.setScalar(0.85);
  outside.add(train);
  const windowCorners = [
    new THREE.Vector3(wx0, wy0, backZ),
    new THREE.Vector3(wx1, wy0, backZ),
    new THREE.Vector3(wx0, wy1, backZ),
    new THREE.Vector3(wx1, wy1, backZ),
    new THREE.Vector3(wx0, wy0, backZ - 0.2),
    new THREE.Vector3(wx1, wy1, backZ - 0.2),
  ];

  // poster + shelf
  const poster = card(0.5, 0.66, kanaPoster(), 0.02);
  poster.position.set(-0.75, 1.55, backZ + 0.07);
  scene.add(poster);
  const shelfY = 1.15;
  scene.add(mesh(rbox(0.3, 0.04, 0.9, 0.01), mat(C.wood), { x: -W / 2 + 0.2, y: shelfY, z: -0.2 }));
  ["#ff5a12", C.blue, C.yellow, C.sage, C.coral].forEach((color, i) => {
    scene.add(mesh(rbox(0.2, 0.26 - (i % 2) * 0.04, 0.07, 0.01), mat(color, { rough: 0.6 }), { x: -W / 2 + 0.2, y: shelfY + 0.15 - (i % 2) * 0.02, z: -0.5 + i * 0.09 }));
  });

  // rug, desk, chair
  scene.add(mesh(rbox(2.0, 0.02, 1.3, 0.01), mat("#3f5a7a", { rough: 0.95 }), { x: 0.0, y: 0.065, z: -0.05, cast: false }));
  scene.add(mesh(rbox(1.85, 0.022, 1.15, 0.01), mat("#e9dcc3", { rough: 0.95 }), { x: 0.0, y: 0.067, z: -0.05, cast: false }));
  const deskTop = 0.68;
  const desk = group({ x: 0.0, y: 0.06, z: 0.32 });
  desk.add(mesh(rbox(1.5, 0.07, 0.62, 0.03), mat(C.woodLight), { y: 0.6 }));
  for (const [lx, lz] of [[-0.68, -0.25], [0.68, -0.25], [-0.68, 0.25], [0.68, 0.25]]) desk.add(mesh(rbox(0.06, 0.58, 0.06, 0.02), mat(C.woodDark), { x: lx, y: 0.29, z: lz }));
  desk.add(contact(1.8, 0.9, {}, 0.8));
  scene.add(desk);
  const chair = group({ x: 0, y: 0.06, z: -0.46 });
  chair.add(mesh(rbox(0.5, 0.07, 0.48, 0.03), mat(C.ink), { y: 0.38 }));
  chair.add(mesh(rbox(0.5, 0.55, 0.08, 0.05), mat(C.ink), { y: 0.7, z: -0.24, rx: -0.08 }));
  chair.add(mesh(cyl(0.025, 0.025, 0.3, 8), mat(C.steel, { metal: 0.7, rough: 0.3 }), { y: 0.2 }));
  scene.add(chair);
  // mug + lamp on the desk
  const mugGroup = group({ x: 0.5, y: deskTop, z: 0.42 });
  mugGroup.add(mesh(lathe("mug", [[0, 0], [0.06, 0], [0.065, 0.02], [0.065, 0.13], [0.055, 0.13], [0.055, 0.03], [0, 0.03]], 20), mat(C.white, { rough: 0.35 })));
  mugGroup.add(mesh(torus(0.035, 0.012, 8, 14), mat(C.white, { rough: 0.35 }), { x: 0.075, y: 0.07 }));
  scene.add(mugGroup);
  const steamMat = ownMat("#ffffff", { transparent: true, opacity: 0.4, rough: 1 });
  const puffs = Array.from({ length: 4 }, () => {
    const puff = mesh(sphere(0.028, 10, 8), steamMat.clone(), { cast: false, receive: false });
    scene.add(puff);
    return puff;
  });
  const lamp = group({ x: -0.55, y: deskTop, z: 0.2 });
  lamp.add(mesh(puck(0.08, 0.03, 0.01), mat(C.orange)));
  lamp.add(mesh(cyl(0.012, 0.012, 0.42, 6), mat(C.ink), { y: 0.21, z: -0.03, rx: -0.15 }));
  const head = group({ y: 0.44, z: -0.02, rx: 1.1, rz: 0.4 });
  head.add(mesh(lathe("lamphead", [[0.02, 0.05], [0.04, 0.04], [0.09, -0.04], [0.0, -0.04]], 18), mat(C.orange, { rough: 0.45 })));
  head.add(mesh(sphere(0.03, 10, 8), mat("#fff6dd", { emissive: "#ffdf9e", emissiveIntensity: 2 }), { y: -0.03, cast: false }));
  lamp.add(head);
  scene.add(lamp);

  // Peter, reading this post
  const peter = buildPeter({ pose: "reading" });
  peter.root.position.set(0, 0.04, -0.4);
  scene.add(peter.root);
  // the open notebook on the desk (this post), with a page that turns as you scroll
  const book = group({ x: 0.02, y: deskTop + 0.012, z: 0.18, ry: Math.PI, rx: 0.0 });
  const cover = mat(options.bookColor ?? C.orange, { rough: 0.6 });
  const paper = mat("#fbf6ea", { rough: 0.9, side: THREE.DoubleSide });
  book.add(mesh(rbox(0.56, 0.014, 0.38, 0.004), cover, { y: -0.004 }));
  book.add(mesh(rbox(0.26, 0.022, 0.35, 0.003), paper, { x: -0.135, y: 0.01 }));
  book.add(mesh(rbox(0.26, 0.022, 0.35, 0.003), paper, { x: 0.135, y: 0.01 }));
  const lines = mat("#b9ad99", { rough: 0.9 });
  for (let i = 0; i < 7; i += 1) {
    book.add(mesh(rbox(0.19, 0.003, 0.012, 0.001), lines, { x: -0.135, y: 0.022, z: -0.13 + i * 0.042, cast: false }));
    book.add(mesh(rbox(0.19 - (i === 6 ? 0.09 : 0), 0.003, 0.012, 0.001), lines, { x: 0.135, y: 0.022, z: -0.13 + i * 0.042, cast: false }));
  }
  const pageHinge = group({ y: 0.023 });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.34), paper);
  page.rotation.x = -Math.PI / 2;
  page.position.x = 0.125;
  page.castShadow = true;
  pageHinge.add(page);
  book.add(pageHinge);
  scene.add(book);
  peter.state.typing = 0;

  // ---- lights ----
  scene.add(new THREE.HemisphereLight("#fff6e6", "#9c8a6c", 1.0));
  const sun = new THREE.DirectionalLight("#fff1dc", 2.6);
  sun.position.set(4, 6, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;
  scene.add(sun);
  const lampLight = new THREE.PointLight("#ffcf8a", 1.4, 2.5, 1.6);
  lampLight.position.set(-0.4, 1.15, 0.3);
  scene.add(lampLight);

  // ---- camera ----
  const camera = new THREE.PerspectiveCamera(26, 1, 0.3, 50);
  const target = new THREE.Vector3(0.05, 1.0, -0.3);
  const dir = new THREE.Vector3(0.42, 0.36, 1).normalize();
  const tallPoints = [new THREE.Vector3(-1.25, 0.1, 0.9), new THREE.Vector3(1.45, 0.1, 0.9), new THREE.Vector3(-1.2, 2.2, -1.1), new THREE.Vector3(1.45, 2.15, -1.1)];
  const widePoints = [new THREE.Vector3(-0.9, 0.5, 0.4), new THREE.Vector3(1.4, 0.6, 0.4), new THREE.Vector3(-0.9, 2.0, -1.1), new THREE.Vector3(1.4, 2.0, -1.1)];
  const tmp = new THREE.Vector3();
  const fit = () => {
    const points = camera.aspect > 1.6 ? widePoints : tallPoints;
    const t = camera.aspect > 1.6 ? new THREE.Vector3(0.3, 1.25, -0.4) : target;
    const d = camera.aspect > 1.6 ? new THREE.Vector3(0.2, 0.18, 1).normalize() : dir;
    let lo = 2;
    let hi = 40;
    for (let i = 0; i < 20; i += 1) {
      const mid = (lo + hi) / 2;
      camera.position.copy(t).addScaledVector(d, mid);
      camera.lookAt(t);
      camera.updateMatrixWorld();
      const fits = points.every((p) => {
        tmp.copy(p).project(camera);
        return Math.abs(tmp.x) < 0.96 && Math.abs(tmp.y) < 0.96;
      });
      if (fits) hi = mid;
      else lo = mid;
    }
    camera.position.copy(t).addScaledVector(d, hi);
    camera.lookAt(t);
    camera.updateMatrixWorld();
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit();
    request();
  };

  // ---- state + loop ----
  let progress = 0;
  let turnsDone = 0;
  let turnAnim = 1;
  let waved = false;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let lastRender = 0;
  let waveTimer = 0;

  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    elapsed += dt;
    // one page turn per eighth of the post
    const wanted = Math.floor(Math.min(progress, 0.999) * 8);
    if (wanted !== turnsDone && turnAnim >= 1) {
      turnsDone = wanted;
      turnAnim = 0;
    }
    if (turnAnim < 1) {
      turnAnim = options.reducedMotion ? 1 : Math.min(1, turnAnim + dt / 0.7);
      const e = turnAnim < 0.5 ? 2 * turnAnim * turnAnim : 1 - Math.pow(-2 * turnAnim + 2, 2) / 2;
      pageHinge.rotation.z = e * Math.PI;
      if (turnAnim >= 1) pageHinge.rotation.z = 0;
    }
    if (progress > 0.97 && !waved) {
      waved = true;
      waveTimer = 3.2;
    }
    if (progress < 0.9) waved = false;
    if (waveTimer > 0) {
      waveTimer -= dt;
      peter.state.wave = 1;
      peter.state.look = 1;
    } else {
      peter.state.wave = 0;
      peter.state.look = 0;
    }
    peter.update(options.reducedMotion ? 0 : elapsed, dt, camera.position);
    // the train: glides through every ~11 s
    const cycle = options.reducedMotion ? 0.35 : (elapsed % 11) / 11;
    train.position.x = -4.6 + Math.min(1, cycle / 0.42) * 10.5;
    puffs.forEach((puff, i) => {
      const p = options.reducedMotion ? 0.3 + i * 0.2 : (elapsed * 0.3 + i / 4) % 1;
      puff.position.set(0.5 + Math.sin(p * 6 + i) * 0.025, deskTop + 0.14 + p * 0.28, 0.42);
      puff.scale.setScalar(0.6 + p * 1.3);
      (puff.material as THREE.MeshStandardMaterial).opacity = Math.sin(p * Math.PI) * 0.4;
    });
    // ~30 fps is plenty for a margin toy
    if (now - lastRender > 30 || options.reducedMotion) {
      draw();
      lastRender = now;
    }
    const busy = turnAnim < 1 || waveTimer > 0;
    if (!options.reducedMotion || busy) request();
  };
  const request = () => {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  };
  const size = new THREE.Vector2();
  const draw = () => {
    renderer.getSize(size);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const corner of windowCorners) {
      tmp.copy(corner).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.x;
      const y = (tmp.y * 0.5 + 0.5) * size.y;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    renderer.autoClear = false;
    renderer.clear();
    renderer.setScissorTest(true);
    renderer.setScissor(Math.floor(minX), Math.floor(minY), Math.ceil(maxX - minX), Math.ceil(maxY - minY));
    renderer.render(outside, camera);
    renderer.setScissorTest(false);
    renderer.clearDepth();
    renderer.render(scene, camera);
  };

  resize();
  return {
    setProgress(next) {
      progress = next;
      request();
    },
    resize,
    setVisible(next) {
      visible = next;
      if (visible) {
        last = performance.now();
        request();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      scene.traverse((object) => {
        const m = object as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
      env.dispose();
      renderer.dispose();
    },
  };
}
