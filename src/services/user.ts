import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import {
  FeedbackPayload,
  IBusinessVerificationPayload,
  IFetchRewardsParams,
  IRewardActivityResponse,
  IRewardPoint,
  IUserSearchParams,
  IUserSearchResponse,
} from "@/types/services";
import { IUser } from "@/types/user";

export const FetchUserApi = async (): Promise<IUser> => {
  const response = await AuthAxios.get("/business/account_user/me", {
    silent: true,
  } as CustomAxiosRequestConfig);
  return response.data;
};

export const UploadProfilePicture = async (image_url: string) => {
  const response = await AuthAxios.patch(
    "/business/account_user/business-image/",
    null,
    {
      params: {
        image_url,
      },
    }
  );
  return response?.data;
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
    `/business/entities/rewards/activities/?limit=${limit}&page=${page}`
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
    }
  );
  return response?.data;
};

export const BusinessVerificationApi = async (
  payload: IBusinessVerificationPayload
) => {
  const response = await AuthAxios.post(
    `/business/account_user/verifications/persona/`,
    payload
  );
  return response?.data;
};

export const SearchAllUsersApi = async (
  params: IUserSearchParams
): Promise<IUserSearchResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null
    )
  );
  const response = await AuthAxios.get(`/business/account_user/search/all/`, {
    params: queryParams,
  });
  return response?.data;
};

export const FeedbacksApi = async (data: FeedbackPayload) => {
  const response = await AuthAxios.post(
    "/business/account_user/features/requests/",
    data
  );
  return response?.data;
};
