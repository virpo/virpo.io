import { bloomEntries } from "../../../../lib/japan/bloom-data";
import { getBloomTimeline, getTokyoParts, type BloomTimelineItem } from "../../../../lib/japan/bloom";
import { lcdSafe, measure } from "../font";
import { ACCENT, hash, type Framebuffer, type Tone } from "../framebuffer";
import { fillLeds, type Scene, type SceneContext } from "../types";

// BLOOM: the next flower season in Japan, with the main site's pixel flowers
// re-quantised to four LCD tones.

const SIZE = 48;
type Sprite = Int8Array; // -1 transparent, otherwise tone
const sprites = new Map<string, Sprite | "loading">();

function loadSprite(src: string, onReady: () => void) {
  if (sprites.has(src)) return;
  sprites.set(src, "loading");
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0);
    const { data, width } = context.getImageData(0, 0, canvas.width, canvas.height);
    const step = canvas.width / SIZE;
    const outlined = new Int8Array(SIZE * SIZE).fill(-1);
    // Pixel art stays pixel art: nearest sampling, posterised to four tones.
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const i = (Math.floor(y * step + step / 2) * width + Math.floor(x * step + step / 2)) * 4;
        if (data[i + 3] < 120) continue;
        const lum = (0.3 * data[i] + 0.55 * data[i + 1] + 0.15 * data[i + 2]) / 255;
        outlined[y * SIZE + x] = lum > 0.76 ? 0 : lum > 0.56 ? 1 : lum > 0.32 ? 2 : 3;
      }
    }
    sprites.set(src, outlined);
    onReady();
  };
  image.onerror = () => sprites.delete(src);
  image.src = src;
}

const DAY_MS = 86_400_000;
const TOKYO_OFFSET_MS = 9 * 3_600_000;
const pad = (value: number) => String(value).padStart(2, "0");

/** Live countdown to Tokyo midnight `days` days from now, as "T-12D 04:31:07". */
export function tMinus(now: Date, days: number) {
  const { year, month, day } = getTokyoParts(now);
  const target = Date.UTC(year, month - 1, day) - TOKYO_OFFSET_MS + days * DAY_MS;
  const left = Math.max(0, target - now.getTime());
  const whole = Math.floor(left / DAY_MS);
  const rest = Math.floor((left % DAY_MS) / 1000);
  return `T-${whole}D ${pad(Math.floor(rest / 3600))}:${pad(Math.floor((rest % 3600) / 60))}:${pad(rest % 60)}`;
}

export function createBloomScene(): Scene {
  let timeline: BloomTimelineItem[] = [];
  let index = 0;
  let enteredAt = 0;
  let petals: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

  function refresh(context: SceneContext) {
    timeline = getBloomTimeline(bloomEntries, context.now, 6);
    index = Math.min(index, Math.max(0, timeline.length - 1));
  }

  function current() {
    return timeline[index] ?? null;
  }

  function sayCurrent() {
    const item = current();
    if (!item) return "Bloom forecast unavailable.";
    return item.status === "active"
      ? `${item.bloom.name} are blooming now at ${item.bloom.place}, ${item.days} days left.`
      : `Next bloom: ${item.bloom.name} at ${item.bloom.place} in ${item.days} days.`;
  }

  return {
    id: "bloom",
    enter(context) {
      refresh(context);
      enteredAt = context.t;
      for (const item of timeline) loadSprite(item.bloom.pixelArt, () => context.invalidate());
      context.announce(sayCurrent());
    },
    draw(fb: Framebuffer, context) {
      if (!timeline.length) refresh(context);
      fb.clear(0);
      const item = current();
      const tokyo = getTokyoParts(context.now);
      fb.text("BLOOM", 3, 3, 3);
      fb.text("FORECAST", 27, 3, 2);
      fb.text(`JST ${tokyo.label}`, 157, 3, 2, { align: "right" });
      fb.hline(0, 159, 10, 2);

      if (!item) {
        fb.text("NO FORECAST", 80, 46, 3, { align: "center", font: "m" });
        return;
      }

      // A specimen card, like a pressed flower in a field guide.
      const potX = 9;
      fb.rect(potX - 3, 16, SIZE + 8, SIZE + 18, 0);
      fb.frame(potX - 4, 15, SIZE + 10, SIZE + 20, 2);
      fb.hline(potX - 1, potX + SIZE + 1, 15 + SIZE + 10, 1);
      fb.text(`NO.${String(index + 1).padStart(2, "0")}`, potX - 1, 15 + SIZE + 13, 2);

      const sprite = sprites.get(item.bloom.pixelArt);
      const grow = context.reduced ? 1 : Math.min(1, (context.t - enteredAt) / 0.9);
      if (sprite && sprite !== "loading") {
        const visibleFrom = Math.round(SIZE * (1 - grow));
        for (let y = visibleFrom; y < SIZE; y += 1) {
          const sway = context.reduced ? 0 : Math.round(Math.sin(context.t * 1.4 + y * 0.09) * (1 - y / SIZE) * 1.6);
          for (let x = 0; x < SIZE; x += 1) {
            const tone = sprite[y * SIZE + x];
            if (tone >= 0) fb.px(potX + x + sway, 19 + y, tone as Tone);
          }
        }
      } else {
        fb.text("...", 36, 50, 2, { align: "center" });
      }

      // Falling petals after a press of the action key.
      petals = petals.filter((petal) => petal.life > 0);
      for (const petal of petals) {
        petal.x += petal.vx * context.dt;
        petal.y += petal.vy * context.dt;
        petal.vx += Math.sin(context.t * 3 + petal.life * 9) * context.dt * 30;
        petal.life -= context.dt;
        fb.px(petal.x, petal.y, 2);
        fb.px(petal.x + 1, petal.y, 1);
      }

      const active = item.status === "active";
      const x = 70;
      fb.text(active ? "IN BLOOM NOW" : "NEXT BLOOM", x, 15, 2);
      const name = lcdSafe(item.bloom.name);
      fb.text(name, x, 22, 3, { font: measure(name, "m") > 88 ? "s" : "m" });
      const days = String(item.days);
      const digitsWidth = fb.text(days, x, 34, ACCENT, { font: "m", scale: 3 });
      fb.text(item.days === 1 ? "DAY" : "DAYS", x + digitsWidth + 3, 46, 3);
      fb.text(active ? "LEFT" : "TO GO", x + digitsWidth + 3, 53, 2);
      const place = lcdSafe(item.bloom.place);
      fb.text(place, x, 64, 3);
      fb.text(lcdSafe(item.bloom.region), x, 71, 2);

      // Pager.
      for (let i = 0; i < timeline.length; i += 1) fb.rect(x + i * 6, 82, 4, 2, i === index ? 3 : 1);
      // A live T-minus to the first (or last) day, ticking in Tokyo time.
      fb.text(active ? "ENDS" : "OPENS", x, 91, 2);
      fb.text(tMinus(context.now, active ? item.days + 1 : item.days), 157, 91, ACCENT, { align: "right" });
    },
    live() {
      return petals.length > 0;
    },
    action(context) {
      for (let i = 0; i < 26; i += 1) {
        petals.push({ x: 10 + hash(i * 3 + Math.floor(context.t)) * 50, y: 12 + hash(i * 7) * 20, vx: 8 + hash(i * 11) * 14, vy: 10 + hash(i * 13) * 18, life: 2 + hash(i) * 2 });
      }
      context.announce("Petals fall.");
    },
    prev(context) {
      if (!timeline.length) return;
      index = (index - 1 + timeline.length) % timeline.length;
      enteredAt = context.t;
      context.announce(sayCurrent());
    },
    next(context) {
      if (!timeline.length) return;
      index = (index + 1) % timeline.length;
      enteredAt = context.t;
      context.announce(sayCurrent());
    },
    leds() {
      const item = current();
      if (!item) return fillLeds(0);
      return fillLeds(item.status === "active" ? 1 : Math.max(0.04, 1 - item.days / 120));
    },
    describe() {
      return sayCurrent();
    },
    softkeys() {
      return ["Earlier", "Petals", "Later"];
    },
  };
}
