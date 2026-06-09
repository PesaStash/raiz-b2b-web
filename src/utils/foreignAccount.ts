import { FOREIGN_ACCOUNT_ACTIVATION_FEE_USD } from "@/constants/misc";
import { IUser } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

export function getUsdAccountBalance(user: IUser | undefined) {
  return findWalletByCurrency(user, "USD")?.account_balance ?? 0;
}

export function hasSufficientUsdForForeignAccount(user: IUser | undefined) {
  const usdWallet = findWalletByCurrency(user, "USD");
  if (!usdWallet) return false;

  return getUsdAccountBalance(user) >= FOREIGN_ACCOUNT_ACTIVATION_FEE_USD;
}

export function getInsufficientUsdForForeignAccountMessage() {
  return `You need at least $${FOREIGN_ACCOUNT_ACTIVATION_FEE_USD} in your USD account to create a foreign account.`;
}
