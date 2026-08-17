"use client";

import AipriseVerificationWebview from "@/app/(dashboard)/_components/createNgnAcct/AipriseVerificationWebview";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { AIPRISE_CONFIG_ERROR, getAipriseConfig } from "@/constants/aiprise";
import { useNgnOnboarding } from "@/lib/hooks/useNgnOnboarding";
import type { NgnAipriseFlow, NgnKybRequirementStatus } from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";
import { getNgnKybStepUiState, type NgnKybStepUiState } from "@/utils/ngnKyb";
import Image from "next/image";
import React, { useState } from "react";

const CreateNgnAcct = ({ close }: { close: () => void }) => {
  const config = getAipriseConfig();
  const [activeFlow, setActiveFlow] = useState<NgnAipriseFlow | null>(null);
  const {
    cacStatus,
    uboStatus,
    canCreateAccount,
    isPolling,
    isLoading,
    error,
    submitSession,
    createNgnAccount,
    isCreatingAccount,
  } = useNgnOnboarding({ enabled: true });

  const cacStep = getNgnKybStepUiState(cacStatus);
  const uboStep = getNgnKybStepUiState(uboStatus);

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
              Complete both steps below to activate your NGN account
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

        {!config.isConfigured ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {AIPRISE_CONFIG_ERROR}
          </p>
        ) : null}

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
            <VerificationStepCard
              stepNumber={1}
              title="Submit Business Documents"
              description="Provide your CAC and business registration documents"
              state={cacStep}
              status={cacStatus}
              actionLabel={getCacActionLabel(cacStep)}
              onAction={() => setActiveFlow("cac")}
              disabled={!config.isConfigured || cacStep === "processing" || cacStep === "review" || cacStep === "completed"}
            />
            <VerificationStepCard
              stepNumber={2}
              title="Verify Business Owner Identity"
              description="Complete ID verification and facial recognition (liveness check)"
              state={uboStep}
              status={uboStatus}
              actionLabel={getUboActionLabel(uboStep)}
              onAction={() => setActiveFlow("ubo")}
              disabled={
                !config.isConfigured ||
                uboStep === "processing" ||
                uboStep === "review" ||
                uboStep === "completed"
              }
            />
          </div>
        )}

        {isPolling ? (
          <p className="mt-4 text-center text-[13px] text-raiz-gray-600">
            Verification is still processing. This page will update automatically.
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

      {activeFlow ? (
        <AipriseVerificationWebview
          flow={activeFlow}
          close={() => setActiveFlow(null)}
          onSessionComplete={async (sessionId) => {
            await submitSession(activeFlow, sessionId);
          }}
        />
      ) : null}
    </>
  );
};

function getCacActionLabel(state: NgnKybStepUiState) {
  switch (state) {
    case "retry":
      return "Retry Upload";
    case "processing":
      return "Processing...";
    case "review":
      return "Under Review";
    case "completed":
      return "Completed";
    default:
      return "Upload Documents";
  }
}

function getUboActionLabel(state: NgnKybStepUiState) {
  switch (state) {
    case "retry":
      return "Retry Verification";
    case "processing":
      return "Processing...";
    case "review":
      return "Under Review";
    case "completed":
      return "Completed";
    case "locked":
      return "Start Verification";
    default:
      return "Start Verification";
  }
}

function VerificationStepCard({
  stepNumber,
  title,
  description,
  state,
  status,
  actionLabel,
  onAction,
  disabled,
}: {
  stepNumber: number;
  title: string;
  description: string;
  state: NgnKybStepUiState;
  status?: NgnKybRequirementStatus;
  actionLabel: string;
  onAction: () => void;
  disabled: boolean;
}) {
  const isLocked = state === "locked";
  const isComplete = state === "completed";

  return (
    <div
      className={`flex w-full flex-col gap-4 rounded-[20px] border border-[#EAECF0] bg-white p-5 ${
        isLocked ? "opacity-50" : ""
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
              isComplete
                ? "bg-[#9BCF53] text-white"
                : isLocked
                  ? "bg-raiz-gray-100 text-raiz-gray-500"
                  : "bg-primary2 text-raiz-gray-50"
            }`}
          >
            {isComplete ? "✓" : stepNumber}
          </div>
          <p
            className={`flex-1 text-sm font-bold leading-[1.2] ${
              isLocked ? "text-raiz-gray-500" : "text-raiz-gray-950"
            }`}
          >
            {title}
          </p>
        </div>
        <p
          className={`text-[13px] leading-normal ${
            isLocked ? "text-raiz-gray-500" : "text-raiz-gray-600"
          }`}
        >
          {description}
        </p>
        {status && state !== "start" && state !== "locked" ? (
          <p className="text-xs capitalize text-raiz-gray-500">
            Status: {status.replace("_", " ")}
          </p>
        ) : null}
      </div>
      <Button
        onClick={onAction}
        disabled={disabled}
        className={
          disabled
            ? "!bg-raiz-gray-100 !text-raiz-gray-500"
            : ""
        }
      >
        {actionLabel}
      </Button>
    </div>
  );
}

export default CreateNgnAcct;
