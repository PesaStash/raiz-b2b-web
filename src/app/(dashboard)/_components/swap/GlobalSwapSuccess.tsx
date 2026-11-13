"use client";

import Image from "next/image";
import { toast } from "sonner";
import { formatMoney } from "@/lib/globalBalance";
import type { SwapPairCurrency, SwapPreview } from "@/types/swap";
import { copyToClipboard } from "@/utils/helpers";

interface Props {
  sourceCurrency: SwapPairCurrency;
  destinationCurrency: SwapPairCurrency;
  preview: SwapPreview;
  reference: string;
  onDone: () => void;
  onViewReceipt: () => void;
}

export default function GlobalSwapSuccess({
  sourceCurrency,
  destinationCurrency,
  preview,
  reference,
  onDone,
  onViewReceipt,
}: Props) {
  const credited = formatMoney(
    preview.destinationMoney.amount,
    destinationCurrency,
  );
  const fromLabel = `${formatMoney(
    preview.totalDebit.amount,
    preview.totalDebit.currency,
  )} · ${sourceCurrency} balance`;
  const toLabel = `${credited} · ${destinationCurrency} balance`;

  const handleCopy = async () => {
    if (!reference) return;
    await copyToClipboard(reference);
    toast.success("Reference copied");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(14,11,22,0.45)] p-4 font-monzo">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-success-title"
        className="flex w-full max-w-[480px] flex-col items-center gap-5 rounded-3xl bg-white p-7 shadow-[0px_24px_64px_rgba(13,13,38,0.25)]"
      >
        <div className="flex size-20 items-center justify-center rounded-[40px] bg-[rgba(234,236,255,0.6)]">
          <Image
            src="/images/dashboard/32555-swap-success.svg"
            alt=""
            width={44}
            height={44}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2
            id="swap-success-title"
            className="text-2xl font-bold text-[#19151e]"
          >
            Swap complete
          </h2>
          <p className="text-sm text-[#6b6b80]">
            {credited} has been added to your {destinationCurrency} balance.
          </p>
        </div>

        <div className="w-full">
          {(
            [
              { label: "From", value: fromLabel },
              { label: "To", value: toLabel },
              { label: "Rate", value: preview.rateLabel },
            ] as const
          ).map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 border-b border-[#eeeef3] py-3"
            >
              <span className="text-sm whitespace-nowrap text-[#6b6b80]">
                {row.label}
              </span>
              <div className="min-w-0 flex-1" />
              <span className="text-sm font-semibold whitespace-nowrap text-[#19151e]">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 py-3">
            <span className="text-sm whitespace-nowrap text-[#6b6b80]">
              Reference
            </span>
            <div className="min-w-0 flex-1" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#19151e]">
                {reference || "—"}
              </span>
              {reference ? (
                <button
                  type="button"
                  aria-label="Copy reference"
                  onClick={handleCopy}
                  className="flex size-4 items-center justify-center"
                >
                  <Image
                    src="/images/dashboard/32533-drawer-copy.svg"
                    alt=""
                    width={16}
                    height={16}
                  />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onDone}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0d6494] px-6 text-[15px] font-semibold text-white transition hover:brightness-110"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onViewReceipt}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-6 text-[15px] font-semibold text-[#14141e]"
          >
            View receipt
          </button>
        </div>
      </div>
    </div>
  );
}
