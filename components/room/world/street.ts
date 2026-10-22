import * as THREE from "three";
import type { BuildContext } from "./context";
import { C, capsule, contact, cyl, dynamic, group, mat, mesh, ownMat, rbox, sphere } from "./kit";

// Street life: two kei cars that wait at the level crossings while a train goes by,
// and a neighbour walking a dog along the pavement. Small, slow and toy-like.

const ROAD_Z = 1.5;
const LANE = 0.24;
const EDGE = 6.9;

function keiCar(body: string, roof: string, ctx: BuildContext) {
  const car = dynamic(group({}));
  const shell = group({ y: 0.2 });
  shell.add(mesh(rbox(0.56, 0.2, 0.32, 0.07), mat(body, { rough: 0.35, clearcoat: 0.5 })));
  shell.add(mesh(rbox(0.36, 0.17, 0.3, 0.06), mat(roof, { rough: 0.35, clearcoat: 0.5 }), { x: -0.04, y: 0.16 }));
  shell.add(mesh(rbox(0.3, 0.12, 0.31, 0.04), mat("#2f3b4f", { rough: 0.15, metal: 0.2 }), { x: -0.04, y: 0.16 }));
  const lights = ownMat("#fff4d6", { emissive: "#ffe6a8", emissiveIntensity: 0.2 });
  ctx.glow(lights, 0.2, 5);
  for (const z of [-0.1, 0.1]) shell.add(mesh(sphere(0.028, 8, 6), lights, { x: 0.28, y: 0.0, z, cast: false }));
  const tail = ownMat("#7a1d14", { emissive: "#ff3a1a", emissiveIntensity: 0.1 });
  ctx.glow(tail, 0.1, 3);
  for (const z of [-0.11, 0.11]) shell.add(mesh(sphere(0.022, 8, 6), tail, { x: -0.28, y: 0.02, z, cast: false }));
  car.add(shell);
  const wheel = mat(C.ink, { rough: 0.6 });
  for (const x of [-0.17, 0.17]) for (const z of [-0.15, 0.15]) car.add(mesh(cyl(0.07, 0.07, 0.06, 14), wheel, { x, y: 0.08, z, rx: Math.PI / 2 }));
  car.add(contact(0.75, 0.48, { y: -0.005 }, 0.8));
  car.userData.noShadow = true;
  return { car, shell };
}

function walker(coat: string, hair: string) {
  const person = dynamic(group({}));
  const legs: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const leg = dynamic(group({ x: 0, y: 0.17, z: side * 0.035 }));
    leg.add(mesh(capsule(0.025, 0.1, 3, 8), mat(C.denim), { y: -0.07 }));
    leg.add(mesh(rbox(0.06, 0.03, 0.04, 0.012), mat(C.white), { x: 0.01, y: -0.14 }));
    person.add(leg);
    legs.push(leg);
  }
  person.add(mesh(capsule(0.06, 0.12, 4, 10), mat(coat, { rough: 0.8 }), { y: 0.27 }));
  person.add(mesh(sphere(0.07, 14, 10), mat(C.skin, { rough: 0.6 }), { y: 0.44 }));
  person.add(mesh(sphere(0.074, 14, 10, ), mat(hair, { rough: 0.8 }), { y: 0.47, x: -0.012, s: [1, 0.62, 1] }));
  person.add(contact(0.25, 0.25, { y: 0 }, 0.7));
  person.userData.noShadow = true;
  return { person, legs };
}

function dog() {
  const pup = dynamic(group({}));
  const fur = mat("#b9824e", { rough: 0.85 });
  pup.add(mesh(capsule(0.035, 0.08, 3, 8), fur, { y: 0.07, rz: Math.PI / 2 }));
  pup.add(mesh(sphere(0.04, 10, 8), fur, { x: 0.07, y: 0.1 }));
  pup.add(mesh(sphere(0.016, 6, 5), mat(C.ink), { x: 0.105, y: 0.1 }));
  for (const x of [-0.035, 0.035]) for (const z of [-0.02, 0.02]) pup.add(mesh(cyl(0.01, 0.01, 0.05, 5), fur, { x, y: 0.025, z }));
  pup.add(mesh(capsule(0.008, 0.05, 2, 5), fur, { x: -0.07, y: 0.11, rz: 0.8 }));
  pup.add(contact(0.18, 0.12, {}, 0.6));
  pup.userData.noShadow = true;
  return pup;
}

export function buildStreet(ctx: BuildContext, crossings: { x: number; closed(): boolean }[]) {
  const root = group({ name: "street" });

  // ---- cars ----
  const cars = [
    { ...keiCar("#8fd0b8", "#f4f1ea", ctx), x: -2.5, dir: 1, speed: 0, cruise: 1.05 },
    { ...keiCar("#e8604c", "#f4f1ea", ctx), x: 3.8, dir: -1, speed: 0, cruise: 0.9 },
  ];
  for (const c of cars) {
    c.car.position.set(c.x, 0.04, ROAD_Z + (c.dir > 0 ? LANE : -LANE));
    c.car.rotation.y = c.dir > 0 ? 0 : Math.PI;
    root.add(c.car);
  }

  // ---- a neighbour walking the dog along the front pavement ----
  const { person, legs } = walker("#d9a531", C.hair);
  const pup = dog();
  root.add(person, pup);
  const walk = { x: -1.2, dir: 1, pause: 0 };

  ctx.animate((t, dt) => {
    if (ctx.reducedMotion) return;
    const step = Math.min(dt, 0.05);
    for (const c of cars) {
      // stop short of a closed crossing; otherwise ease back up to speed
      let limit = c.cruise;
      for (const crossing of crossings) {
        const ahead = (crossing.x - c.car.position.x) * c.dir;
        if (crossing.closed() && ahead > 0.4 && ahead < 1.8) limit = Math.min(limit, Math.max(0, (ahead - 0.75) * 1.4));
      }
      c.speed += (limit - c.speed) * (1 - Math.exp(-step * 3));
      c.car.position.x += c.dir * c.speed * step;
      if (c.car.position.x * c.dir > EDGE) c.car.position.x = -EDGE * c.dir;
      // pop in and out at the ends of the plinth like a toy on a track
      const fade = THREE.MathUtils.clamp((EDGE - Math.abs(c.car.position.x)) / 0.5, 0, 1);
      c.car.scale.setScalar(Math.max(0.001, fade));
      c.shell.position.y = 0.2 + Math.sin(t * 22 + c.x) * 0.004 * (c.speed / c.cruise);
    }

    if (walk.pause > 0) walk.pause -= step;
    else {
      walk.x += walk.dir * step * 0.32;
      if (walk.x > 2.4 || walk.x < -1.4) {
        walk.dir *= -1;
        walk.pause = 1.6;
      }
    }
    const moving = walk.pause <= 0;
    person.position.set(walk.x, 0.07, 2.18);
    person.rotation.y = walk.dir > 0 ? 0 : Math.PI;
    person.position.y = 0.07 + (moving ? Math.abs(Math.sin(t * 7)) * 0.012 : 0);
    legs[0].rotation.z = moving ? Math.sin(t * 7) * 0.5 : 0;
    legs[1].rotation.z = moving ? -Math.sin(t * 7) * 0.5 : 0;
    pup.position.set(walk.x + walk.dir * 0.38, 0.07, 2.3);
    pup.rotation.y = walk.dir > 0 ? 0 : Math.PI;
    pup.position.y = 0.07 + (moving ? Math.abs(Math.sin(t * 13)) * 0.015 : 0);
  });

  if (ctx.reducedMotion) {
    person.position.set(walk.x, 0.07, 2.18);
    pup.position.set(walk.x + 0.38, 0.07, 2.3);
  }

  return root;
}
