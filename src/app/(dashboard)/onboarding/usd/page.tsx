import { Suspense } from "react";
import UsdKybFlow from "@/components/usd-kyb/UsdKybFlow";
export default function UsdKybPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading verification…</p>}>
      <UsdKybFlow />
    </Suspense>
  );
}
