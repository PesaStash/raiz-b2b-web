"use client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { IBusinessPaymentData, IPaymentChannel } from "@/types/services";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import Image from "next/image";
import GuestSelectCurrency from "./GuestSelectCurrency";
import SelectField from "@/components/ui/SelectField";
import PayStepActions from "./PayStepActions";
import { useGuestSendStore } from "@/store/GuestSend";
import { useQuery } from "@tanstack/react-query";
import {
  GetAfricaPayinChannelsApi,
  QuoteAfricaPayinRateApi,
} from "@/services/business";
import {
  AFRICA_USD_AMOUNT_MAX,
  AFRICA_USD_AMOUNT_MIN,
  clampAfricaUsdLimit,
  getChannelLabel,
  isMomoChannel,
  resolveAccountType,
} from "./africaPayinUtils";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { getCurrencySymbol } from "@/utils/helpers";

interface Props {
  data: IBusinessPaymentData;
  goBack: () => void;
  goNext: () => void;
  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;
  amountFromLink?: string;
}

const PayLocalAmount = ({
  goBack,
  goNext,
  paymentMethod,
  setPaymentMethod,
  amountFromLink,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    amount,
    guestLocalCurrency,
    actions,
    max,
    min,
    channel_name,
    account_type,
  } = useGuestSendStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);

  const countryCode = guestLocalCurrency?.value || "";
  const localCurrency = guestLocalCurrency?.currency || "";
  const localCurrencySymbol = getCurrencySymbol(localCurrency);
  const debouncedAmount = useDebounce(amount, 400);
  const parsedDebouncedAmount = Number(debouncedAmount || 0);
  const canQuoteFx =
    !!localCurrency &&
    !!debouncedAmount &&
    !Number.isNaN(parsedDebouncedAmount) &&
    parsedDebouncedAmount > 0;

  const {
    data: fxQuote,
    isFetching: fxQuoteFetching,
    isError: fxQuoteError,
  } = useQuery({
    queryKey: [
      "africa-payin-usd-to-local",
      localCurrency,
      parsedDebouncedAmount,
    ],
    queryFn: () =>
      QuoteAfricaPayinRateApi({
        currency: localCurrency,
        amount: parsedDebouncedAmount,
        direction: "usd_to_local",
      }),
    enabled: canQuoteFx,
    retry: false,
    staleTime: 30_000,
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["africa-payin-channels", countryCode],
    queryFn: () => GetAfricaPayinChannelsApi(countryCode),
    enabled: !!countryCode,
  });

  const selectedChannel = useMemo(
    () =>
      channels.find((channel) => channel.channel_id === paymentMethod) || null,
    [channels, paymentMethod],
  );

  const isMomo = isMomoChannel(
    selectedChannel,
    account_type,
    channel_name,
    paymentMethod,
  );

  const localMin = selectedChannel?.min ?? null;
  const localMax = selectedChannel?.max ?? null;

  const {
    data: usdLimits,
    isLoading: usdLimitsLoading,
    isError: usdLimitsError,
    isFetching: usdLimitsFetching,
  } = useQuery({
    queryKey: [
      "africa-payin-usd-limits",
      localCurrency,
      selectedChannel?.channel_id,
      localMin,
      localMax,
    ],
    queryFn: async () => {
      const [minQuote, maxQuote] = await Promise.all([
        QuoteAfricaPayinRateApi({
          currency: localCurrency,
          amount: localMin || AFRICA_USD_AMOUNT_MIN,
          direction: "local_to_usd",
        }),
        QuoteAfricaPayinRateApi({
          currency: localCurrency,
          amount: localMax || AFRICA_USD_AMOUNT_MAX,
          direction: "local_to_usd",
        }),
      ]);

      let usdMin = clampAfricaUsdLimit(minQuote.usd_amount, "min");
      let usdMax = clampAfricaUsdLimit(maxQuote.usd_amount, "max");

      if (usdMin > usdMax) {
        [usdMin, usdMax] = [usdMax, usdMin];
      }

      return { min: usdMin, max: usdMax };
    },
  });

  const limitsReady = !!selectedChannel && !!usdLimits && !usdLimitsError;
  const limitsPending =
    !!selectedChannel &&
    (usdLimitsLoading || usdLimitsFetching) &&
    !usdLimits;

  useEffect(() => {
    if (amountFromLink) {
      actions.setField("amount", amountFromLink);
      setRawAmount(amountFromLink);
    }
  }, [amountFromLink, actions]);

  useEffect(() => {
    if (!selectedChannel) {
      actions.setFields({
        min: AFRICA_USD_AMOUNT_MIN,
        max: AFRICA_USD_AMOUNT_MAX,
      });
      return;
    }

    actions.setFields({
      channel_id: selectedChannel.channel_id,
      channel_name: selectedChannel.channel_name,
      account_type: resolveAccountType(selectedChannel),
      country_code: selectedChannel.country_code || countryCode,
    });
  }, [selectedChannel, actions, countryCode]);

  useEffect(() => {
    if (!usdLimits) return;
    actions.setFields({
      min: usdLimits.min,
      max: usdLimits.max,
    });
  }, [usdLimits, actions]);

  const amountSchema = useMemo(
    () =>
      z
        .string()
        .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
        .refine(
          (val) => {
            if (!limitsReady) return true;
            const parsed = parseFloat(val);
            return (
              !Number.isNaN(parsed) && parsed >= (min || AFRICA_USD_AMOUNT_MIN)
            );
          },
          {
            message: `Amount must be at least $${(min || AFRICA_USD_AMOUNT_MIN).toLocaleString()} USD`,
          },
        )
        .refine(
          (val) => {
            if (!limitsReady) return true;
            const parsed = parseFloat(val);
            return (
              Number.isNaN(parsed) || parsed <= (max || AFRICA_USD_AMOUNT_MAX)
            );
          },
          {
            message: `Amount must not exceed $${(max || AFRICA_USD_AMOUNT_MAX).toLocaleString()} USD`,
          },
        ),
    [min, max, limitsReady],
  );

  useEffect(() => {
    if (amount) {
      const result = amountSchema.safeParse(amount);
      if (!result.success) {
        setError(result.error.errors[0].message);
      } else {
        setError(null);
      }
    }
  }, [amountSchema, amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.startsWith(".")) value = "0" + value;

    const decimalCount = value.split(".").length - 1;
    if (decimalCount > 1) return;

    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

    setRawAmount(formattedValue);
    actions.setField("amount", value);

    const result = amountSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };

  const displayValue = () => {
    if (isFocused || !amount) return amount ? `$${rawAmount}` : "";
    const num = Number(rawAmount.replace(/,/g, ""));
    return isNaN(num)
      ? ""
      : `$${num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
  };

  const channelOptions = channels.map((channel: IPaymentChannel) => ({
    label: getChannelLabel(channel.channel_name || channel.channel_id),
    value: channel.channel_id,
  }));

  const goNextHandler = () => {
    if (!paymentMethod || error || !amount || !guestLocalCurrency) return;
    if (!limitsReady) return;
    goNext();
  };

  const canContinue =
    !error &&
    !!amount &&
    !!paymentMethod &&
    !!guestLocalCurrency &&
    limitsReady &&
    !limitsPending;

  const formatUsdLimit = (value: number) =>
    `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="flex flex-col h-full">
      <div className="flex flex-col h-full justify-between relative items-center w-full">
        <div className="w-full">
          <header className="flex items-start justify-between mb-4">
            <div>
             
              <h2 className="hidden md:block text-raiz-gray-950 text-xl md:text-[23px] font-bold md:font-semibold leading-tight md:leading-10">
                Send in USD
              </h2>
              <p className="hidden md:block text-raiz-gray-700 text-[15px] font-normal leading-snug">
                How much do you want to send in (USD)?
              </p>
            </div>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hidden md:block shrink-0"
            >
              <rect
                width="48"
                height="48"
                rx="16"
                fill="#EAECFF"
                fillOpacity="0.4"
              />
              <path
                d="M34.084 16.376C33.872 15.147 32.906 14.119 31.688 13.849C30.385 13.56 29.199 14.086 28.489 15H24V33H30C31.657 33 33 31.657 33 30V19.33C33.814 18.643 34.289 17.567 34.084 16.376Z"
                fill="#F2ED9F"
              />
              <path
                d="M31 12C28.239 12 26 14.239 26 17C26 18.977 28.001 21.704 29.471 23.441C30.27 24.385 31.73 24.385 32.529 23.441C33.999 21.704 36 18.977 36 17C36 14.239 33.761 12 31 12ZM31 19.143C29.817 19.143 28.857 18.184 28.857 17C28.857 15.816 29.817 14.857 31 14.857C32.183 14.857 33.143 15.817 33.143 17C33.143 18.183 32.183 19.143 31 19.143Z"
                fill="#EDB637"
              />
              <path
                d="M18.697 13.786L16.459 15.126C15.554 15.668 15 16.645 15 17.7V31.106C15 32.38 16.39 33.167 17.482 32.512L18.696 31.785C19.098 31.544 19.547 31.415 20 31.395V13.397C19.547 13.417 19.098 13.546 18.697 13.786Z"
                fill="#F2ED9F"
              />
              <path
                d="M21.359 13.6829C20.931 13.4699 20.463 13.3759 20 13.3969V31.3949C20.464 31.3749 20.932 31.4689 21.36 31.6829L24 32.9999V14.9999L21.359 13.6829Z"
                fill="#EDB637"
              />
            </svg>
          </header>

          <div className="flex flex-col justify-center items-center mt-1 md:mt-6 mb-4">
            <div className="relative w-full">
              <input
                ref={inputRef}
                value={displayValue()}
                onChange={handleAmountChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={!!amountFromLink}
                placeholder="$0.00"
                className="w-full h-16 bg-transparent text-center text-2xl md:text-4xl font-bold focus:outline-none"
              />
            </div>
            <p className="text-primary2 text-xs  font-medium mt-1 text-center bg-[#F9F5FF] py-2 px-4 rounded-2xl">
              {limitsPending ? (
                <span>Loading USD limits…</span>
              ) : usdLimitsError && selectedChannel ? (
                <span>Unable to load USD limits. Please try again.</span>
              ) : limitsReady ? (
                <span>
                  Min {formatUsdLimit(min)} · Max {formatUsdLimit(max)}
                </span>
              ) : (
                <span>Select a payment method to see USD limit</span>
              )}
            </p>
            {canQuoteFx && (
              <div className="mt-2 w-full flex justify-center">
                {fxQuoteFetching && !fxQuote ? (
                  <p className="text-xs text-zinc-500">Getting rate…</p>
                ) : fxQuote && !fxQuoteError ? (
                  <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-full bg-[#EAECFF99] px-3 py-1.5">
                    <p className="text-xs text-zinc-900">
                      <span className="text-zinc-500">You pay </span>
                      <span className="font-semibold">
                        {localCurrencySymbol}
                        {Number(fxQuote.local_amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {localCurrency}
                      </span>
                    </p>
                    {fxQuote.rate > 0 && (
                      <p className="text-[11px] text-zinc-500">
                        · $1 = {localCurrencySymbol}
                        {Number(fxQuote.rate).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            {error && <ErrorMessage message={error} />}
          </div>

          <div className="mt-4 mb-5">
            <p className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma leading-normal">
              <span className="md:hidden">Your Currency</span>
              <span className="hidden md:inline">Recipient Currency</span>
            </p>
            <button
              type="button"
              onClick={() => setShowCurrency(true)}
              className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl w-full"
            >
              <div className="flex gap-2 items-center min-w-0">
                <Image
                  src={guestLocalCurrency?.logo ?? "/icons/website.svg"}
                  width={24}
                  height={24}
                  alt=""
                  className="rounded-full object-cover"
                />
                <span className="text-zinc-900 text-[13px] md:text-sm font-normal leading-tight truncate">
                  {guestLocalCurrency
                    ? `${guestLocalCurrency.currency} - ${guestLocalCurrency.name}`
                    : "Select currency"}
                </span>
              </div>
              <Image
                src="/icons/arrow-down.svg"
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
            </button>
          </div>

          <SelectField
            label="Payment Method"
            placeholder={
              channelsLoading
                ? "Loading payment methods..."
                : "Select a payment method"
            }
            name="method"
            options={channelOptions}
            onChange={(i) => {
              if (!i?.value) return;
              const value = String(i.value);
              const channel =
                channels.find((item) => item.channel_id === value) || null;
              setPaymentMethod(value);
              actions.setFields({
                channel_id: value,
                channel_name: channel?.channel_name || value,
                account_type: resolveAccountType(channel),
                country_code: channel?.country_code || countryCode,
                network_id: "",
                network_name: "",
                guestAccount: "",
                min: AFRICA_USD_AMOUNT_MIN,
                max: AFRICA_USD_AMOUNT_MAX,
              });
            }}
            value={
              paymentMethod
                ? channelOptions.find(
                    (option) => option.value === paymentMethod,
                  ) || null
                : null
            }
            height="auto"
          />
        </div>
        <PayStepActions
          onBack={goBack}
          onContinue={goNextHandler}
          continueDisabled={!canContinue}
          continueLabel={
            isMomo ? "Continue to provider" : "Continue to description"
          }
        />
      </div>
      {showCurrency && (
        <GuestSelectCurrency
          close={() => setShowCurrency(false)}
          onSelect={() => {
            setPaymentMethod(null);
            actions.setFields({
              channel_id: "",
              channel_name: "",
              network_id: "",
              network_name: "",
              account_type: "",
              guestAccount: "",
              min: AFRICA_USD_AMOUNT_MIN,
              max: AFRICA_USD_AMOUNT_MAX,
            });
          }}
        />
      )}
    </section>
  );
};

export default PayLocalAmount;
