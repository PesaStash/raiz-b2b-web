/* eslint-disable @typescript-eslint/no-explicit-any */
import { sbcType } from "@/app/(dashboard)/_components/crypto/send/CryptoSend";
import { ACCOUNT_CURRENCIES, SWAP_ACCOUNT_CURRENCIES } from "@/constants/misc";
import { PaymentStatusType } from "@/types/transactions";
import { IWallet } from "@/types/user";

export type CurrencyTypeKey = keyof typeof ACCOUNT_CURRENCIES;

export const INVALID_SWAP_PAIRS = new Set(["SBC-NGN", "NGN-SBC"]);

export interface SwapState {
  swapFromWallet: Record<any, any> | null;
  swapToWallet: Record<string, any> | null;
  swapFromCurrency: CurrencyTypeKey;
  swapToCurrency: CurrencyTypeKey;
  amount: string;
  transactionPin: string;
  walletData?: {
    wallets: Array<{ wallet_type: { currency: CurrencyTypeKey } }>;
  };
  status: PaymentStatusType | null;
  coinType: sbcType | null;
}

export interface SwapActions {
  switchSwapWallet: (
    clickedCurrency: CurrencyTypeKey,
    walletData?: IWallet[]
  ) => boolean;
  setAmount: (amount: string) => void;
  setTransactionPin: (pin: string) => void;
  setCoinType: (coinType: sbcType) => void;
  setStatus: (status: PaymentStatusType | null) => void;
  isValidSwapPair: (from: CurrencyTypeKey, to: CurrencyTypeKey) => boolean;
  reset: () => void;
}

export const initialSwapState: SwapState = {
  swapFromWallet: null,
  swapToWallet: null,
  swapFromCurrency: ACCOUNT_CURRENCIES.USD.name,
  swapToCurrency: ACCOUNT_CURRENCIES.NGN.name,
  amount: "",
  transactionPin: "",
  walletData: undefined,
  status: null,
  coinType: null,
};

export interface SwapSlice extends SwapState {
  actions: SwapActions;
}
