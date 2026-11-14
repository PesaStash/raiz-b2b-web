"use client";

import { formatMoney, isGlobalBalance, spendableBalances } from "@/lib/globalBalance";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { ICurrencyName } from "@/types/misc";
import { CurrencyFlag } from "@/app/(dashboard)/_components/global/GlobalUI";

const FLAG_ORDER = ["GBP", "EUR", "USD", "USDT", "USDC"] as const;

export default function BalanceTabs() {
  const { user } = useUser();
  const account = user?.business_account;
  const global = isGlobalBalance(account);
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const balances = spendableBalances(account);
  const wallets = account?.wallets ?? [];

  if (global) {
    const usd = balances.find((b) => b.currency === "USD");
    const ngn = balances.find((b) => b.currency === "NGN");
    const active = selectedCurrency.name === "NGN" ? "NGN" : "USD";
    const receiveAssets = (
      usd?.supported_receive_assets?.length
        ? usd.supported_receive_assets
        : FLAG_ORDER
    ).filter((asset, index, list) => list.indexOf(asset) === index);

    return (
      <section className="flex min-h-[97px] w-full items-center gap-4 overflow-hidden rounded-[20px] bg-[#fcfcfd] p-4 pr-6">
        <div className="flex min-w-0 items-start gap-1 overflow-x-auto rounded-2xl bg-[#f4f4f8] p-1 no-scrollbar">
          {usd && (
            <button
              type="button"
              onClick={() => setSelectedCurrency("USD", user)}
              className={`flex h-[57px] min-w-[183px] shrink-0 items-center gap-3 rounded-xl py-2.5 pl-3.5 pr-5 text-left transition ${
                active === "USD"
                  ? "bg-white shadow-[0px_2px_8px_rgba(26,20,51,0.08)]"
                  : "text-[#6b6b80] hover:bg-white/50"
              }`}
            >
              <CurrencyFlag currency="USD" />
              <span className="whitespace-nowrap">
                <span
                  className={`block text-xs font-semibold ${
                    active === "USD" ? "text-[#0d6494]" : "text-[#6b6b80]"
                  }`}
                >
                  USD balance
                </span>
                <span
                  className={`mt-0.5 block text-lg font-bold ${
                    active === "USD" ? "text-[#19151e]" : "text-[#6b6b80]"
                  }`}
                >
                  {formatMoney(usd.available_balance, "USD")}
                </span>
              </span>
            </button>
          )}
          {ngn && (
            <button
              type="button"
              onClick={() => setSelectedCurrency("NGN", user)}
              className={`flex h-[57px] min-w-[191px] shrink-0 items-center gap-3 rounded-xl py-2.5 pl-3.5 pr-5 text-left transition ${
                active === "NGN"
                  ? "bg-white shadow-[0px_2px_8px_rgba(26,20,51,0.08)]"
                  : "text-[#6b6b80] hover:bg-white/50"
              }`}
            >
              <CurrencyFlag currency="NGN" />
              <span className="whitespace-nowrap">
                <span
                  className={`block text-xs font-semibold ${
                    active === "NGN" ? "text-primary" : "text-[#6b6b80]"
                  }`}
                >
                  NGN balance
                </span>
                <span
                  className={`mt-0.5 block text-lg font-bold ${
                    active === "NGN" ? "text-[#19151e]" : "text-[#6b6b80]"
                  }`}
                >
                  {formatMoney(ngn.available_balance, "NGN")}
                </span>
              </span>
            </button>
          )}
        </div>
        <div className="hidden min-w-[180px] flex-1 items-center justify-end gap-2.5 lg:flex">
          {active === "USD" ? (
            <>
              <p className="whitespace-nowrap text-[13px] text-[#6b6b80]">
                Settles into USD
              </p>
              <div className="flex isolate items-center -space-x-1.5">
                {receiveAssets.map((asset) => (
                  <span
                    key={asset}
                    className="rounded-full shadow-[0_0_0_2px_white]"
                  >
                    <CurrencyFlag currency={asset} small />
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="whitespace-nowrap text-[13px] text-[#6b6b80]">
              Local transfers, bills and Alipay.
            </p>
          )}
        </div>
      </section>
    );
  }

  const tabs = wallets
    .map((wallet) => {
      const name = wallet.wallet_type.currency as ICurrencyName;
      if (!(name in ACCOUNT_CURRENCIES)) return null;
      return {
        id: wallet.wallet_id,
        name,
        balance: String(wallet.account_balance),
      };
    })
    .filter(Boolean) as { id: string; name: ICurrencyName; balance: string }[];

  return (
    <section className="flex min-h-[97px] w-full items-center overflow-hidden rounded-[20px] bg-[#fcfcfd] p-4">
      <div className="flex max-w-full items-start gap-1 overflow-x-auto rounded-2xl bg-[#f4f4f8] p-1 no-scrollbar">
        {tabs.map((tab) => {
          const active = selectedCurrency.name === tab.name;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCurrency(tab.name, user)}
              className={`flex h-[57px] min-w-[183px] shrink-0 items-center gap-3 rounded-xl py-2.5 pl-3.5 pr-5 text-left transition ${
                active
                  ? "bg-white shadow-[0px_2px_8px_rgba(26,20,51,0.08)]"
                  : "text-[#6b6b80] hover:bg-white/50"
              }`}
            >
              <CurrencyFlag currency={tab.name} />
              <span className="whitespace-nowrap">
                <span
                  className={`block text-xs font-semibold ${
                    active ? "text-primary" : "text-[#6b6b80]"
                  }`}
                >
                  {tab.name} balance
                </span>
                <span
                  className={`mt-0.5 block text-lg font-bold ${
                    active ? "text-[#19151e]" : "text-[#6b6b80]"
                  }`}
                >
                  {formatMoney(
                    tab.balance,
                    tab.name === "SBC" ? "USD" : tab.name,
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
