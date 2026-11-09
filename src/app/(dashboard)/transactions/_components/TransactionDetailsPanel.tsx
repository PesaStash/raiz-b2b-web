"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { formatMoney } from "@/lib/globalBalance";
import {
  heroStatusLabel,
  type TransactionView,
} from "@/lib/transactionView";
import { copyToClipboard } from "@/utils/helpers";
import {
  CurrencyFlag,
  DesignIcon,
  GlobalDialog,
  primaryButton,
  secondaryButton,
  asset,
} from "@/app/(dashboard)/_components/global/GlobalUI";
import TransactionReceiptModal from "./TransactionReceiptModal";

function statusIcon(view: TransactionView) {
  if (view.kind === "refund" || view.statusTone === "refunded") {
    return {
      bg: "bg-[#f0e9ff]",
      icon: "32533-drawer-close-circle.svg",
    };
  }
  if (view.isPendingGroup || view.statusTone === "warning") {
    return {
      bg: "bg-[#fff3e6]",
      icon: "32533-drawer-clock.svg",
    };
  }
  if (view.statusTone === "danger") {
    return {
      bg: "bg-[#ffe6e6]",
      icon: "32533-drawer-close-circle.svg",
    };
  }
  return {
    bg: "bg-[#e8f6ee]",
    icon: "32533-drawer-tick-circle.svg",
  };
}

function amountClass(view: TransactionView) {
  if (view.amountTone === "credit" || view.amountTone === "refund") {
    return view.amountTone === "refund" ? "text-[#6B4EFF]" : "text-[#1f9d55]";
  }
  return "text-raiz-gray-950";
}

export default function TransactionDetailsPanel({
  view,
  close,
  onSeeHistory,
  onPrimaryAction,
  onSupport,
}: {
  view: TransactionView;
  close: () => void;
  onSeeHistory?: (name: string) => void;
  onPrimaryAction?: (view: TransactionView) => void;
  onSupport?: () => void;
}) {
  const [showReceipt, setShowReceipt] = useState(false);
  const icon = statusIcon(view);

  return (
    <>
      <GlobalDialog
        title="Transaction details"
        close={close}
        drawer
        variant="purple"
        onBack={close}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="relative overflow-hidden rounded-[20px] bg-white px-6 pb-6 pt-7 text-raiz-gray-950">
            <div className="flex flex-col items-center gap-2 pb-1 text-center">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ${icon.bg}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(icon.icon)}
                  alt=""
                  width={30}
                  height={30}
                  className="shrink-0"
                />
              </span>
              <p className="text-sm text-[#6b6b80]">{heroStatusLabel(view)}</p>
              <p className={`text-[32px] font-bold leading-none ${amountClass(view)}`}>
                {view.primarySign}
                {formatMoney(
                  view.primaryAmount.amount,
                  view.primaryAmount.currency,
                )}
              </p>
              {view.counterpartyLine && (
                <p className="text-[15px] font-semibold text-[#19151e]">
                  {view.counterpartyLine}
                </p>
              )}
              {view.accountLine && (
                <p className="text-[13px] text-[#6b6b80]">{view.accountLine}</p>
              )}
            </div>

            <div className="relative my-5">
              <span className="absolute -left-8 top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#3c2875]" />
              <span className="absolute -right-8 top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#3c2875]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("32533-drawer-divider.svg")}
                alt=""
                className="h-px w-full"
              />
            </div>

            <dl className="space-y-4">
              {view.detailRows.map((row) => (
                <div
                  key={`${row.label}-${row.value}`}
                  className="flex items-center gap-3 text-[13px]"
                >
                  <dt className="shrink-0 text-[#6b6b80]">{row.label}</dt>
                  <dd className="h-px flex-1 bg-transparent" />
                  <dd className="flex max-w-[60%] items-center justify-end gap-1.5 text-right font-semibold text-[#19151e]">
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
                      >
                        <DesignIcon name="32533-drawer-copy.svg" />
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {view.counterpartyLine && (
            <button
              type="button"
              onClick={() => onSeeHistory?.(view.counterpartyLine!)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-raiz-gray-950"
            >
              <span className="relative shrink-0">
                <Avatar
                  name={view.avatarName}
                  src={view.avatarSrc}
                  size={40}
                  className="!bg-[#f3f1fd] !text-[#3c2875]"
                />
                {view.flagCurrency && (
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <CurrencyFlag currency={view.flagCurrency} mini />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {view.counterpartyLine}
                </span>
                <span className="block text-xs text-[#6b6b80]">
                  See payment history
                </span>
              </span>
              <DesignIcon name="32258-15724-imgVuesaxLinearArrowRight.svg" />
            </button>
          )}

          <a
            href="mailto:support@raiz.app"
            onClick={onSupport}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-raiz-gray-950"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fcebf1] text-lg font-bold text-[#d6457a]">
              ?
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                Trouble with this payment?
              </span>
              <span className="block text-xs text-[#6b6b80]">
                Contact the support team
              </span>
            </span>
            <DesignIcon name="32258-15724-imgVuesaxLinearArrowRight.svg" />
          </a>

          <div className="mt-auto flex flex-col gap-3 pt-4">
            {view.primaryActionLabel && (
              <button
                type="button"
                onClick={() => onPrimaryAction?.(view)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-white bg-[#3c2875] px-5 py-3 text-[15px] font-semibold text-white"
              >
                {view.primaryActionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className={secondaryButton}
            >
              Share receipt
            </button>
            {view.proofUrl && (
              <a
                href={view.proofUrl}
                target="_blank"
                rel="noreferrer"
                className={`${primaryButton} bg-raiz-usd-primary text-white`}
              >
                View payment proof
              </a>
            )}
          </div>
        </div>
      </GlobalDialog>
      {showReceipt && (
        <TransactionReceiptModal
          view={view}
          close={() => setShowReceipt(false)}
        />
      )}
    </>
  );
}
