import type { IUser } from "@/types/user";

export type AccountChoice = "USD" | "NGN" | "BOTH";
export function basicDetailsComplete(user?: IUser) {
  const status =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  return (
    status === "pending" || status === "kyc_tier_1" || status === "completed"
  );
}
export function accountChoiceRoute(choice: AccountChoice) {
  return choice === "NGN" ? "/onboarding/ngn" : "/onboarding/usd";
}
// A browser-local navigation preference, never evidence of a backend account request.
export function readAccountChoice(entityId?: string): AccountChoice | null {
  if (!entityId || typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(`raiz-account-choice:${entityId}`);
    return value === "USD" || value === "NGN" || value === "BOTH"
      ? value
      : null;
  } catch {
    return null;
  }
}
export function saveAccountChoice(entityId: string, choice: AccountChoice) {
  try {
    localStorage.setItem(`raiz-account-choice:${entityId}`, choice);
  } catch {
    /* Navigation still works if storage is unavailable. */
  }
}
