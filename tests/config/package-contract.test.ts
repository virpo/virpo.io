import packageJson from "../../package.json";
import { describe, expect, it } from "vitest";

describe("package contract", () => {
  it("pins Node, patched build dependencies, and the static-output smoke check", () => {
    expect(packageJson.engines).toMatchObject({ node: ">=20.9.0" });
    expect(packageJson.overrides).toMatchObject({
      postcss: "8.5.22",
      sharp: "0.35.3",
    });
    expect(packageJson.scripts["test:build"]).toBe(
      "npm run build && node scripts/assert-static-output.mjs",
    );
  });
});
