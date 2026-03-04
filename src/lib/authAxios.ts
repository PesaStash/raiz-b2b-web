import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { toast } from "sonner";
import { encryptData, generateNonce } from "./headerEncryption";
import { GetItemFromCookie } from "@/utils/CookiesFunc";
import { fetchPublicIP } from "@/utils/helpers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface ErrorResponseData {
  message?: string;
  [key: string]: unknown;
}

interface CustomAxiosError extends AxiosError {
  response?: AxiosResponse<ErrorResponseData>;
}

// Extend the AxiosRequestConfig to include a custom `silent` property
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  silent?: boolean; // Add this to optionally suppress toast
}

const handleResponse = (response: AxiosResponse) => response;

const handleError = async (error: CustomAxiosError) => {
  console.log(JSON.stringify(error, null, 2));
  const isSilent = (error.config as CustomAxiosRequestConfig)?.silent;

  // Check for 401 status and redirect to login
  if (error.response?.status === 401 || error.response?.status === 403) {
    // If we're in the browser environment
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(error.response);
  }
  if (!isSilent) {
    const errorMessage = error.response?.data?.message || "An Error Occurred";
    toast.error(errorMessage);
  }

  return Promise.reject(error.response);
};

// Fetch IP and cache it
let cachedIP: string | null = null;

export const AuthAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

AuthAxios.interceptors.request.use(
  async (config) => {
    const token = GetItemFromCookie("access_token");
    const nonceStr = generateNonce();
    const signature = encryptData(nonceStr);

    config.headers["nonce-str"] = nonceStr;
    config.headers["signature"] = signature;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!cachedIP) {
      cachedIP = await fetchPublicIP();
    }

    if (cachedIP) {
      config.headers["ip-address"] = cachedIP;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

AuthAxios.interceptors.response.use(handleResponse, handleError);
