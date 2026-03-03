"use client";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from "axios";
import { toast } from "sonner";
import { encryptData, generateNonce } from "./headerEncryption";
import { fetchPublicIP } from "@/utils/helpers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface ErrorResponseData {
  message?: string;
  [key: string]: unknown;
}

interface CustomAxiosError extends AxiosError {
  response?: AxiosResponse<ErrorResponseData>;
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  silent?: boolean;
}

const handleResponse = (response: AxiosResponse) => response;

const handleError = async (error: CustomAxiosError) => {
  console.log(JSON.stringify(error, null, 2));
  const isSilent = (error.config as CustomAxiosRequestConfig)?.silent;
  if (!isSilent) {
    const errorMessage = error.response?.data?.message || "An Error Occurred";
    toast.error(errorMessage);
  }
  return Promise.reject(error.response);
};

export const PublicAxios = axios.create({
  baseURL: BASE_URL,
});

// Cache IP to avoid multiple fetches
let cachedIP: string | null = null;

const addNetworkCheckInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(
    async (requestConfig) => {
      try {
        const cancelTokenSource: CancelTokenSource = axios.CancelToken.source();
        requestConfig.cancelToken = cancelTokenSource.token;

        const nonceStr = generateNonce();
        const signature = encryptData(nonceStr);
        // Fetch and cache IP address if not already done
        if (!cachedIP) {
          cachedIP = await fetchPublicIP();
        }

        requestConfig.headers["nonce-str"] = nonceStr;
        requestConfig.headers["signature"] = signature;

        if (cachedIP) {
          requestConfig.headers["ip-address"] = cachedIP;
        }

        return requestConfig;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    (error: AxiosError) => Promise.reject(error),
  );
};

addNetworkCheckInterceptor(PublicAxios);

PublicAxios.interceptors.response.use(handleResponse, handleError);
