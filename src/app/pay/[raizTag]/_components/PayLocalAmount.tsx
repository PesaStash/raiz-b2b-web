"use client";
import Avatar from "@/components/ui/Avatar";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { IBusinessPaymentData, IPaymentChannel } from "@/types/services";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import Image from "next/image";
import GuestSelectCurrency from "./GuestSelectCurrency";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useGuestSendStore } from "@/store/GuestSend";
import { useQuery } from "@tanstack/react-query";
import {
  GetAfricaPayinChannelsApi,
  GetAfricaPayinNetworksApi,
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
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import { Country } from "react-phone-number-input";

interface Props {
  data: IBusinessPaymentData;
  goBack: () => void;
  goNext: () => void;
  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;
  amountFromLink?: string;
}

const PayLocalAmount = ({
  data,
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
    network_id,
    guestAccount,
    channel_name,
    account_type,
  } = useGuestSendStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);

  const countryCode = guestLocalCurrency?.value || "";
  const localCurrency = guestLocalCurrency?.currency || "";

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["africa-payin-channels", countryCode],
    queryFn: () => GetAfricaPayinChannelsApi(countryCode),
    enabled: !!countryCode,
  });

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.channel_id === paymentMethod) || null,
    [channels, paymentMethod],
  );

  const isMomo = isMomoChannel(
    selectedChannel,
    account_type,
    channel_name,
    paymentMethod,
  );

  const { data: networks = [], isLoading: networksLoading } = useQuery({
    queryKey: ["africa-payin-networks", countryCode, paymentMethod],
    queryFn: () => GetAfricaPayinNetworksApi(countryCode, paymentMethod),
    enabled: !!countryCode && !!paymentMethod && isMomo,
  });

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
        // Prefer a coherent range if quotes invert after rounding.
        [usdMin, usdMax] = [usdMax, usdMin];
      }

      return { min: usdMin, max: usdMax };
    },
    // enabled:
    //   !!selectedChannel &&
    //   !!localCurrency &&
    //   localMin != null &&
    //   localMax != null &&
    //   localMin > 0 &&
    //   localMax > 0,
    // staleTime: 60_000,
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
        .refine((val) => {
          if (!limitsReady) return true;
          const parsed = parseFloat(val);
          return !Number.isNaN(parsed) && parsed >= (min || AFRICA_USD_AMOUNT_MIN);
        }, {
          message: `Amount must be at least $${(min || AFRICA_USD_AMOUNT_MIN).toLocaleString()} USD`,
        })
        .refine((val) => {
          if (!limitsReady) return true;
          const parsed = parseFloat(val);
          return (
            Number.isNaN(parsed) ||
            parsed <= (max || AFRICA_USD_AMOUNT_MAX)
          );
        }, {
          message: `Amount must not exceed $${(max || AFRICA_USD_AMOUNT_MAX).toLocaleString()} USD`,
        }),
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
    const num = parseFloat(rawAmount);
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

  const networkOptions = networks.map((network) => ({
    label: network.network_name,
    value: network.network_id,
  }));

  const goNextHandler = () => {
    if (!paymentMethod || error || !amount || !guestLocalCurrency) return;
    if (!limitsReady) return;
    if (isMomo && (!network_id || !guestAccount)) return;
    goNext();
  };

  const canContinue =
    !error &&
    !!amount &&
    !!paymentMethod &&
    !!guestLocalCurrency &&
    limitsReady &&
    !limitsPending &&
    (!isMomo || (!!network_id && !!guestAccount));

  const formatUsdLimit = (value: number) =>
    `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="flex flex-col h-full">
      <div className="flex flex-col h-full justify-between items-center w-full px-4 md:px-0 mt-5">
        <div className="w-full h-full overflow-y-auto">
          <button type="button" onClick={goBack} className="mb-2">
            <Image
              className="w-3 h-3 md:w-[18px] md:h-[18px]"
              src={"/icons/arrow-left.svg"}
              width={18.48}
              height={18.48}
              alt="back"
            />
          </button>
          <div className="flex flex-col justify-center items-center">
            <div className="relative w-10 h-10">
              <Avatar
                src={data?.account_user?.selfie_image}
                name={data?.account_user?.username}
              />
            </div>
            <p className="text-center mt-4 justify-start text-zinc-900 text-sm font-bold leading-none capitalize">
              {data?.account_user?.username}
            </p>
            <p className="text-center mt-10 justify-start text-zinc-900 text-sm md:text-base mb-3">
              How much do you want to send in USD?
            </p>
            <div className="relative w-full mt-3">
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
            <div className="py-2 px-4 rounded-2xl flex items-center gap-3 text-zinc-900 text-[10px] md:text-xs bg-indigo-100/60">
              {limitsPending ? (
                <span>Loading USD limits…</span>
              ) : usdLimitsError && selectedChannel ? (
                <span>Unable to load USD limits. Please try again.</span>
              ) : limitsReady ? (
                <>
                  <div className="flex items-center gap-1">
                    <span>Min</span>
                    <span className="font-bold">{formatUsdLimit(min)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Max</span>
                    <span className="font-bold">{formatUsdLimit(max)}</span>
                  </div>
                </>
              ) : (
                <span>Select a payment method to see USD limits</span>
              )}
            </div>

            {error && <ErrorMessage message={error} />}
          </div>
          <SelectField
            label="Payment method"
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
                // Keep previous USD defaults until the quote resolves.
                min: AFRICA_USD_AMOUNT_MIN,
                max: AFRICA_USD_AMOUNT_MAX,
              });
            }}
            value={
              paymentMethod
                ? channelOptions.find((option) => option.value === paymentMethod) ||
                  null
                : null
            }
            height="auto"
          />
          <div className="mt-8 mb-5">
            <p className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma leading-normal">
              Your currency
            </p>
            <div className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl">
              <div className="flex gap-1 items-center">
                <Image
                  src={guestLocalCurrency?.logo ?? "/icons/website.svg"}
                  width={24}
                  height={14}
                  alt=""
                />
                <span className="text-zinc-900 text-[13px] md:text-sm font-normal leading-tight">
                  {guestLocalCurrency
                    ? `${guestLocalCurrency.name} (${guestLocalCurrency.currency})`
                    : "Select currency"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCurrency(true)}
                className="px-1.5 py-1 bg-zinc-200 rounded-lg text-zinc-700 text-xs font-medium font-brSonoma leading-tight"
              >
                {guestLocalCurrency ? "Change" : "Select"}
              </button>
            </div>
          </div>

          {isMomo && (
            <div className="mt-4 flex flex-col gap-4">
              <SelectField
                label="Mobile money network"
                placeholder={
                  networksLoading
                    ? "Loading networks..."
                    : "Select mobile money network"
                }
                name="network"
                options={networkOptions}
                onChange={(i) => {
                  if (!i?.value) return;
                  const network = networks.find(
                    (item) => item.network_id === String(i.value),
                  );
                  actions.setFields({
                    network_id: String(i.value),
                    network_name: network?.network_name || String(i.label || ""),
                  });
                }}
                value={
                  network_id
                    ? networkOptions.find((option) => option.value === network_id) ||
                      null
                    : null
                }
                height="auto"
              />
              <PhoneNumberInput
                defaultCountry={(guestLocalCurrency?.value || "KE") as Country}
                label="Mobile money account number"
                value={guestAccount}
                onChange={(value) =>
                  actions.setField("guestAccount", value || "")
                }
              />
            </div>
          )}
        </div>
        <div className="w-full py-5">
          <Button disabled={!canContinue} onClick={goNextHandler}>
            Continue
          </Button>
          <p className="text-[13px] text-raiz-gray-900 text-center mt-2">
            Don&#39;t have Raiz?{" "}
            <Link
              target="_blank"
              className="font-bold"
              href={"https://raizapp.onelink.me/RiOx/webdirect"}
            >
              Download
            </Link>{" "}
            Raiz app |{" "}
            <Link target="_blank" className="font-bold" href={"/register"}>
              Sign up{" "}
            </Link>{" "}
            on Raiz Business
          </p>
        </div>
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
