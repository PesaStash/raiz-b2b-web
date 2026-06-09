import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { ICurrencyName } from "@/types/misc";
import { IUser } from "@/types/user";
import { determineSwapPair, findWalletByCurrency } from "@/utils/helpers";
import { CurrencyTypeKey } from "@/store/Swap/swapSlice.types";

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

export function userHasWalletCurrency(
  user: IUser | undefined,
  currency: ICurrencyName
) {
  return !!findWalletByCurrency(user, currency);
}

export function getDefaultAccountCurrency(
  user: IUser | undefined,
  verificationStatus?: VerificationStatus
): ICurrencyName {
  if (!user?.business_account?.wallets?.length) {
    return "USD";
  }

  const status =
    verificationStatus ??
    user.business_account.business_verifications?.[0]?.verification_status;

  const branchState = getOnboardingBranchState(user, status);

  if (branchState.isNgnBranch && branchState.hasNgnWallet) {
    return "NGN";
  }

  if (userHasWalletCurrency(user, "USD")) {
    return "USD";
  }

  const firstWalletCurrency = user.business_account.wallets[0]?.wallet_type
    ?.currency;

  if (
    firstWalletCurrency &&
    firstWalletCurrency in ACCOUNT_CURRENCIES
  ) {
    return firstWalletCurrency as ICurrencyName;
  }

  return "USD";
}

export function resolveActiveAccountCurrency(
  user: IUser | undefined,
  selectedCurrency: ICurrencyName,
  verificationStatus?: VerificationStatus
): ICurrencyName {
  const status =
    verificationStatus ??
    user?.business_account?.business_verifications?.[0]?.verification_status;

  const branchState = getOnboardingBranchState(user, status);

  if (
    branchState.isNgnBranch &&
    branchState.hasNgnWallet &&
    !branchState.isVerificationComplete
  ) {
    return "NGN";
  }

  if (userHasWalletCurrency(user, selectedCurrency)) {
    return selectedCurrency;
  }

  return getDefaultAccountCurrency(user, status);
}

export function getDefaultSwapCurrencies(user: IUser | undefined): {
  from: ICurrencyName;
  to: ICurrencyName;
} {
  const wallets = user?.business_account?.wallets ?? [];
  if (wallets.length < 2) {
    return { from: "USD", to: "NGN" };
  }

  const defaultCurrency = getDefaultAccountCurrency(user);
  const pair = determineSwapPair(defaultCurrency as CurrencyTypeKey, wallets);

  if (pair.isValid) {
    return {
      from: pair.fromCurrency,
      to: pair.toCurrency,
    };
  }

  return { from: "USD", to: "NGN" };
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
