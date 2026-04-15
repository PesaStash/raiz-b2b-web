import { sbcType } from "@/app/(dashboard)/_components/crypto/send/CryptoSend";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { IIntCountry } from "@/constants/send";
import { INGNSendOptions, IUSDSendOptions } from "@/types/misc";
import {
  EntityBeneficiary,
  EntityForeignPayoutBeneficiary,
  IExternalAccount,
  IP2pTransferResponse,
} from "@/types/services";
import { ITransactionCategory, PaymentStatusType } from "@/types/transactions";
import { ISearchedUser } from "@/types/user";

type CurrencyTypeKey = keyof typeof ACCOUNT_CURRENCIES;

export interface SendState {
  usdSendType: IUSDSendOptions | null;
  ngnSendType: INGNSendOptions;
  user: ISearchedUser | null;
  externalUser: IExternalAccount | null;
  usdBeneficiary: EntityBeneficiary | null;
  intBeneficiary: EntityForeignPayoutBeneficiary | null;
  currency: CurrencyTypeKey | null;
  amount: string;
  purpose: string;
  category: ITransactionCategory | null;
  transactionPin: string;
  status: PaymentStatusType | null;
  transactionDetail: IP2pTransferResponse | null;
  cryptoAddress: string;
  cryptoNetwork: string;
  cryptoType: sbcType | null;
  guestLocalCurrency: IIntCountry | null;
  // paymentRail: "ach" | "wire" | "ach-same-day" | null;
}

export interface AmountAndRemarksPayload {
  amount: string;
  purpose: string;
}

export interface SendActions {
  selectCurrency: (currency: CurrencyTypeKey) => void;
  selectNGNSendOption: (option: INGNSendOptions) => void;
  selectUSDSendOption: (option: IUSDSendOptions | null) => void;
  selectUser: (user: ISearchedUser | null) => void;
  selectExternalUser: (user: IExternalAccount | null) => void;
  selectUsdBeneficiary: (user: EntityBeneficiary | null) => void;
  selectIntBeneficiary: (user: EntityForeignPayoutBeneficiary | null) => void;
  setAmountAndRemark: (payload: AmountAndRemarksPayload) => void;
  selectCategory: (category: ITransactionCategory | null) => void;
  setTransactionPin: (pin: string) => void;
  setStatus: (status: PaymentStatusType | null) => void;
  setTransactionDetail: (detail: IP2pTransferResponse) => void;
  setCryptoAddress: (address: string) => void;
  setCryptoNetwork: (network: string) => void;
  setCryptoType: (type: sbcType) => void;
  setGuestLocalCurrency: (currency: IIntCountry) => void;
  // setPaymentRail: (rail: "ach" | "wire" | "ach-same-day") => void;
  reset: (currency: CurrencyTypeKey) => void;
}

export const initialSendState: SendState = {
  usdSendType: null,
  ngnSendType: "to Raizer",
  user: null,
  externalUser: null,
  usdBeneficiary: null,
  intBeneficiary: null,
  currency: "USD",
  amount: "",
  purpose: "",
  category: null,
  transactionPin: "",
  status: null,
  transactionDetail: null,
  cryptoAddress: "",
  cryptoNetwork: "",
  cryptoType: null,
  guestLocalCurrency: null,
  // paymentRail: null,
};

export interface SendSlice extends SendState {
  actions: SendActions;
}
