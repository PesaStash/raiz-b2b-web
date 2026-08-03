"use client";

import {
  GetUsdOnboardingStatusApi,
  RequestUsdOnboardingApi,
} from "@/services/business";
import { IUsdOnboardingCase, IUser } from "@/types/user";
import { getApiErrorMessage } from "@/utils/helpers";
import {
  hasCompletedUsdWallet,
  hasUsdOnboardingRequest,
} from "@/utils/onboardingBranch";
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
  if (!hasUsdOnboardingRequest(caseData)) return;
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
    const parsed = JSON.parse(raw) as IUsdOnboardingCase;
    return hasUsdOnboardingRequest(parsed) ? parsed : null;
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

async function fetchUsdOnboardingStatus(
  entityId: string | undefined
): Promise<IUsdOnboardingCase | null> {
  const fromApi = await GetUsdOnboardingStatusApi();

  if (fromApi) {
    if (entityId) {
      if (hasUsdOnboardingRequest(fromApi)) {
        persistUsdOnboardingCase(entityId, fromApi);
      } else {
        clearUsdOnboardingCase(entityId);
      }
    }
    return fromApi;
  }

  if (entityId) {
    clearUsdOnboardingCase(entityId);
  }

  return null;
}

/** Fetches live USD onboarding status via GET — never POST on mount. */
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
    queryFn: () => fetchUsdOnboardingStatus(entityId),
    enabled: !!entityId && !hasCompletedUsdWallet(user),
    staleTime: 30_000,
    placeholderData: () => readUsdOnboardingCase(entityId),
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
    onSuccess: async (response) => {
      const entityId =
        useUserStore.getState().user?.business_account?.entity_id;

      if (entityId && hasUsdOnboardingRequest(response.data)) {
        persistUsdOnboardingCase(entityId, response.data);
        qc.setQueryData(getUsdOnboardingQueryKey(entityId), response.data);
      }

      await qc.invalidateQueries({
        queryKey: getUsdOnboardingQueryKey(entityId),
      });

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
