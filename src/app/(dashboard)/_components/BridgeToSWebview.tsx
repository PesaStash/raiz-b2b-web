"use client";

import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import Spinner from "@/components/ui/Spinner";
import { parseBridgeTosMessage } from "@/utils/bridgeTos";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";

interface BridgeToSWebviewProps {
  bridgeUrl: string;
  close: () => void;
  onAccepted: (signedAgreementId: string) => void | Promise<void>;
  onError?: (message: string) => void;
}

const BridgeToSWebview = ({
  bridgeUrl,
  close,
  onAccepted,
  onError,
}: BridgeToSWebviewProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (isProcessing) return;

      const signedAgreementId = parseBridgeTosMessage(event, bridgeUrl);
      if (!signedAgreementId) return;

      setIsProcessing(true);
      setLocalError(null);

      try {
        await onAccepted(signedAgreementId);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to complete Bridge Terms acceptance.";
        setLocalError(message);
        onError?.(message);
        setIsProcessing(false);
      }
    },
    [bridgeUrl, isProcessing, onAccepted, onError]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <CenterModalWrapper close={close} wrapperStyle="!max-w-[720px]">
      <div className="flex h-full min-h-[70vh] flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-raiz-gray-950">
              Accept Terms of Use
            </h2>
            <p className="mt-1 text-sm text-raiz-gray-600">
              Review and accept our terms of use to continue with your USD account
              request.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={isProcessing}
            aria-label="Close Bridge Terms"
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
          <iframe
            src={bridgeUrl}
            title="Bridge Terms of Service"
            className="h-full min-h-[60vh] w-full"
            allow="clipboard-read; clipboard-write"
          />
          {isProcessing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="flex items-center gap-2 text-sm font-medium text-raiz-gray-700">
                <Spinner className="!h-5 !w-5 !border-t-2 !border-b-2" />
                Saving Bridge Terms acceptance...
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </CenterModalWrapper>
  );
};

export default BridgeToSWebview;
