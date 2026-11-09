"use client";

import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/globalBalance";
import type { TransactionView } from "@/lib/transactionView";
import { CurrencyFlag } from "@/app/(dashboard)/_components/global/GlobalUI";

function amountClass(view: TransactionView): string {
  if (view.amountTone === "credit") return "text-[#1f9d55]";
  if (view.amountTone === "refund") return "text-[#6B4EFF]";
  return "text-raiz-gray-950";
}

function statusTone(
  view: TransactionView,
): "success" | "warning" | "danger" | "neutral" | "refunded" {
  return view.statusTone;
}

export function TransactionRowDesktop({
  view,
  selected,
  onSelect,
}: {
  view: TransactionView;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      className={`h-16 cursor-pointer border-b border-[#f4f4f8] last:border-0 ${
        selected ? "bg-[#f8f7ff]" : "hover:bg-[#fcfcfd]"
      }`}
    >
      <td className="pl-5">
        <div className="flex items-center gap-2.5">
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
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-[17px] text-[#19151e]">
              {view.title}
            </span>
            <span className="mt-0.5 block truncate text-xs leading-[14px] text-[#6b6b80]">
              {view.subtitle}
            </span>
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap">
        <p className={`text-sm font-semibold leading-[17px] ${amountClass(view)}`}>
          {view.primarySign}
          {formatMoney(view.primaryAmount.amount, view.primaryAmount.currency)}
        </p>
        {view.secondaryLine && (
          <p className="mt-0.5 text-xs leading-[14px] text-[#6b6b80]">
            {view.secondaryLine}
          </p>
        )}
      </td>
      <td className="hidden whitespace-nowrap lg:table-cell">
        <div className="flex items-center gap-2">
          {view.railCurrency && (
            <CurrencyFlag currency={view.railCurrency} mini />
          )}
          <span className="text-[13px] text-[#2c2435]">{view.railLabel}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {view.category ? (
          <span className="inline-flex h-6 items-center rounded-full bg-[#f4f4f8] px-2.5 text-xs text-[#6b6b80]">
            {view.category}
          </span>
        ) : (
          <span className="text-xs text-raiz-gray-400">—</span>
        )}
      </td>
      <td className="hidden whitespace-nowrap sm:table-cell">
        <p className="text-xs text-[#6b6b80]">{view.absoluteDateLabel}</p>
      </td>
      <td>
        <StatusBadge
          label={view.statusLabel}
          tone={statusTone(view)}
        />
      </td>
    </tr>
  );
}

export function TransactionRowMobile({
  view,
  selected,
  onSelect,
}: {
  view: TransactionView;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left ${
        selected
          ? "border-primary/30 bg-[#f3f1fd]"
          : "border-raiz-gray-100 bg-white"
      }`}
    >
      <span className="relative shrink-0">
        <Avatar name={view.avatarName} src={view.avatarSrc} size={40} />
        {view.flagCurrency && (
          <span className="absolute -bottom-0.5 -right-0.5">
            <CurrencyFlag currency={view.flagCurrency} mini />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-raiz-gray-950">
              {view.title}
            </span>
            <span className="mt-0.5 block truncate text-xs text-raiz-gray-500">
              {view.subtitle}
            </span>
          </span>
          <span className={`shrink-0 text-sm font-semibold ${amountClass(view)}`}>
            {view.primarySign}
            {formatMoney(view.primaryAmount.amount, view.primaryAmount.currency)}
          </span>
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge
            label={view.statusLabel}
            tone={statusTone(view)}
          />
          <span className="text-xs text-raiz-gray-500">{view.absoluteDateLabel}</span>
        </span>
      </span>
    </button>
  );
}
