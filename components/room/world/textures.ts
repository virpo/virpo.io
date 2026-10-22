import * as THREE from "three";
import { C, canvasTexture } from "./kit";

const families = {
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  sans: '"Helvetica Neue", Arial, sans-serif',
};
/** Point canvas text at the page's next/font families (their names are hashed). */
export function setTextureFonts(mono?: string, sans?: string) {
  if (mono) families.mono = `${mono}, ${families.mono}`;
  if (sans) families.sans = `${sans}, ${families.sans}`;
}
const MONO = "mono";
const SANS = "sans";
const JP = "jp";
const font = (kind: string, size: number) =>
  kind === "mono"
    ? `600 ${size}px ${families.mono}`
    : kind === "sans"
      ? `800 ${size}px ${families.sans}`
      : `700 ${size}px "Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif`;

export function kanaPoster() {
  return canvasTexture(384, 512, (ctx) => {
    ctx.fillStyle = "#fbf4e4";
    ctx.fillRect(0, 0, 384, 512);
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(320, 62, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = font(MONO, 18);
    ctx.fillText("HIRAGANA", 30, 52);
    ctx.font = font(MONO, 12);
    ctx.fillStyle = "#7a6f62";
    ctx.fillText("ひらがな · 46", 30, 74);
    const rows = ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの"];
    ctx.fillStyle = C.ink;
    ctx.font = font(JP, 50);
    rows.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        ctx.fillText(ch, 26 + c * 68, 150 + r * 76);
      });
    });
  });
}

export function pegboardTexture() {
  return canvasTexture(256, 128, (ctx) => {
    ctx.fillStyle = "#d9b98c";
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = "rgba(90,60,35,0.55)";
    for (let x = 8; x < 256; x += 16) for (let y = 8; y < 128; y += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function corkTexture() {
  return canvasTexture(320, 224, (ctx) => {
    ctx.fillStyle = "#c79a64";
    ctx.fillRect(0, 0, 320, 224);
    for (let i = 0; i < 900; i += 1) {
      ctx.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 30},30,${0.25 + Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * 320, Math.random() * 224, 2, 2);
    }
    const cards: [number, number, number, number, string][] = [
      [24, 20, 70, 56, "#fbf4e4"],
      [220, 26, 76, 52, "#fbf4e4"],
      [40, 140, 64, 60, "#e9eef3"],
      [212, 140, 80, 58, "#fbf4e4"],
    ];
    const pins: [number, number][] = [];
    for (const [x, y, w, h, color] of cards) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + 3, y + 4, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#9a9187";
      for (let l = 0; l < 4; l += 1) ctx.fillRect(x + 8, y + 14 + l * 10, w - 18 - (l % 2) * 14, 3);
      pins.push([x + w / 2, y + 6]);
    }
    // the yellow footprint card in the middle
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(124, 66, 76, 92);
    ctx.fillStyle = "#f6cf34";
    ctx.fillRect(120, 62, 76, 92);
    ctx.fillStyle = "#2a2a2a";
    const foot = (fx: number, fy: number, s: number) => {
      ctx.beginPath();
      ctx.ellipse(fx, fy, 9 * s, 15 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      for (let t = 0; t < 4; t += 1) {
        ctx.beginPath();
        ctx.arc(fx - 9 * s + t * 6 * s, fy - 20 * s - (t === 0 ? 0 : 2), 3 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    foot(146, 118, 1);
    foot(170, 96, 0.8);
    pins.push([158, 68]);
    ctx.strokeStyle = "#d43a2f";
    ctx.lineWidth = 2.5;
    for (const [x, y] of pins.slice(0, 4)) {
      ctx.beginPath();
      ctx.moveTo(158, 68);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    for (const [x, y] of pins) {
      ctx.fillStyle = "#d43a2f";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function buildWeekBanner() {
  return canvasTexture(256, 384, (ctx) => {
    ctx.fillStyle = "#1f2128";
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = C.orange;
    ctx.fillRect(0, 0, 256, 14);
    ctx.fillStyle = "#fbf4e4";
    ctx.font = font(SANS, 54);
    ctx.fillText("AI", 24, 96);
    ctx.fillText("BUILD", 24, 150);
    ctx.fillText("WEEK", 24, 204);
    ctx.fillStyle = C.orange;
    ctx.font = font(MONO, 14);
    ctx.fillText("12 HRS · TINY TEAMS", 24, 250);
    ctx.fillText("SHIP SOMETHING €", 24, 272);
    ctx.fillStyle = "#3a3d47";
    for (let i = 0; i < 6; i += 1) ctx.fillRect(24 + i * 36, 314, 26, 26);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(24 + 2 * 36, 314, 26, 26);
  });
}

export function tvScreen() {
  return canvasTexture(256, 192, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 192);
    g.addColorStop(0, "#fdfbf6");
    g.addColorStop(1, "#ece6da");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = "#e33b2e";
    ctx.beginPath();
    ctx.roundRect(28, 36, 86, 60, 14);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(62, 52);
    ctx.lineTo(86, 66);
    ctx.lineTo(62, 80);
    ctx.fill();
    ctx.fillStyle = "#2a2a2a";
    ctx.font = font(SANS, 22);
    ctx.fillText("TL;DR", 130, 62);
    ctx.fillStyle = "#9a948a";
    for (let l = 0; l < 3; l += 1) ctx.fillRect(130, 76 + l * 12, 90 - l * 18, 6);
    ctx.fillStyle = "#3a3a3a";
    for (let l = 0; l < 3; l += 1) ctx.fillRect(28, 118 + l * 16, 200 - l * 40, 8);
  });
}

export function arcadeScreen() {
  return canvasTexture(192, 160, (ctx) => {
    ctx.fillStyle = "#14204a";
    ctx.fillRect(0, 0, 192, 160);
    ctx.fillStyle = "#7fd0ff";
    ctx.fillRect(0, 120, 192, 40);
    ctx.fillStyle = "#6bc25a";
    for (let i = 0; i < 6; i += 1) ctx.fillRect(i * 34, 112 - (i % 3) * 22, 30, 10);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(84, 74, 16, 16);
    ctx.fillStyle = "#ff6a3d";
    ctx.fillRect(140, 52, 12, 12);
    ctx.fillStyle = "#fff";
    ctx.font = font(MONO, 14);
    ctx.fillText("LEVEL 03", 12, 22);
    ctx.fillText("★★☆", 130, 22);
  });
}

export function arcadeMarquee() {
  return canvasTexture(256, 64, (ctx) => {
    ctx.fillStyle = C.orange;
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#1b1d24";
    ctx.font = font(SANS, 34);
    ctx.textAlign = "center";
    ctx.fillText("LEVELS", 128, 45);
  });
}

export function laptopScreen() {
  return canvasTexture(256, 160, (ctx) => {
    ctx.fillStyle = "#fbf6ec";
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(22, 22, 120, 12);
    ctx.fillStyle = "#9a948a";
    for (let l = 0; l < 7; l += 1) ctx.fillRect(22, 50 + l * 14, 200 - ((l * 37) % 70), 6);
    ctx.fillStyle = C.orange;
    ctx.fillRect(22, 50 + 7 * 14, 4, 10);
  });
}

export function konbiniSign() {
  return canvasTexture(512, 64, (ctx) => {
    ctx.fillStyle = "#fbfbf7";
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = "#2f9e6a";
    ctx.fillRect(0, 0, 512, 20);
    ctx.fillStyle = "#3f73b8";
    ctx.fillRect(0, 44, 512, 20);
    ctx.fillStyle = "#1f2a3a";
    ctx.font = font(JP, 24);
    ctx.textAlign = "center";
    ctx.fillText("コンビニ  24h", 256, 41);
  });
}

export function konbiniWindow() {
  return canvasTexture(256, 128, (ctx) => {
    ctx.fillStyle = "#fff6dc";
    ctx.fillRect(0, 0, 256, 128);
    const colors = ["#f26a21", "#3f73b8", "#f2c84b", "#2f9e6a", "#d9503e", "#8a8fe0"];
    for (let shelf = 0; shelf < 3; shelf += 1) {
      ctx.fillStyle = "#c9b28c";
      ctx.fillRect(0, 34 + shelf * 36, 256, 4);
      for (let i = 0; i < 18; i += 1) {
        ctx.fillStyle = colors[(i * 7 + shelf * 3) % colors.length];
        ctx.fillRect(6 + i * 14, 14 + shelf * 36, 10, 20);
      }
    }
  });
}

export function vendingPanel() {
  return canvasTexture(128, 192, (ctx) => {
    ctx.fillStyle = "#f4f7fb";
    ctx.fillRect(0, 0, 128, 192);
    const colors = ["#d9503e", "#3f73b8", "#f2c84b", "#2f9e6a", "#f26a21", "#8a5a3c", "#ffffff", "#6bc2e8"];
    for (let row = 0; row < 4; row += 1) {
      ctx.fillStyle = "#c8ced8";
      ctx.fillRect(0, 40 + row * 44, 128, 3);
      for (let i = 0; i < 5; i += 1) {
        ctx.fillStyle = colors[(i + row * 3) % colors.length];
        ctx.beginPath();
        ctx.roundRect(8 + i * 23, 10 + row * 44, 15, 28, 4);
        ctx.fill();
        ctx.fillStyle = "#3a8a4a";
        ctx.fillRect(10 + i * 23, 42 + row * 44 - 2, 10, 3);
      }
    }
  });
}

export function stationSign() {
  return canvasTexture(256, 64, (ctx) => {
    ctx.fillStyle = "#fbfbf7";
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#2f9e6a";
    ctx.fillRect(0, 50, 256, 14);
    ctx.fillStyle = "#1f2a3a";
    ctx.font = font(JP, 26);
    ctx.textAlign = "center";
    ctx.fillText("ぽけっと", 128, 32);
    ctx.font = font(MONO, 10);
    ctx.fillText("POKETTO · PR-03", 128, 46);
  });
}

export function plinthLabel(time: string) {
  return canvasTexture(1024, 64, (ctx) => {
    ctx.fillStyle = "#2a2b30";
    ctx.fillRect(0, 0, 1024, 64);
    ctx.fillStyle = "#e9e3d8";
    ctx.font = font(MONO, 20);
    ctx.fillText("POCKET ROOM", 34, 40);
    ctx.fillStyle = "#9b978f";
    ctx.font = font(MONO, 15);
    ctx.fillText("FIG. 03  ·  1:87  ·  PETER HRASKA  ·  VIRPO.IO", 236, 39);
    ctx.fillStyle = C.orange;
    ctx.fillRect(960, 22, 22, 22);
    ctx.fillStyle = "#e9e3d8";
    ctx.textAlign = "right";
    ctx.fillText(time, 944, 39);
  });
}

export function deckKeys() {
  return canvasTexture(160, 96, (ctx) => {
    ctx.fillStyle = "#17181c";
    ctx.fillRect(0, 0, 160, 96);
    const colors = ["#f26a21", "#2f9e6a", "#3f73b8", "#f2c84b", "#d9503e", "#8a8fe0", "#2f9e6a", "#f26a21", "#6bc2e8", "#f2c84b", "#3f73b8", "#d9503e", "#2f9e6a", "#f26a21", "#8a8fe0"];
    for (let r = 0; r < 3; r += 1) for (let c = 0; c < 5; c += 1) {
      ctx.fillStyle = colors[r * 5 + c];
      ctx.beginPath();
      ctx.roundRect(8 + c * 30, 8 + r * 29, 24, 23, 4);
      ctx.fill();
    }
  });
}

export function bookSpines(seed: number) {
  return canvasTexture(256, 64, (ctx) => {
    const colors = [C.orange, C.blue, C.sage, C.yellow, C.red, "#e9dcc3", C.navy, C.coral, "#6f8ea8", "#b9a07a"];
    let x = 0;
    let i = seed;
    while (x < 256) {
      const w = 10 + ((i * 7) % 9);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, 64 - (44 + ((i * 13) % 18)), w - 1, 64);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x + 2, 64 - 30, w - 5, 2);
      x += w;
      i += 3;
    }
  });
}

export function notebookCover(color: string, index: number) {
  return canvasTexture(128, 160, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 160);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(18, 26, 92, 30);
    ctx.fillStyle = "#24262c";
    ctx.font = font(MONO, 20);
    ctx.fillText(`0${index + 1}`, 28, 49);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, 10, 160);
  });
}

export function hoodieLogo(): THREE.Texture | null {
  return null;
}
