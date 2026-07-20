"use client";

import { IUsdOnboardingCase, UsdKybCaseStatus } from "@/types/user";
import { isUsdKybRejected } from "@/utils/onboardingBranch";
import dayjs from "dayjs";

const STATUS_LABELS: Record<string, string> = {
  collecting: "Collecting information",
  ready_for_review: "Ready for review",
  submitted_to_bridge: "Submitted for review",
  under_review: "Under review",
  requires_additional_info: "Additional info required",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  collecting: "bg-blue-50 text-blue-800 border-blue-200",
  ready_for_review: "bg-violet-50 text-violet-800 border-violet-200",
  submitted_to_bridge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  under_review: "bg-amber-50 text-amber-800 border-amber-200",
  requires_additional_info: "bg-orange-50 text-orange-800 border-orange-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  completed: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

function getStatusLabel(status: UsdKybCaseStatus) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

function getStatusStyle(status: UsdKybCaseStatus) {
  return STATUS_STYLES[status] ?? "bg-raiz-gray-50 text-raiz-gray-800 border-raiz-gray-200";
}

interface UsdOnboardingConfirmationProps {
  usdCase: IUsdOnboardingCase;
  message?: string;
  compact?: boolean;
  className?: string;
}

const UsdOnboardingConfirmation = ({
  usdCase,
  message,
  compact = false,
  className = "",
}: UsdOnboardingConfirmationProps) => {
  const rejected = isUsdKybRejected(usdCase.status);
  const requestedAt = usdCase.requested_onboarding_at
    ? dayjs(usdCase.requested_onboarding_at).format("MMM D, YYYY [at] h:mm A")
    : null;

  const defaultMessage = rejected
    ? "Your USD verification has been declined. Please contact support."
    : "USD account request submitted — our team will contact you to complete verification.";

  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${compact ? "p-3" : "md:p-5"} ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold text-raiz-gray-950 ${compact ? "text-sm" : "text-sm md:text-base"}`}
          >
            {rejected ? "USD account request declined" : "USD account requested"}
          </p>
          <p
            className={`mt-1 leading-relaxed text-raiz-gray-600 ${compact ? "text-xs" : "text-xs md:text-sm"}`}
          >
            {message || defaultMessage}
          </p>
          {requestedAt && !compact ? (
            <p className="mt-2 text-xs text-raiz-gray-500">
              Requested on {requestedAt}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusStyle(usdCase.status)}`}
        >
          {getStatusLabel(usdCase.status)}
        </span>
      </div>
    </div>
  );
};

export default UsdOnboardingConfirmation;
