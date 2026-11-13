import { Suspense } from "react";
import type { Metadata } from "next";
import AcceptInvite from "./AcceptInvite";
import AuthLayout from "../_components/AuthLayout";
export const metadata: Metadata = {
  title: "Accept your invitation | Raiz Business",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <p className="w-full max-w-[440px] text-sm text-[#6b6b80]" role="status">
            Checking your invitation…
          </p>
        </AuthLayout>
      }
    >
      <AcceptInvite />
    </Suspense>
  );
}
