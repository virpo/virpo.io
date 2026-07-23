import type { Metadata } from "next";
import { SiteShell } from "../components/site/SiteShell";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "virpo",
    title: "virpo · Peter Hraska",
    description: "Peter Hraska makes useful things where product, design, and engineering meet.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <SiteShell current="home">
      <section className="tile pagePlaceholder">
        <p>Product, design, engineering.</p>
        <h1>virpo</h1>
      </section>
    </SiteShell>
  );
}
