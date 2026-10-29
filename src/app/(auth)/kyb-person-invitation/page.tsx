import type { Metadata } from "next";
import PersonVerification from "./PersonVerification";
export const metadata: Metadata = {
  title: "Verify your identity | Raiz Business",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function PersonVerificationPage() {
  return <PersonVerification />;
}
