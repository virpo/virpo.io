import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import config from "../../next.config";

describe("static export", () => {
  it("emits trailing-slash static HTML into dist", () => {
    expect(config.output).toBe("export");
    expect(config.trailingSlash).toBe(true);
    expect(config.distDir).toBe("dist");
    expect(config.images).toMatchObject({ unoptimized: true });
    expect(config.turbopack).toMatchObject({ root: resolve(process.cwd()) });
  });
});
