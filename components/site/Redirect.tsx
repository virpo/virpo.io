import Link from "next/link";

/**
 * A static redirect for GitHub Pages, which has no server-side redirects: an instant meta refresh,
 * a script for browsers that ignore it, and a plain link for everyone else. Pair it with
 * `alternates.canonical` and `robots: noindex` in the page's metadata.
 */
export function Redirect({ to, label }: { to: string; label: string }) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(to)} + location.search)` }} />
      <main style={{ font: "16px/1.5 system-ui, sans-serif", padding: "3rem 1.5rem", background: "#faf7f2", minHeight: "100vh" }}>
        <p>
          This moved. <Link href={to}>{label}</Link>
        </p>
      </main>
    </>
  );
}
