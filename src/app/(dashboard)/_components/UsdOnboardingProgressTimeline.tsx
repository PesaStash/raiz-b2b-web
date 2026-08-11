"use client";

import React from "react";
import { UsdKybCaseStatus } from "@/types/user";
import { getUsdOnboardingTimelineSteps } from "@/utils/usdOnboardingStatus";

interface UsdOnboardingProgressTimelineProps {
  status: UsdKybCaseStatus;
  className?: string;
}

const UsdOnboardingProgressTimeline = ({
  status,
  className = "",
}: UsdOnboardingProgressTimelineProps) => {
  const steps = getUsdOnboardingTimelineSteps(status);

  return (
    <div
      className={`flex w-full items-start justify-between gap-1 sm:items-center sm:gap-2 sm:px-4 ${className}`}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          {index > 0 ? (
            <div
              className={`mt-[9px] h-0 min-w-3 flex-1 border-t-2 sm:mt-0 sm:min-w-4 ${
                step.state === "upcoming"
                  ? "border-dashed border-[#D0C8D9]"
                  : "border-solid border-[#19151E]"
              }`}
            />
          ) : null}
          <div className="flex shrink-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
            <div
              className={`size-5 rounded-full sm:size-6 ${
                step.state === "complete"
                  ? "bg-[#19151E]"
                  : step.state === "active"
                    ? "bg-[#0D6494]"
                    : "border-2 border-[#E4E0EA] bg-white"
              }`}
            />
            <p
              className={`max-w-16 text-center text-[10px] leading-tight sm:max-w-none sm:text-left sm:text-[13px] ${
                step.state === "active"
                  ? "font-bold text-[#0D6494]"
                  : step.state === "complete"
                    ? "font-semibold text-[#19151E]"
                    : "font-semibold text-[#A89AB9]"
              }`}
            >
              {step.label}
            </p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default UsdOnboardingProgressTimeline;
