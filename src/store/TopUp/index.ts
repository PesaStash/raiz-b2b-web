import { create } from "zustand";
import {
  ICardDetails,
  initialTopupState,
  TopupSlice,
} from "./topupSlice.types";

export const useTopupStore = create<TopupSlice>((set) => ({
  ...initialTopupState,
  actions: {
    setAmount: (amount) => set(() => ({ amount })),
    setCardDetails: (card: ICardDetails) =>
      set(() => ({
        cardDetails: card,
      })),
    setPaymentOption: (paymentOption) => set(() => ({ paymentOption })),
    setStatus: (status) =>
      set(() => ({
        status,
      })),
    setZelleInfo: (zelleInfo) => set(() => ({ zelleInfo })),
    setStripeDetail: (stripeDetail) => set(() => ({ stripeDetail })),
    setTopupCurrency: (currency) => set(() => ({ topupCurrency: currency })),
    reset: () => set(initialTopupState),
  },
}));
