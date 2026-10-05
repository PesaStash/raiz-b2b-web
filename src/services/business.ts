import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import {
  ForeignCurrency,
  FinalizeAfricaPayinResponse,
  IBusinessPaymentData,
  IAddNotificationEmailsPayload,
  ICreateForeignAccountResponse,
  InitiateAfricaPayinPayload,
  InitiateAfricaPayinResponse,
  AfricaPayinStatusResponse,
  INotificationEmail,
  INotificationEmailsResponse,
  INotificationParams,
  INotificationResponse,
  AfricaPayinQuoteParams,
  AfricaPayinQuoteResponse,
  IPaymentChannel,
  IPaymentNetwork,
  ITransactionPinPayload,
  ITxnIncomeExpenseResponse,
  ITxnReportCategoryResponse,
  ITxnReportPayload,
  IUpdateGatewayDefaultWalletPayload,
  IUpdateGatewayDefaultWalletResponse,
  IUpdateNotificationEmailPayload,
  RaizPaymentsPayerProfile,
  RaizPaymentsPayerReadiness,
  RaizPaymentsPayerRegisterPayload,
} from "../types/services";
import { IChain } from "@/types/misc";
import { PublicAxios } from "@/lib/publicAxios";
import { GuestPayStatusType } from "@/types/transactions";
import {
  IBridgeTosSaveResponse,
  IUsdOnboardingCase,
  IUsdOnboardingResponse,
  IUsdOnboardingStatusResponse,
} from "@/types/user";

const AFRICA_PAYIN_BASE = "/business/transactions/payins/africa";
const RAIZ_PAYERS_BASE = "/raiz-payments/payers";

export const extractAfricaPayinStatus = (
  payload: GuestPayStatusType | AfricaPayinStatusResponse | string | null,
): GuestPayStatusType => {
  if (!payload) return null;
  if (typeof payload === "string") return payload as GuestPayStatusType;
  return (
    (payload.transaction_status as GuestPayStatusType) ||
    (payload.status as GuestPayStatusType) ||
    (payload.onramp_status as GuestPayStatusType) ||
    null
  );
};

export const FreezeDebitApi = async (data: ITransactionPinPayload) => {
  const response = await AuthAxios.patch(
    "/business/entities/freeze-debits/",
    data
  );
  return response?.data;
};

export const UnFreezeDebitApi = async (data: ITransactionPinPayload) => {
  const response = await AuthAxios.patch(
    "/business/entities/unfreeze-debits/",
    data
  );
  return response?.data;
};

export const RequestUsdOnboardingApi = async (options?: {
  silent?: boolean;
}): Promise<IUsdOnboardingResponse> => {
  const response = await AuthAxios.post(
    "/business/entities/wallets/usd/",
    null,
    { silent: options?.silent } as CustomAxiosRequestConfig
  );
  return response?.data;
};

export const GetUsdOnboardingStatusApi = async (): Promise<IUsdOnboardingCase | null> => {
  const response = await AuthAxios.get("/business/entities/wallets/usd/", {
    silent: true,
  } as CustomAxiosRequestConfig);
  const body = response?.data as IUsdOnboardingStatusResponse | undefined;

  if (!body) return null;

  if (body.success && body.data) {
    return body.data;
  }

  // Pre-basic-verification or other non-error unavailable states — no toast.
  if (body.success === false) {
    return null;
  }

  return body.data ?? null;
};

/** @deprecated Use RequestUsdOnboardingApi */
export const CreateUSDWalletApi = RequestUsdOnboardingApi;

export const ConfirmBridgeTosApi = async (): Promise<boolean> => {
  const response = await AuthAxios.get("/business/entities/tos/confirm/", {
    silent: true,
  } as CustomAxiosRequestConfig);
  return response?.data === true;
};

export const GenerateBridgeTosUrlApi = async (): Promise<string> => {
  const response = await AuthAxios.get(
    "/business/entities/tos/generate/new/",
    { silent: true } as CustomAxiosRequestConfig
  );
  const data = response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "url" in data && typeof data.url === "string") {
    return data.url;
  }
  throw new Error("Invalid Bridge ToS URL response");
};

export const SaveBridgeTosApi = async (
  tosId: string
): Promise<IBridgeTosSaveResponse> => {
  const response = await AuthAxios.post(
    `/business/entities/tos/?tos_id=${encodeURIComponent(tosId)}`,
    null,
    { silent: true } as CustomAxiosRequestConfig
  );
  return response?.data;
};

export const CreateNGNVirtualWalletApi = async () => {
  const response = await AuthAxios.post(
    "/business/entities/virtual-accounts/naira/"
  );
  return response?.data;
};

export const UpdateGatewayDefaultWalletApi = async (
  payload: IUpdateGatewayDefaultWalletPayload
): Promise<IUpdateGatewayDefaultWalletResponse> => {
  const response = await AuthAxios.patch(
    "/business/entities/gateway/default-wallet/",
    payload
  );
  return response?.data;
};

export const CreateCryptoWalletApi = async (chain: IChain = "bsc") => {
  const response = await AuthAxios.post(
    `/business/entities/wallets/crypto/?chain=${chain}`
  );
  return response?.data;
};

export const FetchNotificationsApi = async (
  params?: INotificationParams
): Promise<INotificationResponse> => {
  const response = await AuthAxios.get(`/business/entities/notifications/`, {
    params,
    silent: true,
  } as CustomAxiosRequestConfig);
  return response?.data;
};

export const MarkAsReadApi = async (notification_id: string) => {
  const response = await AuthAxios.patch(
    `/business/entities/notifications/${notification_id}/`
  );
  return response?.data;
};

export const FetchTransactionReportChartApi = async (
  params: ITxnReportPayload
): Promise<ITxnIncomeExpenseResponse> => {
  const response = await AuthAxios.get(
    `/business/transactions/analytics/transaction-report/chart/`,
    {
      params,
      silent: true,
    } as CustomAxiosRequestConfig
  );
  return response?.data;
};

export const FetchTransactionReportCategoryApi = async (
  params: ITxnReportPayload
): Promise<ITxnReportCategoryResponse[]> => {
  const response = await AuthAxios.get(
    `/business/transactions/analytics/transaction-report/categories/`,
    {
      params,
    }
  );
  return response?.data;
};

export const FetchPaymentInfoApi = async (
  userName: string
): Promise<IBusinessPaymentData> => {
  const response = await PublicAxios.get(
    `/util/account_user/payment-information/${userName}/`
  );
  return response?.data;
};

export const GetAfricaPayinCountriesApi = async (): Promise<
  {
    country_code: string;
    country_name: string;
    currency: string;
  }[]
> => {
  const response = await PublicAxios.get(`${AFRICA_PAYIN_BASE}/countries/`);
  return response?.data;
};

export const GetAfricaPayinChannelsApi = async (
  country_code: string | null,
): Promise<IPaymentChannel[]> => {
  const response = await PublicAxios.get(
    `${AFRICA_PAYIN_BASE}/channels/?country_code=${encodeURIComponent(
      country_code || "",
    )}`,
  );
  return response?.data;
};

export const GetAfricaPayinNetworksApi = async (
  country_code: string | null,
  channel_id: string | null,
): Promise<IPaymentNetwork[]> => {
  const response = await PublicAxios.get(
    `${AFRICA_PAYIN_BASE}/networks/?country_code=${encodeURIComponent(
      country_code || "",
    )}&channel_id=${encodeURIComponent(channel_id || "")}`,
  );
  return response?.data;
};

export const QuoteAfricaPayinRateApi = async (
  params: AfricaPayinQuoteParams,
): Promise<AfricaPayinQuoteResponse> => {
  const response = await PublicAxios.get(`${AFRICA_PAYIN_BASE}/rates/quote/`, {
    params: {
      currency: params.currency,
      amount: params.amount,
      direction: params.direction,
    },
    silent: true,
  } as CustomAxiosRequestConfig);
  return response?.data;
};

export async function InitiateAfricaPayinApi({
  data,
  username,
}: InitiateAfricaPayinPayload): Promise<InitiateAfricaPayinResponse> {
  const response = await PublicAxios.post(
    `${AFRICA_PAYIN_BASE}/initiate/?username=${encodeURIComponent(username)}`,
    { ...data },
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
}

export async function FinalizeAfricaPayinApi(
  payin_id: string,
): Promise<FinalizeAfricaPayinResponse> {
  const response = await PublicAxios.post(
    `${AFRICA_PAYIN_BASE}/finalize/?payin_id=${encodeURIComponent(payin_id)}`,
    undefined,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
}

export const GetAfricaPayinStatus = async (
  payin_id: string,
): Promise<GuestPayStatusType> => {
  const response = await PublicAxios.get(
    `${AFRICA_PAYIN_BASE}/status/${encodeURIComponent(payin_id)}/`,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return extractAfricaPayinStatus(response?.data);
};

export const DenyAfricaPayinApi = async (
  payin_id: string,
): Promise<{ message: string }> => {
  const response = await PublicAxios.post(
    `${AFRICA_PAYIN_BASE}/deny/?payin_id=${encodeURIComponent(payin_id)}`,
    undefined,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
};

export const GetRaizPaymentsPayerReadinessApi = async (
  email: string,
): Promise<RaizPaymentsPayerReadiness> => {
  const response = await PublicAxios.get(
    `${RAIZ_PAYERS_BASE}/readiness/?email=${encodeURIComponent(email)}`,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
};

export const RegisterRaizPaymentsPayerApi = async (
  payload: RaizPaymentsPayerRegisterPayload,
): Promise<RaizPaymentsPayerProfile> => {
  const response = await PublicAxios.post(
    `${RAIZ_PAYERS_BASE}/`,
    payload,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
};

export const RequestRaizPaymentsPayerEmailOtpApi = async (
  email: string,
): Promise<{ message: string }> => {
  const response = await PublicAxios.post(
    `${RAIZ_PAYERS_BASE}/email-otp/`,
    { email },
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
};

export const VerifyRaizPaymentsPayerEmailOtpApi = async (payload: {
  email: string;
  otp: string;
}): Promise<RaizPaymentsPayerProfile> => {
  const response = await PublicAxios.post(
    `${RAIZ_PAYERS_BASE}/email-otp/verify/`,
    payload,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response.data;
};

export const CreateForeignAccountApi = async (
  currency: ForeignCurrency,
): Promise<ICreateForeignAccountResponse> => {
  const response = await AuthAxios.post(
    `/business/entities/accounts/${currency}/`,
  );
  return response?.data;
};

export const FetchNotificationEmailsApi =
  async (): Promise<INotificationEmailsResponse> => {
    const response = await AuthAxios.get(
      "/business/transactions/notification-emails/",
    );
    return response?.data;
  };

export const AddNotificationEmailsApi = async (
  payload: IAddNotificationEmailsPayload,
): Promise<INotificationEmailsResponse> => {
  const response = await AuthAxios.post(
    "/business/transactions/notification-emails/",
    payload,
  );
  return response?.data;
};

export const UpdateNotificationEmailApi = async (
  notificationEmailId: string,
  payload: IUpdateNotificationEmailPayload,
): Promise<INotificationEmail> => {
  const response = await AuthAxios.patch(
    `/business/transactions/notification-emails/${notificationEmailId}/`,
    payload,
  );
  return response?.data;
};