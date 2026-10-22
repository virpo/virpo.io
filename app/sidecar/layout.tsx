import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { rssAlternates } from "../../components/sidecar/meta";
import styles from "./sidecar.module.css";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Sidecar · virpo", template: "%s · Sidecar · virpo" },
  robots: { index: false, follow: true },
  alternates: { types: rssAlternates },
};

export default function SidecarLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.root} ${plexMono.variable}`} data-sidecar-root>
      {children}
    </div>
  );
}
