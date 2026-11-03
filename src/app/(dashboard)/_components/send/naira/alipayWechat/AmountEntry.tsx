"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlipayWechatAmountQuoteApi } from "@/services/transactions";
import { IAlipayWechatAmountQuoteResponse } from "@/types/services";
import Button from "@/components/ui/Button";

interface Props {
  channel: "alipay" | "wechat";
  rate: string;
  onConfirm: (amount: string, quote: IAlipayWechatAmountQuoteResponse) => void;
  onBack: () => void;
}

const channelLabel: Record<"alipay" | "wechat", string> = {
  alipay: "Alipay",
  wechat: "WeChat Pay",
};

const AmountEntry = ({ channel, rate, onConfirm, onBack }: Props) => {
  const [amount, setAmount] = useState<string>("");
  const [quote, setQuote] = useState<IAlipayWechatAmountQuoteResponse | null>(
    null
  );
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQuote = useCallback(
    async (val: string) => {
      const numeric = parseFloat(val);
      if (!val || isNaN(numeric) || numeric <= 0) {
        setQuote(null);
        setQuoteError("");
        return;
      }
      setQuoteLoading(true);
      setQuoteError("");
      try {
        const result = await AlipayWechatAmountQuoteApi({
          payload: { channel, amount: numeric },
        });
        setQuote(result);
      } catch {
        setQuoteError("Could not get quote. Please try again.");
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    },
    [channel]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQuote(amount);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, fetchQuote]);

  const handleContinue = () => {
    if (quote) {
      onConfirm(amount, quote);
    }
  };

  const canContinue =
    !!quote && !quoteLoading && !!amount && parseFloat(amount) > 0;

  return (
    <div className="p-0 md:p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
      <button onClick={onBack} className="mb-6 self-start">
        <Image src="/icons/arrow-left.svg" width={18} height={18} alt="back" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Image
          src={`/icons/${channel}.svg`}
          width={20}
          height={20}
          alt={channelLabel[channel]}
        />
        <span className="text-raiz-gray-500 text-sm font-medium">
          {channelLabel[channel]}
        </span>
      </div>

      <h3 className="text-raiz-gray-950 text-base font-bold leading-tight mb-6">
        Enter amount
      </h3>

      <div className="mb-3">
        <label className="text-raiz-gray-500 text-xs mb-1.5 block">
          Destination amount (CNY)
        </label>
        <div className="flex items-center border border-raiz-gray-200 rounded-2xl px-4 py-3 bg-white focus-within:border-raiz-purple-500 transition-colors">
          <span className="text-raiz-gray-400 text-sm mr-2">¥</span>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 text-raiz-gray-950 text-sm font-medium outline-none bg-transparent placeholder:text-raiz-gray-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-raiz-gray-400 text-xs">Rate:</span>
        <span className="text-raiz-gray-700 text-xs font-medium">
          ¥1 = ₦{parseFloat(rate).toLocaleString()}
        </span>
      </div>

      <div className="rounded-2xl bg-raiz-gray-50 border border-raiz-gray-100 p-4 mb-8 min-h-[80px] flex flex-col justify-center">
        {quoteLoading && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-raiz-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-raiz-gray-400 text-sm">Getting quote…</span>
          </div>
        )}
        {quoteError && !quoteLoading && (
          <p className="text-red-500 text-sm">{quoteError}</p>
        )}
        {quote && !quoteLoading && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-raiz-gray-500 md:text-sm text-[13px]">You pay (NGN)</span>
              <span className="text-raiz-gray-950 text-sm font-bold">
                ₦{parseFloat(quote.naira_amount).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-raiz-gray-500 md:text-sm text-[13px]">Recipient gets</span>
              <span className="text-raiz-gray-950 md:text-sm text-[13px] font-medium">
                ¥{parseFloat(quote.destination_amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}
        {!quote && !quoteLoading && !quoteError && (
          <p className="text-raiz-gray-300 text-sm text-center">
            Enter an amount to see the NGN equivalent
          </p>
        )}
      </div>

      <div className="mt-auto">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          width="full"
        
          loading={quoteLoading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default AmountEntry;
