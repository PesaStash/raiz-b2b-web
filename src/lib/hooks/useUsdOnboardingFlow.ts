"use client";

import { useBridgeTos } from "@/lib/hooks/useBridgeTos";
import { useRequestUsdOnboarding } from "@/lib/hooks/useUsdOnboarding";
import { IUsdOnboardingCase } from "@/types/user";
import { getApiErrorMessage } from "@/utils/helpers";
import { hasUsdOnboardingRequest } from "@/utils/onboardingBranch";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseUsdOnboardingFlowOptions {
  usdCase?: IUsdOnboardingCase | null;
  onUsdRequestSuccess?: (caseData: IUsdOnboardingCase, message: string) => void;
  showSuccessToast?: boolean;
}

export function useUsdOnboardingFlow(
  options: UseUsdOnboardingFlowOptions = {}
) {
  const {
    usdCase = null,
    onUsdRequestSuccess,
    showSuccessToast = true,
  } = options;
  const [bridgeUrl, setBridgeUrl] = useState<string | null>(null);
  const [requestUsdAfterTos, setRequestUsdAfterTos] = useState(false);

  const hasRequestedUsd = hasUsdOnboardingRequest(usdCase);
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
    if (hasRequestedUsd || requestUsdMutation.isPending) return;
    await requestUsdMutation.mutateAsync();
  }, [hasRequestedUsd, requestUsdMutation]);

  const openBridgeTosFlow = useCallback(
    async (requestUsdAfter = false) => {
      if (requestUsdAfter && hasRequestedUsd) return;
      setRequestUsdAfterTos(requestUsdAfter);
      const url = await bridgeTos.generateBridgeTosUrl();
      setBridgeUrl(url);
    },
    [bridgeTos, hasRequestedUsd]
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
    if (bridgeTos.isTosConfirmed || bridgeTos.isGeneratingUrl) return;
    await openBridgeTosFlow(false);
  }, [bridgeTos.isGeneratingUrl, bridgeTos.isTosConfirmed, openBridgeTosFlow]);

  const startUsdRequest = useCallback(async () => {
    if (hasRequestedUsd) return;
    if (requestUsdMutation.isPending || bridgeTos.isGeneratingUrl) return;

    if (bridgeTos.isTosConfirmed) {
      await submitUsdRequest();
      return;
    }

    await openBridgeTosFlow(true);
  }, [
    bridgeTos.isGeneratingUrl,
    bridgeTos.isTosConfirmed,
    hasRequestedUsd,
    openBridgeTosFlow,
    requestUsdMutation.isPending,
    submitUsdRequest,
  ]);

  const getUsdActionLabel = useCallback(() => {
    if (hasRequestedUsd) return "USD Account Requested";
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
    hasRequestedUsd,
    requestUsdMutation.isPending,
  ]);

  const isUsdActionPending =
    bridgeTos.isTosLoading ||
    bridgeTos.isTosFetching ||
    bridgeTos.isGeneratingUrl ||
    bridgeTos.isSavingTos ||
    requestUsdMutation.isPending;

  return {
    hasRequestedUsd,
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
