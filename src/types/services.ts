import { IBeneficiaryBank } from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/BankSelectModal";
import { IChain, IPagination } from "./misc";
import {
  IBillRequest,
  IPaymentMethod,
  ITransaction,
  ITransactionClass,
  ITransactionStatus,
  ITransactionType,
} from "./transactions";
import { INotification, ISearchedUser, IWallet } from "./user";
import { sbcType } from "@/app/(dashboard)/_components/crypto/send/CryptoSend";

export interface IRewardPoint {
  reward_point_id: string;
  entity_id: string;
  referral_code: string;
  point: number;
  number_of_referrals: number;
  super10_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface IRewardActivityType {
  reward_activity_type: string;
  reward_activity_type_code: number;
  reward_activity_type_description: string;
  points_awarded: number;
  reward_activity_type_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IRewardActivity {
  entity_id: string;
  reward_activity_type_id: number;
  points_gained: number;
  total_points: number;
  promo_img_url: string;
  referral_activity_id: string;
  created_at: Date;
  updated_at: Date;
  reward_activity_type: IRewardActivityType;
}

export interface IRewardActivityResponse {
  data: IRewardActivity[];
  pagination: IPagination;
}

export interface IFetchRewardsParams {
  limit: number;
  page: number;
}

export interface IResetPinPayload {
  otp: string | null;
  password: string | null;
  email: string | null;
}

export interface IChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface ITransactionPinPayload {
  transaction_pin: string;
}

export interface INotificationParams {
  page?: number;
  limit?: number;
  read?: boolean;
  notification_category_id?: number;
}

export interface INotificationResponse {
  pagination_details: IPagination;
  notifications: INotification[];
}

export interface ITxnReportPayload {
  wallet_id: string;
  number_of_days: number;
}

export interface IAnalyticsData {
  credit_amount: number;
  date: string;
  debit_amount: number;
}
export interface ITxnIncomeExpenseResponse {
  total_expense: number;
  total_income: number;
  analytics: IAnalyticsData[];
}

export interface ITxnReportCategoryResponse {
  category_emoji: string;
  percentage: number;
  total_amount: number;
  transaction_category: string;
  transaction_category_id: number;
}

export interface ITransactionParams {
  wallet_id: string;
  transaction_status_id?: number | null;
  transaction_type_id?: number | null;
  transaction_class_id?: number | null;
  payment_method_id?: string | null;
  transaction_report_id?: string | null;
  transaction_category_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  transaction_reference?: string | null;
  session_id?: string | null;
  order_number?: string | null;
  page?: number;
  limit?: number;
}

export interface ITxnReportResponse {
  pagination_details: IPagination;
  transaction_reports: ITransaction[];
}

export interface IBillRequestParams {
  status_id?: string | null;
  page?: number;
  limit?: number;
  currency?: string | null;
}

export interface IBillRequestResponse {
  pagination_details: IPagination;
  data: IBillRequest[];
}

export interface IUserSearchParams {
  page?: number;
  limit?: number;
  search: string;
  wallet_id: string;
}

export interface IUserSearchResponse {
  pagination_details: IPagination;
  results: ISearchedUser[];
}

export interface ITransactionCategory {
  transaction_category: string;
  transaction_category_code: number;
  transaction_category_description: string;
  category_emoji: string;
  transaction_category_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IAcceptRequestPayload {
  transaction_pin: string;
  params: {
    wallet_id: string;
    request_id: string;
  };
}

export interface IRequestFundsPayload {
  requestee_entity_id: string | null;
  transaction_amount: number;
  narration: string;
  transaction_category_id: number;
}

export interface IP2PTransferPayload {
  wallet_id: string | null;
  payload: {
    receiver_entity_id: string | null;
    transaction_amount: number;
    transaction_remarks: string | null;
    transaction_pin: string | null;
    transaction_category_id: number;
  };
}

export interface IP2pTransferResponse {
  wallet_id: string;
  transaction_type_id: number;
  transaction_class_id: number;
  payment_method_id: number;
  transaction_status_id: number;
  transaction_category_id: number;
  transaction_amount: number;
  currency: string;
  transaction_remarks: string;
  transaction_reference: string;
  transaction_date_time: Date;
  fee_amount: number;
  vat_amount: number;
  account_balance: number;
  transaction_description: string;
  third_party_name: string;
  third_party_profile_image_url: string;
  session_id: string;
  order_number: string;
  source_account_number: string;
  source_bank_name: string;
  beneficiary_account_number: string;
  beneficiary_bank: string;
  beneficiary_bank_name: string;
  ip_address: string;
  transaction_report_id: string;
  created_at: string;
  updated_at: string;
  transaction_type: ITransactionType;
  transaction_status: ITransactionStatus;
  transaction_class: ITransactionClass;
  payment_method: IPaymentMethod;
  transaction_category: ITransactionCategory;
}

export interface IP2pBeneficiariesParams {
  wallet_id: string;
  search?: string;
  page?: number;
  limit?: number;
  favourite?: boolean;
}

export interface IBeneficiariestResponse {
  pagination_details: IPagination;
  results: ISearchedUser[];
}

export interface IExternalAccount {
  bank_short_code: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  external_account_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IExternalBeneficiaryEntity {
  entity_id: string;
  external_account_id: string;
  favourite: boolean;
  ranking: number;
  favourite_external_account_id: string;
  created_at: string;
  updated_at: string;
  external_account: IExternalAccount;
}

export interface IExternalBeneficiariesResponse {
  pagination_details: IPagination;
  data: IExternalBeneficiaryEntity[];
}

export interface IExternalTransferPayload {
  wallet_id?: string;
  pin: ITransactionPinPayload;
  data: {
    beneficiary_account_name: string | null;
    beneficiary_account_number: string | null;
    transaction_amount: number;
    narration: string | null;
    beneficiary_bank_code: string | null;
    beneficiary_bank_name: string | null;
    transaction_category_id: number | null;
  };
}

export interface IExternalBeneficiaryPayload {
  bank_short_code: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
}

export interface ISwapPayload {
  amount: number;
  transaction_pin: string;
  currency: string;
}

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  enum?: string[];
  max_length?: number;
  min_length?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  const?: string;
  fields?: FormField[];
  banks?: IBeneficiaryBank[];
}

export interface IUsBeneficiaryPayload {
  optionType: IUsBeneficiaryOptionType;
  label: string;
  data: {
    bank_name: string;
    account_number: string;
    routing_number: string;
    account_type: "checking" | "savings";
    account_owner_name: string;
    street_line_1: string;
    street_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    payment_rail: "ach" | "wire";
  };
}

export interface IUsBeneficiariesParams {
  option_type: string;
  label?: string;
  page?: number;
  limit?: number;
}

export type IUsBeneficiaryOptionType =
  | "bank"
  | "zelle"
  | "card"
  | "international_bank"
  | "paypal"
  | "interac"
  | "eft";
export interface UsdBeneficiary {
  beneficiary_id: string;
  option_type: IUsBeneficiaryOptionType;
  account_name: string;
  label: string;
  usd_beneficiary_id: string;
  created_at: string;
  updated_at: string;
}

export interface EntityBeneficiary {
  entity_id: string;
  usd_beneficiary_id: string;
  ranking: number;
  entity_usd_beneficiary_id: string;
  created_at: string;
  updated_at: string;
  label: string;
  usd_beneficiary: UsdBeneficiary;
}

export interface IUsBeneficiariesResponse {
  pagination_details: IPagination;
  beneficiaries: EntityBeneficiary[];
}

export interface ISendMoneyUsBankPayload {
  amount: number;
  transaction_pin: string;
  usd_beneficiary_id: string | null;
  transaction_reason: string;
  transaction_category_id: number;
}

export interface ISendCryptoPayload {
  transaction_category_id: number;
  transaction_amount: number;
  transaction_pin: string;
  crypto_address: string;
  crypto_network: IChain;
  crypto_type: sbcType;
  transaction_description: string;
}

export interface IIntBeneficiariesParams {
  option_type: string;
  label?: string;
  page?: number;
  limit?: number;
}

export interface ForeignPayoutBeneficiary {
  beneficiary_name: string;
  beneficiary_id: string;
  beneficiary_currency: string;
  beneficiary_country: string;
  beneficiary_creation_status: string;
  beneficiary_account_number: string;
  beneficiary_email: string;
  reference: string;
  beneficiary_bank_name: string;
  foreign_payout_beneficiary_id: string;
  created_at: string;
  updated_at: string;
}

export interface EntityForeignPayoutBeneficiary {
  entity_id: string;
  foreign_payout_beneficiary_id: string;
  ranking: number;
  entity_foreign_payout_beneficiary_id: string;
  created_at: string;
  updated_at: string;
  foreign_payout_beneficiary: ForeignPayoutBeneficiary;
}

export interface IIntBeneficiariesResponse {
  pagination_details: IPagination;
  beneficiaries: EntityForeignPayoutBeneficiary[];
}

export type IntCountryType =
  | "GH" // Ghana
  | "AU" // Australia
  | "AT" // Austria
  | "AD" // Andorra
  | "BE" // Belgium
  | "BG" // Bulgaria
  | "CZ" // Czech Republic
  | "DE" // Germany
  | "DK" // Denmark
  | "EE" // Estonia
  | "ES" // Spain
  | "FI" // Finland
  | "GR" // Greece
  | "HR" // Croatia
  | "HU" // Hungary
  | "IE" // Ireland
  | "IS" // Iceland
  | "IT" // Italy
  | "LV" // Latvia
  | "LT" // Lithuania
  | "LU" // Luxembourg
  | "LI" // Liechtenstein
  | "MT" // Malta
  | "MC" // Monaco
  | "NL" // Netherlands
  | "NO" // Norway
  | "PL" // Poland
  | "PT" // Portugal
  | "RO" // Romania
  | "SE" // Sweden
  | "SK" // Slovakia
  | "SI" // Slovenia
  | "SG" // Singapore
  | "SM" // San Marino
  | "VA" // Vatican City
  | "CN" // China
  | "KE" // Kenya
  | "UG" // Uganda
  | "NG" // Nigeria
  | "TZ" // Tanzania
  | "ZM" // Zambia
  | "MW" // Malawi
  | "GB" // United Kingdom
  | "BF" // Burkina Faso
  | "CM" // Cameroon
  | "SN" // Senegal
  | "RW" // Rwanda
  | "GN" // Guinea
  | "ML" // Mali
  | "TG" // Togo
  | "AE" // United Arab Emirates
  | "FR" // France
  | "CI" // Ivory Coast
  | "BJ" // Benin
  | "CD"; // Democratic Republic of Congo

export type IntCurrencyCode =
  | "USD" // United States
  | "NGN" // Nigeria
  | "GHS" // Ghana
  | "KES" // Kenya
  | "UGX" // Uganda
  | "TZS" // Tanzania
  | "ZMW" // Zambia
  | "MWK" // Malawi
  | "RWF" // Rwanda
  | "GNF" // Guinea

  | "GBP" // United Kingdom
  | "EUR" // Eurozone (Germany, France, Italy, Spain, Netherlands, etc.)
  | "DKK" // Denmark
  | "AUD" // Australia
  | "SGD" // Singapore
  | "CNY" // China
  | "AED" // United Arab Emirates

  | "XOF" // West African CFA Franc (Benin, Burkina Faso, Ivory Coast, Mali, Niger, Senegal, Togo)
  | "XAF" // Central African CFA Franc (Cameroon, Central African Republic, Chad, Congo, Equatorial Guinea, Gabon)
  | "CDF"; // Democratic Republic of Congo


export interface IIntBeneficiaryPayload {
  customer_email: string | null;
  country: IntCountryType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface IInitialPayoutResponse {
  entity_id: string;
  foreign_payout_beneficiary_id: string;
  payout_id: string;
  description: string;
  reference: string;
  amount: number;
  fees: number;
  status: string;
  payout_currency: string;
  exchange_rate: number;
  payout_amount: number;
  final_status: string;
  raiz_charge: number;
  payout_initiation_id: string;
  created_at: string;
  updated_at: string;
  foreign_payout_beneficiary: ForeignPayoutBeneficiary;
}

export interface IIntSendPayload {
  payout_initiation_id: string | null;
  wallet_id: string | null;
  transaction_category_id: number;
  transaction_description: string;
  data: ITransactionPinPayload;
}

export interface IBusinessPaymentData {
  account_user: {
    account_name: string
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    image: string | null;
    phone_number: string | null;
    username: string;
    selfie_image: string | null;
    gender: string | null;
    entity_id: string;
    last_login: string | null;
    occupation: string | null;
    industry: string | null;
    customer_segmentation: string;
    qr_code: string | null;
    account_user_id: string;
  };
  email: string;
  wallets: IWallet[];
}

export interface IPaymentChannel {
  channel_id: string;
  channel_name: string;
  country_code: string;
  max: number;
  min: number;
  estimated_settlement_time: number;
}

export interface IPaymentNetwork {
  network_id: string;
  network_name: string;
  channel_id: string;
  country_code: string;
  account_type: string;
}

export interface InitiateAfricaPayinPayload {
  data: {
    channel_id: string;
    network_id?: string | null;
    account_type: string;
    account_number?: string | null;
    amount: number;
    sender_name: string;
    transaction_description: string;
  };
  username: string;
}

export interface InitiateAfricaPayinResponse {
  payin_id: string;
  amount: number;
  payout_amount: number;
  rate: number;
  payout_currency: string;
  expires_at: Date;
}

export interface FinalizeAfricaPayinResponse
  extends InitiateAfricaPayinResponse {
  collection_account_number: string;
  collection_bank_name: string;
  collection_account_name: string;
}

export interface FeedbackPayload {
  email: string;
  feedback: string;
  feature: string;
}

interface MonthlyVolume {
  month: string; // e.g., "Sep 2024"
  value: number;
}

interface MonthlyActivity {
  month: string;
  transfer: number;
  swap: number;
  top_up: number;
}

export interface VolumeAndActivityData {
  volume: MonthlyVolume[];
  activity: MonthlyActivity[];
}

export interface IBusinessVerificationPayload {
  business_registration_number: string | null;
  business_name: string | null;
  business_email: string | null;
  country_code: string | null;
  state: string | null;
  zip_code: string | null;
  street: string | null;
  building_number: string | null;
  city: string | null;
  length_of_stay_months: number | null;
}

export interface IInvoiceSettingsPayload {
  default_currency?: string;
  invoice_prefix?: string;
  terms_and_conditions: string;
  discount_level: "line" | "total" | null;
  tax_level: "line" | "total" | null;
  logo_url?: string;
}

export interface IAddCustomerPayload {
  customer_type: "individual" | "business"
  full_name?: string | null;
  email: string | null;
  phone_number: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  business_name?: string | null;
}

export interface IUpdateCustomerPayload {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  business_name: string | null;
  business_account_id: string | null
  customer_type: "individual" | "business"
}

export interface IInvoiceTax {
  tax_name: string;
  tax_percentage: number;
  business_account_id: string;
  tax_rate_id: string;
}

export interface ICreateTaxPayload {
  tax_name: string;
  tax_percentage: number;
}

export interface IFectchInvoiceParams {
  search?: string;
  status?: string;
  issued_date_from?: string;
  issued_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  page?: number;
  limit?: number;
}

export interface SendInvoicemailPayload {
  payment_link: string;
  invoice_pdf_url: string;
}
