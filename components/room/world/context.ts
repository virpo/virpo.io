import type * as THREE from "three";

export type Lighting = {
  /** 0 = day, 1 = night; dusk sits around 0.5 */
  night: number;
  dusk: number;
};

export type SpotOptions = {
  /** How far (world units) the object springs up on hover. */
  lift?: number;
  /** Marker anchor in the object's local space; defaults to the top of its bounds. */
  anchor?: THREE.Vector3;
  /** Extra objects (not under the spot) that light up with it. */
  extras?: THREE.Object3D[];
  /** Skip outline on these (e.g. glass). */
  noOutline?: boolean;
  /** Hover scale boost. */
  pop?: number;
  /** Add an invisible box around the object so hovering anywhere over open or sparse objects works. */
  hull?: boolean;
};

export type BuildContext = {
  spot(id: string, object: THREE.Object3D, options?: SpotOptions): void;
  animate(fn: (t: number, dt: number, light: Lighting) => void): void;
  /** Emissive materials scale with night-ness: value = day + (night - day) * lighting.night */
  glow(material: THREE.MeshStandardMaterial, day: number, night: number): void;
  /** Lights that fade up at dusk / night. */
  lamp(light: THREE.Light, day: number, night: number): void;
  reducedMotion: boolean;
  mobile: boolean;
};
