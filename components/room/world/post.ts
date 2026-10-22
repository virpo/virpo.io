import * as THREE from "three";

// Single-pass "scatter-as-gather" bokeh depth of field with a tilt-shift band,
// composited over a soft studio sweep. The scene is rendered linear/HDR into a
// half-float target so bright lamps bloom into proper bokeh discs when defocused.

const TAPS = 44;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  #include <common>
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform vec2 resolution;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float focusDist;
  uniform float aperture;
  uniform float maxBlur;
  uniform float focusY;
  uniform float tilt;
  uniform vec3 bgTop;
  uniform vec3 bgBottom;
  uniform vec3 bgGlow;
  uniform float time;
  uniform float grain;
  uniform float vignette;
  uniform float taps;
  varying vec2 vUv;

  float linearDepth(float d) {
    float z = d * 2.0 - 1.0;
    return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
  }

  float blurSize(vec2 uv, out float depth) {
    float d = texture2D(tDepth, uv).x;
    depth = d >= 1.0 ? cameraFar : linearDepth(d);
    float lens = abs(depth - focusDist) / max(depth, 0.001) * aperture;
    float band = smoothstep(0.26, 0.75, abs(uv.y - focusY) * tilt);
    return clamp(max(lens, band * 0.6), 0.0, 1.0) * maxBlur;
  }

  vec3 background(vec2 uv) {
    vec3 col = mix(bgBottom, bgTop, smoothstep(0.0, 1.0, uv.y));
    vec2 p = (uv - vec2(0.5, 0.56)) * vec2(resolution.x / resolution.y, 1.0);
    col = mix(col, bgGlow, smoothstep(0.75, 0.0, length(p)) * 0.55);
    return col;
  }

  void main() {
    float centerDepth;
    float centerSize = blurSize(vUv, centerDepth);
    vec4 center = texture2D(tColor, vUv);
    vec4 acc = center;
    float total = 1.0;
    vec2 texel = 1.0 / resolution;
    for (int i = 0; i < ${TAPS}; i++) {
      if (float(i) >= taps) break;
      float fi = float(i) + 0.5;
      float r = sqrt(fi / taps) * maxBlur;
      float a = fi * 2.39996323;
      vec2 suv = vUv + vec2(cos(a), sin(a)) * r * texel;
      float sampleDepth;
      float sampleSize = blurSize(suv, sampleDepth);
      if (sampleDepth > centerDepth) sampleSize = min(sampleSize, centerSize * 2.0);
      float m = smoothstep(r - 1.0, r + 1.0, sampleSize);
      vec4 s = texture2D(tColor, suv);
      float lum = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
      float boost = 1.0 + smoothstep(0.9, 2.6, lum) * 5.0 * smoothstep(2.0, 8.0, sampleSize);
      acc += mix(acc / total, s, m) * mix(1.0, boost, m);
      total += mix(1.0, boost, m);
    }
    vec4 scene = acc / total;
    vec3 bg = background(vUv);
    vec3 color = bg * (1.0 - clamp(scene.a, 0.0, 1.0)) + scene.rgb;
    vec2 v = vUv - 0.5;
    color *= 1.0 - dot(v, v) * vignette;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    float n = fract(sin(dot(vUv * resolution + time * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor.rgb += (n - 0.5) * grain;
  }
`;

export type PostPass = {
  target: THREE.WebGLRenderTarget;
  material: THREE.ShaderMaterial;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  setSize(width: number, height: number): void;
  dispose(): void;
};

export function createPostPass(renderer: THREE.WebGLRenderer, samples: number): PostPass {
  const depthTexture = new THREE.DepthTexture(1, 1);
  depthTexture.type = THREE.UnsignedIntType;
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples,
    depthTexture,
    depthBuffer: true,
  });
  target.texture.colorSpace = THREE.LinearSRGBColorSpace;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tColor: { value: target.texture },
      tDepth: { value: depthTexture },
      resolution: { value: new THREE.Vector2(1, 1) },
      cameraNear: { value: 1 },
      cameraFar: { value: 100 },
      focusDist: { value: 30 },
      aperture: { value: 9 },
      maxBlur: { value: 12 },
      focusY: { value: 0.5 },
      tilt: { value: 1.6 },
      bgTop: { value: new THREE.Color("#f4ead9") },
      bgBottom: { value: new THREE.Color("#e8dac2") },
      bgGlow: { value: new THREE.Color("#fff7ea") },
      time: { value: 0 },
      grain: { value: 0.018 },
      vignette: { value: 0.5 },
      taps: { value: TAPS },
    },
  });
  material.toneMapped = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  void renderer;

  return {
    target,
    material,
    scene,
    camera,
    setSize(width, height) {
      target.setSize(width, height);
      material.uniforms.resolution.value.set(width, height);
    },
    dispose() {
      target.dispose();
      depthTexture.dispose();
      material.dispose();
      quad.geometry.dispose();
    },
  };
}

// ---------- screen-space rim outline (inverted hull) ----------

export function createOutlineMaterial(color: string, width: number) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      color: { value: new THREE.Color(color) },
      width: { value: width },
      resolution: { value: new THREE.Vector2(1, 1) },
      opacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float width;
      uniform vec2 resolution;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 viewNormal = normalize(normalMatrix * normal);
        vec2 dir = (projectionMatrix * vec4(viewNormal, 0.0)).xy;
        float len = length(dir);
        dir = len > 1e-5 ? dir / len : vec2(0.0);
        clip.xy += dir * width * 2.0 / resolution * clip.w;
        gl_Position = clip;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float opacity;
      void main() {
        gl_FragColor = vec4(color * 1.6, opacity);
      }
    `,
  });
}

/** Additive fresnel rim + faint tint, layered on the hovered object's own surfaces. */
export function createGlowMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - clamp(abs(dot(normalize(vNormal), normalize(vView))), 0.0, 1.0), 2.2);
        gl_FragColor = vec4(color * (rim * 1.4 + 0.12) * opacity, 1.0);
      }
    `,
  });
}
