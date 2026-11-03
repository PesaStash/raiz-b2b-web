"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { formatGatewayReason } from "../_utils/subaccountHelpers";

type Props = {
  status: string;
  rejectionReasons?: unknown[];
  missingRequirements?: unknown[];
  retryEligible?: boolean;
  kycLink?: string | null;
};

const RejectionBanner = ({
  status,
  rejectionReasons = [],
  missingRequirements = [],
  retryEligible = false,
  kycLink,
}: Props) => {
  const reasons = rejectionReasons.map(formatGatewayReason).filter(Boolean);
  const requirements = missingRequirements
    .map(formatGatewayReason)
    .filter(Boolean);

  const title =
    status === "requires_kyc"
      ? "Additional verification required"
      : "Provisioning Failed";

  const reasonText =
    reasons.length > 0
      ? reasons.join(" ")
      : "Bridge could not complete verification for this customer.";

  const handleContinue = () => {
    if (kycLink) {
      window.open(kycLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 md:p-5 flex flex-col gap-3">
      <div>
        <h3 className="text-base md:text-lg font-bold text-[#991B1B]">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#B91C1C] leading-relaxed">
          <span className="font-semibold">Rejection Reason:</span> {reasonText}
          {status !== "requires_kyc"
            ? " Because provisioning did not complete, comprehensive USD, EUR, and GBP account details are unavailable for this subaccount."
            : ""}
        </p>
        {requirements.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-[#991B1B] uppercase tracking-wide">
              Missing requirements
            </p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {requirements.map((item) => (
                <li key={item} className="text-sm text-[#B91C1C]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {retryEligible && kycLink ? (
        <div>
          <Button
            onClick={handleContinue}
            className="!w-auto h-10 px-5 py-2 rounded-full"
          >
            Continue verification
          </Button>
        </div>
      ) : null}

      {retryEligible && !kycLink ? (
        <p className="text-sm text-[#991B1B]">
          Verification needs more information. Please contact support.
        </p>
      ) : null}
    </div>
  );
};

export default RejectionBanner;
