import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ICurrencyName } from "@/types/misc";
import { IUser } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

export const useCurrentWallet = (user: IUser | undefined) => {
  const { selectedCurrency } = useCurrencyStore();

  return findWalletByCurrency(user, selectedCurrency.name as ICurrencyName) ?? null;
};
