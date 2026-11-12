import type { ReceivingAccount } from "@/types/globalBalance";
import type { ForeignCurrency } from "@/types/services";
import type { IUser } from "@/types/user";

export function hasCreatedForeignAccount(
  user: IUser | undefined,
  currency: ForeignCurrency,
  receivingAccounts?: ReceivingAccount[],
) {
  const hasWallet = user?.business_account?.wallets?.some(
    (wallet) => wallet.wallet_type?.currency === currency,
  );
  if (hasWallet) return true;
  const accounts = [
    ...(user?.business_account?.receiving_accounts ?? []),
    ...(receivingAccounts ?? []),
  ];
  return accounts.some((account) => account.asset === currency);
}
