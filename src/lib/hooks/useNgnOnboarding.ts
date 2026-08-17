"use client";

import { CreateNGNVirtualWalletApi } from "@/services/business";
import {
  FetchNgnVerificationRequirementsApi,
  SubmitNgnCacDocumentSessionApi,
  SubmitNgnUboSessionApi,
} from "@/services/user";
import type { NgnAipriseFlow } from "@/types/services";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";
import { getApiErrorMessage } from "@/utils/helpers";
import {
  clearAipriseResumeSessionId,
  isNgnRequirementApproved,
  isNgnRequirementPending,
  NGN_REQUIREMENTS_QUERY_KEY,
} from "@/utils/ngnKyb";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "./useUser";

interface UseNgnOnboardingOptions {
  enabled?: boolean;
}

export function useNgnOnboarding(options: UseNgnOnboardingOptions = {}) {
  const { enabled = true } = options;
  const { user } = useUser();
  const qc = useQueryClient();
  const entityId = user?.business_account?.entity_id;

  const requirementsQuery = useQuery({
    queryKey: NGN_REQUIREMENTS_QUERY_KEY,
    queryFn: FetchNgnVerificationRequirementsApi,
    enabled,
    staleTime: 5_000,
    refetchOnMount: "always",
    refetchInterval: (query) => {
      if (!enabled) return false;
      const data = query.state.data;
      if (!data || data.can_create_ngn_account) return false;
      return isNgnRequirementPending(data.cac_document_status) ||
        isNgnRequirementPending(data.ubo_status)
        ? 5_000
        : false;
    },
  });

  const requirements = requirementsQuery.data;
  const cacStatus = requirements?.cac_document_status;
  const uboStatus = requirements?.ubo_status;
  const isCacApproved = isNgnRequirementApproved(cacStatus);
  const isUboApproved = isNgnRequirementApproved(uboStatus);
  const canCreateAccount = !!requirements?.can_create_ngn_account;
  const isPolling =
    enabled &&
    !canCreateAccount &&
    (isNgnRequirementPending(cacStatus) || isNgnRequirementPending(uboStatus));

  const invalidateNgnQueries = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: NGN_REQUIREMENTS_QUERY_KEY }),
      qc.invalidateQueries({ queryKey: ["user"] }),
      qc.invalidateQueries({ queryKey: ["ngn-payout-settings"] }),
    ]);
  };

  const submitCacMutation = useMutation({
    mutationFn: SubmitNgnCacDocumentSessionApi,
    onSuccess: async (response) => {
      toast.success(
        "Business documents submitted. We’ll update this step once verification finishes.",
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_cac_document",
        kyc_status: response.status || "pending",
        user_type: getAnalyticsUserType(),
      });
      clearAipriseResumeSessionId(entityId, "cac");
      await invalidateNgnQueries();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to submit business document verification.",
        ),
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_cac_document",
        kyc_status: "rejected",
        user_type: getAnalyticsUserType(),
      });
    },
  });

  const submitUboMutation = useMutation({
    mutationFn: SubmitNgnUboSessionApi,
    onSuccess: async (response) => {
      toast.success(
        "Owner verification submitted. We’ll update this step once verification finishes.",
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_ubo",
        kyc_status: response.status || "pending",
        user_type: getAnalyticsUserType(),
      });
      clearAipriseResumeSessionId(entityId, "ubo");
      await invalidateNgnQueries();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to submit owner identity verification.",
        ),
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_ubo",
        kyc_status: "rejected",
        user_type: getAnalyticsUserType(),
      });
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: CreateNGNVirtualWalletApi,
    onSuccess: async (response) => {
      toast.success(response?.message || "Naira Virtual Account Created Successfully");
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "ngn_account_created",
        kyc_status: "approved",
        user_type: getAnalyticsUserType(),
      });
      await invalidateNgnQueries();
    },
  });

  const submitSession = async (flow: NgnAipriseFlow, sessionId: string) => {
    if (flow === "cac") {
      return submitCacMutation.mutateAsync(sessionId);
    }
    return submitUboMutation.mutateAsync(sessionId);
  };

  const createNgnAccount = async () => {
    if (createWalletMutation.isPending) return false;

    const latest = await requirementsQuery.refetch();
    if (!latest.data?.can_create_ngn_account) {
      toast.info(
        "Verification is still in progress. Please wait until both steps are approved.",
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
    submitSession,
    createNgnAccount,
    isSubmittingCac: submitCacMutation.isPending,
    isSubmittingUbo: submitUboMutation.isPending,
    isCreatingAccount: createWalletMutation.isPending,
    isSubmittingSession:
      submitCacMutation.isPending || submitUboMutation.isPending,
  };
}
