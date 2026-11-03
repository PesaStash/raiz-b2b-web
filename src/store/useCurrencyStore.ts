import { create } from "zustand";
import { AccountCurrencyType, ICurrencyName } from "@/types/misc";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { IUser, IWallet } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";
import { resolveActiveAccountCurrency } from "@/utils/onboardingBranch";
import { persist } from "zustand/middleware";

interface AccountCurrencyState {
  selectedCurrency: AccountCurrencyType;
  setSelectedCurrency: (
    currency: keyof typeof ACCOUNT_CURRENCIES,
    user: IUser | undefined
  ) => void;
  syncWithUser: (user: IUser | undefined) => void;
  selectedWallet: IWallet | undefined;
}

export const useCurrencyStore = create<AccountCurrencyState>()(
  persist(
    (set, get) => ({
      selectedCurrency: ACCOUNT_CURRENCIES.USD,
      selectedWallet: undefined,
      setSelectedCurrency: (currency, user) =>
        set(() => {
          const selectedCurrency = ACCOUNT_CURRENCIES[currency];
          const selectedWallet = findWalletByCurrency(
            user,
            selectedCurrency.name
          );
          return { selectedCurrency, selectedWallet };
        }),
      syncWithUser: (user) => {
        if (!user) return;

        const resolved = resolveActiveAccountCurrency(
          user,
          get().selectedCurrency.name as ICurrencyName
        );

        if (resolved === get().selectedCurrency.name && get().selectedWallet) {
          return;
        }

        const selectedCurrency = ACCOUNT_CURRENCIES[resolved];
        const selectedWallet = findWalletByCurrency(user, selectedCurrency.name);
        set({ selectedCurrency, selectedWallet });
      },
    }),
    {
      name: "currency-store",
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
