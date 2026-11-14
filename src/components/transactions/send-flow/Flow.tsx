"use client";

import Image from "next/image";
import { formatTypedAmount } from "@/utils/formatTypedAmount";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";

export const SendFlowContext = createContext(false);
export const useSendFlow = () => useContext(SendFlowContext);

export function FlowHeader({
  title,
  subtitle,
  onBack,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Slightly tighter type and spacing for the send-options chooser only. */
  compact?: boolean;
}) {
  return (
    <header
      className={`flex flex-col ${
        compact
          ? "gap-3 mb-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:leading-[1.35] [&>p]:text-[#79708d] [&>p]:text-[13px] [&>p]:-mt-1.5"
          : "gap-5 mb-5 [@media(max-height:800px)]:gap-3 max-md:gap-3 [@media(max-height:800px)]:mb-3 max-md:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-[1.4] [&>p]:text-[#79708d] [&>p]:text-sm [&>p]:-mt-3"
      }`}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[#79708d] text-[13px] text-left self-start"
      >
        <Image src="/images/send/back.svg" width={22} height={22} alt="" />
        Send money
      </button>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

export function FlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 bg-white border border-[#eaecf0] rounded-[20px] p-5 md:p-7 [@media(max-height:800px)]:p-5 max-md:p-5 [@media(max-height:800px)]:gap-2 max-md:gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function FlowRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:gap-6 border-b border-[#eaecf0] py-3 min-h-[45px] [@media(max-height:800px)]:py-2 max-md:py-2 [@media(max-height:800px)]:min-h-[36px] max-md:min-h-[36px] text-[13px] [&>span]:text-[#79708d] [&>span]:max-w-[45%] [&>strong]:text-sm [&>strong]:font-semibold [&>strong]:text-right [&>strong]:break-words">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export function FlowActions({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  tone = "blue",
  disabled,
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  tone?: "blue" | "purple";
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex gap-3 [&>button]:flex-1 [&>button]:!rounded-xl [&>button]:min-h-12 [&>button]:font-semibold">
      {onBack && (
        <Button variant="tertiary" onClick={onBack}>
          {backLabel}
        </Button>
      )}
      <Button
        className={
          tone === "purple"
            ? "enabled:!bg-primary2 enabled:hover:!bg-primary2/90"
            : "enabled:!bg-[#0d6494] enabled:hover:!bg-[#0b567f]"
        }
        onClick={onNext}
        disabled={disabled}
        loading={loading}
      >
        {nextLabel}
      </Button>
    </div>
  );
}

export function FlowChoice({
  title,
  subtitle,
  icon,
  onClick,
  badge,
  iconSize = 44,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  iconSize?: number;
  onClick: () => void;
  badge?: string;
  /** Slightly tighter row for the send-options chooser only. */
  compact?: boolean;
}) {
  const size = compact ? Math.min(iconSize, 36) : iconSize;
  return (
    <button
      type="button"
      className={`flex items-center gap-3 w-full text-left rounded-xl hover:bg-[#f8f7fa] focus-visible:outline-primary2 [&_strong]:text-sm [&_strong]:font-semibold [&>img]:shrink-0 ${
        compact
          ? "px-3 py-2.5 min-h-[60px]"
          : "px-3.5 py-3 min-h-[68px] [@media(max-height:800px)]:py-2 max-md:py-2 [@media(max-height:800px)]:min-h-[60px] max-md:min-h-[60px]"
      }`}
      onClick={onClick}
    >
      {icon && <Image src={icon} alt="" width={size} height={size} />}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <strong>{title}</strong>
          {badge && (
            <small className="bg-[#e8f6ee] text-[#1f9d55] px-2 py-0.5 rounded-full text-[11px]">
              {badge}
            </small>
          )}
        </span>
        {subtitle && (
          <span
            className={`text-[#79708d] block text-xs ${compact ? "mt-0.5" : "mt-1"}`}
          >
            {subtitle}
          </span>
        )}
      </span>
      <Image
        src="/images/send/chevron.svg"
        alt=""
        width={18}
        height={18}
        className="rotate-180"
      />
    </button>
  );
}

export function FlowRecipient({
  name,
  detail,
  image,
  onChange,
  countryBadge,
}: {
  name: string;
  detail?: string;
  image?: string;
  countryBadge?: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border border-[#eaecf0] rounded-2xl [&_strong]:text-sm [&_strong]:font-semibold [&>button]:text-primary2 [&>button]:text-sm [&>button]:font-semibold">
      <span className="relative shrink-0">
        <Avatar
          className="!bg-[#f3f1fd] !text-primary2 shrink-0"
          name={name}
          src={image || ""}
          size={44}
        />
        {countryBadge && (
          <span className="absolute -bottom-1 -right-1">
            <FlowCurrency currency={countryBadge} />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <strong>{name}</strong>
        <p className="text-[#79708d] text-xs mt-1 break-words">{detail}</p>
      </div>
      <button type="button" onClick={onChange}>
        Change
      </button>
    </div>
  );
}

export function FlowCurrency({
  currency,
  size = 24,
}: {
  currency: string;
  size?: number;
}) {
  if (currency === "USDT" || currency === "USDC")
    return (
      <Image
        className="rounded-full object-contain"
        src={currency === "USDT" ? "/images/send/usdt.svg" : "/icons/usdc.svg"}
        width={size}
        height={size}
        alt={currency}
      />
    );
  if (currency === "CNY" || currency === "NGN")
    return (
      <span className="inline-flex shrink-0 items-center justify-center">
        <Image
          src={
            currency === "CNY"
              ? "/images/send/cny-18.svg"
              : "/images/send/ngn-36.svg"
          }
          width={currency === "CNY" ? 24 : 36}
          height={currency === "CNY" ? 24 : 36}
          alt={currency}
        />
      </span>
    );
  return ["USD", "GBP", "EUR"].includes(currency) ? (
    <Image
      className="rounded-full object-cover"
      src={`/images/send/${currency.toLowerCase()}.png`}
      width={size}
      height={size}
      alt={currency}
    />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[#f3f1fd] text-primary2 shrink-0"
      style={{ width: size, height: size }}
    >
      {getCurrencySymbol(currency)}
    </span>
  );
}

export function FlowAmount({
  currency,
  amount,
  onChange,
  recipient,
  decimals = 2,
}: {
  currency: string;
  amount: string;
  onChange: (value: string) => void;
  recipient: string;
  decimals?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const formattedAmount = formatTypedAmount(amount);
  useLayoutEffect(() => {
    if (caret.current === null || !inputRef.current) return;
    const position = caret.current;
    inputRef.current.setSelectionRange(position, position);
    caret.current = null;
  }, [formattedAmount]);
  return (
    <label className="flex flex-col gap-3 px-5 py-[18px] [@media(max-height:800px)]:py-3 max-md:py-3 [@media(max-height:800px)]:gap-2 max-md:gap-2 border-[1.5px] border-primary2 rounded-2xl [&_input]:min-w-0 [&_input]:w-full [&_input]:bg-transparent [&_input]:text-[28px] md:[&_input]:text-4xl [&_input]:font-semibold [&_input]:text-right [&_input]:outline-none">
      <span className="text-[#79708d] text-[13px]">Recipient gets</span>
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full bg-[#f4f4f8] py-1.5 pl-2 pr-3.5 text-sm font-semibold">
          <FlowCurrency currency={currency} />
          {currency}
        </span>
        <input
          ref={inputRef}
          aria-label="Recipient gets"
          autoFocus
          inputMode="decimal"
          placeholder="0.00"
          value={formattedAmount}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, "");
            if (!new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`).test(value))
              return;
            const rawBeforeCaret = e.target.value
              .slice(0, e.target.selectionStart ?? e.target.value.length)
              .replace(/,/g, "").length;
            const formatted = formatTypedAmount(value);
            let digits = 0;
            let position = 0;
            while (position < formatted.length && digits < rawBeforeCaret) {
              if (formatted[position] !== ",") digits++;
              position++;
            }
            caret.current = position;
            onChange(value);
          }}
        />
      </span>
      <span className="text-[#79708d] text-xs">
        Type the exact amount {recipient.split(" ")[0] || "your recipient"}{" "}
        should receive
      </span>
    </label>
  );
}

export function FlowTotal({
  currency,
  total,
  balance,
}: {
  currency: string;
  total?: number;
  balance: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 border border-[#eaecf0] rounded-2xl">
      <FlowCurrency currency={currency} size={32} />
      <div className="flex-1">
        <p className="text-[#79708d] text-[13px]">Total {currency} deducted</p>
        <p className="text-xs">
          <strong>
            {getCurrencySymbol(currency)}
            {formatAmount(balance)}
          </strong>
          <span className="text-[#79708d]"> available</span>
        </p>
      </div>
      <strong className="text-2xl">
        {total === undefined
          ? "—"
          : `${getCurrencySymbol(currency)}${formatAmount(total)}`}
      </strong>
    </div>
  );
}
