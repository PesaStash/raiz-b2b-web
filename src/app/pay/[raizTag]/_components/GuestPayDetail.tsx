"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import GuestPayAmount from "./GuestPayAmount";
import GuestTransferSummary from "./GuestTransferSummary";
import GuestPaymentInstructions from "./GuestPaymentInstructions";
import GuestSendStatusModal from "./GuestSendStatusModal";
import GuestPayerEmail from "./GuestPayerEmail";
import GuestPayerRegister from "./GuestPayerRegister";
import GuestPayerVerify from "./GuestPayerVerify";
import {
  buildAfricaPayinSessionSnapshot,
  clearAfricaPayinSession,
  isCancelledAfricaPayinStatus,
  isExpiredAfricaPayinStatus,
  isPendingPaymentAfricaPayinStatus,
  isProcessingAfricaPayinStatus,
  isSuccessAfricaPayinStatus,
  isTerminalAfricaPayinStatus,
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
  RequestRaizPaymentsPayerEmailOtpApi,
} from "@/services/business";
import { toast } from "sonner";
import { mapAfricaPayinError } from "./africaPayinUtils";
import { getAppRatingLink, getCurrencySymbol } from "@/utils/helpers";
import Button from "@/components/ui/Button";
import { GuestPayStatusType } from "@/types/transactions";

interface Props {
  close: () => void;
  data: IBusinessPaymentData;
  step: GuestAfricaPayinStep;
  setStep: (v: GuestAfricaPayinStep) => void;
  goBack: () => void;
  username: string;
  onNigeriaPalmPay?: () => void;
  onPayerReady?: () => void;
  onBackToAmount?: () => void;
}

const POLL_INTERVAL_MS = 20000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

const GuestPayDetail = ({
  close,
  data,
  step,
  setStep,
  goBack,
  username,
  onNigeriaPalmPay,
  onPayerReady,
  onBackToAmount,
}: Props) => {
  const [paymentError, setPaymentError] = useState("");
  const {
    amount,
    local_amount,
    payout_currency,
    status,
    actions,
    payin_id,
    payment_instruction,
    payer_email,
  } = useGuestSendStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartedAtRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(true);

  const persistSession = useCallback(
    (nextStep?: GuestAfricaPayinStep) => {
      if (!sessionActiveRef.current) return;
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

  const requestOtpAndVerify = useCallback(async () => {
    const email = payer_email || useGuestSendStore.getState().payer_email;
    if (!email) {
      setStep("payer_email");
      return;
    }
    try {
      await RequestRaizPaymentsPayerEmailOtpApi(email);
      toast.success("OTP sent to your email");
    } catch (error) {
      const mapped = mapAfricaPayinError(error);
      toast.error(mapped.message);
    }
    setStep("payer_verify");
    persistSession("payer_verify");
  }, [payer_email, persistSession, setStep]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollStartedAtRef.current = null;
  }, []);

  const handleDone = useCallback(() => {
    const currentStatus = useGuestSendStore.getState().status;
    sessionActiveRef.current = false;
    stopPolling();
    clearAfricaPayinSession(username);
    setStep("payer_email");
    close();
    actions.resetPaymentSession();
    if (
      isPendingPaymentAfricaPayinStatus(currentStatus) ||
      isProcessingAfricaPayinStatus(currentStatus)
    ) {
      toast.success(
        "The payment will be received when the transfer is completed.",
      );
    }
  }, [actions, close, setStep, stopPolling, username]);

  const handleSuccessDone = useCallback(() => {
    sessionActiveRef.current = false;
    stopPolling();
    clearAfricaPayinSession(username);
    setStep("payer_email");
    close();
    actions.resetPaymentSession();
    window.location.assign(getAppRatingLink());
  }, [actions, close, setStep, stopPolling, username]);

  const handleRestart = useCallback(() => {
    sessionActiveRef.current = false;
    stopPolling();
    clearAfricaPayinSession(username);
    actions.resetPaymentSession();
    setPaymentError("");
    setStep("payer_email");
    goBack();
  }, [actions, goBack, setStep, stopPolling, username]);

  const applyStatus = useCallback(
    (nextStatus: string) => {
      if (!sessionActiveRef.current) return;
      if (!useGuestSendStore.getState().payin_id) return;
      actions.setField("status", nextStatus as GuestPayStatusType);
      if (
        isSuccessAfricaPayinStatus(nextStatus) ||
        nextStatus === "failed" ||
        isExpiredAfricaPayinStatus(nextStatus)
      ) {
        stopPolling();
        setStep("status");
        persistSession("status");
        if (nextStatus === "failed") {
          setPaymentError("Payment failed. Please try again.");
        }
        if (isExpiredAfricaPayinStatus(nextStatus)) {
          setPaymentError("This payment expired. Please start a new payment.");
        }
        return;
      }
      if (isCancelledAfricaPayinStatus(nextStatus)) {
        stopPolling();
        clearAfricaPayinSession(username);
        actions.resetPaymentSession();
        setPaymentError("");
        setStep("payer_email");
        goBack();
        return;
      }
      if (
        nextStatus === "pending" ||
        nextStatus === "process" ||
        nextStatus === "processing"
      ) {
        setStep("instructions");
        persistSession("instructions");
      }
    },
    [actions, goBack, persistSession, setStep, stopPolling, username],
  );

  const fetchStatusOnce = useCallback(async () => {
    const id = payin_id;
    if (!id || !sessionActiveRef.current) return null;
    try {
      const nextStatus = await GetAfricaPayinStatus(id);
      if (!sessionActiveRef.current) return null;
      if (useGuestSendStore.getState().payin_id !== id) return null;
      if (nextStatus) applyStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      const mapped = mapAfricaPayinError(error);
      setPaymentError(mapped.message);
      return null;
    }
  }, [applyStatus, payin_id]);

  const startPolling = useCallback(() => {
    if (!payin_id || pollingRef.current || !sessionActiveRef.current) return;
    pollStartedAtRef.current = Date.now();
    pollingRef.current = setInterval(async () => {
      if (!sessionActiveRef.current) {
        stopPolling();
        return;
      }
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
        // Keep initiate USD/local amounts; finalize may return an older shape.
        expires_at: res.expires_at,
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
      if (mapped.kind === "nigeria_palmpay") {
        toast.error(mapped.message);
        onNigeriaPalmPay?.();
        return;
      }
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
      if (mapped.kind === "payer_verification_required") {
        void requestOtpAndVerify();
        return;
      }
      if (mapped.kind === "payer_not_found") {
        setStep("payer_register");
        return;
      }
      toast.error(mapped.message);
      setPaymentError(mapped.message);
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => DenyAfricaPayinApi(id),
    onSuccess: () => {
      toast.success("Payment cancelled");
      handleRestart();
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
    if (payin_id) {
      sessionActiveRef.current = true;
    }
  }, [payin_id]);

  useEffect(() => {
    if (step === "instructions" && payin_id && sessionActiveRef.current) {
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
    // Never re-persist a cancelled payin — cancel clears storage, and this
    // effect previously rewrote the session because payin_id was still set.
    if (!payin_id || !sessionActiveRef.current) return;
    if (isCancelledAfricaPayinStatus(status)) {
      clearAfricaPayinSession(username);
      return;
    }
    persistSession(step);
  }, [
    payin_id,
    step,
    amount,
    local_amount,
    payout_currency,
    status,
    payment_instruction,
    persistSession,
    username,
  ]);

  const displayStep = () => {
    switch (step) {
      case "payer_email":
        return (
          <GuestPayerEmail
            goBack={goBack}
            onNeedRegister={() => {
              setStep("payer_register");
              persistSession("payer_register");
            }}
            onNeedVerify={() => {
              setStep("payer_verify");
              persistSession("payer_verify");
            }}
            onVerified={() => {
              if (onPayerReady) {
                onPayerReady();
                return;
              }
              setStep("details");
              persistSession("details");
            }}
          />
        );
      case "payer_register":
        return (
          <GuestPayerRegister
            goBack={() => setStep("payer_email")}
            goNext={() => {
              setStep("payer_verify");
              persistSession("payer_verify");
            }}
            onVerified={() => {
              if (onPayerReady) {
                onPayerReady();
                return;
              }
              setStep("details");
              persistSession("details");
            }}
          />
        );
      case "payer_verify":
        return (
          <GuestPayerVerify
            goBack={() =>
              setStep(
                useGuestSendStore.getState().payer_exists
                  ? "payer_email"
                  : "payer_register",
              )
            }
            goNext={() => {
              if (onPayerReady) {
                onPayerReady();
                return;
              }
              setStep("details");
              persistSession("details");
            }}
          />
        );
      case "details":
        return (
          <GuestPayAmount
            close={() => {
              if (onBackToAmount) {
                onBackToAmount();
                return;
              }
              setStep("payer_email");
              persistSession("payer_email");
            }}
            goNext={() => {
              setStep("summary");
              persistSession("summary");
            }}
            onNigeriaPalmPay={onNigeriaPalmPay}
            onNeedVerify={() => {
              void requestOtpAndVerify();
            }}
            onNeedRegister={() => setStep("payer_register")}
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
            loading={finalizeMutation.isPending}
            recipientName={
              data?.account_user?.account_name ||
              data?.account_user?.username ||
              ""
            }
          />
        );
      case "instructions":
        if (!payin_id) return null;
        return (
          <GuestPaymentInstructions
            onCancel={cancelPayment}
            onDone={handleDone}
            cancelling={denyMutation.isPending}
          />
        );
      case "status":
        return (
          <GuestSendStatusModal
            status={status}
            amount={amount}
            currency="USD"
            close={handleDone}
            onSuccessDone={handleSuccessDone}
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
                <p className="text-sm text-gray-500">Amount sent</p>
                <p className="text-lg font-semibold text-zinc-900">
                  $
                  {Number(amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Local amount paid</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {getCurrencySymbol(payout_currency)}
                  {Number(local_amount).toLocaleString()}
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
              <Button
                onClick={
                  isSuccessAfricaPayinStatus(status)
                    ? handleSuccessDone
                    : handleDone
                }
              >
                Done
              </Button>
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
