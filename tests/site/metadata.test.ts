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
    });
  });

  it("defines the homepage canonical and Open Graph URL on the homepage", () => {
    expect(homeMetadata).toMatchObject({
      alternates: { canonical: "/" },
      openGraph: { url: "/" },
    });
  });
});
