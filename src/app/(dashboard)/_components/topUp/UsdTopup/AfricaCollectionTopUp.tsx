"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Overlay from "@/components/ui/Overlay";
import Image from "next/image";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import EnterPin from "@/components/transactions/EnterPin";
import AfricaPaymentInstructions from "@/components/transactions/AfricaPaymentInstructions";
import GuestSendStatusModal from "@/app/pay/[raizTag]/_components/GuestSendStatusModal";
import {
  filterAfricaPayinCountries,
  getAfricaCountryFlagUrl,
  getChannelLabel,
  mapAfricaPayinError,
  resolveAccountType,
  AFRICA_USD_AMOUNT_MAX,
  AFRICA_USD_AMOUNT_MIN,
  AFRICA_UNSUPPORTED_COUNTRY_CODES,
  clampAfricaUsdLimit,
} from "@/app/pay/[raizTag]/_components/africaPayinUtils";
import {
  DenyAuthAfricaPayinApi,
  FinalizeAuthAfricaPayinApi,
  GetAuthAfricaPayinChannelsApi,
  GetAuthAfricaPayinCountriesApi,
  GetAuthAfricaPayinNetworksApi,
  GetAuthAfricaPayinStatusApi,
  InitiateAuthAfricaPayinApi,
  QuoteAuthAfricaPayinRateApi,
} from "@/services/transactions";
import { toast } from "sonner";
import { z } from "zod";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import TopUp from "../TopUp";
import { Country } from "react-phone-number-input";
import { findWalletByCurrency, getCurrencySymbol } from "@/utils/helpers";
import { useTopupStore } from "@/store/TopUp";
import { IIntCountry } from "@/constants/send";
import { IntCountryType, IntCurrencyCode } from "@/types/services";
import { GuestPayStatusType } from "@/types/transactions";
import {
  isCancelledAfricaPayinStatus,
  isExpiredAfricaPayinStatus,
  isSuccessAfricaPayinStatus,
  isTerminalAfricaPayinStatus,
} from "@/store/GuestSend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/hooks/useUser";
import InputLabel from "@/components/ui/InputLabel";

type AfricaTopupStep =
  | "setup"
  | "review"
  | "pin"
  | "instructions"
  | "status";

interface Props {
  close: () => void;
  onDone: () => void;
}

const AfricaCollectionTopUp = ({ close, onDone }: Props) => {
  const { user } = useUser();
  const { amount: storedAmount, actions: topupActions } = useTopupStore();
  const qc = useQueryClient();

  const [step, setStep] = useState<AfricaTopupStep>("setup");
  const [country, setCountry] = useState<IIntCountry | null>(null);
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [accountType, setAccountType] = useState<"bank" | "momo">("bank");
  const [networkId, setNetworkId] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [usdAmount, setUsdAmount] = useState(storedAmount || "");
  const [localAmount, setLocalAmount] = useState("");
  const [description, setDescription] = useState("USD wallet top-up");
  const [localMin, setLocalMin] = useState<number | null>(null);
  const [localMax, setLocalMax] = useState<number | null>(null);
  const [min, setMin] = useState(AFRICA_USD_AMOUNT_MIN);
  const [max, setMax] = useState(AFRICA_USD_AMOUNT_MAX);
  const [payinId, setPayinId] = useState("");
  const [status, setStatus] = useState<GuestPayStatusType>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [payoutCurrency, setPayoutCurrency] = useState("");
  const [paymentInstruction, setPaymentInstruction] = useState("");
  const [collectionAccountNumber, setCollectionAccountNumber] = useState("");
  const [collectionAccountName, setCollectionAccountName] = useState("");
  const [collectionBankName, setCollectionBankName] = useState("");
  const [collectionMethod, setCollectionMethod] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [pin, setPin] = useState("");
  const [showUsBankFallback, setShowUsBankFallback] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const initiateIdempotencyKeyRef = useRef<string | null>(null);
  const lastInitiatePayloadRef = useRef<string | null>(null);

  // First-party Africa top-up always credits the business USD wallet.
  const usdWallet = useMemo(() => findWalletByCurrency(user, "USD"), [user]);

  const entityCountry = user?.business_account?.entity?.country;
  const entityCountryCode = (entityCountry?.country_code || "").toUpperCase();

  const isMomo = accountType === "momo";

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["auth-africa-payin-countries"],
    queryFn: GetAuthAfricaPayinCountriesApi,
  });

  const supportedCountries = useMemo(
    () => filterAfricaPayinCountries(countries),
    [countries],
  );

  const discoveryMatch = useMemo(
    () =>
      supportedCountries.find(
        (item) => item.country_code.toUpperCase() === entityCountryCode,
      ) || null,
    [supportedCountries, entityCountryCode],
  );

  const isEntityCountryUnsupported =
    !!entityCountryCode &&
    AFRICA_UNSUPPORTED_COUNTRY_CODES.has(entityCountryCode);

  const isCountryUnavailable =
    !countriesLoading &&
    !!entityCountryCode &&
    !isEntityCountryUnsupported &&
    !discoveryMatch;

  // Lock country to the business entity profile (not user-selectable).
  useEffect(() => {
    if (!entityCountryCode) return;

    if (entityCountryCode === "NG") {
      setShowUsBankFallback(true);
      return;
    }

    if (!discoveryMatch) return;

    setCountry((prev) => {
      if (prev?.value === discoveryMatch.country_code) return prev;
      return {
        name: discoveryMatch.country_name,
        value: discoveryMatch.country_code as IntCountryType,
        currency: discoveryMatch.currency as IntCurrencyCode,
        logo: getAfricaCountryFlagUrl(discoveryMatch.country_code),
      };
    });
  }, [entityCountryCode, discoveryMatch]);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["auth-africa-payin-channels", country?.value],
    queryFn: () => GetAuthAfricaPayinChannelsApi(country?.value || null),
    enabled: !!country?.value && !isEntityCountryUnsupported,
  });

  const channelOptions = channels.map((channel) => ({
    label: getChannelLabel(channel.channel_name || channel.channel_id),
    value: channel.channel_id,
  }));

  const { data: networks = [], isLoading: networksLoading } = useQuery({
    queryKey: ["auth-africa-payin-networks", country?.value, channelId],
    queryFn: () =>
      GetAuthAfricaPayinNetworksApi(country?.value || null, channelId),
    enabled: !!country?.value && !!channelId && isMomo,
  });

  const networkOptions = networks.map((network) => ({
    label: network.network_name,
    value: network.network_id,
  }));

  const localCurrency = country?.currency || entityCountry?.currency || "";

  const {
    data: usdLimits,
    isLoading: usdLimitsLoading,
    isError: usdLimitsError,
    isFetching: usdLimitsFetching,
  } = useQuery({
    queryKey: [
      "auth-africa-payin-usd-limits",
      localCurrency,
      channelId,
      localMin,
      localMax,
    ],
    queryFn: async () => {
      const [minQuote, maxQuote] = await Promise.all([
        QuoteAuthAfricaPayinRateApi({
          currency: localCurrency,
          amount: localMin || AFRICA_USD_AMOUNT_MIN,
          direction: "local_to_usd",
        }),
        QuoteAuthAfricaPayinRateApi({
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
    // enabled:
    //   !!channelId &&
    //   !!localCurrency &&
    //   localMin != null &&
    //   localMax != null &&
    //   localMin > 0 &&
    //   localMax > 0,
    // staleTime: 60_000,
  });

  const limitsReady = !!channelId && !!usdLimits && !usdLimitsError;
  const limitsPending =
    !!channelId && (usdLimitsLoading || usdLimitsFetching) && !usdLimits;

  useEffect(() => {
    if (!usdLimits) return;
    setMin(usdLimits.min);
    setMax(usdLimits.max);
  }, [usdLimits]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const applyStatus = (nextStatus: GuestPayStatusType) => {
    if (!nextStatus) return;
    if (isCancelledAfricaPayinStatus(nextStatus)) {
      stopPolling();
      initiateIdempotencyKeyRef.current = null;
      lastInitiatePayloadRef.current = null;
      setPayinId("");
      setStatus(null);
      setPaymentError("");
      setLocalAmount("");
      setPaymentInstruction("");
      setCollectionAccountNumber("");
      setCollectionAccountName("");
      setCollectionBankName("");
      setPin("");
      setStep("setup");
      return;
    }
    setStatus(nextStatus);
    if (isTerminalAfricaPayinStatus(nextStatus)) {
      stopPolling();
      setStep("status");
      if (nextStatus === "failed") {
        setPaymentError("Top-up failed. Please try again.");
      }
      if (isExpiredAfricaPayinStatus(nextStatus)) {
        setPaymentError("This top-up expired. Please start a new one.");
      }
      if (isSuccessAfricaPayinStatus(nextStatus)) {
        qc.invalidateQueries({ queryKey: ["user"] });
        qc.invalidateQueries({ queryKey: ["transactions-report"] });
      }
    }
  };

  const fetchStatusOnce = async () => {
    if (!payinId) return null;
    try {
      const nextStatus = await GetAuthAfricaPayinStatusApi(payinId);
      applyStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      const mapped = mapAfricaPayinError(error);
      setPaymentError(mapped.message);
      return null;
    }
  };

  const initiateMutation = useMutation({
    mutationFn: InitiateAuthAfricaPayinApi,
    onSuccess: (res) => {
      initiateIdempotencyKeyRef.current = null;
      lastInitiatePayloadRef.current = null;
      setPayinId(res.payin_id);
      // Contract: amount = USD; payout_amount = local currency to pay.
      setUsdAmount(String(res.amount));
      setLocalAmount(String(res.payout_amount ?? ""));
      setExpiresAt(res.expires_at);
      setPayoutCurrency(res.payout_currency || "");
      setCollectionMethod(res.collection_method || accountType);
      setStatus((res.transaction_status as GuestPayStatusType) || "created");
      setStep("review");
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      if (mapped.kind === "nigeria_palmpay") {
        toast.error(mapped.message);
        setShowUsBankFallback(true);
        return;
      }
      toast.error(mapped.message);
      setPaymentError(mapped.message);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: FinalizeAuthAfricaPayinApi,
    onSuccess: (res) => {
      setPayinId(res.payin_id);
      // Keep initiate amounts; finalize may return an older amount shape.
      setExpiresAt(res.expires_at);
      setPaymentInstruction(res.payment_instruction || "");
      setCollectionAccountNumber(res.collection_account_number || "");
      setCollectionAccountName(res.collection_account_name || "");
      setCollectionBankName(res.collection_bank_name || "");
      setCollectionMethod(res.collection_method || accountType);
      setStatus((res.transaction_status as GuestPayStatusType) || "pending");
      setStep("instructions");
    },
    onError: async (error) => {
      const mapped = mapAfricaPayinError(error);
      setPin("");
      if (mapped.kind === "already_finalized") {
        // Instructions are still useful; no status polling on first-party top-up.
        if (paymentInstruction || collectionAccountNumber || isMomo) {
          setStep("instructions");
          return;
        }
        const nextStatus = await fetchStatusOnce();
        if (isTerminalAfricaPayinStatus(nextStatus)) {
          setStep("status");
          return;
        }
        setStep("instructions");
        return;
      }
      if (mapped.kind === "expired") {
        toast.error(mapped.message);
        handleRestart();
        return;
      }
      toast.error(mapped.message);
      setPaymentError(mapped.message);
      setStep("review");
    },
  });

  const denyMutation = useMutation({
    mutationFn: DenyAuthAfricaPayinApi,
    onSuccess: () => {
      toast.success("Payment cancelled");
      handleRestart();
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      toast.error(mapped.message);
    },
  });

  const setupSchema = z
    .object({
      amount: z
        .string()
        .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount")
        .refine((val) => {
          if (!limitsReady) return true;
          return Number(val) >= min;
        }, {
          message: `Amount must be at least $${min.toLocaleString()} USD`,
        })
        .refine((val) => {
          if (!limitsReady) return true;
          return Number(val) <= max;
        }, {
          message: `Amount must not exceed $${max.toLocaleString()} USD`,
        }),
      description: z
        .string()
        .trim()
        .min(3, "Enter a description")
        .max(255, "Description is too long"),
      channelId: z.string().min(1, "Select a payment method"),
      networkId: z.string().optional(),
      accountNumber: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (isMomo && !values.networkId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a mobile money network",
          path: ["networkId"],
        });
      }
      if (isMomo && !values.accountNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter your mobile money account number",
          path: ["accountNumber"],
        });
      } else if (
        isMomo &&
        values.accountNumber &&
        !/^\+[0-9]+$/.test(values.accountNumber)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid international number (e.g. +254711111111)",
          path: ["accountNumber"],
        });
      }
    });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      amount: usdAmount,
      description,
      channelId,
      networkId,
      accountNumber,
    },
    validationSchema: toFormikValidationSchema(setupSchema),
    onSubmit: (values) => {
      if (!usdWallet?.wallet_id || !country) {
        toast.error("USD wallet unavailable for this top-up.");
        return;
      }
      if (isEntityCountryUnsupported || isCountryUnavailable) {
        toast.error(
          "This payment method is not available for your business country.",
        );
        return;
      }
      if (!limitsReady) {
        toast.error("USD limits are still loading. Please try again.");
        return;
      }

      topupActions.setAmount(values.amount);
      setUsdAmount(values.amount);
      setDescription(values.description.trim());

      const payload = {
        channel_id: values.channelId,
        account_type: accountType,
        amount: Number(values.amount),
        transaction_description: values.description.trim(),
        ...(isMomo
          ? {
              network_id: values.networkId,
              account_number: values.accountNumber,
            }
          : {}),
      };

      const payloadFingerprint = JSON.stringify(payload);
      if (lastInitiatePayloadRef.current !== payloadFingerprint) {
        initiateIdempotencyKeyRef.current = crypto.randomUUID();
        lastInitiatePayloadRef.current = payloadFingerprint;
      }

      initiateMutation.mutate({
        wallet_id: usdWallet.wallet_id,
        data: payload,
        idempotencyKey: initiateIdempotencyKeyRef.current || undefined,
      });
    },
  });

  useEffect(() => {
    if (pin.length === 4 && payinId && step === "pin") {
      finalizeMutation.mutate({
        payin_id: payinId,
        transaction_pin: pin,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, payinId, step]);

  const handleRestart = () => {
    stopPolling();
    initiateIdempotencyKeyRef.current = null;
    lastInitiatePayloadRef.current = null;
    setPayinId("");
    setStatus(null);
    setPaymentError("");
    setLocalAmount("");
    setPaymentInstruction("");
    setCollectionAccountNumber("");
    setCollectionAccountName("");
    setCollectionBankName("");
    setPin("");
    setStep("setup");
  };

  const handleClose = () => {
    stopPolling();
    topupActions.setPaymentOption(null);
    close();
  };

  if (showUsBankFallback) {
    return (
      <CenterModalWrapper close={handleClose}>
        <TopUp close={handleClose} />
      </CenterModalWrapper>
    );
  }

  if (step === "pin") {
    return (
      <EnterPin
        pin={pin}
        setPin={setPin}
        close={() => {
          setPin("");
          setStep("review");
        }}
      />
    );
  }

  if (step === "status") {
    return (
      <GuestSendStatusModal
        status={status}
        amount={usdAmount}
        currency="USD"
        close={() => {
          if (isSuccessAfricaPayinStatus(status)) {
            onDone();
            return;
          }
          handleClose();
        }}
        error={paymentError}
        tryAgain={handleRestart}
        viewReceipt={() => {
          if (isSuccessAfricaPayinStatus(status)) onDone();
        }}
        merchantName="your USD wallet"
      />
    );
  }

  if (step === "instructions") {
    return (
      <Overlay close={handleClose} width="400px">
        <div className="flex flex-col h-full py-8 px-5">
          <AfricaPaymentInstructions
            amount={localAmount}
            usdAmount={usdAmount}
            payoutCurrency={payoutCurrency || "USD"}
            expiresAt={expiresAt}
            status={status}
            paymentInstruction={paymentInstruction}
            collectionAccountNumber={collectionAccountNumber}
            collectionAccountName={collectionAccountName}
            collectionBankName={collectionBankName}
            collectionMethod={collectionMethod}
            accountType={accountType}
            channelName={channelName}
            momoAccountNumber={accountNumber}
            networkName={networkName}
            showWaitingStatus={false}
            onDone={onDone}
            onCancel={() => {
              if (!payinId) {
                handleRestart();
                return;
              }
              denyMutation.mutate(payinId);
            }}
            cancelling={denyMutation.isPending}
            title={isMomo ? "Check your phone" : "Pay by transfer"}
          />
        </div>
      </Overlay>
    );
  }

  if (step === "review") {
    return (
      <Overlay close={handleClose} width="400px">
        <div className="flex flex-col h-full py-8 px-5">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-zinc-900 text-xl font-bold leading-normal">
                Review top-up
              </h3>
              <p className="text-zinc-900 text-xs leading-tight">
                Confirm the details, then enter your PIN to continue.
              </p>
            </div>
            <button onClick={handleClose}>
              <Image src={"/icons/close.svg"} width={16} height={16} alt="close" />
            </button>
          </div>
          <div className="space-y-4 p-5 rounded-[20px] bg-indigo-50">
            <div>
              <p className="text-xs text-zinc-500">Amount to your wallet</p>
              <p className="text-lg font-semibold text-zinc-900">
                ${Number(usdAmount).toLocaleString()} USD
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">You pay</p>
              <p className="text-lg font-semibold text-zinc-900">
                {getCurrencySymbol(payoutCurrency)}
                {Number(localAmount).toLocaleString()} {payoutCurrency}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Country</p>
              <p className="text-sm font-semibold text-zinc-900">
                {country?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Payment method</p>
              <p className="text-sm font-semibold text-zinc-900">
                {getChannelLabel(channelName || accountType)}
              </p>
            </div>
            {isMomo && (
              <>
                <div>
                  <p className="text-xs text-zinc-500">Network</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {networkName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Account number</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {accountNumber}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-zinc-500">Description</p>
              <p className="text-sm font-semibold text-zinc-900">{description}</p>
            </div>
          </div>
          {paymentError && (
            <p className="text-sm text-red-600 mt-4">{paymentError}</p>
          )}
          <div className="mt-auto flex flex-col gap-3 pt-6">
            <Button
              loading={finalizeMutation.isPending}
              onClick={() => {
                setPaymentError("");
                setPin("");
                setStep("pin");
              }}
            >
              Enter PIN
            </Button>
            <Button
              className="bg-zinc-200 text-zinc-900"
              loading={denyMutation.isPending}
              onClick={() => {
                if (!payinId) {
                  handleRestart();
                  return;
                }
                denyMutation.mutate(payinId);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Overlay>
    );
  }


  return (
    <Overlay close={handleClose} width="400px">
      <div className="flex flex-col h-full py-8 px-5 overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-zinc-900 text-xl font-bold leading-normal">
              Pay by transfer
            </h3>
            <p className="text-zinc-900 text-xs leading-tight">
              Fund your USD wallet with bank transfer or mobile money.
            </p>
          </div>
          <button onClick={handleClose}>
            <Image src={"/icons/close.svg"} width={16} height={16} alt="close" />
          </button>
        </div>

        <form
          className="flex flex-col gap-4 max-h-[450px] overflow-y-auto flex-1"
          onSubmit={formik.handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <InputLabel content="Country" />
            <div className="flex items-center gap-3 p-3.5 bg-gray-100 rounded-xl">
              <Image
                src={
                  country?.logo ||
                  entityCountry?.country_flag ||
                  getAfricaCountryFlagUrl(entityCountryCode) ||
                  "/icons/website.svg"
                }
                width={24}
                height={14}
                alt=""
              />
              <div className="min-w-0">
                <p className="text-zinc-900 text-sm font-medium leading-tight truncate">
                  {countriesLoading
                    ? "Loading country..."
                    : country
                      ? `${country.name} (${country.currency})`
                      : entityCountry
                        ? `${entityCountry.country_name}${
                            entityCountry.currency
                              ? ` (${entityCountry.currency})`
                              : ""
                          }`
                        : "Business country unavailable"}
                </p>
                <p className="text-zinc-500 text-xs leading-tight mt-0.5">
                  Based on your business profile
                </p>
              </div>
            </div>
            {!entityCountryCode && !countriesLoading && (
              <p className="text-sm text-red-600">
                Your business country is missing. Update your profile to use
                this top-up method.
              </p>
            )}
            {isEntityCountryUnsupported && entityCountryCode !== "NG" && (
              <p className="text-sm text-red-600">
                This payment method is not available for{" "}
                {entityCountry?.country_name || "your business country"}.
              </p>
            )}
            {isCountryUnavailable && (
              <p className="text-sm text-red-600">
                This payment method is not available for{" "}
                {entityCountry?.country_name || "your business country"}.
              </p>
            )}
          </div>

          <SelectField
            label="Payment method"
            name="channelId"
            placeholder={
              channelsLoading
                ? "Loading payment methods..."
                : !country
                  ? "Country required"
                  : "Select payment method"
            }
            options={channelOptions}
            value={
              channelId
                ? channelOptions.find((item) => item.value === channelId) || null
                : null
            }
            onChange={(option) => {
              const channel = channels.find(
                (item) => item.channel_id === option?.value,
              );
              if (!channel) return;
              const nextAccountType = resolveAccountType(channel);
              setChannelId(channel.channel_id);
              setChannelName(channel.channel_name);
              setAccountType(nextAccountType);
              setLocalMin(channel.min || null);
              setLocalMax(channel.max || null);
              setMin(AFRICA_USD_AMOUNT_MIN);
              setMax(AFRICA_USD_AMOUNT_MAX);
              setNetworkId("");
              setNetworkName("");
              setAccountNumber("");
              formik.setFieldValue("channelId", channel.channel_id);
              formik.setFieldValue("networkId", "");
              formik.setFieldValue("accountNumber", "");
            }}
            height="auto"
          />

          {isMomo && (
            <>
              <SelectField
                label="Mobile money network"
                name="networkId"
                placeholder={
                  networksLoading ? "Loading networks..." : "Select network"
                }
                options={networkOptions}
                value={
                  networkId
                    ? networkOptions.find((item) => item.value === networkId) ||
                      null
                    : null
                }
                onChange={(option) => {
                  const network = networks.find(
                    (item) => item.network_id === option?.value,
                  );
                  setNetworkId(String(option?.value || ""));
                  setNetworkName(network?.network_name || "");
                  formik.setFieldValue("networkId", option?.value || "");
                }}
                height="auto"
              />
              <PhoneNumberInput
                defaultCountry={(country?.value || "KE") as Country}
                label="Mobile money account number"
                value={accountNumber}
                onChange={(value) => {
                  setAccountNumber(value || "");
                  formik.setFieldValue("accountNumber", value || "");
                }}
                error={formik.errors.accountNumber}
                touched={formik.touched.accountNumber}
              />
            </>
          )}

          <InputField
            label="USD amount"
            placeholder="20"
            {...formik.getFieldProps("amount")}
            onChange={(e) => {
              formik.handleChange(e);
              setUsdAmount(e.target.value);
            }}
            status={
              formik.touched.amount && formik.errors.amount ? "error" : null
            }
            errorMessage={formik.touched.amount && formik.errors.amount}
          />
          <p className="text-xs text-zinc-500 -mt-2">
            {limitsPending
              ? "Loading USD limits…"
              : usdLimitsError && channelId
                ? "Unable to load USD limits. Please try again."
                : limitsReady
                  ? `Limits: $${min.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} - $${max.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })} USD`
                  : "Select a payment method to see USD limits"}
          </p>

          <InputField
            label="Description"
            placeholder="USD wallet top-up"
            {...formik.getFieldProps("description")}
            onChange={(e) => {
              formik.handleChange(e);
              setDescription(e.target.value);
            }}
            status={
              formik.touched.description && formik.errors.description
                ? "error"
                : null
            }
            errorMessage={
              formik.touched.description && formik.errors.description
            }
          />

          {paymentError && <ErrorMessage message={paymentError} />}

          <div className="mt-auto pt-4">
            <Button
              type="submit"
              loading={initiateMutation.isPending}
              disabled={
                initiateMutation.isPending ||
                !formik.isValid ||
                !limitsReady ||
                limitsPending ||
                !country ||
                isEntityCountryUnsupported ||
                isCountryUnavailable
              }
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
};

export default AfricaCollectionTopUp;
