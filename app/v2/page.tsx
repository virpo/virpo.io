import type { Metadata } from "next";
import { Redirect } from "../../components/site/Redirect";

// The old v2 home page; the home page is the room now.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function V2Redirect() {
  return <Redirect to="/" label="Go to the home page" />;
}
