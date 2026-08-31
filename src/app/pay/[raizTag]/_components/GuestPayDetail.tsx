"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import GuestPayAmount from "./GuestPayAmount";
import GuestTransferSummary from "./GuestTransferSummary";
import GuestPaymentInstructions from "./GuestPaymentInstructions";
import GuestSendStatusModal from "./GuestSendStatusModal";
import {
  buildAfricaPayinSessionSnapshot,
  clearAfricaPayinSession,
  isCancelledAfricaPayinStatus,
  isSuccessAfricaPayinStatus,
  isTerminalAfricaPayinStatus,
  normalizeAfricaPayinStep,
  saveAfricaPayinSession,
  useGuestSendStore,
} from "@/store/GuestSend";
import { GuestAfricaPayinStep } from "@/store/GuestSend/guestSendSlice.types";
import { IBusinessPaymentData } from "@/types/services";
import { useMutation } from "@tanstack/react-query";
import {
  DenyAfricaPayinApi,
  FinalizeAfricaPayinApi,
  GetAfricaPayinStatus,
} from "@/services/business";
import { toast } from "sonner";
import { mapAfricaPayinError } from "./africaPayinUtils";
import { getCurrencySymbol } from "@/utils/helpers";
import Button from "@/components/ui/Button";
import { GuestPayStatusType } from "@/types/transactions";

interface Props {
  close: () => void;
  data: IBusinessPaymentData;
  step: GuestAfricaPayinStep;
  setStep: (v: GuestAfricaPayinStep) => void;
  goBack: () => void;
  username: string;
}

const POLL_INTERVAL_MS = 8000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

const GuestPayDetail = ({
  close,
  data,
  step,
  setStep,
  goBack,
  username,
}: Props) => {
  const [paymentError, setPaymentError] = useState("");
  const {
    amount,
    payout_currency,
    status,
    actions,
    payin_id,
    payment_instruction,
  } = useGuestSendStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);

  const persistSession = useCallback(
    (nextStep?: GuestAfricaPayinStep) => {
      if (nextStep) {
        actions.setField("lifecycleStep", nextStep);
      }
      const snapshot = buildAfricaPayinSessionSnapshot(username);
      if (snapshot) {
        saveAfricaPayinSession(username, {
          ...snapshot,
          lifecycleStep: nextStep || snapshot.lifecycleStep,
        });
      }
    },
    [actions, username],
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollStartedAtRef.current = null;
  }, []);

  const handleDone = useCallback(() => {
    stopPolling();
    clearAfricaPayinSession(username);
    actions.resetPaymentSession();
    setStep("details");
    close();
  }, [actions, close, setStep, stopPolling, username]);

  const handleRestart = useCallback(() => {
    stopPolling();
    clearAfricaPayinSession(username);
    actions.resetPaymentSession();
    setPaymentError("");
    setStep("details");
    goBack();
  }, [actions, goBack, setStep, stopPolling, username]);

  const applyStatus = useCallback(
    (nextStatus: string) => {
      actions.setField("status", nextStatus as GuestPayStatusType);
      if (isSuccessAfricaPayinStatus(nextStatus) || nextStatus === "failed") {
        stopPolling();
        setStep("status");
        persistSession("status");
        if (nextStatus === "failed") {
          setPaymentError("Payment failed. Please try again.");
        }
        return;
      }
      if (isCancelledAfricaPayinStatus(nextStatus)) {
        stopPolling();
        setStep("status");
        persistSession("status");
        return;
      }
      if (nextStatus === "pending") {
        setStep("instructions");
        persistSession("instructions");
      }
    },
    [actions, persistSession, setStep, status, stopPolling],
  );

  const fetchStatusOnce = useCallback(async () => {
    if (!payin_id) return null;
    try {
      const nextStatus = await GetAfricaPayinStatus(payin_id);
      if (nextStatus) applyStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      const mapped = mapAfricaPayinError(error);
      setPaymentError(mapped.message);
      return null;
    }
  }, [applyStatus, payin_id]);

  const startPolling = useCallback(() => {
    if (!payin_id || pollingRef.current) return;
    pollStartedAtRef.current = Date.now();
    pollingRef.current = setInterval(async () => {
      if (
        pollStartedAtRef.current &&
        Date.now() - pollStartedAtRef.current > POLL_TIMEOUT_MS
      ) {
        stopPolling();
        toast.info(
          "We’re still waiting for confirmation. You can leave this page and check again later.",
        );
        return;
      }
      const nextStatus = await fetchStatusOnce();
      if (isTerminalAfricaPayinStatus(nextStatus)) {
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [fetchStatusOnce, payin_id, stopPolling]);

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => FinalizeAfricaPayinApi(id),
    onSuccess: (res) => {
      actions.setFields({
        payin_id: res.payin_id,
        amount: String(res.amount),
        payout_amount: String(res.payout_amount ?? 0),
        rate: res.rate ?? 0,
        expires_at: res.expires_at,
        payout_currency: res.payout_currency,
        collection_account_number: res.collection_account_number || "",
        collection_bank_name: res.collection_bank_name || "",
        collection_account_name: res.collection_account_name || "",
        payment_instruction: res.payment_instruction || "",
        collection_method: res.collection_method || "",
        provider: res.provider || "",
        status: (res.transaction_status as GuestPayStatusType) || "pending",
        lifecycleStep: "instructions",
      });
      setStep("instructions");
      persistSession("instructions");
      startPolling();
      void fetchStatusOnce();
    },
    onError: async (error) => {
      const mapped = mapAfricaPayinError(error);
      if (mapped.kind === "already_finalized") {
        const nextStatus = await fetchStatusOnce();
        if (nextStatus === "pending" || payment_instruction) {
          setStep("instructions");
          persistSession("instructions");
          startPolling();
          return;
        }
        if (isTerminalAfricaPayinStatus(nextStatus)) {
          setStep("status");
          persistSession("status");
          return;
        }
      }
      if (mapped.kind === "expired") {
        toast.error(mapped.message);
        handleRestart();
        return;
      }
      toast.error(mapped.message);
      setPaymentError(mapped.message);
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => DenyAfricaPayinApi(id),
    onSuccess: () => {
      actions.setField("status", "cancelled");
      stopPolling();
      clearAfricaPayinSession(username);
      setStep("status");
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      toast.error(mapped.message);
      void fetchStatusOnce();
    },
  });

  const confirmReview = () => {
    if (!payin_id || finalizeMutation.isPending) return;
    finalizeMutation.mutate(payin_id);
  };

  const cancelPayment = () => {
    if (!payin_id) {
      handleRestart();
      return;
    }
    denyMutation.mutate(payin_id);
  };

  useEffect(() => {
    if (step === "instructions" && payin_id) {
      startPolling();
      void fetchStatusOnce();
    }
    return () => {
      if (step !== "instructions") stopPolling();
    };
  }, [step, payin_id, startPolling, fetchStatusOnce, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (payin_id) persistSession(step);
  }, [
    payin_id,
    step,
    amount,
    payout_currency,
    status,
    payment_instruction,
    persistSession,
  ]);

  const displayStep = () => {
    switch (step) {
      case "details":
        return (
          <GuestPayAmount
            close={goBack}
            goNext={() => {
              setStep("summary");
              persistSession("summary");
            }}
          />
        );
      case "summary":
        return (
          <GuestTransferSummary
            goBack={() => {
              setStep("details");
              persistSession("details");
            }}
            goNext={confirmReview}
            onCancel={cancelPayment}
            loading={finalizeMutation.isPending || denyMutation.isPending}
            recipientName={
              data?.account_user?.account_name ||
              data?.account_user?.username ||
              ""
            }
          />
        );
      case "instructions":
        return (
          <GuestPaymentInstructions
            onCancel={cancelPayment}
            cancelling={denyMutation.isPending}
          />
        );
      case "status":
        return (
          <GuestSendStatusModal
            status={status}
            amount={amount}
            currency={payout_currency}
            close={handleDone}
            error={paymentError}
            tryAgain={handleRestart}
            viewReceipt={() => setStep("receipt")}
            merchantName={
              data?.account_user?.account_name ||
              data?.account_user?.username ||
              ""
            }
          />
        );
      case "receipt":
        return (
          <section className="flex flex-col h-full mt-10">
            <h2 className="text-raiz-gray-950 text-[23px] font-semibold leading-10">
              Payment receipt
            </h2>
            <div className="mt-5 p-7 bg-[#EAECFF99] rounded-[20px] space-y-4">
              <div>
                <p className="text-sm text-gray-500">Amount paid</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {getCurrencySymbol(payout_currency)}
                  {Number(amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Recipient</p>
                <p className="text-lg font-semibold text-zinc-900 capitalize">
                  {data?.account_user?.account_name ||
                    data?.account_user?.username}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reference</p>
                <p className="text-sm font-medium text-zinc-900 break-all">
                  {payin_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold text-zinc-900 capitalize">
                  {isSuccessAfricaPayinStatus(status) ? "Complete" : status}
                </p>
              </div>
            </div>
            <div className="mt-auto pb-2">
              <Button onClick={handleDone}>Done</Button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return <>{displayStep()}</>;
};

export default GuestPayDetail;
