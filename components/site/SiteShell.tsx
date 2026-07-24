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
    <div className="siteShell">
      <Masthead current={current} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
