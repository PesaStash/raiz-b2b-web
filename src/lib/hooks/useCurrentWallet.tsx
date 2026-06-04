import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IUser } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

export const useCurrentWallet = (user: IUser | undefined) => {
  const { selectedCurrency, selectedWallet } = useCurrencyStore();

  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");
  const SBCAcct = findWalletByCurrency(user, "SBC");

  const getCurrentWallet = () => {
    if (selectedWallet) return selectedWallet;
    if (selectedCurrency.name === "NGN") return NGNAcct;
    if (selectedCurrency.name === "USD") return USDAcct;
    if (selectedCurrency.name === "GBP") return GBPAcct;
    if (selectedCurrency.name === "EUR") return EURAcct;
    if (selectedCurrency.name === "SBC") return SBCAcct;
    return null;
  };

  return getCurrentWallet();
};
