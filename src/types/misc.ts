import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { CurrencyTypeKey } from "@/store/Swap/swapSlice.types";
import { ReactNode } from "react";

export interface ISidebarMenuItem {
  name: string;
  link: string;
  icon: (isActive: boolean) => React.ReactNode;
  locked?: boolean;
}

export interface IRegisterFormValues {
  email: string;
  password: string;
  // username: string;
  // phone_number: string;
  country_id: string;
  country_name?: string;
  referral_code?: string;
  otp: string;
  // useCases?: number[];
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface AccountSetupStep {
  title:
    | "Account created"
    | "Verify your phone"
    | "Add a residential Address"
    | "Secure your account";
  subtitle: string;
  status: "completed" | "in-complete";
  icon: ReactNode;
}

export type AccountCurrencyType =
  (typeof ACCOUNT_CURRENCIES)[keyof typeof ACCOUNT_CURRENCIES];

export type ICurrencyName = keyof typeof ACCOUNT_CURRENCIES;

export interface AccountSetupProps {
  selectedStep: AccountSetupStep;
  setSelectedStep: (step: AccountSetupStep | null) => void;
}

export type IUSDSendOptions =
  | "to Raizer"
  | "usBank"
  | "internationalRemittance"
  | "to debit card"
  | "to paypal"
  | "to canada"
  | "to zelle"
  | "to cashapp";

export type INGNSendOptions = "to Raizer" | "to other bank";

export interface ICountry {
  country_name: string;
  country_code: string;
  currency: string;
  is_supported: boolean;
  country_flag: string;
  area_code: string;
  country_id: string;
  created_at: string;
  updated_at: string;
}

export interface IEntityAddress {
  country_id: string;
  state: string;
  lga: string;
  building_number: string;
  street: string;
  city: string;
  zip_code: string;
  address_document_url: string;
  length_of_stay_months: number;
  inquiry_id: string;
  entity_id: string;
  entity_address_id: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  country: ICountry;
}

export interface IPagination {
  total_results: number;
  current_results_on_page: number;
  current_page: number;
  next_page: number;
  previous_page: number;
  total_pages: number;
}

export interface ITiers {
  level: string;
  min: number;
  max: number;
}

export interface IBank {
  bankName: string;
  bankCode: string;
  bankUrl: string;
  bg2Url: string;
  bgUrl: string;
}

export type IChain = "tron" | "ethereum" | "polygon" | "bsc";

export interface SwapPairResult {
  fromCurrency: CurrencyTypeKey;
  toCurrency: CurrencyTypeKey;
  isValid: boolean;
  message?: string;
}
