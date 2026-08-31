"use client";

import DiditVerificationWebview from "@/app/(dashboard)/_components/createNgnAcct/DiditVerificationWebview";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useNgnOnboarding } from "@/lib/hooks/useNgnOnboarding";
import type { NgnKybRequirementStatus } from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";
import {
  canResumeNgnKybSession,
  getCombinedNgnKybActionLabel,
  getCombinedNgnKybUiState,
  getNgnKybStepUiState,
  isNgnRequirementApproved,
  type NgnKybStepUiState,
} from "@/utils/ngnKyb";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";

const CreateNgnAcct = ({ close }: { close: () => void }) => {
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [showHostedFlow, setShowHostedFlow] = useState(false);
  const {
    requirements,
    cacStatus,
    uboStatus,
    canCreateAccount,
    isPolling,
    isLoading,
    error,
    refetch,
    startKybSession,
    createNgnAccount,
    isStartingSession,
    isCreatingAccount,
  } = useNgnOnboarding({ enabled: true });

  const combinedState = getCombinedNgnKybUiState(requirements);
  const cacStep = getNgnKybStepUiState(cacStatus);
  const uboStep = getNgnKybStepUiState(uboStatus);
  const bothApproved =
    isNgnRequirementApproved(cacStatus) && isNgnRequirementApproved(uboStatus);
  const isSavingEvidence = bothApproved && !canCreateAccount;
  const canStartVerification = canResumeNgnKybSession(combinedState);

  const handleCloseHostedFlow = useCallback(() => {
    setShowHostedFlow(false);
    setHostedUrl(null);
    void refetch();
  }, [refetch]);

  // Close the Didit webview only when Raiz confirms eligibility.
  useEffect(() => {
    if (!showHostedFlow || !canCreateAccount) return;
    setShowHostedFlow(false);
    setHostedUrl(null);
  }, [canCreateAccount, showHostedFlow]);

  const handleStartVerification = async () => {
    if (isStartingSession || !canStartVerification) return;

    setShowHostedFlow(true);
    setHostedUrl(null);

    try {
      const session = await startKybSession();
      setHostedUrl(session.url);
      if (!session.url) {
        // Idempotent resume: URL may be null after cache expiry — show status.
        setShowHostedFlow(false);
      }
    } catch {
      setShowHostedFlow(false);
      setHostedUrl(null);
    }
  };

  const handleCreate = async () => {
    try {
      const created = await createNgnAccount();
      if (created) close();
    } catch {
      // Wallet creation errors are already surfaced by the API client.
    }
  };

  return (
    <>
      <div className="flex w-full flex-col font-brSonoma">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-[1.2] text-raiz-gray-950">
              Set Up Your NGN Account
            </h2>
            <p className="mt-1.5 text-[13px] leading-normal text-raiz-gray-600">
              Verify UBO identity and CAC document in one step to activate your
              NGN account
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close NGN account setup"
            className="rounded-full bg-raiz-gray-100 p-2"
          >
            <Image src="/icons/close.svg" width={16} height={16} alt="" />
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(
              error,
              "Unable to load NGN verification requirements.",
            )}
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Spinner className="!h-6 !w-6 !border-t-2 !border-b-2" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex w-full flex-col gap-4 rounded-[20px] border border-[#EAECF0] bg-white p-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold leading-[1.2] text-raiz-gray-950">
                  Business verification
                </p>
                <p className="text-[13px] leading-normal text-raiz-gray-600">
                  Government ID, liveness check, and CAC document collection
                  happen in a single secure flow.
                </p>
              </div>

              <div className="space-y-2">
                <RequirementDetail
                  label="CAC document"
                  status={cacStatus}
                  state={cacStep}
                />
                <RequirementDetail
                  label="UBO identity & liveness"
                  status={uboStatus}
                  state={uboStep}
                />
              </div>

              {!canCreateAccount ? (
                <Button
                  onClick={handleStartVerification}
                  loading={isStartingSession}
                  disabled={!canStartVerification || isStartingSession}
                  className={
                    !canStartVerification
                      ? "!bg-raiz-gray-100 !text-raiz-gray-500"
                      : ""
                  }
                >
                  {getCombinedNgnKybActionLabel(combinedState)}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {isSavingEvidence ? (
          <p className="mt-4 text-center text-[13px] text-raiz-gray-600">
            Saving verification evidence. This page will update automatically.
          </p>
        ) : combinedState === "review" && isPolling ? (
          <p className="mt-4 text-center text-[13px] text-raiz-gray-600">
            Verification is under review. This page will update automatically.
          </p>
        ) : combinedState === "continue" ? (
          <p className="mt-4 text-center text-[13px] text-raiz-gray-600">
            You can continue your verification session, or wait while we update
            status automatically.
          </p>
        ) : null}

        {canCreateAccount ? (
          <Button
            onClick={handleCreate}
            loading={isCreatingAccount}
            className="mt-6"
          >
            Create NGN Account
          </Button>
        ) : null}
      </div>

      {showHostedFlow ? (
        <DiditVerificationWebview
          url={hostedUrl}
          isLoading={isStartingSession && !hostedUrl}
          close={handleCloseHostedFlow}
        />
      ) : null}
    </>
  );
};

function RequirementDetail({
  label,
  status,
  state,
}: {
  label: string;
  status?: NgnKybRequirementStatus;
  state: NgnKybStepUiState;
}) {
  const isComplete = state === "completed";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EAECF0] bg-raiz-gray-50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
            isComplete
              ? "bg-[#9BCF53] text-white"
              : "bg-raiz-gray-200 text-raiz-gray-600"
          }`}
        >
          {isComplete ? "✓" : "·"}
        </span>
        <p className="text-xs font-semibold text-raiz-gray-950 sm:text-[13px]">
          {label}
        </p>
      </div>
      {status && state !== "start" ? (
        <span className="text-[11px] capitalize text-raiz-gray-500 sm:text-xs">
          {status.replace(/_/g, " ")}
        </span>
      ) : (
        <span className="text-[11px] text-raiz-gray-500 sm:text-xs">
          Not started
        </span>
      )}
    </div>
  );
}

export default CreateNgnAcct;
