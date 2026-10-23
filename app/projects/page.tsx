import type { Metadata } from "next";
import { Redirect } from "../../components/site/Redirect";

// The projects live under the room on the home page now.
export const metadata: Metadata = {
  title: "Projects",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function ProjectsRedirect() {
  return <Redirect to="/#projects" label="See the projects" />;
}
