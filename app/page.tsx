import { SiteShell } from "../components/site/SiteShell";

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
