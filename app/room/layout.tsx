import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import styles from "./room.module.css";

const sans = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-room-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-room-mono",
  display: "swap",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Pocket Room · Peter Hraska", template: "%s · Pocket Room" },
  robots: { index: false, follow: true },
  alternates: {
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "virpo · writing" }] },
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
};

export default function RoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${sans.variable} ${mono.variable} ${styles.shell}`}>
      {/* the site's dark page colour would show on overscroll; the room is paper */}
      <style>{"html,body{background:#faf7f2}"}</style>
      {children}
    </div>
  );
}
