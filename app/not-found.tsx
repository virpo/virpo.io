import Link from "next/link";

// GitHub Pages serves this as 404.html for any path that doesn't exist.
export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: "1rem", padding: "2rem 1.5rem", background: "#faf7f2", color: "#2a2118", font: "17px/1.5 system-ui, sans-serif", textAlign: "center" }}>
      <p style={{ margin: 0, font: "600 12px/1 ui-monospace, monospace", letterSpacing: "0.14em", color: "#6f6860" }}>FIG. 404</p>
      <h1 style={{ margin: 0, fontSize: "2.4rem", fontWeight: 500, letterSpacing: "-0.03em" }}>Nothing on this shelf.</h1>
      <p style={{ margin: 0, color: "#5b5248" }}>
        The page you wanted isn&rsquo;t here. <Link href="/" style={{ color: "#b8480f" }}>Back to the room</Link> or <Link href="/blog/" style={{ color: "#b8480f" }}>read the writing</Link>.
      </p>
    </main>
  );
}
