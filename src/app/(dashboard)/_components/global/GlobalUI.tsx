"use client";
/* eslint-disable @next/next/no-img-element -- Figma SVGs retain their intrinsic geometry. */
import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export const asset = (name: string) => `/images/dashboard/${name}`;
export function DesignIcon({ name }: { name: string }) {
  return <img src={asset(name)} alt="" className="shrink-0" />;
}
const flags: Record<string, string> = {
  USD: "32310-11118-imgImage11.png",
  NGN: "32310-11118-imgImage10.png",
  EUR: "32310-11118-imgImage13.png",
  GBP: "32310-11118-imgImage12.png",
};
export function CurrencyFlag({
  currency,
  large = false,
  small = false,
  compact = false,
  hero = false,
  badge = false,
  mini = false,
}: {
  currency: string;
  large?: boolean;
  small?: boolean;
  compact?: boolean;
  hero?: boolean;
  badge?: boolean;
  mini?: boolean;
}) {
  if ((badge || mini) && flags[currency])
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[#e4e0ea] bg-[#fcfcfd] ${badge ? "h-11 w-11 border-[0.611px]" : "h-[18px] w-[18px] border-[0.25px]"}`}
      >
        <img
          src={asset(flags[currency])}
          alt=""
          className={`max-w-none object-cover ${badge ? "h-[39.111px] w-[39.111px]" : "h-5 w-5"}`}
        />
      </span>
    );
  const dimensions = hero
    ? "h-16 w-16"
    : large
      ? "h-12 w-12"
      : small
        ? "h-[22px] w-[22px]"
        : compact
          ? "h-5 w-5"
          : "h-8 w-8";
  if (currency === "SBC")
    return (
      <span
        className={`relative inline-block shrink-0 ${hero ? "h-[60px] w-[60px]" : large ? "h-12 w-12" : "h-8 w-8"}`}
      >
        {["USDT", "USDC"].map((coin, index) => (
          <span
            key={coin}
            className={`absolute flex items-center justify-center rounded-full ${hero ? "h-[43.2px] w-[43.2px]" : large ? "h-10 w-10" : "h-6 w-6"} ${index ? "bottom-0 right-0 bg-[#2775ca]" : "left-0 top-0 bg-[#26a17b]"}`}
          >
            <DesignIcon
              name={
                hero
                  ? `32269-stablecoin-modal-${index ? "usdc" : "usdt"}.svg`
                  : `${large ? "32280-13319" : "32258-15724"}-imgVuesaxBold${index ? "UsdCoinUsdc" : "TetherUsdt"}.svg`
              }
            />
          </span>
        ))}
      </span>
    );
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${dimensions} ${hero ? "border-[0.889px] border-[#e4e0ea] bg-[#fcfcfd]" : currency === "USDT" ? "bg-[#26a17b]" : currency === "USDC" ? "bg-[#2775ca]" : "bg-white"}`}
    >
      {flags[currency] ? (
        <img
          src={asset(flags[currency])}
          alt=""
          className={`object-cover ${hero ? "h-[56.889px] w-[56.889px]" : dimensions}`}
        />
      ) : (
        <DesignIcon
          name={`${small ? "32310-11118" : "32258-15724"}-imgVuesaxBold${currency === "USDT" ? "TetherUsdt" : "UsdCoinUsdc"}.svg`}
        />
      )}
    </span>
  );
}
export const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-raiz-usd-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e8e5ef] px-5 py-3 text-sm font-semibold text-raiz-gray-950 hover:bg-raiz-gray-200 disabled:opacity-50";

export function GlobalDialog({
  title,
  close,
  onBack,
  drawer = false,
  compact = false,
  hero = false,
  children,
}: {
  title: string;
  close: () => void;
  onBack?: () => void;
  drawer?: boolean;
  compact?: boolean;
  hero?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab") return;
      const elements = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [close, title]);
  return createPortal(
    <div
      className={`fixed inset-0 z-[110] flex ${hero ? "bg-[rgba(25,21,30,0.45)]" : "bg-black/50"} ${drawer ? "justify-end" : "items-center justify-center p-4"}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex w-full flex-col overflow-y-auto font-monzo text-raiz-gray-950 outline-none ${drawer ? `h-dvh max-w-[480px] bg-[#fbfaff] p-5 sm:p-7 ${onBack ? "sm:pt-4 sm:pb-6 shadow-[-12px_0_40px_rgba(26,20,51,0.18)]" : ""}` : hero ? "max-h-[90dvh] max-w-[480px] overflow-hidden rounded-3xl bg-white drop-shadow-[0px_24px_32px_rgba(13,13,38,0.25)]" : compact ? "max-h-[90dvh] max-w-[440px] rounded-3xl bg-white p-6 shadow-[0px_24px_64px_0px_rgba(13,13,38,0.25)]" : "max-h-[90dvh] max-w-[480px] rounded-3xl bg-white p-6 sm:p-7"}`}
      >
        {hero ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <header
            className={`flex shrink-0 items-center ${compact ? "mb-4" : onBack ? "mb-6 gap-3" : "mb-8 gap-3"}`}
          >
            {drawer && (
              <button
                aria-label={onBack ? "Back" : "Close account details"}
                onClick={onBack ?? close}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-raiz-gray-100"
              >
                <DesignIcon name="32273-13049-imgVuesaxLinearArrowLeft.svg" />
              </button>
            )}
            <h2
              id={titleId}
              className={`flex-1 font-semibold ${drawer ? "text-center text-base" : compact ? "text-xl leading-normal text-[#19151e]" : "text-xl"}`}
            >
              {title}
            </h2>
            {compact ? (
              <button
                aria-label="Close"
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] bg-[#f4f4f8]"
              >
                <DesignIcon name="32284-13677-imgVuesaxLinearCloseCircle.svg" />
              </button>
            ) : (
              <button
                aria-label="Close"
                onClick={close}
                className="h-9 w-9 rounded-full bg-raiz-gray-100 text-xl text-raiz-gray-600"
              >
                ×
              </button>
            )}
          </header>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
