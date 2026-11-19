import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ICurrencyName } from "@/types/misc";
import { IUser } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

export const useCurrentWallet = (user: IUser | undefined) => {
  const { selectedCurrency, selectedWallet } = useCurrencyStore();

  const active = user?.business_account?.wallets.find(
    (wallet) => wallet.wallet_id === selectedWallet?.wallet_id &&
      wallet.wallet_type.currency === selectedCurrency.name,
  );
  if (active) return active;
  return findWalletByCurrency(user, selectedCurrency.name as ICurrencyName) ?? null;
};
