import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { toast } from "sonner";
import { GetItemFromCookie } from "@/utils/CookiesFunc";
import { fetchPublicIP, getApiErrorMessage } from "@/utils/helpers";

import { endSession, refreshSessionProfile } from "@/lib/session";
import { readApiError } from "@/lib/apiError";
import { canMakeRequest, isPublicPath } from "@/lib/permissions";
import { useUserStore } from "@/store/useUserStore";

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
  try {
    const isSilent = (error.config as CustomAxiosRequestConfig)?.silent;

    // Check for 401 status and redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !isPublicPath(window.location.pathname)) {
        const { code } = readApiError(error);
        endSession(/deactivat|inactive/.test(code));
      }
      return Promise.reject(error.response ?? error);
    }
    if (error.response?.status === 403) {
      useUserStore.setState({ sessionVerified: false });
      if (!error.config?.url?.replace(/\/$/, "").endsWith("/account_user/me")) refreshSessionProfile();
    }
    if (!isSilent) {
      const message = getApiErrorMessage(error, "An error occurred");
      toast.error(
        typeof message === "string" ? message : "An error occurred",
      );
    }
  } catch {
    // Never let error-display logic crash the app.
  }

  return Promise.reject(error.response ?? error);
};

// Fetch IP and cache it
let cachedIP: string | null = null;

export const AuthAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

AuthAxios.interceptors.request.use(
  async (config) => {
    const token = GetItemFromCookie("access_token");
    const method = (config.method ?? "get").toLowerCase();
    const path = new URL(config.url ?? "/", "https://local.invalid").pathname;
    const state = useUserStore.getState();
    if (!canMakeRequest(state.sessionVerified ? state.user : null, method, path)) {
      throw new axios.AxiosError("Your role does not allow this action.", "ERR_FORBIDDEN", config, undefined, {
        status: 403, statusText: "Forbidden", data: { message: "Your role does not allow this action." }, headers: {}, config,
      });
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!cachedIP) {
      cachedIP = await fetchPublicIP();
    }

    if (cachedIP) {
      config.headers["ip-address"] = cachedIP;
    }

    const mutatingMethods = ["post", "patch"];
    if (
      config.method &&
      mutatingMethods.includes(config.method.toLowerCase())
    ) {
      // Retain a caller-supplied key so retries of the same logical request
      // share an idempotency key.
      const existingKey = config.headers["idempotency-key"];
      if (!existingKey) {
        config.headers["idempotency-key"] = crypto.randomUUID();
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

AuthAxios.interceptors.response.use(handleResponse, handleError);
