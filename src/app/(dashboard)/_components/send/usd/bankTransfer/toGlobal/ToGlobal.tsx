"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ToUsdBanksStepsType } from "../toBanks/ToUsdBanks";
import { bankTypeProp } from "../BankTransfer";
import { useSendStore } from "@/store/Send";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GetMinAmountApi,
  SendInternationalInitialPayout,
} from "@/services/transactions";
import AddBeneficiary from "../toBanks/AddBeneficiary";
import Categories from "@/components/transactions/Categories";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import InternationalSendSummary from "@/components/transactions/InternationalSendSummary";
import InternationalSendMoney from "@/components/transactions/InternationalSendMoney";
import InternationPayout from "../toInternational/InternationalPayout";
import { IInitialPayoutResponse, IntCurrencyCode } from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";
import { mapRemittanceError } from "@/utils/remittancePayoutErrors";
import { toast } from "sonner";

interface Props {
  close: () => void;
  bankType: bankTypeProp;
}

const ToGlobal = ({ close, bankType }: Props) => {
  const [step, setStep] = useState<ToUsdBanksStepsType>("add-beneficiary");
  const [paymentError, setPaymentError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRequoting, setIsRequoting] = useState(false);
  const [paymentInitiationData, setPaymentInitiationData] =
    useState<IInitialPayoutResponse | null>(null);
  const hasRequotedRef = useRef(false);
  const isFirstInitiateRef = useRef(true);
  const {
    intBeneficiary,
    actions,
    amount,
    currency,
    status,
    transactionDetail,
  } = useSendStore();

  useEffect(() => {
    if (bankType) {
      setTimeout(() => setStep("add-beneficiary"), 200);
    }
  }, [bankType]);

  const { data } = useQuery({
    queryKey: [
      "min-Amount",
      intBeneficiary?.foreign_payout_beneficiary?.beneficiary_currency,
    ],
    queryFn: ({ queryKey }) => {
      const [, currencyCode] = queryKey as [string, IntCurrencyCode];
      return GetMinAmountApi(currencyCode);
    },
    enabled: !!intBeneficiary?.foreign_payout_beneficiary?.beneficiary_currency,
  });

  const InitiatePayMutation = useMutation({
    mutationFn: () =>
      SendInternationalInitialPayout({
        foreign_payout_beneficiary_id:
          intBeneficiary?.foreign_payout_beneficiary_id || null,
        amount: parseFloat(amount),
      }),
    onSuccess: (response) => {
      if (!response?.payout_initiation_id) {
        toast.error(
          getApiErrorMessage(
            { data: response },
            "Unable to start this transfer.",
          ),
        );
        return;
      }
      setTimeLeft(120);
      hasRequotedRef.current = false;
      setPaymentInitiationData(response);
      if (isFirstInitiateRef.current) {
        setStep("category");
      }
    },
    onError: (error) => {
      const remittanceError = mapRemittanceError(
        error,
        "Unable to start this transfer.",
      );
      if (remittanceError.kind === "minimum_amount") {
        toast.error(remittanceError.message);
        setStep("details");
        return;
      }
      if (remittanceError.kind === "beneficiary_not_found") {
        toast.error(remittanceError.message);
        setStep("add-beneficiary");
        return;
      }
      if (remittanceError.kind === "missing_wallet") {
        toast.error(remittanceError.message);
        return;
      }
      if (remittanceError.kind === "temporary") {
        toast.error(remittanceError.message);
        return;
      }
    },
  });

  const requotePayout = useCallback(async () => {
    if (
      !intBeneficiary ||
      !amount ||
      InitiatePayMutation.isPending ||
      isRequoting
    ) {
      return;
    }
    setIsRequoting(true);
    isFirstInitiateRef.current = false;
    try {
      const response = await InitiatePayMutation.mutateAsync();
      if (response?.payout_initiation_id) {
        toast.success("Quote refreshed.");
      }
    } catch (error) {
      const remittanceError = mapRemittanceError(
        error,
        "Unable to refresh quote.",
      );
      toast.error(remittanceError.message);
    } finally {
      setIsRequoting(false);
    }
  }, [InitiatePayMutation, amount, intBeneficiary, isRequoting]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => Math.max(prev - 1, 0));
      }, 1000);
      return () => clearInterval(timerId);
    }

    if (
      timeLeft === 0 &&
      paymentInitiationData &&
      intBeneficiary &&
      (step === "summary" || step === "pay") &&
      !hasRequotedRef.current
    ) {
      hasRequotedRef.current = true;
      toast.info("Quote expired. Refreshing rate...");
      void requotePayout();
    }
  }, [
    timeLeft,
    paymentInitiationData,
    intBeneficiary,
    step,
    requotePayout,
  ]);

  useEffect(() => {
    if (intBeneficiary) {
      setStep("details");
    }
  }, [intBeneficiary]);

  const goBackToStep2 = () => {
    actions.selectIntBeneficiary(null);
    actions.setAmountAndRemark({ amount: "", purpose: "" });
    setPaymentInitiationData(null);
    setTimeLeft(0);
    hasRequotedRef.current = false;
    setStep("add-beneficiary");
  };

  const initiatePayout = () => {
    isFirstInitiateRef.current = true;
    InitiatePayMutation.mutate();
  };

  const handleDone = () => {
    actions.reset("USD");
    actions.selectUSDSendOption(null);
    close();
  };

  const summaryProps = {
    fee: paymentInitiationData?.fees || 0,
    paymentData: paymentInitiationData || undefined,
    timeLeft,
    isRequoting,
    isExpired: timeLeft <= 0 && !isRequoting,
  };

  const displayStep = () => {
    switch (step) {
      case "add-beneficiary":
        return bankType && <AddBeneficiary type={bankType} close={close} />;
      case "details":
        return (
          <InternationalSendMoney
            goBack={goBackToStep2}
            goNext={initiatePayout}
            fee={paymentInitiationData?.raiz_charge || 0}
            loading={InitiatePayMutation.isPending}
            minAmount={data}
          />
        );
      case "category":
        return (
          <Categories
            goBack={() => setStep("details")}
            goNext={() => setStep("summary")}
            loading={false}
          />
        );
      case "summary":
        return (
          paymentInitiationData && (
            <InternationalSendSummary
              goBack={() => setStep("category")}
              goNext={() => setStep("pay")}
              {...summaryProps}
            />
          )
        );
      case "pay":
        return (
          <>
            {paymentInitiationData && (
              <InternationalSendSummary
                goBack={() => setStep("category")}
                goNext={() => setStep("pay")}
                {...summaryProps}
              />
            )}
            <InternationPayout
              paymentInitiationId={
                paymentInitiationData?.payout_initiation_id || ""
              }
              goNext={() => setStep("status")}
              close={() => setStep("summary")}
              setPaymentError={setPaymentError}
              fee={paymentInitiationData?.raiz_charge || 0}
              disabled={timeLeft <= 0 || isRequoting}
            />
          </>
        );
      case "status":
        return (
          currency &&
          intBeneficiary && (
            <>
              {paymentInitiationData && (
                <InternationalSendSummary
                  goBack={() => setStep("category")}
                  goNext={() => setStep("pay")}
                  {...summaryProps}
                />
              )}
              <PaymentStatusModal
                status={status}
                amount={parseFloat(amount)}
                currency={
                  intBeneficiary?.foreign_payout_beneficiary
                    ?.beneficiary_currency
                }
                user={intBeneficiary}
                close={handleDone}
                error={paymentError}
                tryAgain={() => setStep("summary")}
                viewReceipt={() => setStep("receipt")}
                type="external"
              />
            </>
          )
        );
      case "receipt":
        return (
          transactionDetail && (
            <RaizReceipt data={transactionDetail} close={handleDone} />
          )
        );
      default:
        break;
    }
  };

  return <>{displayStep()}</>;
};

export default ToGlobal;
