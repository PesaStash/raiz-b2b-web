"use client";

import Image from "next/image";
import FlowOverlay from "./FlowOverlay";
import { FlowCard } from "./Flow";

const DEFAULT_SUBTITLE = "Please wait while we process the transfer.";

export default function SendProcessing({
  title,
  subtitle = DEFAULT_SUBTITLE,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <FlowOverlay label={title}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold leading-[1.4] text-[#19151e]">
            {title}
          </h1>
          <p className="text-sm leading-[1.4] text-[#79708d]">{subtitle}</p>
        </div>
        <FlowCard className="!items-center !gap-4 !px-7 !py-10">
          <div className="flex size-24 items-center justify-center rounded-full bg-[rgba(234,236,255,0.6)]">
            <Image
              src="/images/send/pending.svg"
              width={48}
              height={48}
              alt=""
            />
          </div>
          <h2 className="text-center text-2xl font-semibold leading-[1.4] text-[#19151e]">
            Processing your transfer
          </h2>
          <p className="text-center text-sm leading-[1.4] text-[#79708d]">
            Please wait. Don’t submit the payment again.
          </p>
          <div
            className="relative h-1.5 w-60 overflow-hidden rounded-[3px] bg-[#eeecf5]"
            role="progressbar"
            aria-label="Processing transfer"
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="absolute top-0 h-1.5 w-24 rounded-[3px] bg-primary2 animate-send-progress" />
          </div>
        </FlowCard>
      </div>
    </FlowOverlay>
  );
}
