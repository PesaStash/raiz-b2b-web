"use client";

import Button from "@/components/ui/Button";
import { IUsdOnboardingCase, UsdKybCaseStatus } from "@/types/user";
import { isUsdKybRejected } from "@/utils/onboardingBranch";
import {
  getUsdOnboardingStatusLabel,
  getUsdOnboardingStatusStyle,
} from "@/utils/usdOnboardingStatus";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import UsdOnboardingProgressTimeline from "./UsdOnboardingProgressTimeline";

interface UsdOnboardingConfirmationProps {
  usdCase: IUsdOnboardingCase;
  message?: string;
  compact?: boolean;
  className?: string;
  tosConfirmed?: boolean;
  onAcceptTos?: () => void;
  isAcceptingTos?: boolean;
  showTimeline?: boolean;
  showSupportLink?: boolean;
  onGoToDashboard?: () => void;
}

const SUPPORT_MAILTO =
  "mailto:support@raiz.app?subject=USD%20Account%20Onboarding%20Support";

function shouldShowTimeline(status: UsdKybCaseStatus, compact: boolean) {
  if (compact) return false;
  return !isUsdKybRejected(status) && status !== "not_started";
}

const UsdOnboardingConfirmation = ({
  usdCase,
  message,
  compact = false,
  className = "",
  tosConfirmed = true,
  onAcceptTos,
  isAcceptingTos = false,
  showTimeline,
  showSupportLink = true,
  onGoToDashboard,
}: UsdOnboardingConfirmationProps) => {
  const rejected = isUsdKybRejected(usdCase.status);
  const needsTos = !tosConfirmed;
  const requestedAt = usdCase.requested_onboarding_at
    ? dayjs(usdCase.requested_onboarding_at).format("MMM D, YYYY [at] h:mm A")
    : null;

  const defaultMessage = rejected
    ? "Your USD verification has been declined. Please contact support."
    : needsTos
      ? "Your USD request was recorded, but Bridge Terms of Service still need to be accepted before operations can proceed."
      : "Our operations team will contact your business to complete USD verification.";

  const title = rejected
    ? "USD Account Request Declined"
    : needsTos
      ? "Bridge Terms Required"
      : "USD KYB Onboarding Progress";

  const displayTimeline =
    showTimeline ?? shouldShowTimeline(usdCase.status, compact);

  return (
    <div
      className={`rounded-lg bg-[#FFF3E666] ${
        compact ? "p-3" : "px-3.5 py-4 sm:px-4 sm:py-5"
      } ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`relative flex shrink-0 items-center justify-center rounded-full border-[0.667px] border-black/[0.08] bg-[#FCFCFD] ${
              compact ? "size-10" : "size-10 sm:size-12"
            }`}
          >
            <Image
              src="/icons/usd-kyb-bank.svg"
              alt=""
              width={32}
              height={32}
              className={compact ? "size-6" : "size-6 sm:size-8"}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`font-bold leading-[1.2] text-[#1E1924] ${
                compact ? "text-[13px]" : "text-[13px] sm:text-sm"
              }`}
            >
              {title}
            </p>
            <p
              className={`mt-1 leading-[1.4] text-[#6F5B86] ${
                compact ? "text-xs" : "text-xs sm:text-sm"
              }`}
            >
              {message || defaultMessage}
            </p>
            {requestedAt || (needsTos && onAcceptTos) || showSupportLink ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-[1.4]">
                {requestedAt ? (
                  <span className="text-[#6F5B86]">
                    Requested on{" "}
                    <span className="font-semibold sm:text-[13px]">
                      {requestedAt}
                    </span>
                  </span>
                ) : null}
                {needsTos && onAcceptTos ? (
                  <>
                    {requestedAt ? (
                      <span
                        aria-hidden="true"
                        className="text-sm leading-none text-[#6F5B86] sm:text-xl"
                      >
                        ·
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={onAcceptTos}
                      disabled={isAcceptingTos}
                      className="cursor-pointer font-semibold text-[#3C2875] underline underline-offset-2 transition-colors hover:text-[#2f1f5c] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[13px]"
                    >
                      {isAcceptingTos
                        ? "Opening Terms of Use..."
                        : "Accept Terms of Use"}
                    </button>
                  </>
                ) : null}
                {showSupportLink ? (
                  <>
                    {requestedAt || (needsTos && onAcceptTos) ? (
                      <span
                        aria-hidden="true"
                        className="text-sm leading-none text-[#6F5B86] sm:text-xl"
                      >
                        ·
                      </span>
                    ) : null}
                    <Link
                      href={SUPPORT_MAILTO}
                      className="cursor-pointer font-semibold text-[#3C2875] underline underline-offset-2 transition-colors hover:text-[#2f1f5c] sm:text-[13px]"
                    >
                      Contact Support
                    </Link>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <span
          className={`self-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-normal sm:shrink-0 sm:text-[13px] ${getUsdOnboardingStatusStyle(
            usdCase.status
          )}`}
        >
          {rejected
            ? getUsdOnboardingStatusLabel(usdCase.status, true)
            : `Stage: ${getUsdOnboardingStatusLabel(usdCase.status, true)}`}
        </span>
      </div>

      {displayTimeline ? (
        <UsdOnboardingProgressTimeline
          status={usdCase.status}
          className="mt-5 sm:mt-6"
        />
      ) : null}

      {!compact && onGoToDashboard ? (
        <div className="mt-6">
          <Button
            type="button"
            onClick={onGoToDashboard}
            className="h-10 w-full sm:w-auto"
          >
            Go to Dashboard
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default UsdOnboardingConfirmation;
