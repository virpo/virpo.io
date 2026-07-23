import type { ReactNode } from "react";
import { Masthead, type CurrentRoute } from "./Masthead";
import { SiteFooter } from "./SiteFooter";

export function SiteShell({
  current,
  children,
}: {
  current: CurrentRoute;
  children: ReactNode;
}) {
  return (
    <main className="siteShell">
      <Masthead current={current} />
      {children}
      <SiteFooter />
    </main>
  );
}
