import { useMemo } from "react";
import { IUser, IWallet } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

export function isEligibleNgnPayoutWallet(wallet: IWallet): boolean {
  return (
    wallet.wallet_type?.currency === "NGN" &&
    wallet.wallet_status === "completed" &&
    wallet.is_pnd !== true
  );
}

export function getEligibleNgnPayoutWallets(
  user: IUser | undefined,
): IWallet[] {
  const wallets = user?.business_account?.wallets ?? [];
  return wallets.filter(isEligibleNgnPayoutWallet);
}

export function useEligibleNgnPayoutWallets(user: IUser | undefined) {
  return useMemo(() => getEligibleNgnPayoutWallets(user), [user]);
}

export function getSelectedPayoutWallet(
  user: IUser | undefined,
  sourceWalletId: string | null | undefined,
): IWallet | undefined {
  if (!sourceWalletId) {
    return getEligibleNgnPayoutWallets(user)[0];
  }
  return user?.business_account?.wallets?.find(
    (wallet) => wallet.wallet_id === sourceWalletId,
  );
}

export function isWalletBlockedForPayouts(
  wallet: IWallet | undefined,
  sourceWalletStatus: string | null | undefined,
): boolean {
  if (!wallet) return false;
  if (wallet.is_pnd === true) return true;
  if (sourceWalletStatus && /block|frozen|suspend/i.test(sourceWalletStatus)) {
    return true;
  }
  return wallet.wallet_status !== "completed";
}
