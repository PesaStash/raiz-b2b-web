"use client";

import { useBridgeTos } from "@/lib/hooks/useBridgeTos";
import { useRequestUsdOnboarding } from "@/lib/hooks/useUsdOnboarding";
import { IUsdOnboardingCase } from "@/types/user";
import { getApiErrorMessage } from "@/utils/helpers";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseUsdOnboardingFlowOptions {
  onUsdRequestSuccess?: (caseData: IUsdOnboardingCase, message: string) => void;
  showSuccessToast?: boolean;
}

export function useUsdOnboardingFlow(
  options: UseUsdOnboardingFlowOptions = {}
) {
  const { onUsdRequestSuccess, showSuccessToast = true } = options;
  const [bridgeUrl, setBridgeUrl] = useState<string | null>(null);
  const [requestUsdAfterTos, setRequestUsdAfterTos] = useState(false);

  const bridgeTos = useBridgeTos();
  const requestUsdMutation = useRequestUsdOnboarding({
    onSuccess: onUsdRequestSuccess,
    showSuccessToast,
  });

  const closeBridgeWebview = useCallback(() => {
    setBridgeUrl(null);
    setRequestUsdAfterTos(false);
  }, []);

  const submitUsdRequest = useCallback(async () => {
    await requestUsdMutation.mutateAsync();
  }, [requestUsdMutation]);

  const openBridgeTosFlow = useCallback(
    async (requestUsdAfter = false) => {
      setRequestUsdAfterTos(requestUsdAfter);
      const url = await bridgeTos.generateBridgeTosUrl();
      setBridgeUrl(url);
    },
    [bridgeTos]
  );

  const handleBridgeTosAccepted = useCallback(
    async (signedAgreementId: string) => {
      await bridgeTos.saveAndConfirm(signedAgreementId);
      toast.success("Bridge Terms accepted successfully");
      closeBridgeWebview();

      if (requestUsdAfterTos) {
        await submitUsdRequest();
      }
    },
    [
      bridgeTos,
      closeBridgeWebview,
      requestUsdAfterTos,
      submitUsdRequest,
    ]
  );

  const startAcceptBridgeTos = useCallback(async () => {
    if (bridgeTos.isTosConfirmed) return;
    await openBridgeTosFlow(false);
  }, [bridgeTos.isTosConfirmed, openBridgeTosFlow]);

  const startUsdRequest = useCallback(async () => {
    if (requestUsdMutation.isPending || bridgeTos.isGeneratingUrl) return;

    if (bridgeTos.isTosConfirmed) {
      await submitUsdRequest();
      return;
    }

    await openBridgeTosFlow(true);
  }, [
    bridgeTos.isGeneratingUrl,
    bridgeTos.isTosConfirmed,
    openBridgeTosFlow,
    requestUsdMutation.isPending,
    submitUsdRequest,
  ]);

  const getUsdActionLabel = useCallback(() => {
    if (bridgeTos.isTosLoading || bridgeTos.isTosFetching) {
      return "Checking Bridge Terms...";
    }
    if (bridgeTos.isGeneratingUrl) return "Opening Bridge Terms...";
    if (bridgeTos.isSavingTos || requestUsdMutation.isPending) {
      return "Submitting USD request...";
    }
    if (!bridgeTos.isTosConfirmed) return "Accept Terms of Use";
    return "Request USD Account";
  }, [
    bridgeTos.isGeneratingUrl,
    bridgeTos.isSavingTos,
    bridgeTos.isTosConfirmed,
    bridgeTos.isTosFetching,
    bridgeTos.isTosLoading,
    requestUsdMutation.isPending,
  ]);

  const isUsdActionPending =
    bridgeTos.isTosLoading ||
    bridgeTos.isTosFetching ||
    bridgeTos.isGeneratingUrl ||
    bridgeTos.isSavingTos ||
    requestUsdMutation.isPending;

  return {
    isTosConfirmed: bridgeTos.isTosConfirmed,
    isTosLoading: bridgeTos.isTosLoading,
    bridgeUrl,
    closeBridgeWebview,
    handleBridgeTosAccepted,
    startAcceptBridgeTos,
    startUsdRequest,
    getUsdActionLabel,
    isUsdActionPending,
    requestUsdMutation,
    bridgeTos,
  };
}

export function getBridgeTosErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}
