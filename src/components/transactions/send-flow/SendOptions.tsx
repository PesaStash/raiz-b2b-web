"use client";
import { spendableBalances, formatMoney } from "@/lib/globalBalance";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { FetchTodayOutflowApi } from "@/services/user";
import { findWalletByCurrency, formatAmount } from "@/utils/helpers";
import {
  FlowCard,
  FlowChoice,
  FlowCurrency,
  FlowHeader,
  FlowRow,
} from "./Flow";

export type SendMethod = "raizer" | "bank" | "remittance" | "swift" | "crypto" | "china";

export default function SendOptions({
  close,
  onSelect,
}: {
  close: () => void;
  onSelect: (method: SendMethod) => void;
}) {
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const wallet = findWalletByCurrency(user, selectedCurrency.name);
  const tier = user?.business_account?.entity?.wallet_tier;
  const ngn = selectedCurrency.name === "NGN";
  const limit = ngn ? tier?.naira_limit : tier?.dollar_limit;
  const [limits, setLimits] = useState(false);
  const {
    data: used,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["today-outflow", wallet?.wallet_id],
    queryFn: () => FetchTodayOutflowApi(wallet!.wallet_id),
    enabled: !!wallet?.wallet_id,
  });
  const money = (value: number) =>
    `${selectedCurrency.sign}${formatAmount(value)}`;
  const usedAmount = typeof used === "number" ? used : undefined;
  const choices = (
    group: string,
    items: {
      method: SendMethod;
      title: string;
      subtitle: string;
      icon: string;
      badge?: string;
    }[],
  ) => (
    <section>
      <h2 className="text-[#79708d] text-[13px] font-semibold mb-1.5">
        {group}
      </h2>
      <div className="border border-[#eaecf0] rounded-2xl overflow-hidden [&>button+button]:border-t [&>button+button]:border-[#eaecf0]">
        {items.map((item) => (
          <FlowChoice
            key={item.method}
            {...item}
            compact
            icon={`/images/send/${item.icon}.svg`}
            onClick={() => onSelect(item.method)}
          />
        ))}
      </div>
    </section>
  );
  if (limits)
    return (
      <>
        <FlowHeader
          title="Your sending limits"
          subtitle={tier?.wallet_tier_name}
          onBack={() => setLimits(false)}
        />
        <FlowCard>
          <FlowRow label="USD daily limit">
            {tier ? `$${formatAmount(tier.dollar_limit)}` : "Unavailable"}
          </FlowRow>
          <FlowRow label="NGN daily limit">
            {tier ? `₦${formatAmount(tier.naira_limit)}` : "Unavailable"}
          </FlowRow>
          <FlowRow label={`${selectedCurrency.name} used today`}>
            {usedAmount === undefined ? "Unavailable" : money(usedAmount)}
          </FlowRow>
          <FlowRow label="USD monthly limit">
            {tier
              ? `$${formatAmount(tier.monthly_dollar_limit)}`
              : "Unavailable"}
          </FlowRow>
          <FlowRow label="NGN monthly limit">
            {tier
              ? `₦${formatAmount(tier.monthly_naira_limit)}`
              : "Unavailable"}
          </FlowRow>
        </FlowCard>
      </>
    );
  return (
    <>
      <FlowHeader
        compact
        title={ngn ? "Send from your NGN balance" : "Choose your send option"}
        subtitle={
          ngn ? undefined : `Send from your ${selectedCurrency.name} balance`
        }
        onBack={close}
      />
      <FlowCard className="!gap-3.5 !bg-[#fcfcfd] !p-5 md:!p-6">
        <div className="rounded-2xl border border-[#eaecf0] bg-white p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[#79708d] text-[13px] flex items-center gap-1.5">
                <FlowCurrency currency={selectedCurrency.name} size={16} />
                Available to send
              </p>
              <p className="text-[24px] font-semibold mt-0.5">
                {formatMoney(
                  spendableBalances(user?.business_account).find(
                    (balance) => balance.currency === selectedCurrency.name,
                  )?.available_balance,
                  selectedCurrency.name,
                )}
              </p>
            </div>
            {tier && (
              <span className="rounded-full bg-[#f3f1fd] text-primary2 text-xs px-2.5 py-1">
                {tier.wallet_tier_name}
              </span>
            )}
          </div>
          <div className="border-t border-[#eaecf0] pt-3">
            <div className="flex justify-between gap-3 text-sm mb-2">
              <span className="flex items-center gap-1.5">
                <strong>Daily send limit</strong>
                <Image
                  src="/images/send/info.svg"
                  width={16}
                  height={16}
                  alt=""
                />
              </span>
              <button
                type="button"
                className="text-primary2 text-[13px] font-semibold"
                onClick={() => setLimits(true)}
              >
                See all limits
              </button>
            </div>
            <div
              className="h-2 rounded bg-[#eeecf5] overflow-hidden"
              role="progressbar"
              aria-label="Daily send limit used"
              aria-valuemin={0}
              aria-valuemax={limit ?? 0}
              aria-valuenow={usedAmount}
            >
              <div
                className="h-full bg-primary2 rounded"
                style={{
                  width: `${limit && usedAmount !== undefined ? Math.min(100, Math.max(0, (usedAmount / limit) * 100)) : 0}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2 mt-2 text-[13px]">
              {isError ? (
                <button type="button" onClick={() => refetch()}>
                  Couldn’t load usage. Retry
                </button>
              ) : (
                <>
                  <strong>
                    {isLoading || usedAmount === undefined
                      ? "Loading usage…"
                      : `${money(usedAmount)} used today`}
                  </strong>
                  <span className="text-[#79708d]">
                    {limit !== undefined && usedAmount !== undefined
                      ? `${money(Math.max(0, limit - usedAmount))} left of ${money(limit)}`
                      : ""}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {choices("To people", [
          {
            method: "raizer",
            title: "To a Raizer",
            subtitle: "Search by username or email",
            icon: "raizer",
            badge: "Free · Instant",
          },
        ])}
        {choices(
          "To banks",
          ngn
            ? [
                {
                  method: "bank",
                  title: "Bank account",
                  subtitle: "Send to a Nigerian bank",
                  icon: "bank",
                },
              ]
            : [
                {
                  method: "bank",
                  title: "Bank transfer",
                  subtitle: "US, UK or EU banks",
                  icon: "bank",
                },
                {
                  method: "remittance",
                  title: "International remittance",
                  subtitle: "Bank and mobile money payouts",
                  icon: "remittance",
                },
                {
                  method: "swift",
                  title: "SWIFT",
                  subtitle: "Send an international bank transfer",
                  icon: "swift",
                },
              ],
        )}
        {!ngn && choices("Crypto & others", [
            {
              method: "crypto",
              title: "Crypto",
              subtitle: "USDT or USDC to a wallet · minutes",
              icon: "crypto",
            },
            {
              method: "china",
              title: "Alipay & WeChat",
              subtitle: "Pay someone in China from USD",
              icon: "alipay-wechat",
            },
          ])}
        {ngn && choices("Pay abroad", [{
          method: "china",
          title: "Alipay & WeChat",
          subtitle: "Pay someone in China from NGN",
          icon: "alipay-wechat",
        }])}
      </FlowCard>
    </>
  );
}
