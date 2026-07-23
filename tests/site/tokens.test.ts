import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globals = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

describe("site focus treatment", () => {
  it("uses a two-tone inset indicator across light, red, Kaki, and ink surfaces", () => {
    expect(globals).toMatch(
      /:focus-visible\s*{[^}]*box-shadow:\s*inset 0 0 0 3px var\(--white\),\s*inset 0 0 0 6px var\(--focus\)/s,
    );
  });
});
