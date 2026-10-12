"use client";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
import { routeThroughProxy } from "@/lib/apiClient";

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
  try {
    const isSilent = (error.config as CustomAxiosRequestConfig)?.silent;
    if (!isSilent) {
      const errorMessage = error.response?.data?.message;
      toast.error(
        typeof errorMessage === "string" ? errorMessage : "An Error Occurred",
      );
    }
  } catch {
    // Never let error-display logic crash the app.
  }
  return Promise.reject(error.response ?? error);
};

/** Unauthenticated RaizServer client (sign-up, login, public pay pages). Uses the same proxy. */
export const PublicAxios = axios.create();

PublicAxios.interceptors.request.use((config) => routeThroughProxy(config, { anonymous: true }));

PublicAxios.interceptors.response.use(handleResponse, handleError);
