import { Suspense } from "react";
import type { Metadata } from "next";
import AcceptInvite from "./AcceptInvite";
export const metadata: Metadata = {
  title: "Accept your invitation | Raiz Business",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <p className="p-10" role="status">
          Checking your invitation…
        </p>
      }
    >
      <AcceptInvite />
    </Suspense>
  );
}
