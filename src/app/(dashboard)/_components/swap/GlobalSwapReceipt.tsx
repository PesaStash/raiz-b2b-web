"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { formatMoney } from "@/lib/globalBalance";
import {
  generateReceiptPdf,
  shareReceiptPdf,
} from "@/lib/generateReceiptPdf";
import type { SwapPairCurrency, SwapPreview } from "@/types/swap";
import {
  GlobalDialog,
  primaryButton,
  secondaryButton,
} from "@/app/(dashboard)/_components/global/GlobalUI";

interface Props {
  sourceCurrency: SwapPairCurrency;
  destinationCurrency: SwapPairCurrency;
  preview: SwapPreview;
  reference: string;
  close: () => void;
}

export default function GlobalSwapReceipt({
  sourceCurrency,
  destinationCurrency,
  preview,
  reference,
  close,
}: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  const run = async (mode: "download" | "share") => {
    if (!receiptRef.current || busy) return;
    setBusy(mode);
    try {
      const filename = `swap-receipt-${reference || "raiz"}.pdf`;
      if (mode === "share") await shareReceiptPdf(receiptRef.current, filename);
      else await generateReceiptPdf(receiptRef.current, filename);
    } catch (error) {
      console.error("Error generating swap receipt:", error);
    } finally {
      setBusy(null);
    }
  };

  const rows = [
    {
      label: "From",
      value: `${formatMoney(preview.totalDebit.amount, preview.totalDebit.currency)} · ${sourceCurrency}`,
    },
    {
      label: "To",
      value: `${formatMoney(preview.destinationMoney.amount, destinationCurrency)} · ${destinationCurrency}`,
    },
    { label: "Rate", value: preview.rateLabel },
    { label: "Reference", value: reference || "—" },
  ];

  return (
    <GlobalDialog title="Swap receipt" close={close} compact>
      <div className="flex flex-col gap-4 font-monzo">
        <div
          ref={receiptRef}
          className="relative overflow-hidden rounded-2xl border border-[#eeeef3] bg-white p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <Image
              src="/icons/logoWText.svg"
              alt="Raiz"
              width={88}
              height={28}
            />
            <span className="text-xs font-semibold text-[#1f9d55]">
              Completed
            </span>
          </div>
          <p className="text-sm text-[#6b6b80]">Swap</p>
          <p className="mt-1 text-2xl font-bold text-[#19151e]">
            {formatMoney(
              preview.destinationMoney.amount,
              destinationCurrency,
            )}
          </p>
          <p className="mt-1 text-sm text-[#6b6b80]">
            Added to {destinationCurrency} balance
          </p>
          <div className="mt-6 space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-3 text-sm">
                <span className="text-[#6b6b80]">{row.label}</span>
                <span className="text-right font-semibold text-[#19151e]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <QRCode value="https://raizapp.onelink.me/RiOx/webdirect" size={72} />
          </div>
        </div>
        <button
          type="button"
          className={primaryButton}
          disabled={busy === "download"}
          onClick={() => run("download")}
        >
          {busy === "download" ? "Preparing…" : "Download PDF"}
        </button>
        <button
          type="button"
          className={secondaryButton}
          disabled={busy === "share"}
          onClick={() => run("share")}
        >
          {busy === "share" ? "Preparing…" : "Share receipt"}
        </button>
      </div>
    </GlobalDialog>
  );
}
