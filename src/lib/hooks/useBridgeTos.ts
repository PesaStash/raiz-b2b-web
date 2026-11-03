"use client";

import {
  ConfirmBridgeTosApi,
  GenerateBridgeTosUrlApi,
  SaveBridgeTosApi,
} from "@/services/business";
import { getApiErrorMessage } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const BRIDGE_TOS_QUERY_KEY = ["bridge-tos", "confirm"] as const;

export function useBridgeTosConfirm(enabled = true) {
  return useQuery({
    queryKey: BRIDGE_TOS_QUERY_KEY,
    queryFn: ConfirmBridgeTosApi,
    enabled,
    staleTime: 30_000,
  });
}

export function useBridgeTos() {
  const qc = useQueryClient();

  const confirmQuery = useBridgeTosConfirm();

  const generateMutation = useMutation({
    mutationFn: GenerateBridgeTosUrlApi,
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to start Bridge Terms flow"));
    },
  });

  const saveMutation = useMutation({
    mutationFn: SaveBridgeTosApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BRIDGE_TOS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to save Bridge Terms acceptance"));
    },
  });

  const saveAndConfirm = async (signedAgreementId: string) => {
    await saveMutation.mutateAsync(signedAgreementId);
    const confirmed = await qc.fetchQuery({
      queryKey: BRIDGE_TOS_QUERY_KEY,
      queryFn: ConfirmBridgeTosApi,
    });
    if (!confirmed) {
      throw new Error("Bridge Terms were not confirmed. Please try again.");
    }
    return confirmed;
  };

  return {
    isTosConfirmed: confirmQuery.data === true,
    isTosLoading: confirmQuery.isLoading,
    isTosFetching: confirmQuery.isFetching,
    tosError: confirmQuery.error,
    refetchTosConfirm: confirmQuery.refetch,
    generateBridgeTosUrl: generateMutation.mutateAsync,
    isGeneratingUrl: generateMutation.isPending,
    saveAndConfirm,
    isSavingTos: saveMutation.isPending,
  };
}
