import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ExchangeRatePreferenceStore {
  selectedCurrencies: string[];
  setSelectedCurrencies: (currencies: string[]) => void;
  toggleCurrency: (currency: string) => void;
}

export const useExchangeRatePreferenceStore = create<ExchangeRatePreferenceStore>()(
  persist(
    (set) => ({
      selectedCurrencies: [], // Default to empty, will be populated with defaults if empty in component
      setSelectedCurrencies: (currencies) => set({ selectedCurrencies: currencies.slice(0, 14) }),
      toggleCurrency: (currency) =>
        set((state) => {
          const isSelected = state.selectedCurrencies.includes(currency);
          if (isSelected) {
            return {
              selectedCurrencies: state.selectedCurrencies.filter((c) => c !== currency),
            };
          } else {
            if (state.selectedCurrencies.length >= 14) return state;
            return {
              selectedCurrencies: [...state.selectedCurrencies, currency],
            };
          }
        }),
    }),
    {
      name: "exchange-rate-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
