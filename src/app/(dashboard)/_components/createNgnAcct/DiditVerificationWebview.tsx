"use client";

import Overlay from "@/components/ui/Overlay";
import Spinner from "@/components/ui/Spinner";
import Image from "next/image";
import React from "react";

interface DiditVerificationWebviewProps {
  url: string | null;
  isLoading?: boolean;
  close: () => void;
}

const DiditVerificationWebview = ({
  url,
  isLoading = false,
  close,
}: DiditVerificationWebviewProps) => {
  return (
    <Overlay close={() => {}} width="720px" height="85vh">
      <div className="flex h-full min-h-[70vh] flex-col px-5 py-6 font-brSonoma">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-raiz-gray-950">
              Verify UBO identity and CAC document
            </h2>
            <p className="mt-1 text-sm text-raiz-gray-600">
              Complete ID verification, liveness, and CAC document upload in one
              step.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close verification"
            className="rounded-full bg-raiz-gray-100 p-2"
          >
            <Image src="/icons/close.svg" width={16} height={16} alt="" />
          </button>
        </div>

        <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border border-raiz-gray-100 bg-white">
          {isLoading ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-sm text-raiz-gray-700">
                <Spinner className="!h-6 !w-6 !border-t-2 !border-b-2" />
                Starting verification…
              </div>
            </div>
          ) : url ? (
            <iframe
              title="Didit verification"
              src={url}
              allow="camera *; microphone *; fullscreen *; autoplay *; clipboard-write *; encrypted-media *"
              referrerPolicy="strict-origin-when-cross-origin"
              className="block h-full min-h-[60vh] w-full border-0"
            />
          ) : (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-raiz-gray-700">
                Your verification session is already in progress. Close this
                window and wait while we update your status.
              </p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-primary2 px-4 py-2 text-sm font-semibold text-raiz-gray-50"
              >
                Back to status
              </button>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default DiditVerificationWebview;
