import { create } from "zustand";
import {
  CurrencyTypeKey,
  initialSwapState,
  INVALID_SWAP_PAIRS,
  SwapSlice,
} from "./swapSlice.types";

const isValidSwapPair = (
  from: CurrencyTypeKey,
  to: CurrencyTypeKey
): boolean => {
  const pairKey = `${from}-${to}`;
  return !INVALID_SWAP_PAIRS.has(pairKey);
};

export const useSwapStore = create<SwapSlice>((set) => ({
  ...initialSwapState,
  actions: {
    switchSwapWallet: (clickedCurrency, walletData, fromCurrency) => {
      set((state) => {
        // When fromCurrency is explicitly provided (e.g. on first open), use it
        // directly and skip the reverse-detection heuristic.
        let finalFrom = fromCurrency ?? state.swapFromCurrency;
        let finalTo = clickedCurrency;

        // REVERSE CASE: only applies when re-clicking the current source in the
        // destination selector (no explicit fromCurrency supplied).
        if (!fromCurrency && clickedCurrency === state.swapFromCurrency) {
          finalFrom = state.swapToCurrency;
          finalTo = state.swapFromCurrency;
        }

        //Validate final pair
        if (!isValidSwapPair(finalFrom, finalTo)) {
          console.warn(`Invalid swap pair: ${finalFrom} to ${finalTo}`);
          return state;
        }

        const swapFromWallet =
          walletData?.find((w) => w.wallet_type.currency === finalFrom) || null;

        const swapToWallet =
          walletData?.find((w) => w.wallet_type.currency === finalTo) || null;

        return {
          ...state,
          swapFromCurrency: finalFrom,
          swapToCurrency: finalTo,
          swapFromWallet,
          swapToWallet,
        };
      });

      return true;
    },

    setAmount: (amount) =>
      set({
        amount,
      }),
    setTransactionPin: (pin) =>
      set({
        transactionPin: pin,
      }),
    setCoinType: (coinType) =>
      set({
        coinType,
      }),
    setStatus: (status) =>
      set(() => ({
        status,
      })),
    isValidSwapPair,
    reset: () =>
      set({
        ...initialSwapState,
      }),
  },
}));
