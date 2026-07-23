import Link from "next/link";
import { BloomTicker } from "./BloomTicker";
import { BrandMark } from "./BrandMark";

export type CurrentRoute = "home" | "blog" | "projects";

export function Masthead({ current }: { current: CurrentRoute }) {
  return (
    <header className="masthead">
      <Link
        className="tile brand"
        href="/"
        aria-label="Virpo home"
        aria-current={current === "home" ? "page" : undefined}
      >
        <BrandMark />
      </Link>
      <nav className="tile primaryNav" aria-label="Primary">
        <Link href="/blog/" aria-current={current === "blog" ? "page" : undefined}>
          Blog
        </Link>
        <Link href="/projects/" aria-current={current === "projects" ? "page" : undefined}>
          Projects
        </Link>
        <Link href="/#about">About</Link>
      </nav>
      <BloomTicker />
    </header>
  );
}
