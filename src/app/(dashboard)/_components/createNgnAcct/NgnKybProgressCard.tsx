"use client";

import Button from "@/components/ui/Button";
import type { INgnVerificationRequirements } from "@/types/services";
import {
  getNgnKybProgressCardCopy,
  getNgnKybRequirementLabel,
  getNgnKybRequirementStyle,
} from "@/utils/ngnKyb";
import Image from "next/image";

interface NgnKybProgressCardProps {
  requirements: INgnVerificationRequirements;
  onViewStatus: () => void;
  className?: string;
}

const NgnKybProgressCard = ({
  requirements,
  onViewStatus,
  className = "",
}: NgnKybProgressCardProps) => {
  const copy = getNgnKybProgressCardCopy(requirements);

  return (
    <div
      className={`rounded-lg bg-[#FFF3E666] px-3.5 py-4 sm:px-4 sm:py-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-[0.667px] border-black/[0.08] bg-[#FCFCFD] sm:size-12">
          <Image
            src="/icons/ngn.svg"
            alt=""
            width={32}
            height={32}
            className="size-6 sm:size-8"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-[1.2] text-[#1E1924] sm:text-sm">
            {copy.title}
          </p>
          <p className="mt-1 text-xs leading-[1.4] text-[#6F5B86] sm:text-sm">
            {copy.message}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <RequirementRow
          label="Business documents"
          status={requirements.cac_document_status}
        />
        <RequirementRow
          label="Owner identity"
          status={requirements.ubo_status}
        />
      </div>

      <div className="mt-4">
        <Button
          type="button"
          onClick={onViewStatus}
          className="h-10 w-full sm:w-auto"
        >
          {copy.ctaLabel}
        </Button>
      </div>
    </div>
  );
};

function RequirementRow({
  label,
  status,
}: {
  label: string;
  status: INgnVerificationRequirements["cac_document_status"];
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EAECF0] bg-white px-3 py-2.5">
      <p className="text-xs font-semibold text-[#1E1924] sm:text-[13px]">
        {label}
      </p>
      <span
        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${getNgnKybRequirementStyle(
          status,
        )}`}
      >
        {getNgnKybRequirementLabel(status)}
      </span>
    </div>
  );
}

export default NgnKybProgressCard;
