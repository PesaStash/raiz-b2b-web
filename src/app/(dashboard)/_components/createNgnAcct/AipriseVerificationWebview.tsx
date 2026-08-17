"use client";

import "@/types/aiprise";
import Overlay from "@/components/ui/Overlay";
import Spinner from "@/components/ui/Spinner";
import { AIPRISE_CONFIG_ERROR, getAipriseConfig, getAipriseTemplateId } from "@/constants/aiprise";
import { useUser } from "@/lib/hooks/useUser";
import type { NgnAipriseFlow } from "@/types/services";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";
import {
  clearAipriseResumeSessionId,
  getAipriseResumeSessionId,
  saveAipriseResumeSessionId,
} from "@/utils/ngnKyb";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface AipriseVerificationWebviewProps {
  flow: NgnAipriseFlow;
  close: () => void;
  onSessionComplete: (sessionId: string) => Promise<void>;
}

const FLOW_COPY: Record<
  NgnAipriseFlow,
  { title: string; description: string }
> = {
  cac: {
    title: "Upload Business Documents",
    description:
      "Complete the business document verification to continue setting up your NGN account.",
  },
  ubo: {
    title: "Verify Business Owner Identity",
    description:
      "Complete ID verification and the liveness check for the signed-in business owner.",
  },
};

const RESUMABLE_ERROR_CODES = new Set([
  "SESSION_EXPIRED",
  "SESSION_COMPLETED",
  "RESUME_FAILED",
]);

const AipriseVerificationWebview = ({
  flow,
  close,
  onSessionComplete,
}: AipriseVerificationWebviewProps) => {
  const { user } = useUser();
  const config = getAipriseConfig();
  const entityId = user?.business_account?.entity_id;
  const copy = FLOW_COPY[flow];
  const frameRef = useRef<HTMLElement | null>(null);
  const submittedSessionRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [resumeSessionId, setResumeSessionId] = useState<string | undefined>(
    () => getAipriseResumeSessionId(entityId, flow),
  );
  const [frameKey, setFrameKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(
    config.isConfigured ? null : AIPRISE_CONFIG_ERROR,
  );

  useEffect(() => {
    let cancelled = false;

    const loadSdk = async () => {
      try {
        await import("aiprise-web-sdk");
        if (!cancelled) setSdkReady(true);
      } catch {
        if (!cancelled) {
          setLocalError("Unable to load verification. Please try again.");
        }
      }
    };

    void loadSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    if (isSubmitting) return;
    close();
  };

  const completeSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId || submittedSessionRef.current === sessionId || isSubmitting) {
        return;
      }

      submittedSessionRef.current = sessionId;
      setIsSubmitting(true);
      setLocalError(null);

      try {
        await onSessionComplete(sessionId);
        close();
      } catch {
        submittedSessionRef.current = null;
        setIsSubmitting(false);
        setLocalError("Unable to submit this verification session. Please try again.");
      }
    },
    [close, isSubmitting, onSessionComplete],
  );

  useEffect(() => {
    const el = frameRef.current;
    if (!el || !sdkReady || !config.isConfigured) return;

    const getSessionId = (event: Event) =>
      (event as CustomEvent<{ verification_session_id?: string }>).detail
        ?.verification_session_id;

    const handleStarted = (event: Event) => {
      const sessionId = getSessionId(event);
      if (!sessionId || !entityId) return;
      saveAipriseResumeSessionId(entityId, flow, sessionId);
    };

    const handleSuccessful = (event: Event) => {
      const sessionId = getSessionId(event);
      if (sessionId) void completeSession(sessionId);
    };

    const handleError = (event: Event) => {
      const errorCode =
        (event as CustomEvent<{ error_code?: string }>).detail?.error_code ||
        "SESSION_FAILED";

      pushDataLayerEvent("kyc_status_update", {
        kyc_step: flow === "cac" ? "ngn_cac_document" : "ngn_ubo",
        kyc_status: "rejected",
        user_type: getAnalyticsUserType(),
      });

      if (RESUMABLE_ERROR_CODES.has(errorCode)) {
        clearAipriseResumeSessionId(entityId, flow);
        setResumeSessionId(undefined);
        setFrameKey((current) => current + 1);
        setLocalError("The previous verification session expired. Starting a new one.");
        return;
      }

      setLocalError("Unable to start verification. Please try again.");
    };

    el.addEventListener("aiprise:started", handleStarted);
    el.addEventListener("aiprise:resumed", handleStarted);
    el.addEventListener("aiprise:successful", handleSuccessful);
    el.addEventListener("aiprise:continue", handleSuccessful);
    el.addEventListener("aiprise:error", handleError);

    return () => {
      el.removeEventListener("aiprise:started", handleStarted);
      el.removeEventListener("aiprise:resumed", handleStarted);
      el.removeEventListener("aiprise:successful", handleSuccessful);
      el.removeEventListener("aiprise:continue", handleSuccessful);
      el.removeEventListener("aiprise:error", handleError);
    };
  }, [completeSession, config.isConfigured, entityId, flow, frameKey, sdkReady]);

  const userData = JSON.stringify({
    first_name: user?.first_name,
    last_name: user?.last_name,
    email_address: user?.business_account?.business_email,
  });

  const entityAddress = user?.business_account?.entity?.entity_address?.[0];
  const businessData = JSON.stringify({
    name: user?.business_account?.business_name,
    country_code: user?.business_account?.entity?.country?.country_code,
    email_addresses: user?.business_account?.business_email
      ? [user.business_account.business_email]
      : undefined,
    phone_numbers: user?.business_account?.business_phone_number
      ? [user.business_account.business_phone_number]
      : undefined,
    addresses: entityAddress
      ? [
          {
            address_street_1: entityAddress.street,
            address_city: entityAddress.city,
            address_state: entityAddress.state,
            address_zip_code: entityAddress.zip_code,
            address_country:
              entityAddress.country?.country_code ||
              user?.business_account?.entity?.country?.country_code,
          },
        ]
      : undefined,
  });

  return (
    <Overlay close={handleClose} width="720px" height="85vh">
      <div className="flex h-full min-h-[70vh] flex-col px-5 py-6 font-brSonoma">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-raiz-gray-950">{copy.title}</h2>
            <p className="mt-1 text-sm text-raiz-gray-600">{copy.description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close verification"
            className="rounded-full bg-raiz-gray-100 p-2"
          >
            <Image src="/icons/close.svg" width={16} height={16} alt="" />
          </button>
        </div>

        {localError ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        ) : null}

        <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border border-raiz-gray-100 bg-white">
          {sdkReady && config.isConfigured ? (
            <aiprise-frame
              key={`${flow}-${frameKey}-${resumeSessionId ?? "new"}`}
              ref={frameRef}
              mode={config.mode}
              template-id={getAipriseTemplateId(flow)}
              {...(resumeSessionId ? { "session-id": resumeSessionId } : {})}
              client-reference-id={user?.business_account_id}
              {...(flow === "cac" && user?.business_account?.business_email
                ? { "associated-email": user.business_account.business_email }
                : {})}
              {...(flow === "ubo" ? { "user-data": userData } : {})}
              {...(flow === "cac" ? { "business-data": businessData } : {})}
              style={{ display: "block", width: "100%", height: "100%", minHeight: "60vh" }}
            />
          ) : (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
              <Spinner className="!h-6 !w-6 !border-t-2 !border-b-2" />
            </div>
          )}

          {isSubmitting ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="flex items-center gap-2 text-sm font-medium text-raiz-gray-700">
                <Spinner className="!h-5 !w-5 !border-t-2 !border-b-2" />
                Submitting verification session...
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Overlay>
  );
};

export default AipriseVerificationWebview;
