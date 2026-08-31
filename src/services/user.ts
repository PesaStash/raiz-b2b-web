import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import {
  FeedbackPayload,
  IBusinessVerificationPayload,
  IFetchRewardsParams,
  INgnKybSessionResponse,
  INgnVerificationRequirements,
  IRewardActivityResponse,
  IRewardPoint,
  IUserSearchParams,
  IUserSearchResponse,
} from "@/types/services";
import { IUser } from "@/types/user";

export type ImageContentType = "image/jpeg" | "image/png" | "image/webp";

export interface ProfileImageUploadUrlRequest {
  content_type: ImageContentType;
  file_size?: number | null;
}

export interface ProfileImageUploadUrlResponse {
  upload_url: string;
  image_url: string;
  s3_key: string;
  method: "PUT";
  expires_in: number;
  max_file_size: number;
  content_type: ImageContentType;
  required_headers: Record<string, string>;
}

export const FetchUserApi = async (): Promise<IUser> => {
  const response = await AuthAxios.get("/business/account_user/me", {
    silent: true,
  } as CustomAxiosRequestConfig);
  return response.data;
};

export const CreateBusinessImageUploadUrl = async (
  payload: ProfileImageUploadUrlRequest,
): Promise<ProfileImageUploadUrlResponse> => {
  const response = await AuthAxios.post(
    "/business/account_user/business-image/upload-url/",
    payload,
  );
  return response?.data;
};

export const UploadProfilePicture = async (image_url: string) => {
  const response = await AuthAxios.patch(
    "/business/account_user/business-image/",
    null,
    {
      params: {
        image_url,
      },
    },
  );
  return response?.data;
};

async function putFileToPresignedUrl(
  grant: ProfileImageUploadUrlResponse,
  file: Blob,
): Promise<Response> {
  return fetch(grant.upload_url, {
    method: grant.method,
    headers: grant.required_headers,
    body: file,
  });
}

export const uploadB2bBusinessImage = async (file: File) => {
  const contentType = file.type as ImageContentType;

  let grant = await CreateBusinessImageUploadUrl({
    content_type: contentType,
    file_size: file.size,
  });

  let uploadResponse = await putFileToPresignedUrl(grant, file);

  // Expired URL or mismatched headers — refresh grant and retry once.
  if (uploadResponse.status === 403) {
    grant = await CreateBusinessImageUploadUrl({
      content_type: contentType,
      file_size: file.size,
    });
    uploadResponse = await putFileToPresignedUrl(grant, file);
  }

  if (!uploadResponse.ok) {
    throw new Error("Image upload failed");
  }

  return UploadProfilePicture(grant.image_url);
};

export const FetchUserRewardsApi = async (): Promise<IRewardPoint> => {
  const response = await AuthAxios.get("/business/entities/rewards/points/", {
    silent: true,
  } as CustomAxiosRequestConfig);
  return response?.data;
};

export const FetchUserRewardsActivitiesApi = async ({
  limit,
  page,
}: IFetchRewardsParams): Promise<IRewardActivityResponse> => {
  const response = await AuthAxios.get(
    `/business/entities/rewards/activities/?limit=${limit}&page=${page}`,
  );
  return response?.data;
};

export const SearchUsersApi = async (): Promise<IUser> => {
  const response = await AuthAxios.get("/business/account_user/search/all");
  return response?.data;
};

export const updateUsernameApi = async (username: string) => {
  const response = await AuthAxios.patch(
    "/business/account_user/username/",
    null,
    {
      params: {
        username,
      },
    },
  );
  return response?.data;
};

export const BusinessVerificationApi = async (
  payload: IBusinessVerificationPayload,
) => {
  const response = await AuthAxios.post(
    `/business/account_user/verifications/persona/`,
    payload,
  );
  return response?.data;
};

export const FetchNgnVerificationRequirementsApi =
  async (): Promise<INgnVerificationRequirements> => {
    const response = await AuthAxios.get(
      "/business/account_user/verifications/ngn/requirements/",
      { silent: true } as CustomAxiosRequestConfig,
    );
    return response?.data;
  };

export const CreateNgnKybSessionApi =
  async (): Promise<INgnKybSessionResponse> => {
    const response = await AuthAxios.post(
      "/business/account_user/verifications/ngn/kyb/session/",
      null,
      { silent: true } as CustomAxiosRequestConfig,
    );
    return response?.data;
  };

export const SearchAllUsersApi = async (
  params: IUserSearchParams,
): Promise<IUserSearchResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null,
    ),
  );
  const response = await AuthAxios.get(`/business/account_user/search/all/`, {
    params: queryParams,
  });
  return response?.data;
};

export const FeedbacksApi = async (data: FeedbackPayload) => {
  const response = await AuthAxios.post(
    "/business/account_user/features/requests/",
    data,
  );
  return response?.data;
};

export const FetchTodayOutflowApi = async (
  wallet_id: string,
): Promise<number> => {
  const response = await AuthAxios.get(
    `/business/account_user/me/today/outflow/?wallet_id=${wallet_id}`,
  );
  return response?.data;
};
