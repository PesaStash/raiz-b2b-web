import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import {
  FinalizeAfricaPayinResponse,
  IBusinessPaymentData,
  InitiateAfricaPayinPayload,
  InitiateAfricaPayinResponse,
  INotificationParams,
  INotificationResponse,
  IPaymentChannel,
  IPaymentNetwork,
  ITransactionPinPayload,
  ITxnIncomeExpenseResponse,
  ITxnReportCategoryResponse,
  ITxnReportPayload,
} from "../types/services";
import { IChain } from "@/types/misc";
import { PublicAxios } from "@/lib/publicAxios";
import { GuestPayStatusType } from "@/types/transactions";
import { IKYBLinksStatus } from "@/types/user";

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

export const CreateUSDWalletApi = async () => {
  const response = await AuthAxios.post("/business/entities/wallets/usd/");
  return response?.data;
};

export const CreateNGNVirtualWalletApi = async () => {
  const response = await AuthAxios.post(
    "/business/entities/virtual-accounts/naira/"
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
    `/admin/account_user/payment-information/${userName}/`
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
  const response = await PublicAxios.get(
    `/business/transactions/payins/africa/countries/`
  );
  return response?.data;
};

export const GetAfricaPayinChannelsApi = async (
  country_code: string | null
): Promise<IPaymentChannel[]> => {
  const response = await PublicAxios.get(
    `business/transactions/payins/africa/channels/?country_code=${country_code}`
  );
  return response?.data;
};

export const GetAfricaPayinNetworksApi = async (
  country_code: string | null,
  channel_id: string | null
): Promise<IPaymentNetwork[]> => {
  const response = await PublicAxios.get(
    `business/transactions/payins/africa/networks/?country_code=${country_code}&channel_id=${channel_id}`
  );
  return response?.data;
};

export async function InitiateAfricaPayinApi({
  data,
  username,
}: InitiateAfricaPayinPayload): Promise<InitiateAfricaPayinResponse> {
  const response = await AuthAxios.post(
    `/business/transactions/payins/africa/initiate/?username=${username}`,
    { ...data }
  );
  return response.data;
}

export async function FinalizeAfricaPayinApi(
  payin_id: string
): Promise<FinalizeAfricaPayinResponse> {
  const response = await AuthAxios.post(
    `/business/transactions/payins/africa/finalize/?payin_id=${payin_id}`
  );
  return response.data;
}

export const GetAfricaPayinStatus = async (
  payin_id: string
): Promise<GuestPayStatusType> => {
  const response = await PublicAxios.get(
    `/business/transactions/payins/africa/status/${payin_id}/`
  );
  return response?.data;
};

export const CheckBrigdeVerificationStatusApi = async () => {
  const response = await AuthAxios.patch(
    "/business/account_user/verifications/update/bridge/"
  );
  return response?.data;
};

export const GetKYBLinksApi = async (): Promise<IKYBLinksStatus> => {
  const response = await AuthAxios.get(
    "/business/account_user/verifications/link/",
    {
      silent: true,
    } as CustomAxiosRequestConfig
  );
  return response?.data;
};
