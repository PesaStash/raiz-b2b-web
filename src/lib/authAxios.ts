import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { toast } from "sonner";
import { GetItemFromCookie } from "@/utils/CookiesFunc";
import { fetchPublicIP, getApiErrorMessage } from "@/utils/helpers";

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
      if (typeof window !== "undefined") {
        const authRoutes = [
          "/login",
          "/register",
          "/forgot-password",
          "/verify",
        ];
        const isAuthRoute = authRoutes.some((route) =>
          window.location.pathname.startsWith(route),
        );
        if (!isAuthRoute) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error.response);
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
      config.headers["idempotency-key"] = crypto.randomUUID();
    }

    return config;
  },
  (error) => Promise.reject(error),
);

AuthAxios.interceptors.response.use(handleResponse, handleError);
