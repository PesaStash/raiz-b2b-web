import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/utils/helpers";

import { endSession, refreshSessionProfile } from "@/lib/session";
import { readApiError } from "@/lib/apiError";
import { canMakeRequest, isPublicPath } from "@/lib/permissions";
import { requestPath, routeThroughProxy } from "@/lib/apiClient";
import { useUserStore } from "@/store/useUserStore";

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

    // The proxy has already cleared the session cookie on a 401.
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !isPublicPath(window.location.pathname)) {
        const { code } = readApiError(error);
        endSession(/deactivat|inactive/.test(code));
      }
      return Promise.reject(error.response ?? error);
    }
    if (error.response?.status === 403) {
      useUserStore.setState({ sessionVerified: false });
      if (!requestPath(error.config).replace(/\/$/, "").endsWith("/account_user/me")) refreshSessionProfile();
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

/** Authenticated RaizServer client. Requests go through the /api/raiz proxy. */
export const AuthAxios: AxiosInstance = axios.create();

AuthAxios.interceptors.request.use(
  (config) => {
    const method = (config.method ?? "get").toLowerCase();
    const path = requestPath(config);
    const state = useUserStore.getState();
    if (!canMakeRequest(state.sessionVerified ? state.user : null, method, path)) {
      throw new axios.AxiosError("Your role does not allow this action.", "ERR_FORBIDDEN", config, undefined, {
        status: 403, statusText: "Forbidden", data: { message: "Your role does not allow this action." }, headers: {}, config,
      });
    }

    if (["post", "patch"].includes(method)) {
      // Retain a caller-supplied key so retries of the same logical request
      // share an idempotency key.
      if (!config.headers["idempotency-key"]) {
        config.headers["idempotency-key"] = crypto.randomUUID();
      }
    }

    return routeThroughProxy(config);
  },
  (error) => Promise.reject(error),
);

AuthAxios.interceptors.response.use(handleResponse, handleError);
