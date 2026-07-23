import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://virpo.io"),
  title: { default: "virpo · Peter Hraska", template: "%s · virpo" },
  description: "Peter Hraska makes useful things where product, design, and engineering meet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
