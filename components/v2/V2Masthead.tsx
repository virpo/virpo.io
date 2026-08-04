import Link from "next/link";
import { BloomTicker } from "../site/BloomTicker";
import { BrandMark } from "../site/BrandMark";

export function V2Masthead({ className }: { className?: string }) {
  return (
    <header className={className} data-v2-masthead>
      <Link className="v2Brand" href="/v2/" aria-label="Virpo v2 home" aria-current="page">
        <BrandMark />
      </Link>
      <nav className="v2Nav" aria-label="Primary">
        <Link href="/blog/">Blog</Link>
        <Link href="/projects/">Projects</Link>
        <Link href="/v2/#about">About</Link>
      </nav>
      <BloomTicker showSeasonList pixelArt />
    </header>
  );
}
