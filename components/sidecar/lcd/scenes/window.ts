import { ACCENT, hash, LCD_H, LCD_W, type Framebuffer, type Tone } from "../framebuffer";
import { ARRIVED_AT, nextStation, STATIONS } from "../route";
import { fillLeds, type Scene, type SceneContext } from "../types";

// WINDOW: a seat on the Tokaido shinkansen. Everything outside is procedural
// and indexed by world distance, so the scenery scrolls forever without tiles.

const WIN = { x0: 23, y0: 7, x1: 153, y1: 83, r: 9 };
const HORIZON = 58;
const LOOP_SECONDS = 180;
const CRUISE = 285;

const mask = new Uint8Array(LCD_W * LCD_H);
for (let y = 0; y < LCD_H; y += 1) {
  for (let x = 0; x < LCD_W; x += 1) {
    let inside = x >= WIN.x0 && x < WIN.x1 && y >= WIN.y0 && y < WIN.y1;
    if (inside) {
      const cx = x < WIN.x0 + WIN.r ? WIN.x0 + WIN.r : x >= WIN.x1 - WIN.r ? WIN.x1 - WIN.r - 1 : x;
      const cy = y < WIN.y0 + WIN.r ? WIN.y0 + WIN.r : y >= WIN.y1 - WIN.r ? WIN.y1 - WIN.r - 1 : y;
      const dx = x - cx;
      const dy = y - cy;
      inside = dx * dx + dy * dy <= WIN.r * WIN.r;
    }
    mask[y * LCD_W + x] = inside ? 1 : 0;
  }
}

const wrap = (value: number, size: number) => ((value % size) + size) % size;

function journey(context: SceneContext) {
  return context.progress ?? wrap(context.t, LOOP_SECONDS) / LOOP_SECONDS;
}


export function createWindowScene(): Scene {
  let distance = 1830;
  let speed = CRUISE;
  let target: number | null = null;
  let nightOverride: boolean | null = null;
  let arrivedAnnounced = false;
  let boardRise = 0;

  const isNight = (context: SceneContext) => nightOverride ?? context.night;
  const arrived = (context: SceneContext) => context.progress !== null && context.progress >= ARRIVED_AT;

  function drawSky(fb: Framebuffer, night: boolean, t: number) {
    for (let y = 0; y < HORIZON; y += 1) {
      for (let x = WIN.x0; x < WIN.x1; x += 1) {
        if (night) {
          const glow = y > 46 ? Math.round(((y - 46) / (HORIZON - 46)) * 5) : 0;
          let tone: Tone = fb.dither(x, y, glow) ? 2 : 3;
          const star = hash(x * 131 + y * 977);
          if (y < 42 && star > 0.993) tone = Math.sin(t * 2 + star * 40) > -0.3 ? 0 : 1;
          fb.px(x, y, tone);
        } else {
          const level = 3 + Math.round(Math.max(0, 1 - y / HORIZON) * 5);
          fb.px(x, y, fb.dither(x, y, level) ? 1 : 0);
        }
      }
    }
  }

  function drawClouds(fb: Framebuffer, night: boolean, offset: number) {
    const clouds = [
      { x: 40, y: 15, s: 1 },
      { x: 120, y: 22, s: 0.7 },
      { x: 205, y: 12, s: 1.2 },
      { x: 262, y: 27, s: 0.6 },
    ];
    for (const cloud of clouds) {
      const cx = wrap(cloud.x - offset, 300) - 40;
      const puffs = [
        [0, 0, 5],
        [6, -2, 6],
        [13, 0, 5],
        [-6, 1, 4],
        [19, 2, 3],
      ];
      for (const [px, py, pr] of puffs) {
        const r = Math.max(2, Math.round(pr * cloud.s));
        const ox = Math.round(cx + px * cloud.s);
        const oy = Math.round(cloud.y + py * cloud.s);
        for (let y = -r; y <= r; y += 1) {
          if (oy + y > cloud.y + 3 * cloud.s) continue;
          for (let x = -r; x <= r; x += 1) {
            if (x * x + y * y > r * r) continue;
            const sx = ox + x;
            const sy = oy + y;
            if (sx < WIN.x0 || sx >= WIN.x1) continue;
            const under = sy > cloud.y + 1;
            if (night) continue;
            else fb.px(sx, sy, under && fb.dither(sx, sy, 6) ? 1 : 0);
          }
        }
      }
    }
  }

  function drawFuji(fb: Framebuffer, night: boolean, t: number) {
    const fx = 74 + Math.sin(t * 0.03) * 3;
    const peak = 24;
    for (let y = peak; y < HORIZON + 2; y += 1) {
      const k = (y - peak) / (HORIZON - peak);
      const half = 3 + 46 * Math.pow(k, 1.5);
      for (let x = Math.floor(fx - half); x <= Math.ceil(fx + half); x += 1) {
        if (x < WIN.x0 || x >= WIN.x1) continue;
        const snowLine = peak + 9 + Math.round(hash(x * 17) * 2) + (hash(Math.floor(x / 2) * 7) > 0.55 ? Math.round(hash(x * 3) * 6) : 0);
        const edge = Math.abs(x - fx) > half - 1;
        const shadow = x > fx + 1;
        let tone: Tone;
        if (y < snowLine) tone = night ? 1 : edge ? 2 : shadow && fb.dither(x, y, 5) ? 1 : 0;
        else if (night) tone = 2;
        else if (edge) tone = 2;
        else tone = shadow ? (fb.dither(x, y, 11) ? 2 : 1) : fb.dither(x, y, 3) ? 2 : 1;
        fb.px(x, y, tone);
      }
    }
  }

  function drawHills(fb: Framebuffer, night: boolean, offset: number) {
    for (let x = WIN.x0; x < WIN.x1; x += 1) {
      const wx = x + offset;
      const h = 6 + 4 * Math.sin(wx * 0.031) + 3 * Math.sin(wx * 0.073 + 1.3) + 1.5 * Math.sin(wx * 0.19);
      const top = Math.round(HORIZON - h);
      for (let y = top; y < 64; y += 1) {
        if (night) fb.px(x, y, y === top ? 2 : 3);
        else fb.px(x, y, y === top ? 2 : fb.dither(x, y, 7) ? 2 : 1);
      }
    }
  }

  function drawTown(fb: Framebuffer, night: boolean, offset: number) {
    const base = 69;
    for (let x = WIN.x0; x < WIN.x1; x += 1) {
      const wx = Math.floor(x + offset);
      // Rice fields and roads between the hills and the town.
      for (let y = 63; y < base; y += 1) fb.px(x, y, night ? (y === 66 && wrap(wx, 23) < 2 ? 1 : 3) : fb.dither(wx, y, y === 66 ? 12 : 4) ? 2 : 1);

      const lot = Math.floor(wx / 11);
      const local = wrap(wx, 11);
      const kind = hash(lot);
      const height = 4 + Math.floor(hash(lot * 13 + 5) * 7);
      if (local > 8) continue;
      let top = base;
      if (kind < 0.18) continue;
      if (kind < 0.6) top = base - height + Math.round(Math.abs(local - 4) * 0.75);
      else if (kind < 0.82) top = base - height - 6;
      else top = base - 5 - Math.round(Math.sqrt(Math.max(0, 16 - (local - 4) ** 2)));
      for (let y = top; y < base; y += 1) {
        let tone: Tone = night ? 2 : 2;
        const window = kind >= 0.6 && kind < 0.82 && local > 0 && local < 8 && local % 2 === 1 && (y - top) % 3 === 1 && y < base - 1;
        const houseWindow = kind < 0.6 && kind >= 0.18 && y > base - 3 && (local === 2 || local === 6);
        if (window || houseWindow) {
          const lit = hash(lot * 31 + y * 7 + local) > 0.45;
          tone = night ? (lit ? 0 : 3) : 1;
        }
        if (kind >= 0.82 && !night && fb.dither(wx, y, 5)) tone = 3;
        fb.px(x, y, tone);
      }
    }
  }

  function drawNear(fb: Framebuffer, night: boolean, near: number, ballast: number) {
    for (let x = WIN.x0; x < WIN.x1; x += 1) {
      const wx = Math.floor(x + near);
      const bush = 69 + Math.round(1.5 + 1.5 * Math.sin(wx * 0.21) + hash(Math.floor(wx / 3)) * 1.5);
      for (let y = bush; y < 75; y += 1) fb.px(x, y, night ? 3 : fb.dither(wx, y, 11) ? 3 : 2);
      // Guard rail with posts.
      fb.px(x, 74, night ? 2 : 3);
      fb.px(x, 75, night ? 3 : 1);
      if (wrap(wx, 9) === 0) for (let y = 74; y < 80; y += 1) fb.px(x, y, 3);
      const bx = Math.floor(x + ballast);
      for (let y = 76; y < WIN.y1; y += 1) {
        if (wrap(wx, 9) === 0 && y < 80) continue;
        fb.px(x, y, night ? (fb.dither(bx, y, 2) ? 2 : 3) : fb.dither(bx, y, 8) ? 3 : 1);
      }
    }
  }

  function drawPoles(fb: Framebuffer, near: number) {
    const pitch = 68;
    const first = Math.floor(near / pitch) - 1;
    const poles: number[] = [];
    for (let k = first; k < first + 5; k += 1) poles.push(Math.round(k * pitch - near + 30));
    for (let i = 0; i < poles.length - 1; i += 1) {
      const a = poles[i];
      const b = poles[i + 1];
      for (const [y, sag] of [[16, 5], [21, 4]] as const) {
        let previous: number = y;
        for (let x = a; x <= b; x += 1) {
          const u = (x - a) / (b - a);
          const yy = Math.round(y + sag * 4 * u * (1 - u));
          if (x >= WIN.x0 && x < WIN.x1) fb.vline(x, previous, yy, 3);
          previous = yy;
        }
      }
    }
    for (const x of poles) {
      if (x < WIN.x0 - 6 || x > WIN.x1 + 6) continue;
      for (let y = 12; y < 76; y += 1) {
        if (x >= WIN.x0 && x < WIN.x1) fb.px(x, y, 3);
        if (x + 1 >= WIN.x0 && x + 1 < WIN.x1) fb.px(x + 1, y, 2);
      }
      for (let dx = -5; dx <= 6; dx += 1) {
        const sx = x + dx;
        if (sx >= WIN.x0 && sx < WIN.x1) {
          fb.px(sx, 14, 3);
          if (Math.abs(dx) === 4) fb.px(sx, 15, 3);
        }
      }
    }
  }

  function drawPassingTrain(fb: Framebuffer, phase: number) {
    // phase 0..1 across the window; a white N700 nose leads a long body.
    const head = Math.round(WIN.x1 + 40 - phase * 1400);
    for (let x = WIN.x0; x < WIN.x1; x += 1) {
      const local = x - head;
      if (local < 0) continue;
      const roof = local < 30 ? Math.round(56 - local * 0.75) : 33;
      for (let y = Math.max(roof, 33); y < 76; y += 1) {
        let tone: Tone = 0;
        if (y > 60 && y < 63) tone = 2;
        if (local > 30 && y > 40 && y < 45 && wrap(local, 7) < 4) tone = 3;
        if (local < 30 && y < roof + 3) tone = 1;
        if (y > 72) tone = 2;
        fb.px(x, y, tone);
      }
    }
  }

  function drawTunnel(fb: Framebuffer, near: number) {
    for (let y = WIN.y0; y < WIN.y1; y += 1) {
      for (let x = WIN.x0; x < WIN.x1; x += 1) fb.px(x, y, fb.dither(x, y, 2) ? 2 : 3);
    }
    for (let x = WIN.x0; x < WIN.x1; x += 1) {
      const wx = Math.floor(x + near * 2);
      if (wrap(wx, 46) < 7) {
        fb.px(x, 20, 0);
        fb.px(x, 21, 1);
      }
    }
  }

  /** At the end of a post the train stops at a platform name board. */
  function drawStationBoard(fb: Framebuffer, night: boolean, rise: number) {
    const w = 78;
    const h = 27;
    const x = Math.round((WIN.x0 + WIN.x1) / 2 - w / 2 - 6);
    const y = Math.round(30 + (1 - rise) * 50);
    // Two posts down to the platform.
    for (const px of [x + 9, x + w - 10]) {
      for (let yy = y + h; yy < WIN.y1; yy += 1) {
        fb.px(px, yy, 3);
        fb.px(px + 1, yy, 2);
      }
    }
    fb.rect(x - 1, y - 1, w + 2, h + 2, 3);
    fb.rect(x, y, w, h, night ? 1 : 0);
    fb.rect(x, y, w, 3, ACCENT);
    fb.text("SHIN-OSAKA", x + w / 2, y + 6, 3, { font: "m", align: "center" });
    fb.hline(x + 5, x + w - 6, y + 16, 2);
    fb.text("THANKS FOR READING", x + w / 2, y + 19, 2, { align: "center" });
  }

  function drawInterior(fb: Framebuffer, night: boolean, t: number, reduced: boolean) {
    for (let y = 0; y < LCD_H; y += 1) {
      for (let x = 0; x < LCD_W; x += 1) {
        if (mask[y * LCD_W + x]) continue;
        // Moulded cabin plastic: flat, a touch darker towards the floor.
        fb.px(x, y, night ? 0 : 1);
      }
    }
    // Rubber gasket and a highlight around the opening.
    for (let y = WIN.y0 - 2; y < WIN.y1 + 2; y += 1) {
      for (let x = WIN.x0 - 2; x < WIN.x1 + 2; x += 1) {
        if (mask[y * LCD_W + x]) continue;
        let near = false;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx >= 0 && ny >= 0 && nx < LCD_W && ny < LCD_H && mask[ny * LCD_W + nx]) near = true;
        }
        if (near) fb.px(x, y, 2);
      }
    }
    // Window blind, pulled down a little.
    for (let y = WIN.y0; y < WIN.y0 + 5; y += 1) {
      for (let x = WIN.x0; x < WIN.x1; x += 1) if (mask[y * LCD_W + x]) fb.px(x, y, y === WIN.y0 + 4 ? 2 : y % 2 ? 1 : 0);
    }
    fb.rect(84, WIN.y0 + 5, 6, 2, 2);
    // Seat back with a white headrest cover on the left.
    for (let y = 26; y < LCD_H; y += 1) {
      const edge = y < 32 ? 15 - Math.round(Math.sqrt(36 - (y - 32) ** 2)) : 9;
      for (let x = 0; x < 19; x += 1) {
        if (y < 32 && (x < 1 || x > 19 - (32 - y) / 2 - 1)) continue;
        const cover = y > 29 && y < 54 && x > 1 && x < 17;
        let tone: Tone = cover ? 0 : 2;
        if (cover && ((x + y) % 4 === 0 || (x - y) % 4 === 0) && y > 32) tone = 1;
        if (!cover && fb.dither(x, y, 6)) tone = 3;
        if (x === 18 || (y < 32 && x === edge)) tone = 3;
        fb.px(x, y, tone);
      }
    }
    // Sill with a paper cup of coffee, steaming.
    fb.rect(WIN.x0 - 2, WIN.y1 + 2, WIN.x1 - WIN.x0 + 4, 2, 2);
    fb.rect(WIN.x0 - 2, WIN.y1 + 4, WIN.x1 - WIN.x0 + 4, 1, 3);
    const cup = { x: 132, y: WIN.y1 - 6 };
    for (let y = 0; y < 8; y += 1) {
      const inset = Math.floor(y / 4);
      for (let x = inset; x < 7 - inset; x += 1) fb.px(cup.x + x, cup.y + y, y === 0 ? 3 : y > 2 && y < 5 ? 2 : 0);
    }
    fb.px(cup.x + 7, cup.y + 2, 3);
    fb.px(cup.x + 8, cup.y + 3, 3);
    fb.px(cup.x + 7, cup.y + 4, 3);
    if (!reduced) {
      for (let i = 0; i < 3; i += 1) {
        const life = wrap(t * 0.6 + i / 3, 1);
        const sx = cup.x + 3 + Math.round(Math.sin(life * 6 + i) * 1.5);
        const sy = cup.y - 1 - Math.round(life * 9);
        fb.px(sx, sy, life < 0.6 ? 1 : 2);
      }
    }
  }

  function drawHud(fb: Framebuffer, context: SceneContext, night: boolean) {
    const ink: Tone = night ? 0 : 3;
    const halo: Tone = night ? 3 : 0;
    const right = WIN.x1 - 5;
    const progress = journey(context);
    if (context.progress !== null) {
      // On arrival the platform's name board takes over from the HUD.
      if (!arrived(context)) {
        fb.label(`NEXT ${nextStation(progress).name}`, right, 13, ink, halo, { align: "right" });
        fb.label(`${Math.round(speed)} KM/H`, right, 19, ink, halo, { align: "right" });
      }
    } else {
      fb.label("TOKYO → OSAKA", right, 13, ink, halo, { align: "right" });
      fb.label(`${Math.round(speed)} KM/H`, right, 19, ink, halo, { align: "right" });
    }
    // Route strip on the sill: stations as ticks, the train as a block.
    const x0 = 37;
    const x1 = 113;
    const y = 94;
    fb.hline(x0, x1, y, 3);
    for (const station of STATIONS) fb.vline(Math.round(x0 + station.at * (x1 - x0)), y - 1, y + 1, 3);
    const at = Math.round(x0 + progress * (x1 - x0));
    fb.rect(at - 2, y - 2, 5, 5, 3);
    fb.text("TKY", x0 - 3, y - 2, 3, { align: "right" });
    fb.text("OSA", x1 + 4, y - 2, 3);
  }

  return {
    id: "window",
    enter(context) {
      context.announce(this.describe(context));
    },
    draw(fb, context) {
      const night = isNight(context);
      const goal = arrived(context) ? 0 : target ?? CRUISE + Math.sin(context.t * 0.05) * 12;
      speed += (goal - speed) * Math.min(1, context.dt * 0.7);
      if (Math.abs(goal - speed) < 0.5) speed = goal;
      distance += context.dt * (speed / CRUISE) * 115;
      const t = context.t;
      const near = distance;

      fb.clear(0);
      drawSky(fb, night, t);
      drawClouds(fb, night, t * 1.5 + distance * 0.01);
      drawFuji(fb, night, t);
      drawHills(fb, night, distance * 0.07);
      drawTown(fb, night, distance * 0.24);
      drawNear(fb, night, near, distance * 1.7);
      drawPoles(fb, near);

      if (!context.reduced && speed > 40) {
        const trainPhase = wrap(t, 41) / 1.7;
        if (trainPhase < 1) drawPassingTrain(fb, trainPhase);
        const tunnel = wrap(t + 20, 67);
        if (tunnel < 3.2) drawTunnel(fb, near);
      }

      if (arrived(context)) {
        boardRise = context.reduced ? 1 : Math.min(1, boardRise + context.dt * 1.6);
        drawStationBoard(fb, night, 1 - Math.pow(1 - boardRise, 3));
      } else {
        boardRise = 0;
      }

      drawInterior(fb, night, t, context.reduced);
      drawHud(fb, context, night);

      if (arrived(context) && !arrivedAnnounced) {
        arrivedAnnounced = true;
        context.announce("Arrived at Shin-Osaka. End of the post.");
      } else if (!arrived(context)) {
        arrivedAnnounced = false;
      }
    },
    action(context) {
      nightOverride = !isNight(context);
      context.announce(nightOverride ? "Night outside the window." : "Daylight outside the window.");
    },
    prev(context) {
      target = Math.max(0, (target ?? CRUISE) - 70);
      context.announce(target === 0 ? "Train stopping." : `Slowing to ${Math.round(target)} km/h.`);
    },
    next(context) {
      target = Math.min(320, (target ?? CRUISE) + 70);
      context.announce(`Speeding up to ${Math.round(target)} km/h.`);
    },
    leds(context) {
      return fillLeds(journey(context));
    },
    describe(context) {
      const where = context.progress !== null && arrived(context) ? "arrived at Shin-Osaka" : `heading for ${nextStation(journey(context)).title}`;
      return `Window seat on the shinkansen, ${where}, Mount Fuji outside.`;
    },
    softkeys(context) {
      return ["Slower", isNight(context) ? "Day" : "Night", "Faster"];
    },
  };
}
