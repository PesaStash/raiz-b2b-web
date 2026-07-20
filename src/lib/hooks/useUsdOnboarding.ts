"use client";

import { RequestUsdOnboardingApi } from "@/services/business";
import { IUsdOnboardingCase } from "@/types/user";
import { getApiErrorMessage } from "@/utils/helpers";
import {
  canRequestUsdAccount,
  hasCompletedUsdWallet,
  VerificationStatus,
} from "@/utils/onboardingBranch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IUser } from "@/types/user";
import { toast } from "sonner";

const USD_ONBOARDING_QUERY_KEY = ["usd-onboarding"] as const;
const USD_ONBOARDING_REQUESTED_KEY = "usd-onboarding-requested";

export function markUsdOnboardingRequested() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(USD_ONBOARDING_REQUESTED_KEY, "true");
  }
}

export function hasUsdOnboardingRequestedFlag(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(USD_ONBOARDING_REQUESTED_KEY) === "true";
}

export function clearUsdOnboardingRequestedFlag() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(USD_ONBOARDING_REQUESTED_KEY);
  }
}

function shouldFetchUsdOnboardingStatus(
  user: IUser | undefined,
  verificationStatus: VerificationStatus
) {
  if (!user || hasCompletedUsdWallet(user)) return false;
  if (!canRequestUsdAccount(user, verificationStatus)) return false;
  return hasUsdOnboardingRequestedFlag();
}

export function useUsdOnboardingStatus(
  user: IUser | undefined,
  verificationStatus: VerificationStatus
) {
  const enabled = shouldFetchUsdOnboardingStatus(user, verificationStatus);

  return useQuery({
    queryKey: USD_ONBOARDING_QUERY_KEY,
    queryFn: RequestUsdOnboardingApi,
    enabled,
    staleTime: 60_000,
    select: (response) => response.data,
  });
}

interface UseRequestUsdOnboardingOptions {
  onSuccess?: (caseData: IUsdOnboardingCase, message: string) => void;
  showSuccessToast?: boolean;
}

export function useRequestUsdOnboarding(
  options: UseRequestUsdOnboardingOptions = {}
) {
  const { onSuccess, showSuccessToast = true } = options;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: RequestUsdOnboardingApi,
    onSuccess: (response) => {
      markUsdOnboardingRequested();
      qc.setQueryData(USD_ONBOARDING_QUERY_KEY, response);
      if (showSuccessToast && response.message) {
        toast.success(response.message);
      }
      qc.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.(response.data, response.message);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to request USD account"));
    },
  });
}

export { USD_ONBOARDING_QUERY_KEY };
