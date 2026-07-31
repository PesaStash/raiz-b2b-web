"use client";

import { RequestUsdOnboardingApi } from "@/services/business";
import { IUsdOnboardingCase, IUser } from "@/types/user";
import { getApiErrorMessage } from "@/utils/helpers";
import { hasCompletedUsdWallet } from "@/utils/onboardingBranch";
import { useUserStore } from "@/store/useUserStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

const USD_ONBOARDING_QUERY_KEY = ["usd-onboarding"] as const;
const LEGACY_USD_ONBOARDING_REQUESTED_KEY = "usd-onboarding-requested";

function getUsdOnboardingStorageKey(entityId: string) {
  return `usd-onboarding-case:${entityId}`;
}

export function persistUsdOnboardingCase(
  entityId: string,
  caseData: IUsdOnboardingCase
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getUsdOnboardingStorageKey(entityId),
    JSON.stringify(caseData)
  );
}

export function readUsdOnboardingCase(
  entityId: string | undefined
): IUsdOnboardingCase | null {
  if (!entityId || typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getUsdOnboardingStorageKey(entityId));
    if (!raw) return null;
    return JSON.parse(raw) as IUsdOnboardingCase;
  } catch {
    return null;
  }
}

export function clearUsdOnboardingCase(entityId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getUsdOnboardingStorageKey(entityId));
}

export function clearUsdOnboardingSessionState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LEGACY_USD_ONBOARDING_REQUESTED_KEY);
}

function getUsdOnboardingQueryKey(entityId: string | undefined) {
  return [...USD_ONBOARDING_QUERY_KEY, entityId] as const;
}

/** Reads persisted USD onboarding case — never calls POST on mount. */
export function useUsdOnboardingStatus(user: IUser | undefined) {
  const entityId = user?.business_account?.entity_id;
  const qc = useQueryClient();

  useEffect(() => {
    if (!entityId || !user || !hasCompletedUsdWallet(user)) return;
    clearUsdOnboardingCase(entityId);
    qc.removeQueries({ queryKey: getUsdOnboardingQueryKey(entityId) });
  }, [entityId, user, qc]);

  return useQuery({
    queryKey: getUsdOnboardingQueryKey(entityId),
    queryFn: (): IUsdOnboardingCase | null =>
      readUsdOnboardingCase(entityId) ?? null,
    enabled: !!entityId && !hasCompletedUsdWallet(user),
    staleTime: Infinity,
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
    mutationFn: () => RequestUsdOnboardingApi({ silent: true }),
    onSuccess: (response) => {
      const entityId =
        useUserStore.getState().user?.business_account?.entity_id;

      if (entityId) {
        persistUsdOnboardingCase(entityId, response.data);
        qc.setQueryData(getUsdOnboardingQueryKey(entityId), response.data);
      }

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
