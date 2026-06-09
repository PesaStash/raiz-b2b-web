import { create } from "zustand";
import { initialSendState, SendSlice } from "./sendSlice.types";
import { passwordHash } from "@/utils/helpers";

export const useSendStore = create<SendSlice>((set) => ({
  ...initialSendState,
  actions: {
    selectCurrency: (currency) =>
      set(() => ({
        currency,
      })),
    selectUSDSendOption: (option) =>
      set(() => ({
        usdSendType: option,
      })),
    selectNGNSendOption: (option) =>
      set(() => ({
        ngnSendType: option,
      })),
    selectForeignSendOption: (option) =>
      set(() => ({
        foreignSendType: option,
      })),
    selectUser: (user) =>
      set(() => ({
        user,
      })),
    selectExternalUser: (user) =>
      set(() => ({
        externalUser: user,
      })),
    selectUsdBeneficiary: (user) =>
      set(() => ({
        usdBeneficiary: user,
      })),
    selectIntBeneficiary: (user) =>
      set(() => ({
        intBeneficiary: user,
      })),
    selectForeignBeneficiary: (user) =>
      set(() => ({
        foreignBeneficiary: user,
      })),
    setAmountAndRemark: (payload) =>
      set(() => ({
        amount: payload.amount,
        purpose: payload.purpose,
      })),
    selectCategory: (category) =>
      set(() => ({
        category,
      })),
    setTransactionPin: (pin) =>
      set(() => ({
        transactionPin: passwordHash(pin),
      })),
    setStatus: (status) =>
      set(() => ({
        status,
      })),
    setTransactionDetail: (detail) =>
      set((state) => ({
        ...state,
        transactionDetail: detail,
      })),
    setCryptoAddress: (address) =>
      set((state) => ({ ...state, cryptoAddress: address })),
    setCryptoNetwork: (network) =>
      set((state) => ({ ...state, cryptoNetwork: network })),
    setCryptoType: (type) => set(() => ({ cryptoType: type })),
    setGuestLocalCurrency: (guestLocalCurrency) =>
      set((state) => ({ ...state, guestLocalCurrency })),
    // setPaymentRail: (paymentRail) =>
    //   set((state) => ({ ...state, paymentRail })),
    reset: (currency) =>
      set(() => ({
        ...initialSendState,
        currency,
      })),
  },
}));
