"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { formatMoney } from "@/lib/globalBalance";
import {
  generateReceiptPdf,
  shareReceiptPdf,
} from "@/lib/generateReceiptPdf";
import type { TransactionView } from "@/lib/transactionView";
import {
  DesignIcon,
  GlobalDialog,
  primaryButton,
  secondaryButton,
} from "@/app/(dashboard)/_components/global/GlobalUI";
import { copyToClipboard } from "@/utils/helpers";

export default function TransactionReceiptModal({
  view,
  close,
}: {
  view: TransactionView;
  close: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  const run = async (mode: "download" | "share") => {
    if (!receiptRef.current || busy) return;
    setBusy(mode);
    try {
      const filename = `receipt-${view.reference}.pdf`;
      if (mode === "share") await shareReceiptPdf(receiptRef.current, filename);
      else await generateReceiptPdf(receiptRef.current, filename);
    } catch (error) {
      console.error("Error generating receipt:", error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <GlobalDialog title="Transaction receipt" close={close} compact>
      <div className="flex flex-col">
        <div
          ref={receiptRef}
          className="relative overflow-hidden rounded-2xl border border-raiz-gray-100 bg-white"
        >
          <div className="flex flex-col items-center px-5 pb-4 pt-8">
            <Image
              src="/icons/logoWText.svg"
              alt="Raiz"
              width={48}
              height={48}
              className="mb-3"
            />
            <p className="text-xs text-raiz-gray-500">{view.receiptHeadline}</p>
            <p className="mt-1 text-2xl font-bold text-raiz-gray-950">
              {formatMoney(
                view.walletMoney?.amount ?? view.primaryAmount.amount,
                view.walletMoney?.currency ?? view.primaryAmount.currency,
              )}
            </p>
          </div>
          <div className="space-y-3 border-t border-dashed border-raiz-gray-200 px-5 py-4">
            {view.receiptRows.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-raiz-gray-500">{row.label}</span>
                <span className="flex items-center gap-1 text-right font-semibold text-raiz-gray-950">
                  <span
                    className={
                      row.tone === "success"
                        ? "text-[#1f9d55]"
                        : row.tone === "warning"
                          ? "text-[#B45309]"
                          : row.tone === "danger"
                            ? "text-[#DC180D]"
                            : row.tone === "refunded"
                              ? "text-[#6B4EFF]"
                              : undefined
                    }
                  >
                    {row.value}
                  </span>
                  {row.copyValue && (
                    <button
                      type="button"
                      aria-label={`Copy ${row.label}`}
                      onClick={() => copyToClipboard(row.copyValue!)}
                      className="shrink-0"
                    >
                      <DesignIcon name="32533-drawer-copy.svg" />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 bg-raiz-usd-primary px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded bg-white p-0.5">
              <QRCode
                value="https://raizapp.onelink.me/RiOx/webdirect"
                size={40}
              />
            </div>
            <p className="text-sm font-bold text-white">
              Download the <span className="text-amber-300">Raiz App</span> using
              the QR Code
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void run("download")}
            className={secondaryButton}
          >
            {busy === "download" ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void run("share")}
            className={primaryButton}
          >
            {busy === "share" ? "Preparing…" : "Share receipt"}
          </button>
        </div>
      </div>
    </GlobalDialog>
  );
}
