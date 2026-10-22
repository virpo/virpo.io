import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { hotspotById, type RoomHotspotKind } from "../hotspots";
import type { BuildContext, Lighting, SpotOptions } from "./context";
import { buildHouse } from "./house";
import { Spring } from "./kit";
import type { PeterRig } from "./peter";
import { createGlowMaterial, createOutlineMaterial } from "./post";
import { buildRailway, type Railway } from "./railway";
import { buildScenery } from "./scenery";

export const KIND_COLORS: Record<RoomHotspotKind, string> = {
  post: "#ff5a12",
  writing: "#ff5a12",
  about: "#ff5a12",
  project: "#2c6cff",
  toy: "#12a35f",
};

export type LightingName = "day" | "dusk" | "night";

export const LIGHTING_PRESETS: Record<LightingName, Lighting> = {
  day: { night: 0, dusk: 0 },
  dusk: { night: 0.42, dusk: 1 },
  night: { night: 1, dusk: 0 },
};

export type Spot = {
  id: string;
  object: THREE.Object3D;
  base: THREE.Vector3;
  baseScale: THREE.Vector3;
  lift: number;
  pop: number;
  anchor: THREE.Vector3;
  outline: THREE.ShaderMaterial;
  glow: THREE.ShaderMaterial;
  pickables: THREE.Object3D[];
  spring: Spring;
  focus: THREE.Vector3;
  active: boolean;
};

const mixColor = (a: string, b: string, c: string, dusk: number, night: number) => {
  const color = new THREE.Color(a).lerp(new THREE.Color(b), dusk);
  return color.lerp(new THREE.Color(c), night);
};

export type World = {
  scene: THREE.Scene;
  spots: Spot[];
  spotById: Map<string, Spot>;
  peter: PeterRig;
  railway: Railway;
  sun: THREE.DirectionalLight;
  lighting: Lighting;
  background: { top: THREE.Color; bottom: THREE.Color; glow: THREE.Color };
  setLighting(name: LightingName, instant?: boolean): void;
  lightingBusy(): boolean;
  update(t: number, dt: number): void;
  setOutlineResolution(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
};

export function buildWorld(options: { reducedMotion: boolean; mobile: boolean; tokyoLabel: string; shadowSize: number }): World {
  const scene = new THREE.Scene();
  const spots: Spot[] = [];
  const animators: ((t: number, dt: number, light: Lighting) => void)[] = [];
  const glows: { material: THREE.MeshStandardMaterial; day: number; night: number }[] = [];
  const lamps: { light: THREE.Light; day: number; night: number }[] = [];
  const pendingSpots: { id: string; object: THREE.Object3D; options: SpotOptions }[] = [];

  const ctx: BuildContext = {
    spot(id, object, opts = {}) {
      object.userData.spot = id;
      object.userData.dynamic = true;
      pendingSpots.push({ id, object, options: opts });
    },
    animate(fn) {
      animators.push(fn);
    },
    glow(material, day, night) {
      glows.push({ material, day, night });
    },
    lamp(light, day, night) {
      lamps.push({ light, day, night });
    },
    reducedMotion: options.reducedMotion,
    mobile: options.mobile,
  };

  const { root: house, peter } = buildHouse(ctx);
  const railway = buildRailway(ctx);
  const { root: scenery } = buildScenery(ctx, options.tokyoLabel);
  scene.add(scenery, house, railway.root);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight("#fff6e6", "#9a8462", 1.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1dc", 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(options.shadowSize, options.shadowSize);
  const sc = sun.shadow.camera;
  sc.left = -9.5;
  sc.right = 9.5;
  sc.top = 9.5;
  sc.bottom = -9.5;
  sc.near = 1;
  sc.far = 45;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 4;
  sun.target.position.set(0, 0, -0.5);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#dfe8ff", 0.35);
  fill.position.set(-8, 6, 10);
  scene.add(fill);

  // ---------- spots ----------
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const { id, object, options: opts } of pendingSpots) {
    const info = hotspotById.get(id);
    const outline = createOutlineMaterial(KIND_COLORS[info?.kind ?? "toy"], 3.2);
    const glow = createGlowMaterial(KIND_COLORS[info?.kind ?? "toy"]);
    const pickables: THREE.Object3D[] = [];
    const meshes: THREE.Mesh[] = [];
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !child.userData.contact) meshes.push(child as THREE.Mesh);
    });
    for (const m of meshes) {
      pickables.push(m);
      const material = Array.isArray(m.material) ? m.material[0] : m.material;
      if (opts.noOutline || (material as THREE.Material).transparent) continue;
      const shell = new THREE.Mesh(m.geometry, outline);
      shell.castShadow = false;
      shell.receiveShadow = false;
      shell.renderOrder = 2;
      shell.raycast = () => undefined;
      shell.userData.outline = true;
      m.add(shell);
      const sheen = new THREE.Mesh(m.geometry, glow);
      sheen.castShadow = false;
      sheen.receiveShadow = false;
      sheen.renderOrder = 3;
      sheen.raycast = () => undefined;
      m.add(sheen);
    }
    box.setFromObject(object);
    const focus = box.getCenter(new THREE.Vector3());
    const anchorWorld = opts.anchor
      ? object.localToWorld(opts.anchor.clone())
      : new THREE.Vector3(focus.x, box.max.y + 0.08, focus.z);
    const anchor = object.worldToLocal(anchorWorld.clone());
    const spot: Spot = {
      id,
      object,
      base: object.position.clone(),
      baseScale: object.scale.clone(),
      lift: opts.lift ?? 0.12,
      pop: opts.pop ?? 1.06,
      anchor,
      outline,
      glow,
      pickables,
      spring: new Spring(0, 240, 14),
      focus,
      active: false,
    };
    if (id === "peter") spot.focus = peter.head.getWorldPosition(new THREE.Vector3());
    spots.push(spot);
  }
  spots.sort((a, b) => (hotspotById.get(a.id)?.fig ?? 0) - (hotspotById.get(b.id)?.fig ?? 0));
  const spotById = new Map(spots.map((spot) => [spot.id, spot]));

  mergeStatic(scene);

  // ---------- lighting transitions ----------
  const lighting: Lighting = { night: 0, dusk: 0 };
  let target: Lighting = { ...lighting };
  const background = { top: new THREE.Color(), bottom: new THREE.Color(), glow: new THREE.Color() };
  const applyLighting = () => {
    const { dusk, night } = lighting;
    sun.color.copy(mixColor("#fff1dc", "#ffab6e", "#9fb3ff", dusk, night));
    sun.intensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(3.3, 2.2, dusk), 0.6, night);
    const dayPos = new THREE.Vector3(9, 12, 6);
    const duskPos = new THREE.Vector3(-11, 5.5, 5);
    const nightPos = new THREE.Vector3(6, 11, -2);
    sun.position.copy(dayPos.lerp(duskPos, dusk).lerp(nightPos, night));
    hemi.color.copy(mixColor("#fff6e6", "#f5c4a6", "#5d6ea3", dusk, night));
    hemi.groundColor.copy(mixColor("#a08a66", "#6b5466", "#22252f", dusk, night));
    hemi.intensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.95, 0.8, dusk), 0.45, night);
    fill.intensity = THREE.MathUtils.lerp(0.35, 0.12, night);
    scene.environmentIntensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.5, 0.38, dusk), 0.16, night);
    const lit = Math.min(1, night + dusk * 0.55);
    for (const g of glows) g.material.emissiveIntensity = THREE.MathUtils.lerp(g.day, g.night, lit);
    for (const l of lamps) l.light.intensity = THREE.MathUtils.lerp(l.day, l.night, lit);
    background.top.copy(mixColor("#f6eddd", "#f0bf9f", "#232c4b", dusk, night));
    background.bottom.copy(mixColor("#e9dcc5", "#9d8db0", "#10152a", dusk, night));
    background.glow.copy(mixColor("#fffaf0", "#ffe0bb", "#3a4677", dusk, night));
  };
  applyLighting();

  const setOutlineResolution = (width: number, height: number, pixelRatio: number) => {
    for (const spot of spots) {
      spot.outline.uniforms.resolution.value.set(width, height);
      spot.outline.uniforms.width.value = 3.6 * pixelRatio;
    }
  };

  const update = (t: number, dt: number) => {
    // lighting easing
    const k = 1 - Math.exp(-dt * 2.6);
    const before = lighting.night + lighting.dusk;
    lighting.night += (target.night - lighting.night) * k;
    lighting.dusk += (target.dusk - lighting.dusk) * k;
    if (Math.abs(lighting.night + lighting.dusk - before) > 1e-5) applyLighting();

    for (const spot of spots) {
      spot.spring.target = spot.active ? 1 : 0;
      const h = options.reducedMotion ? (spot.spring.snap(spot.spring.target), spot.spring.value) : spot.spring.step(Math.min(dt, 0.04));
      spot.object.position.y = spot.base.y + h * spot.lift;
      const pop = 1 + (spot.pop - 1) * h;
      spot.object.scale.copy(spot.baseScale).multiplyScalar(pop);
      const opacity = THREE.MathUtils.clamp(spot.spring.value * 1.4, 0, 1);
      spot.outline.uniforms.opacity.value = opacity;
      spot.glow.uniforms.opacity.value = opacity * 0.55;
      const visible = opacity > 0.001;
      if (spot.object.userData.shellsVisible !== visible) {
        spot.object.userData.shellsVisible = visible;
        spot.object.traverse((child) => {
          const mat = (child as THREE.Mesh).material;
          if (mat === spot.outline || mat === spot.glow) child.visible = visible;
        });
      }
    }
    for (const fn of animators) fn(t, dt, lighting);
    railway.update(t, dt);
  };

  return {
    scene,
    spots,
    spotById,
    peter,
    railway,
    sun,
    lighting,
    background,
    setLighting(name, instant = false) {
      target = { ...LIGHTING_PRESETS[name] };
      if (instant) {
        lighting.night = target.night;
        lighting.dusk = target.dusk;
        applyLighting();
      }
    },
    lightingBusy() {
      return Math.abs(target.night - lighting.night) + Math.abs(target.dusk - lighting.dusk) > 0.002;
    },
    update,
    setOutlineResolution,
    dispose() {
      scene.traverse((object) => {
        const m = object as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose();
          const materials = Array.isArray(m.material) ? m.material : [m.material];
          for (const material of materials) {
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
            material.dispose();
          }
        }
      });
    },
  };
}

/** Merge every static, single-material mesh by material to cut draw calls. */
function mergeStatic(scene: THREE.Scene) {
  scene.updateMatrixWorld(true);
  const buckets = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[]; cast: boolean; receive: boolean; uv: boolean }>();
  const remove: THREE.Mesh[] = [];
  const isDynamic = (object: THREE.Object3D | null): boolean => {
    for (let o = object; o; o = o.parent) if (o.userData.dynamic) return true;
    return false;
  };
  scene.traverse((object) => {
    const m = object as THREE.Mesh;
    if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh || Array.isArray(m.material)) return;
    if (isDynamic(m)) return;
    const material = m.material as THREE.MeshStandardMaterial;
    if (material.transparent && !m.userData.contact) return;
    const uv = Boolean(material.map);
    const key = `${material.uuid}|${m.castShadow}|${m.receiveShadow}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, geometries: [], cast: m.castShadow, receive: m.receiveShadow, uv };
      buckets.set(key, bucket);
    }
    const geometry = m.geometry.clone();
    geometry.applyMatrix4(m.matrixWorld);
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal" && !(uv && name === "uv")) geometry.deleteAttribute(name);
    }
    if (!geometry.index) {
      const count = geometry.attributes.position.count;
      const index = new (count > 65535 ? Uint32Array : Uint16Array)(count);
      for (let i = 0; i < count; i += 1) index[i] = i;
      geometry.setIndex(new THREE.BufferAttribute(index, 1));
    }
    geometry.clearGroups();
    bucket.geometries.push(geometry);
    remove.push(m);
  });
  for (const m of remove) m.parent?.remove(m);
  for (const bucket of buckets.values()) {
    const merged = mergeGeometries(bucket.geometries, false);
    for (const g of bucket.geometries) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    if (bucket.material.transparent) mesh.renderOrder = -1;
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
  }
}
