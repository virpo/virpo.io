import type { Metadata, Viewport } from "next";
import { Fraunces, Righteous, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://virpo.io"),
  title: { default: "virpo · Peter Hraska", template: "%s · virpo" },
  description: "Peter Hraska makes useful things where product, design, and engineering meet.",
  applicationName: "virpo",
  icons: {
    icon: "/assets/brand-mark.svg",
    apple: "/assets/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "virpo",
    title: "virpo · Peter Hraska",
    description: "Peter Hraska makes useful things where product, design, and engineering meet.",
  },
  twitter: {
    card: "summary",
    title: "virpo · Peter Hraska",
    description: "Peter Hraska makes useful things where product, design, and engineering meet.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fff4df",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${righteous.variable} ${fraunces.variable} ${sourceSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
