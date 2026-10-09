"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import { useUser } from "@/lib/hooks/useUser";
import { useEligibleNgnPayoutWallets } from "@/lib/hooks/useEligibleNgnPayoutWallets";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { InitializePaystackCardCollectionApi } from "@/services/transactions";
import {
  PAYSTACK_DESCRIPTION_MAX_LENGTH,
  caretAfterSignificantChars,
  createIdempotencyKeyTracker,
  formatAmountInput,
  formatDecimalMoney,
  mapPaystackCollectionError,
  normalizePaystackAmount,
  sanitizedErrorCode,
} from "@/lib/paystackCardCollection";
import {
  buildPendingPaystackCheckout,
  loadPendingPaystackCheckout,
  savePendingPaystackCheckout,
} from "@/lib/paystackCheckoutSession";
import type {
  PaystackCardCollectionInitializeRequest,
  PaystackCardCollectionInitializeResponse,
  PaystackCollectionError,
  PendingPaystackCheckout,
} from "@/types/paystackCardCollection";
import { trackPaystackFunding } from "@/utils/analytics/paystackFunding";
import PaystackFundingStatus from "./PaystackFundingStatus";

type Step = "setup" | "review" | "status";

interface Props {
  close: () => void;
  goBack?: () => void;
}

const AMOUNT_INPUT_PATTERN = /^\d*\.?\d{0,2}$/;

const PaystackCardTopUp = ({ close, goBack }: Props) => {
  const qc = useQueryClient();
  const { user } = useUser();
  const { selectedWallet } = useCurrencyStore();
  const entityId = user?.business_account?.entity_id ?? "";
  const eligibleWallets = useEligibleNgnPayoutWallets(user);

  const [step, setStep] = useState<Step>("setup");
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<PaystackCollectionError | null>(null);
  const [amountError, setAmountError] = useState("");
  const [restrictedWalletIds, setRestrictedWalletIds] = useState<string[]>([]);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [checkout, setCheckout] = useState<PaystackCardCollectionInitializeResponse | null>(null);
  const [checkoutWalletId, setCheckoutWalletId] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<PendingPaystackCheckout | null>(null);
  const keyTrackerRef = useRef(createIdempotencyKeyTracker());
  const submittingRef = useRef(false);

  const availableWallets = useMemo(
    () => eligibleWallets.filter((wallet) => !restrictedWalletIds.includes(wallet.wallet_id)),
    [eligibleWallets, restrictedWalletIds],
  );

  useEffect(() => {
    trackPaystackFunding("paystack_card_funding_opened");
  }, []);

  useEffect(() => {
    setPendingCheckout(loadPendingPaystackCheckout(entityId));
  }, [entityId]);

  // Back navigation from Paystack can restore this page from the bfcache with
  // the redirect spinner still showing; hand over to the dashboard resume flow.
  useEffect(() => {
    if (!redirecting) return;
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) close();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [redirecting, close]);

  useEffect(() => {
    if (walletId && availableWallets.some((wallet) => wallet.wallet_id === walletId)) return;
    const preferred =
      availableWallets.find((wallet) => wallet.wallet_id === selectedWallet?.wallet_id) ??
      (availableWallets.length === 1 ? availableWallets[0] : undefined);
    setWalletId(preferred?.wallet_id ?? "");
  }, [availableWallets, selectedWallet?.wallet_id, walletId]);

  const walletOptions = availableWallets.map((wallet) => ({
    value: wallet.wallet_id,
    label: `${wallet.wallet_name || wallet.account_name || "NGN wallet"} · ${wallet.account_number}`,
  }));

  const initializeMutation = useMutation({
    mutationFn: InitializePaystackCardCollectionApi,
    onSuccess: (res, variables) => {
      setCheckout(res);
      setCheckoutWalletId(variables.data.wallet_id);
      setStep("review");
      trackPaystackFunding("paystack_card_funding_initialized", {
        collection_id: res.collection_id,
        reference: res.reference,
        wallet_id: variables.data.wallet_id,
        principal_amount: res.principal_amount,
        fee_amount: res.fee_amount,
        total_amount: res.total_amount,
        status: res.status,
      });
    },
    onError: (error, variables) => {
      const mapped = mapPaystackCollectionError(error);
      console.warn("[paystack-card-funding]", { error_code: sanitizedErrorCode(mapped) });
      setFormError(mapped);
      switch (mapped.kind) {
        case "wallet_reselect":
        case "wallet_not_ready":
          qc.invalidateQueries({ queryKey: ["user"] });
          setWalletId("");
          break;
        case "wallet_restricted":
          setRestrictedWalletIds((ids) => [...ids, variables.data.wallet_id]);
          break;
        case "account_restricted":
        case "verification_required":
        case "rate_limited":
        case "not_configured":
          setBlockedMessage(mapped.message);
          break;
        default:
          break;
      }
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || initializeMutation.isPending || blockedMessage) return;
    setFormError(null);
    setAmountError("");

    const normalized = normalizePaystackAmount(amount);
    if (!normalized) {
      setAmountError("Enter an amount greater than zero with at most two decimal places.");
      return;
    }
    if (!walletId) {
      setFormError({ kind: "wallet_reselect", message: "Please select an NGN wallet to fund.", canRetry: false });
      return;
    }

    const trimmed = description.trim();
    const data: PaystackCardCollectionInitializeRequest = {
      wallet_id: walletId,
      amount: normalized,
      ...(trimmed ? { description: trimmed } : {}),
    };
    submittingRef.current = true;
    trackPaystackFunding("paystack_card_funding_initialize_started", {
      wallet_id: walletId,
      principal_amount: normalized,
    });
    initializeMutation.mutate({ data, idempotencyKey: keyTrackerRef.current.keyFor(data) });
  };

  const openCheckout = () => {
    if (!checkout || redirecting) return;
    let url: URL;
    try {
      url = new URL(checkout.authorization_url);
    } catch {
      setFormError({ kind: "unknown", message: "We couldn't open the payment page. Please try again.", canRetry: false });
      return;
    }
    if (url.protocol !== "https:") {
      setFormError({ kind: "unknown", message: "We couldn't open the payment page. Please try again.", canRetry: false });
      return;
    }
    setRedirecting(true);
    savePendingPaystackCheckout(entityId, buildPendingPaystackCheckout(checkout, checkoutWalletId));
    trackPaystackFunding("paystack_card_funding_checkout_opened", {
      collection_id: checkout.collection_id,
      reference: checkout.reference,
      wallet_id: checkoutWalletId,
      principal_amount: checkout.principal_amount,
      fee_amount: checkout.fee_amount,
      total_amount: checkout.total_amount,
    });
    window.location.assign(checkout.authorization_url);
  };

  const startNewCheckout = () => {
    keyTrackerRef.current.reset();
    setCheckout(null);
    setPendingCheckout(null);
    setFormError(null);
    setStep("setup");
  };

  if (step === "status" && pendingCheckout) {
    return (
      <PaystackFundingStatus
        checkout={pendingCheckout}
        entityId={entityId}
        onClose={(acknowledged) => {
          if (acknowledged) setPendingCheckout(null);
          setStep("setup");
        }}
        onStartNew={startNewCheckout}
      />
    );
  }

  const header = (title: string, subtitle: string, onBack?: () => void) => (
    <div className="flex justify-between items-start mb-8 gap-4">
      <div className="flex items-start gap-3">
        {onBack && (
          <button onClick={onBack} aria-label="Go back" disabled={redirecting} className="mt-1">
            <Image src="/icons/arrow-left.svg" width={18} height={18} alt="" />
          </button>
        )}
        <div>
          <h3 className="text-zinc-900 text-xl font-bold leading-normal">{title}</h3>
          <p className="text-zinc-900 text-xs leading-tight">{subtitle}</p>
        </div>
      </div>
      <button onClick={close} aria-label="Close" disabled={redirecting}>
        <Image src="/icons/close.svg" width={16} height={16} alt="" />
      </button>
    </div>
  );

  if (step === "review" && checkout) {
    const principal = formatDecimalMoney(checkout.principal_amount);
    const fee = formatDecimalMoney(checkout.fee_amount);
    const total = formatDecimalMoney(checkout.total_amount);
    return (
      <Overlay close={redirecting ? () => {} : close} width="400px">
        <div className="flex flex-col h-full py-8 px-5">
          {header("Review card payment", "Confirm the amounts before continuing to Paystack.", () => {
            setFormError(null);
            setStep("setup");
          })}
          <dl className="space-y-4 p-5 rounded-[20px] bg-indigo-50">
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-zinc-600">Amount to wallet</dt>
              <dd className="text-sm font-semibold text-zinc-900">{principal}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-zinc-600">Card processing fee</dt>
              <dd className="text-sm font-semibold text-zinc-900">{fee}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-indigo-100 pt-4">
              <dt className="text-sm font-semibold text-zinc-900">Total card charge</dt>
              <dd className="text-base font-bold text-zinc-900">{total}</dd>
            </div>
          </dl>
          <p className="text-xs text-zinc-700 mt-4 leading-snug">
            You will receive {principal} in your NGN wallet. Your card will be charged {total}, including a {fee}{" "}
            processing fee.
          </p>
          <p className="text-xs text-zinc-500 mt-2 leading-snug">
            You&apos;ll enter your card details securely on Paystack. Raiz never sees your card information.
          </p>
          {formError && <ErrorMessage message={formError.message} />}
          <div className="mt-auto pt-6">
            <Button onClick={openCheckout} loading={redirecting} disabled={redirecting}>
              Continue to Paystack
            </Button>
          </div>
        </div>
      </Overlay>
    );
  }

  const fieldErrors = formError?.fieldErrors ?? {};
  const submitDisabled =
    initializeMutation.isPending || !!blockedMessage || !walletId || !amount || availableWallets.length === 0;

  return (
    <Overlay close={close} width="400px">
      <div className="flex flex-col h-full py-8 px-5 overflow-y-auto">
        {header("Debit card via Paystack", "Fund your NGN wallet with a Nigeria-issued card.", goBack)}

        {pendingCheckout && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200" role="status">
            <p className="text-sm text-zinc-900 font-semibold">You have a card payment in progress</p>
            <p className="text-xs text-zinc-700 mt-1 leading-snug">
              A payment of {formatDecimalMoney(pendingCheckout.principal_amount)} may still be processing. Check its
              status before starting another payment.
            </p>
            <button
              type="button"
              onClick={() => setStep("status")}
              className="mt-2 text-xs font-semibold text-indigo-900 underline"
            >
              Check status
            </button>
          </div>
        )}

        {blockedMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200" role="alert">
            <p className="text-sm text-zinc-900">{blockedMessage}</p>
          </div>
        )}

        <form className="flex flex-col gap-4 flex-1" onSubmit={handleSubmit} noValidate>
          {eligibleWallets.length === 0 && (
            <p className="text-sm text-zinc-700">
              You don&apos;t have an active NGN wallet that can receive card payments yet.
            </p>
          ) 
          // : (
          //   <div>
          //     <SelectField
          //       label="Wallet to fund"
          //       name="wallet_id"
          //       placeholder="Select NGN wallet"
          //       options={walletOptions}
          //       value={walletOptions.find((option) => option.value === walletId) ?? null}
          //       onChange={(option) => {
          //         setWalletId(String(option?.value ?? ""));
          //         setFormError(null);
          //       }}
          //       disabled={availableWallets.length <= 1}
          //       status={fieldErrors.wallet_id || formError?.kind === "wallet_reselect" ? "error" : null}
          //       helper={fieldErrors.wallet_id ?? null}
          //       isSearchable={false}
          //       height="auto"
          //     />
          //   </div>
          // )
          }

          <InputField
            label="Amount to wallet (NGN)"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="50,000.00"
            value={formatAmountInput(amount)}
            onChange={(e) => {
              const input = e.target;
              const caret = input.selectionStart ?? input.value.length;
              let significant = input.value.slice(0, caret).replace(/,/g, "").length;
              let next = input.value.replace(/,/g, "");

              // Deleting only a separator would leave the digits unchanged;
              // remove the neighbouring digit so Backspace/Delete still work.
              const inputType = (e.nativeEvent as InputEvent).inputType;
              if (next === amount && inputType === "deleteContentBackward" && significant > 0) {
                next = next.slice(0, significant - 1) + next.slice(significant);
                significant -= 1;
              } else if (next === amount && inputType === "deleteContentForward") {
                next = next.slice(0, significant) + next.slice(significant + 1);
              }

              const unpadded = next.replace(/^0+(?=\d)/, "");
              significant = Math.max(0, significant - (next.length - unpadded.length));
              next = unpadded;

              if (!AMOUNT_INPUT_PATTERN.test(next)) return;
              setAmount(next);
              setAmountError("");

              const position = caretAfterSignificantChars(formatAmountInput(next), significant);
              requestAnimationFrame(() => {
                if (document.activeElement === input) input.setSelectionRange(position, position);
              });
            }}
            status={amountError || fieldErrors.amount || formError?.kind === "amount_limit" ? "error" : null}
            errorMessage={amountError || fieldErrors.amount}
          />
          <p className="text-xs text-zinc-500 -mt-2">
            A card processing fee is added on the next screen. Your wallet receives the full amount above.
          </p>

          <InputField
            label="Description (optional)"
            name="description"
            placeholder="NGN wallet funding"
            maxLength={PAYSTACK_DESCRIPTION_MAX_LENGTH}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            status={fieldErrors.description ? "error" : null}
            errorMessage={fieldErrors.description}
          />

          {formError && !blockedMessage && <ErrorMessage message={formError.message} />}

          <div className="mt-auto pt-4">
            <Button
              type="submit"
              loading={initializeMutation.isPending}
              disabled={submitDisabled}
            >
              {formError?.canRetry ? "Try again" : "Continue"}
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
};

export default withBusinessWrite(PaystackCardTopUp);
