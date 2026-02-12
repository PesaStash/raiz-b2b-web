import { ICanadianBank } from "@/app/(dashboard)/_components/send/usd/canada/eft/CanadianBanksModal";
import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import { PublicAxios } from "@/lib/publicAxios";
import {
  IAcceptRequestPayload,
  IBeneficiariestResponse,
  IBillRequestParams,
  IBillRequestResponse,
  IBusinessPaymentData,
  IExternalBeneficiariesResponse,
  IExternalBeneficiaryPayload,
  IExternalTransferPayload,
  IInitialPayoutResponse,
  IIntBeneficiariesParams,
  IIntBeneficiariesResponse,
  IIntBeneficiaryPayload,
  IIntSendPayload,
  IntCurrencyCode,
  IP2pBeneficiariesParams,
  IP2PTransferPayload,
  IP2pTransferResponse,
  IRequestFundsPayload,
  ISendCryptoPayload,
  ISendMoneyUsBankPayload,
  ISwapPayload,
  ITransactionCategory,
  ITransactionParams,
  ITxnReportResponse,
  IUsBeneficiariesParams,
  IUsBeneficiariesResponse,
  IUsBeneficiaryPayload,
  VolumeAndActivityData,
} from "@/types/services";
import {
  INgnTempPaymentLinkPayload,
  IRate,
  ITransactionClass,
} from "@/types/transactions";

export const FetchTransactionReportApi = async (
  params: ITransactionParams,
): Promise<ITxnReportResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/transaction-reports/`,
    { params: queryParams, silent: true } as CustomAxiosRequestConfig,
  );
  return response?.data;
};

export const FetchBillRequestApi = async (
  params: IBillRequestParams,
): Promise<IBillRequestResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/requests/funds/received/`,
    { params: queryParams },
  );
  return response?.data;
};

export const FetchTransactionCategoriesApi = async (): Promise<
  ITransactionCategory[]
> => {
  const response = await AuthAxios.get(
    "/business/transactions/transaction-categories/",
  );
  return response?.data;
};

export const AcceptRequestApi = async ({
  params,
  transaction_pin,
}: IAcceptRequestPayload): Promise<IP2pTransferResponse> => {
  const response = await AuthAxios.patch(
    `/business/transactions/requests/funds/${params?.request_id}/accept/`,
    { transaction_pin },
    {
      params,
    },
  );
  return response?.data;
};

export const RejectRequestApi = async (request_id: string, reason?: string) => {
  const response = await AuthAxios.patch(
    `/business/transactions/requests/funds/${request_id}/decline/?reason_for_decline=${reason}`,
    null,
    {
      params: {
        request_id,
      },
    },
  );
  return response?.data;
};

export const RequestFundsApi = async (
  wallet_id: string | null,
  data: IRequestFundsPayload,
) => {
  const response = await AuthAxios.post(
    `/business/transactions/requests/funds/`,
    data,
    {
      params: {
        wallet_id,
      },
    },
  );
  return response?.data;
};

export const FetchSentRequestApi = async (
  params: IBillRequestParams,
): Promise<IBillRequestResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/requests/funds/sent/`,
    { params: queryParams },
  );
  return response?.data;
};

export async function P2PDebitApi({
  wallet_id,
  payload,
}: IP2PTransferPayload): Promise<IP2pTransferResponse> {
  const response = await AuthAxios.post(
    `/business/transactions/debits/p2p/?wallet_id=${wallet_id}`,
    payload,
  );
  return response.data;
}

export const GetTransactionFeeApi = async (
  amount: number,
  transfer_type: "NGN" | "USD" | "WIRE",
  usd_beneficiary_id?: string,
): Promise<number> => {
  const response = await AuthAxios.get(
    `/business/transactions/charges/get/usd/?amount=${amount}&transfer_type=${transfer_type}&usd_beneficiary_id=${usd_beneficiary_id}`,
  );
  return response?.data;
};

export const GetIntTransactionFeeApi = async (
  amount: number,
  transfer_type: "NGN" | "USD" | "WIRE" | "CRYPTO" | "CRYPTO_SWAP",
): Promise<number> => {
  const response = await AuthAxios.get(
    `/business/transactions/charges/get/?amount=${amount}&transfer_type=${transfer_type}`,
  );
  return response?.data;
};

export const GetCadTransactionFeeApi = async (
  cad_amount: number,
): Promise<number> => {
  const response = await AuthAxios.get(
    `/business/transactions/withdrawal/usd/interac-exchange-rate/?cad_amount=${cad_amount}`,
  );
  return response?.data;
};

export const FetchP2PBeneficiariesApi = async (
  params: IP2pBeneficiariesParams,
): Promise<IBeneficiariestResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/p2p/beneficiaries/get/`,
    { params: queryParams },
  );
  return response?.data;
};

export const AddP2PBeneficiaryApi = async (
  wallet_id: string,
  beneficiary_entity_id: string,
) => {
  const response = await AuthAxios.post(
    `/business/transactions/p2p/beneficiaries/add/?wallet_id=${wallet_id}&beneficiary_entity_id=${beneficiary_entity_id}`,
  );
  return response?.data;
};

export const AddExternalBeneficiaryApi = async (
  data: IExternalBeneficiaryPayload,
) => {
  const response = await AuthAxios.post(
    `/business/transactions/external-beneficiaries/add/`,
    data,
  );
  return response?.data;
};

export const FetchNgnAcctDetailsApi = async ({
  account_number,
  bank_code,
}: {
  account_number: string;
  bank_code: string;
}) => {
  const response = await AuthAxios.get(
    `/business/transactions/bank-account-details/nigeria/?account_number=${account_number}&bank_code=${bank_code}`,
  );
  return response?.data;
};

export const FetchExternalBeneficiariesApi = async (
  params: IP2pBeneficiariesParams,
): Promise<IExternalBeneficiariesResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/external-beneficiaries/get/`,
    { params: queryParams },
  );
  return response?.data;
};

export async function ExternalNGNDebitApi({
  data,
  pin,
  wallet_id,
}: IExternalTransferPayload): Promise<IP2pTransferResponse> {
  const response = await AuthAxios.post(
    `/business/transactions/naira/send/?wallet_id=${wallet_id}`,
    { data, pin },
  );
  return response.data;
}

export async function GetExchangeRate(currencyCode: string): Promise<{
  buy_rate: number;
  currency: string;
  sell_rate: number;
}> {
  const response = await AuthAxios.get(
    `/business/transactions/swap/exchange-rates/?currency=${currencyCode}`,
  );
  return response.data;
}

export async function GetSwapRate(currencyCode: string): Promise<{
  buy_rate: number;
  currency: string;
  sell_rate: number;
}> {
  const response = await AuthAxios.get(
    `/business/transactions/swap/exchange-rates/?currency=${currencyCode}`,
  );
  return response.data;
}

export async function SellDollarApi(payload: ISwapPayload) {
  const response = await AuthAxios.post(
    "/business/transactions/swap/sell-dollar/",
    payload,
  );
  return response.data;
}

export async function BuyDollarApi(payload: ISwapPayload) {
  const response = await AuthAxios.post(
    "/business/transactions/swap/buy-dollar/",
    payload,
  );
  return response.data;
}

export async function BuyStableCoinApi(payload: ISwapPayload) {
  const response = await AuthAxios.post(
    "/business/transactions/swap/buy-stablecoin/",
    payload,
  );
  return response.data;
}

export async function SellStableCoinApi(payload: ISwapPayload) {
  const response = await AuthAxios.post(
    "/business/transactions/swap/sell-stablecoin/",
    payload,
  );
  return response.data;
}

export const GethInternationalBeneficiaryFormFields = async () => {
  const response = await AuthAxios.get(
    `/business/transactions/remittance/form-fields/`,
  );
  return response?.data;
};

export const GetUSBeneficiaryFormFields = async () => {
  const response = await AuthAxios.get(
    `/business/transactions/withdrawal/usd/beneficiaries/form-fields/`,
  );
  return response?.data;
};

export const CreateUsBeneficiary = async (payload: IUsBeneficiaryPayload) => {
  const response = await AuthAxios.post(
    `/business/transactions/withdrawal/usd/beneficiaries/?label=${payload.label}&option_type=${payload.optionType}`,
    payload.data,
  );
  return response?.data;
};

export const FetchUsBeneficiariesApi = async (
  params: IUsBeneficiariesParams,
): Promise<IUsBeneficiariesResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/withdrawal/usd/beneficiaries/`,
    { params: queryParams },
  );
  return response?.data;
};

export const GetCanadianBanks = async (): Promise<ICanadianBank[]> => {
  const response = await AuthAxios.get(
    `/business/transactions/withdrawal/usd/beneficiaries/canada/banks/`,
  );
  return response?.data;
};

export const SendMoneyUSBankApi = async (
  data: ISendMoneyUsBankPayload,
): Promise<IP2pTransferResponse> => {
  const response = await AuthAxios.post(
    "/business/transactions/withdrawal/usd/initiate/",
    data,
  );
  return response?.data;
};

export const SendCryptoApi = async (
  data: ISendCryptoPayload,
  wallet_id: string,
): Promise<IP2pTransferResponse> => {
  const response = await AuthAxios.post(
    `/business/transactions/crypto/send/?wallet_id=${wallet_id}`,
    data,
  );
  return response?.data;
};

export const GetIntBeneficiaryFormFields = async () => {
  const response = await AuthAxios.get(
    `/business/transactions/remittance/form-fields/`,
  );
  return response?.data;
};

export const FetchIntBeneficiariesApi = async (
  params: IIntBeneficiariesParams,
): Promise<IIntBeneficiariesResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(
    `/business/transactions/remittance/beneficiaries/`,
    { params: queryParams },
  );
  return response?.data;
};

export const CreateIntBeneficiary = async (payload: IIntBeneficiaryPayload) => {
  const response = await AuthAxios.post(
    `/business/transactions/remittance/beneficiary/?country=${payload.country}&customer_email=${payload.customer_email}`,
    payload.data,
  );
  return response?.data;
};

export async function SendInternationalInitialPayout(data: {
  foreign_payout_beneficiary_id: string | null;
  amount: number;
}): Promise<IInitialPayoutResponse> {
  const response = await AuthAxios.post(
    "/business/transactions/remittance/payout/initiate/",
    data,
  );
  return response?.data;
}

export const SendIntBeneficiariesApi = async ({
  data,
  ...params
}: IIntSendPayload): Promise<IP2pTransferResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.post(
    `/business/transactions/remittance/payout/finalize/`,
    data,
    { params: queryParams },
  );
  return response?.data;
};

export async function GetTransactionClasses(): Promise<ITransactionClass[]> {
  const response = await AuthAxios.get("/transactions/transaction-class/");
  return response.data;
}

export const GenerateStatementApi = async (params: {
  wallet_id: string;
  startDate: string;
  endDate: string;
}) => {
  const response = await AuthAxios.get(
    `/business/transactions/reports/statement/generate/?wallet_id=${params.wallet_id}&start_date=${params.startDate}&end_date=${params.endDate}`,
  );
  return response?.data;
};

export const GetMinAmountApi = async (currency: IntCurrencyCode) => {
  const response = await AuthAxios.get(
    `/business/transactions/remittance/account-types/minimum-amount/?currency=${currency}`,
  );
  return response?.data;
};

export const createStripePaymentIntent = async (
  amountInCents: number,
  payment_method_id: string,
  data: IBusinessPaymentData,
) => {
  const res = await PublicAxios.post(
    `/admin/transaction/topup/usd/create-intent/?name=${data?.account_user?.username}&email=${data?.email}&entity_id=${data?.account_user?.entity_id}`,
    {
      transaction_amount: amountInCents,
      curreny: "USD",
      payment_method_id,
    },
  );

  return {
    ...res.data,
    payment_method_id,
  };
};

export const confirmStripePaymentIntent = async (
  payment_intent_id: string,
  data: IBusinessPaymentData,
  payer: {
    firstName: string;
    lastName: string;
    email: string;
  },
  purpose: string,
) => {
  const params = {
    entity_id: data?.account_user?.entity_id,
    payer_first_name: payer.firstName,
    payer_last_name: payer.lastName,
    payer_email: payer.email,
    payment_description: purpose,
  };

  const res = await PublicAxios.post(
    "/admin/transaction/topup/usd/confirm-intent/",
    {
      payment_intent: payment_intent_id,
      currency: "USD",
    },
    { params },
  );

  return res.data;
};

export const GetTransactionsAnalyticsStatusApi = async (
  wallet_id: string | null,
): Promise<{
  pending: number;
  completed: number;
  failed: number;
  percentage_pending_difference_since_last_month: number;
  percentage_completed_difference_since_last_month: number;
}> => {
  const response = await AuthAxios.get(
    `/business/transactions/transaction-reports/analytics/status/?wallet_id=${wallet_id}`,
    {
      silent: true,
    } as CustomAxiosRequestConfig,
  );
  return response?.data;
};

export const GetActivityStats = async (
  wallet_id: string,
): Promise<VolumeAndActivityData> => {
  const response = await AuthAxios.get(
    `/business/transactions/transaction-reports/analytics/activities/?wallet_id=${wallet_id}`,
    {
      silent: true,
    } as CustomAxiosRequestConfig,
  );
  return response?.data;
};

export async function InitiateZelleTopApi(
  wallet_id: string | null,
  payload: { expected_amount: number },
) {
  const response = await AuthAxios.post(
    `/business/transactions/topup/usd/zelle/initiate/?wallet_id=${wallet_id}`,
    payload,
  );
  return response.data;
}

export const createStripeTopPaymentIntent = async (amountInCents: number) => {
  const res = await AuthAxios.post(
    `/business/transactions/topup/usd/create-intent/`,
    {
      transaction_amount: amountInCents,
      curreny: "USD",
    },
  );
  return res?.data;
};

export const confirmStripeTopPaymentIntent = async (payment_intent: string) => {
  const res = await AuthAxios.post(
    `/business/transactions/topup/usd/confirm-intent/`,
    {
      payment_intent,
      curreny: "USD",
    },
  );
  return res?.data;
};

export const createGuestStripePaymentIntent = async ({
  amountInCents,
  entity_id,
  sender_name,
  sender_email,
}: // currency
{
  amountInCents: number;
  entity_id: string;
  sender_name: string;
  sender_email: string;
  // currency: IntCurrencyCode;
}) => {
  const res = await PublicAxios.post(
    `/admin/transaction/payins/africa/card/create-intent/?sender_name=${sender_name}&sender_email=${sender_email}&entity_id=${entity_id}`,
    {
      transaction_amount: amountInCents,
      currency: "USD",
    },
  );
  return res.data;
};

export const confirmGuestStripeTopPaymentIntent = async ({
  payment_intent,
  entity_id,
  payer_first_name,
  payer_last_name,
  payer_email,
  payment_description,
}: {
  payment_intent: string;
  entity_id: string;
  payer_first_name: string;
  payer_last_name: string;
  payer_email: string;
  payment_description: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("entity_id", entity_id);
  queryParams.append("payer_first_name", payer_first_name);
  queryParams.append("payer_last_name", payer_last_name);
  queryParams.append("payer_email", payer_email);
  queryParams.append("payment_description", payment_description);
  const res = await PublicAxios.post(
    `/admin/transaction/topup/usd/confirm-intent/?${queryParams.toString()}`,
    {
      payment_intent,
      currency: "USD",
    },
  );
  return res?.data;
};

export async function InitiateGuestZellePaymentApi(
  wallet_id: string | null,
  payload: { expected_amount: number },
) {
  const response = await PublicAxios.post(
    `/admin/transaction/topup/usd/zelle/initiate/?wallet_id=${wallet_id}`,
    payload,
  );
  return response.data;
}

export const GetAllRates = async (): Promise<IRate[]> => {
  const response = await PublicAxios.get(`/business/transactions/rates/all/`, {
    silent: true,
  } as CustomAxiosRequestConfig);
  return response.data as IRate[];
};

export const CreateNgnTempPaymentLink = async (
  params: INgnTempPaymentLinkPayload,
) => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await PublicAxios.post(
    `/transactions/topup/ngn/temp/`,
    null,
    {
      params: queryParams,
    },
  );
  return response.data;
};

export const GetUsdAmountTempPaymentLink = async (amount: string) => {
  const response = await PublicAxios.get(
    `/transactions/topup/ngn/temp/?ngn_amount=${amount}`,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
};
