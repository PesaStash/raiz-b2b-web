"use client";
import { useState } from "react";
import Image from "next/image";

interface DailyTransactionLimitProps {
  limit?: number;
  used?: number;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = "$"): string {
  return `${currency}${amount.toLocaleString("en-US")}`;
}

export default function DailyTransactionLimit({
  limit = 10000,
  used = 3000,
  currency = "$",
}: DailyTransactionLimitProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="w-full  mb-7">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-semibold text-raiz-gray-700">
          Daily Transaction Limit :
        </span>
        <span className="text-[11px] font-semibold text-raiz-gray-700">
          {formatCurrency(limit, currency)}
        </span>

        {/* Info icon with tooltip */}
        <div className="relative flex items-center">
          <button
            className="size-4"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label="Daily transaction limit information"
          >
            <Image
              src={"/icons/tooltip-info.svg"}
              alt="country"
              width={16}
              height={16}
            />
          </button>

          {showTooltip && (
            <div className="absolute left-7 top-1/2 -translate-y-1/2 z-10 w-56 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-normal pointer-events-none">
              This is the maximum amount you can transact in a single day.
              Resets at midnight UTC. Contact support for a higher limit.
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="relative w-full h-3 rounded-full bg-purple-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${formatCurrency(used, currency)} used of ${formatCurrency(limit, currency)} daily limit`}
      >
        <div
          className="h-full rounded-full bg-[#4B3A6E] transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2.5">
        <span className="text-[11px] font-semibold text-raiz-gray-950">
          {formatCurrency(used, currency)}
        </span>
        <span className="text-[11px] font-semibold  text-raiz-gray-700">
          of <span className="">{formatCurrency(limit, currency)}</span>
        </span>
      </div>
    </div>
  );
}
