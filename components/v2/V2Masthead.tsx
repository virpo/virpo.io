import Link from "next/link";
import { BloomTicker } from "../site/BloomTicker";
import { BrandMark } from "../site/BrandMark";

export function V2Masthead({ className }: { className?: string }) {
  return (
    <header className={className} data-v2-masthead>
      <Link
        className="v2Brand"
        href="/"
        aria-label="Virpo home"
        aria-current="page"
        prefetch={false}
      >
        <BrandMark />
      </Link>
      <nav className="v2Nav" aria-label="Primary">
        <Link href="/blog/" prefetch={false}>
          Blog
        </Link>
        <Link href="/projects/" prefetch={false}>
          Projects
        </Link>
        <Link href="/#about" prefetch={false}>
          About
        </Link>
      </nav>
      <BloomTicker showSeasonList pixelArt />
    </header>
  );
}
