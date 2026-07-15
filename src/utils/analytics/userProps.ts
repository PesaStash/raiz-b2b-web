import type { AnalyticsUserType } from "@/types/analytics";
import type { IUser } from "@/types/user";
import {
  clearUserDataSessionFlag,
  daysSince,
  hasUserDataFiredThisSession,
  markUserDataFiredThisSession,
  pushDataLayerEvent,
} from "@/utils/analytics/dataLayer";

export function getAnalyticsUserId(user: IUser | undefined | null): string {
  return (
    user?.business_account?.entity?.entity_id ||
    user?.business_account_user_id ||
    user?.business_account_id ||
    ""
  );
}

export function getAnalyticsUserType(): AnalyticsUserType {
  // B2B web app — all accounts are business.
  return "business";
}

export function mapAccountStatus(
  user: IUser | undefined | null,
): "unverified" | "verified" | "restricted" {
  const entity = user?.business_account?.entity;
  if (
    entity?.is_entity_blocked ||
    entity?.is_entity_frozen ||
    entity?.is_entity_closed ||
    entity?.is_entity_blacklisted
  ) {
    return "restricted";
  }
  const verification =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  if (verification === "completed" || user?.is_verified) {
    return "verified";
  }
  return "unverified";
}

export function getKycStatus(user: IUser | undefined | null): string {
  return (
    user?.business_account?.business_verifications?.[0]?.verification_status ||
    "not_started"
  );
}

export function getPreferredCurrency(user: IUser | undefined | null): string | undefined {
  const wallets = user?.business_account?.wallets;
  if (!wallets?.length) return undefined;
  const usd = wallets.find((w) => w.wallet_type?.currency === "USD");
  if (usd) return "USD";
  return wallets[0]?.wallet_type?.currency;
}

/** Push `user_data` once per browser session after profile is available. */
export function trackUserDataOnce(user: IUser): void {
  if (hasUserDataFiredThisSession()) return;

  const userId = getAnalyticsUserId(user);
  if (!userId) return;

  pushDataLayerEvent("user_data", {
    user_id: userId,
    user_type: getAnalyticsUserType(),
    account_status: mapAccountStatus(user),
    kyc_status: getKycStatus(user),
    preferred_currency: getPreferredCurrency(user),
    days_since_signup: daysSince(user.business_account?.entity?.created_at),
  });

  markUserDataFiredThisSession();
}

export function resetUserDataTracking(): void {
  clearUserDataSessionFlag();
}

export { daysSince };
