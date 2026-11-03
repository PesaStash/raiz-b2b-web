import { AuthAxios } from "@/lib/authAxios";
import { FeeCatalogResponse, ReceivingAccount, ReceivingAsset } from "@/types/globalBalance";

export const FetchFeeCatalogApi = async (): Promise<FeeCatalogResponse> => {
  const response = await AuthAxios.get("/business/transactions/fees/");
  return response.data;
};

export const FetchReceivingAccountsApi = async (): Promise<{ accounts: ReceivingAccount[] }> => {
  const response = await AuthAxios.get("/business/entities/v2/receiving-accounts/");
  return response.data;
};

export const CreateReceivingAccountApi = async (
  body: { asset: ReceivingAsset; network?: string },
  idempotencyKey: string,
): Promise<ReceivingAccount> => {
  const response = await AuthAxios.post("/business/entities/v2/receiving-accounts/", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
};
