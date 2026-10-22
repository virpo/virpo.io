import type { Metadata, Viewport } from "next";
import { Martian_Mono, Newsreader, Schibsted_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import styles from "./room.module.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-room-sans",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-room-mono",
  display: "swap",
  axes: ["wdth"],
});

const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-room-serif",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  alternates: {
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "virpo · writing" }] },
  },
};

export const viewport: Viewport = {
  themeColor: "#efeae1",
};

export default function RoomLayout({ children }: { children: ReactNode }) {
  return <div className={`${sans.variable} ${mono.variable} ${serif.variable} ${styles.shell}`}>{children}</div>;
}
