import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as homePage from "../../app/page";
import { metadata as rootMetadata } from "../../app/layout";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "--font-fraunces" }),
  Righteous: () => ({ variable: "--font-righteous" }),
  Source_Serif_4: () => ({ variable: "--font-source-serif" }),
}));

const homeMetadata = "metadata" in homePage ? homePage.metadata : undefined;

describe("route-owned URL metadata", () => {
  it("keeps URL-specific metadata out of the shared root", () => {
    expect(rootMetadata.alternates).toBeUndefined();
    expect(rootMetadata.openGraph).not.toHaveProperty("url");
    expect(rootMetadata).toMatchObject({
      applicationName: "virpo",
      title: { default: "virpo · Peter Hraska" },
      icons: { apple: "/assets/apple-touch-icon.png" },
    });
  });

  it("ships a real 180 by 180 PNG Apple touch icon", () => {
    const icon = readFileSync(
      resolve(process.cwd(), "public/assets/apple-touch-icon.png"),
    );

    expect(icon.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(icon.readUInt32BE(16)).toBe(180);
    expect(icon.readUInt32BE(20)).toBe(180);
  });

  it("defines the homepage canonical and Open Graph URL on the homepage", () => {
    expect(homeMetadata).toMatchObject({
      alternates: { canonical: "/" },
      openGraph: { url: "/" },
    });
  });
});
