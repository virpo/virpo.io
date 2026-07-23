import Link from "next/link";

export function ArticleFooter() {
  return (
    <nav aria-label="Continue exploring" className="articleExits">
      <Link href="/blog/">More writing</Link>
      <Link href="/projects/">Projects</Link>
      <Link href="/#toys">Toys</Link>
    </nav>
  );
}
