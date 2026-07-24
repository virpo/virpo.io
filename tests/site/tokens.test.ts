import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globals = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

function token(name: string) {
  const match = globals.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`Missing color token ${name}`);
  return match[1];
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function requiredContrast(fontSizePx: number, fontWeight: number) {
  const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
  return isLarge ? 3 : 4.5;
}

const shellTextPairs = [
  {
    name: "mobile wordmark",
    foreground: "--white",
    background: "--brand-red",
    fontSizePx: 24,
    fontWeight: 400,
  },
  {
    name: "mobile primary navigation",
    foreground: "--ink",
    background: "--white",
    fontSizePx: 11.04,
    fontWeight: 400,
  },
  {
    name: "ticker kicker",
    foreground: "--muted",
    background: "--white",
    fontSizePx: 8.8,
    fontWeight: 700,
  },
  {
    name: "mobile Tokyo time",
    foreground: "--ink",
    background: "--white",
    fontSizePx: 18.56,
    fontWeight: 400,
  },
  {
    name: "mobile bloom name on white",
    foreground: "--ink",
    background: "--white",
    fontSizePx: 13.44,
    fontWeight: 400,
  },
  {
    name: "mobile bloom name on hover paper",
    foreground: "--ink",
    background: "--paper",
    fontSizePx: 13.44,
    fontWeight: 400,
  },
  {
    name: "bloom countdown on white",
    foreground: "--brand-red-text",
    background: "--white",
    fontSizePx: 10.72,
    fontWeight: 400,
  },
  {
    name: "bloom countdown on hover paper",
    foreground: "--brand-red-text",
    background: "--paper",
    fontSizePx: 10.72,
    fontWeight: 400,
  },
  {
    name: "Kaki popover kicker on paper",
    foreground: "--kaki-text",
    background: "--paper",
    fontSizePx: 10.88,
    fontWeight: 700,
  },
  {
    name: "popover place",
    foreground: "--ink",
    background: "--paper",
    fontSizePx: 18.4,
    fontWeight: 400,
  },
  {
    name: "popover bloom window",
    foreground: "--muted",
    background: "--paper",
    fontSizePx: 12.48,
    fontWeight: 400,
  },
  {
    name: "popover source",
    foreground: "--ink",
    background: "--paper",
    fontSizePx: 12.48,
    fontWeight: 400,
  },
  {
    name: "footer",
    foreground: "--muted",
    background: "--paper",
    fontSizePx: 10.88,
    fontWeight: 400,
  },
] as const;

describe("shell contrast", () => {
  it.each(shellTextPairs)(
    "$name meets its WCAG size and weight threshold",
    ({ foreground, background, fontSizePx, fontWeight }) => {
      expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(
        requiredContrast(fontSizePx, fontWeight),
      );
    },
  );

  it("keeps the exact red tile and qualifies its mobile wordmark as large text", () => {
    const brandMarkRules = [...globals.matchAll(/\.brandMark\s*{([^}]*)\}/g)];

    expect(token("--brand-red")).toBe("#d0513e");
    expect(globals).not.toContain("--brand-red-surface");
    expect(globals).toMatch(
      /\.brand\s*{[^}]*background:\s*var\(--brand-red\)[^}]*color:\s*var\(--white\)/s,
    );
    expect(brandMarkRules.at(-1)?.[1]).toMatch(/font-size:\s*1\.5rem/);
  });

  it("maps the derived contrast tokens to the actual small-text shell selectors", () => {
    expect(globals).toMatch(
      /\.bloomSummary > span:last-child\s*{[^}]*color:\s*var\(--brand-red-text\)/s,
    );
    expect(globals).toMatch(
      /\.popoverKicker\s*{[^}]*color:\s*var\(--kaki-text\)/s,
    );
  });
});

describe("site focus treatment", () => {
  it("uses a two-tone inset indicator across light, red, Kaki, and ink surfaces", () => {
    expect(globals).toMatch(
      /:focus-visible\s*{[^}]*box-shadow:\s*inset 0 0 0 3px var\(--white\),\s*inset 0 0 0 6px var\(--focus\)/s,
    );
  });

  it.each(["--white", "--paper", "--brand-red", "--kaki", "--ink"])(
    "keeps at least one focus stripe at 3:1 against %s",
    (surface) => {
      const stripeRatios = [
        contrast(token("--white"), token(surface)),
        contrast(token("--focus"), token(surface)),
      ];

      expect(Math.max(...stripeRatios)).toBeGreaterThanOrEqual(3);
    },
  );
});

describe("article continuation contrast", () => {
  it("keeps small footer-link text at 4.5:1 on the approved Kaki surface", () => {
    expect(contrast(token("--ink"), token("--kaki"))).toBeGreaterThanOrEqual(4.5);
    expect(globals).toMatch(
      /\.articleExits a:hover,\s*\.articleExits a:focus-visible\s*{[^}]*background:\s*var\(--kaki\)[^}]*color:\s*var\(--ink\)/s,
    );
  });
});
