import { AuthAxios } from "@/lib/authAxios";
import {
  IAPILogsParams,
  IDeveloperApiKey,
  IGenerateDeveloperKeysAPI,
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

export const FetchAPILogs = async (params: IAPILogsParams) => {
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
