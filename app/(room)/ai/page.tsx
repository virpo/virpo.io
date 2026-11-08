import type { Metadata } from "next";
import { Redirect } from "../../../components/site/Redirect";

// Everything that was here lives in Projects on the home page now.
export const metadata: Metadata = {
  title: "Projects",
  alternates: { canonical: "/" },
};

export default function AiRedirect() {
  return <Redirect to="/#projects" label="See the projects" />;
}
