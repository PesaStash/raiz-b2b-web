"use client";

import { CreateNGNVirtualWalletApi } from "@/services/business";
import {
  CreateNgnKybSessionApi,
  FetchNgnVerificationRequirementsApi,
} from "@/services/user";
import type { INgnKybSessionResponse } from "@/types/services";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";
import { getApiErrorMessage } from "@/utils/helpers";
import {
  isNgnRequirementApproved,
  NGN_REQUIREMENTS_QUERY_KEY,
  shouldPollNgnRequirements,
} from "@/utils/ngnKyb";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UseNgnOnboardingOptions {
  enabled?: boolean;
}

export function useNgnOnboarding(options: UseNgnOnboardingOptions = {}) {
  const { enabled = true } = options;
  const qc = useQueryClient();

  const requirementsQuery = useQuery({
    queryKey: NGN_REQUIREMENTS_QUERY_KEY,
    queryFn: FetchNgnVerificationRequirementsApi,
    enabled,
    staleTime: 5_000,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      if (!enabled) return false;
      return shouldPollNgnRequirements(query.state.data) ? 10_000 : false;
    },
  });

  const requirements = requirementsQuery.data;
  const cacStatus = requirements?.cac_document_status;
  const uboStatus = requirements?.ubo_status;
  const isCacApproved = isNgnRequirementApproved(cacStatus);
  const isUboApproved = isNgnRequirementApproved(uboStatus);
  const canCreateAccount = !!requirements?.can_create_ngn_account;
  const isPolling = enabled && shouldPollNgnRequirements(requirements);

  const invalidateNgnQueries = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: NGN_REQUIREMENTS_QUERY_KEY }),
      qc.invalidateQueries({ queryKey: ["user"] }),
      qc.invalidateQueries({ queryKey: ["ngn-payout-settings"] }),
    ]);
  };

  const startKybSessionMutation = useMutation({
    mutationFn: CreateNgnKybSessionApi,
    onSuccess: async (session: INgnKybSessionResponse) => {
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_kyb",
        kyc_status: session.status || "pending",
        user_type: getAnalyticsUserType(),
      });
      await invalidateNgnQueries();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to start verification. Please try again.",
        ),
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_kyb",
        kyc_status: "rejected",
        user_type: getAnalyticsUserType(),
      });
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: CreateNGNVirtualWalletApi,
    onSuccess: async (response) => {
      toast.success(
        response?.message || "Naira Virtual Account Created Successfully",
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_account_created",
        kyc_status: "approved",
        user_type: getAnalyticsUserType(),
      });
      await invalidateNgnQueries();
    },
  });

  const startKybSession = async () => {
    return startKybSessionMutation.mutateAsync();
  };

  const createNgnAccount = async () => {
    if (createWalletMutation.isPending) return false;

    const latest = await requirementsQuery.refetch();
    if (!latest.data?.can_create_ngn_account) {
      toast.info(
        "Verification is still in progress. Please wait until it is complete.",
      );
      return false;
    }

    await createWalletMutation.mutateAsync();
    return true;
  };

  return {
    requirements,
    cacStatus,
    uboStatus,
    isCacApproved,
    isUboApproved,
    canCreateAccount,
    isPolling,
    isLoading: requirementsQuery.isLoading,
    isFetching: requirementsQuery.isFetching,
    error: requirementsQuery.error,
    refetch: requirementsQuery.refetch,
    startKybSession,
    createNgnAccount,
    isStartingSession: startKybSessionMutation.isPending,
    isCreatingAccount: createWalletMutation.isPending,
  };
}
