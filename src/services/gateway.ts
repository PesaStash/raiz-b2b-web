import { AuthAxios } from "@/lib/authAxios";
import {
  IGatewayRemittanceSettlement,
  IGatewaySubaccount,
  IGatewaySubaccountActivitiesParams,
  IGatewaySubaccountActivitiesResponse,
  IGatewaySubaccountSummary,
  IGatewaySubaccountsListParams,
  IGatewaySubaccountsListResponse,
  IUpdateGatewayRemittanceSettlementPayload,
} from "@/types/services";

export const FetchGatewaySubaccountsSummaryApi =
  async (): Promise<IGatewaySubaccountSummary> => {
    const response = await AuthAxios.get(
      "/business/gateway/subaccounts/summary",
    );
    return response?.data;
  };

export const FetchGatewaySubaccountsApi = async (
  params: IGatewaySubaccountsListParams = {},
): Promise<IGatewaySubaccountsListResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
  const response = await AuthAxios.get("/business/gateway/subaccounts", {
    params: queryParams,
  });
  return response?.data;
};

export const FetchGatewaySubaccountApi = async (
  subaccountId: string,
): Promise<IGatewaySubaccount> => {
  const response = await AuthAxios.get(
    `/business/gateway/subaccounts/${subaccountId}`,
  );
  return response?.data;
};

export const FetchGatewaySubaccountActivitiesApi = async (
  subaccountId: string,
  params: IGatewaySubaccountActivitiesParams = {},
): Promise<IGatewaySubaccountActivitiesResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
  const response = await AuthAxios.get(
    `/business/gateway/subaccounts/${subaccountId}/activities`,
    { params: queryParams },
  );
  return response?.data;
};

export const FetchGatewayRemittanceSettlementApi =
  async (): Promise<IGatewayRemittanceSettlement> => {
    const response = await AuthAxios.get(
      "/business/gateway/remittance-settlement",
    );
    return response?.data;
  };

export const UpdateGatewayRemittanceSettlementApi = async (
  payload: IUpdateGatewayRemittanceSettlementPayload,
): Promise<IGatewayRemittanceSettlement> => {
  const response = await AuthAxios.patch(
    "/business/gateway/remittance-settlement",
    payload,
  );
  return response?.data;
};
