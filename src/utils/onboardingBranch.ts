import { IUser } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

export type OnboardingCurrencyPath = "USD" | "NGN";

const INFOS_DISMISSED_KEY = "infos-add-accounts-dismissed";

export function isInfosAddAccountsDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(INFOS_DISMISSED_KEY) === "true";
}

export function dismissInfosAddAccounts() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(INFOS_DISMISSED_KEY, "true");
  }
}

export function resetInfosAddAccountsDismissed() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(INFOS_DISMISSED_KEY);
  }
}

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "kyc_tier_1"
  | "completed"
  | "failed"
  | undefined;

export interface OnboardingBranchState {
  verificationStatus: VerificationStatus;
  isStep1Complete: boolean;
  isVerificationComplete: boolean;
  isNgnBranch: boolean;
  needsCurrencyChoice: boolean;
  showDashboard: boolean;
  showAccountUpgrade: boolean;
  hasNgnWallet: boolean;
  hasUsdWallet: boolean;
}

export function isNigerianBusiness(user: IUser | undefined) {
  return user?.business_account?.entity?.country?.country_code === "NG";
}

export function canCreateNgnWallet(
  user: IUser | undefined,
  verificationStatus: VerificationStatus
) {
  const hasNgnWallet = !!findWalletByCurrency(user, "NGN");
  return (
    isNigerianBusiness(user) &&
    !hasNgnWallet &&
    (verificationStatus === "kyc_tier_1" ||
      verificationStatus === "completed" ||
      verificationStatus === "pending")
  );
}

export function hasCompletedUsdWallet(user: IUser | undefined) {
  return !!user?.business_account?.wallets?.some(
    (wallet) =>
      wallet?.wallet_type?.currency === "USD" &&
      wallet?.wallet_status === "completed"
  );
}

export function canStartUsdVerification(
  user: IUser | undefined,
  verificationStatus: VerificationStatus,
  caseStage?: string | null
) {
  const hasRejectedUsdState = caseStage === "bridge_rejected";

  return (
    !hasCompletedUsdWallet(user) &&
    !hasRejectedUsdState &&
    (verificationStatus === "kyc_tier_1" ||
      verificationStatus === "pending" ||
      verificationStatus === "completed")
  );
}

export function shouldPromptAddUsdAccount(
  user: IUser | undefined,
  verificationStatus: VerificationStatus,
  isNgnBranch: boolean,
  caseStage?: string | null
) {
  if (hasCompletedUsdWallet(user)) return false;
  if (caseStage === "bridge_rejected") return false;
  return verificationStatus === "completed" || isNgnBranch;
}

export function getOnboardingBranchState(
  user: IUser | undefined,
  verificationStatus: VerificationStatus
): OnboardingBranchState {
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");

  const isStep1Complete =
    verificationStatus !== "not_started" && verificationStatus !== undefined;
  const isBasicVerificationComplete =
    verificationStatus === "kyc_tier_1" || verificationStatus === "pending";
  const isVerificationComplete = verificationStatus === "completed";

  const hasNgnWallet = !!NGNAcct;
  const hasUsdWallet = !!USDAcct;

  const isNgnBranch =
    hasNgnWallet && isBasicVerificationComplete && !isVerificationComplete;

  const needsCurrencyChoice =
    isBasicVerificationComplete && !isVerificationComplete && !hasNgnWallet;

  const showDashboard =
    isVerificationComplete || (isNgnBranch && hasNgnWallet);

  const showAccountUpgrade = !showDashboard;

  return {
    verificationStatus,
    isStep1Complete,
    isVerificationComplete,
    isNgnBranch,
    needsCurrencyChoice,
    showDashboard,
    showAccountUpgrade,
    hasNgnWallet,
    hasUsdWallet,
  };
}
