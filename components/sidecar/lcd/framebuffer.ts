import { glyphFor, measure, type FontName } from "./font";

export const LCD_W = 160;
export const LCD_H = 100;

/**
 * Four tones of a reflective monochrome LCD (0 = lit glass, 3 = darkest
 * segment), plus one orange accent segment (4) used sparingly for emphasis.
 */
export const PALETTE = ["#d4d7c8", "#a2a798", "#5b6156", "#1d211b", "#e4521b"] as const;

export type Tone = 0 | 1 | 2 | 3 | 4;
export const ACCENT: Tone = 4;

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function rgba(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  // ImageData is little-endian RGBA on every browser we target.
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

export class Framebuffer {
  readonly w = LCD_W;
  readonly h = LCD_H;
  readonly pixels = new Uint8Array(LCD_W * LCD_H);
  private readonly colors = new Uint32Array(PALETTE.map(rgba));
  private image: ImageData | null = null;
  private words: Uint32Array | null = null;

  clear(tone: Tone = 0) {
    this.pixels.fill(tone);
  }

  px(x: number, y: number, tone: Tone) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= LCD_W || y >= LCD_H) return;
    this.pixels[y * LCD_W + x] = tone;
  }

  get(x: number, y: number): Tone {
    if (x < 0 || y < 0 || x >= LCD_W || y >= LCD_H) return 0;
    return this.pixels[(y | 0) * LCD_W + (x | 0)] as Tone;
  }

  rect(x: number, y: number, w: number, h: number, tone: Tone) {
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(LCD_W, (x + w) | 0);
    const y1 = Math.min(LCD_H, (y + h) | 0);
    for (let yy = y0; yy < y1; yy += 1) this.pixels.fill(tone, yy * LCD_W + x0, yy * LCD_W + x1);
  }

  frame(x: number, y: number, w: number, h: number, tone: Tone) {
    this.hline(x, x + w - 1, y, tone);
    this.hline(x, x + w - 1, y + h - 1, tone);
    this.vline(x, y, y + h - 1, tone);
    this.vline(x + w - 1, y, y + h - 1, tone);
  }

  hline(x0: number, x1: number, y: number, tone: Tone) {
    const a = Math.min(x0, x1);
    const b = Math.max(x0, x1);
    for (let x = a; x <= b; x += 1) this.px(x, y, tone);
  }

  vline(x: number, y0: number, y1: number, tone: Tone) {
    const a = Math.min(y0, y1);
    const b = Math.max(y0, y1);
    for (let y = a; y <= b; y += 1) this.px(x, y, tone);
  }

  line(x0: number, y0: number, x1: number, y1: number, tone: Tone) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    for (let guard = 0; guard < 400; guard += 1) {
      this.px(x0, y0, tone);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * error;
      if (e2 >= dy) {
        error += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        error += dx;
        y0 += sy;
      }
    }
  }

  /** Ordered-dither between two tones; level 0..16 is the share of `on`. */
  dither(x: number, y: number, level: number) {
    return BAYER[((y & 3) << 2) | (x & 3)] < level;
  }

  ditherRect(x: number, y: number, w: number, h: number, level: number, on: Tone, off: Tone | -1 = -1) {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (this.dither(xx, yy, level)) this.px(xx, yy, on);
        else if (off !== -1) this.px(xx, yy, off);
      }
    }
  }

  disc(cx: number, cy: number, r: number, tone: Tone) {
    for (let y = -r; y <= r; y += 1) {
      for (let x = -r; x <= r; x += 1) {
        if (x * x + y * y <= r * r + r * 0.6) this.px(cx + x, cy + y, tone);
      }
    }
  }

  text(
    value: string,
    x: number,
    y: number,
    tone: Tone,
    { font = "s", scale = 1, align = "left" }: { font?: FontName; scale?: number; align?: "left" | "center" | "right" } = {},
  ) {
    let cursor = x;
    const width = measure(value, font, scale);
    if (align === "center") cursor = Math.round(x - width / 2);
    if (align === "right") cursor = x - width;
    for (const char of value) {
      const glyph = glyphFor(font, char);
      for (let gy = 0; gy < glyph.height; gy += 1) {
        for (let gx = 0; gx < glyph.width; gx += 1) {
          if (!glyph.bits[gy * glyph.width + gx]) continue;
          if (scale === 1) this.px(cursor + gx, y + gy, tone);
          else this.rect(cursor + gx * scale, y + gy * scale, scale, scale, tone);
        }
      }
      cursor += (glyph.width + 1) * scale;
    }
    return width;
  }

  /** Text with a one-pixel halo, so labels stay legible over busy scenery. */
  label(value: string, x: number, y: number, tone: Tone, halo: Tone, options?: Parameters<Framebuffer["text"]>[4]) {
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) {
      this.text(value, x + ox, y + oy, halo, options);
    }
    return this.text(value, x, y, tone, options);
  }

  invert(x = 0, y = 0, w = LCD_W, h = LCD_H) {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (xx < 0 || yy < 0 || xx >= LCD_W || yy >= LCD_H) continue;
        const i = yy * LCD_W + xx;
        if (this.pixels[i] !== ACCENT) this.pixels[i] = (3 - this.pixels[i]) as Tone;
      }
    }
  }

  blit(context: CanvasRenderingContext2D) {
    if (!this.image) {
      this.image = context.createImageData(LCD_W, LCD_H);
      this.words = new Uint32Array(this.image.data.buffer);
    }
    const words = this.words!;
    for (let i = 0; i < this.pixels.length; i += 1) words[i] = this.colors[this.pixels[i]];
    context.putImageData(this.image, 0, 0);
  }
}

/** Small deterministic hash for procedural scenery. */
export function hash(n: number) {
  let x = Math.imul(n | 0, 0x27d4eb2d) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 15), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}
