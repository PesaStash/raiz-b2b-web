"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBridgeTos } from "@/lib/hooks/useBridgeTos";
import { hasUsdOnboardingRequest } from "@/utils/onboardingBranch";
import { getApiErrorMessage } from "@/utils/helpers";
import type { IUsdOnboardingCase } from "@/types/user";
interface UseUsdOnboardingFlowOptions {
  usdCase?: IUsdOnboardingCase | null;
  onUsdRequestSuccess?: (caseData: IUsdOnboardingCase, message: string) => void;
  showSuccessToast?: boolean;
}
/** All USD setup entry points open the same resumable, server-backed KYB case. */
export function useUsdOnboardingFlow(
  options: UseUsdOnboardingFlowOptions = {},
) {
  const router = useRouter();
  const bridgeTos = useBridgeTos();
  const [bridgeUrl, setBridgeUrl] = useState<string | null>(null);
  const hasRequestedUsd = hasUsdOnboardingRequest(options.usdCase);
  const closeBridgeWebview = () => setBridgeUrl(null);
  const startUsdRequest = async () => {
    router.push("/onboarding/usd");
  };
  const startAcceptBridgeTos = async () => {
    if (!bridgeTos.isTosConfirmed && !bridgeTos.isGeneratingUrl)
      setBridgeUrl(await bridgeTos.generateBridgeTosUrl());
  };
  const handleBridgeTosAccepted = async (id: string) => {
    await bridgeTos.saveAndConfirm(id);
    closeBridgeWebview();
  };
  return {
    hasRequestedUsd,
    isTosConfirmed: bridgeTos.isTosConfirmed,
    isTosLoading: bridgeTos.isTosLoading,
    bridgeUrl,
    closeBridgeWebview,
    handleBridgeTosAccepted,
    startAcceptBridgeTos,
    startUsdRequest,
    getUsdActionLabel: () =>
      hasRequestedUsd ? "Continue USD setup" : "Set up USD account",
    isUsdActionPending: bridgeTos.isGeneratingUrl || bridgeTos.isSavingTos,
    bridgeTos,
  };
}
export function getBridgeTosErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}
