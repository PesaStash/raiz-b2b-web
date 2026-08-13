import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import {
  IAPILogsParams,
  IAPIKeyLogsResponse,
  ICreateGatewayWebhookPayload,
  IDeveloperApiKey,
  IDeveloperPermission,
  IGatewayWebhook,
  IGenerateDeveloperKeysAPI,
  INgnPayoutSettings,
  ITestGatewayWebhookPayload,
  ITestGatewayWebhookResponse,
  IUpdateGatewayWebhookPayload,
  IUpdateNgnPayoutSettingsPayload,
} from "@/types/services";

export const FetchDeveloperApiKeysApi = async (): Promise<
  IDeveloperApiKey[]
> => {
  const response = await AuthAxios.get("/b2b/developers/keys");
  return response?.data;
};

export const GenerateAPIKeys = async (
  payload: IGenerateDeveloperKeysAPI,
): Promise<IDeveloperApiKey> => {
  const response = await AuthAxios.post("/b2b/developers/keys", payload);
  return response?.data;
};

export const RevokeAPIKey = async (keyId: string) => {
  const response = await AuthAxios.delete(`/b2b/developers/keys/${keyId}`);
  return response?.data;
};

export const FetchAPILogs = async (
  params: IAPILogsParams,
): Promise<IAPIKeyLogsResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(`/b2b/developers/logs`, {
    params: queryParams,
  });
  return response?.data;
};

export const FetchDeveloperPermissionsApi = async (): Promise<
  IDeveloperPermission[]
> => {
  const response = await AuthAxios.get("/b2b/developers/permissions");
  return response?.data;
};

export const FetchNgnPayoutSettingsApi =
  async (): Promise<INgnPayoutSettings> => {
    const response = await AuthAxios.get(
      "/b2b/developers/settings/payouts/ngn",
    );
    return response?.data;
  };

export const UpdateNgnPayoutSettingsApi = async (
  payload: IUpdateNgnPayoutSettingsPayload,
): Promise<INgnPayoutSettings> => {
  const response = await AuthAxios.patch(
    "/b2b/developers/settings/payouts/ngn",
    payload,
  );
  return response?.data;
};

export const FetchGatewayWebhooksApi = async (): Promise<IGatewayWebhook[]> => {
  const response = await AuthAxios.get("/b2b/developers/webhooks");
  return response?.data;
};

export const CreateGatewayWebhookApi = async (
  payload: ICreateGatewayWebhookPayload,
): Promise<IGatewayWebhook> => {
  const response = await AuthAxios.post("/b2b/developers/webhooks", payload);
  return response?.data;
};

export const UpdateGatewayWebhookApi = async (
  webhookId: string,
  payload: IUpdateGatewayWebhookPayload,
): Promise<IGatewayWebhook> => {
  const response = await AuthAxios.put(
    `/b2b/developers/webhooks/${webhookId}`,
    payload,
  );
  return response?.data;
};

export const DeleteGatewayWebhookApi = async (webhookId: string) => {
  const response = await AuthAxios.delete(
    `/b2b/developers/webhooks/${webhookId}`,
  );
  return response?.data;
};

export const TestGatewayWebhookApi = async (
  webhookId: string,
  payload: ITestGatewayWebhookPayload,
): Promise<ITestGatewayWebhookResponse> => {
  const response = await AuthAxios.post(
    `/b2b/developers/webhooks/${webhookId}/test`,
    payload,
    { silent: true } as CustomAxiosRequestConfig,
  );
  return response?.data;
};
