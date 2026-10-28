import type { Metadata, Viewport } from "next";
import { Analytics } from "../components/site/Analytics";
import { AUTHOR, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "../lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR, url: `${SITE_URL}/` }],
  creator: AUTHOR,
  // mini-Peter shouting under the torii, like the X avatar: the same face in the tab and on X
  icons: {
    icon: [
      { url: "/lab/room/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/lab/room/brand/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/lab/room/brand/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/lab/room/brand/icon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/lab/room/brand/apple-touch-icon.png",
  },
  alternates: {
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "Peter Hraska · writing" }] },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@virpo",
    creator: "@virpo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#faf7f2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
