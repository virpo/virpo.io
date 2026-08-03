import Link from "next/link";
import { BloomTicker } from "../site/BloomTicker";
import { BrandMark } from "../site/BrandMark";

export function V2Masthead() {
  return (
    <header data-v2-masthead>
      <Link href="/v2/" aria-label="Virpo v2 home" aria-current="page">
        <BrandMark />
      </Link>
      <nav aria-label="Primary">
        <Link href="/blog/">Blog</Link>
        <Link href="/projects/">Projects</Link>
        <Link href="/v2/#about">About</Link>
      </nav>
      <BloomTicker />
    </header>
  );
}
