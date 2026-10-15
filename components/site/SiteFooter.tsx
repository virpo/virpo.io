import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="tile siteFooter">
      <span>Peter Hraska · Slovakia</span>
      <span>
        Built with curiosity, 2026
        <span aria-hidden="true"> · </span>
        <Link className="footerLink" href="/skills/" prefetch={false}>
          Skills
        </Link>
      </span>
    </footer>
  );
}
