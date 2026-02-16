"use client";
import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";

interface Props {
  close: () => void;
  bankType: bankTypeProp;
}

const ToGlobal = ({ close, bankType }: Props) => {
  const [step, setStep] = useState<ToUsdBanksStepsType>("add-beneficiary");
  const [paymentError, setPaymentError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [paymentInitiationData, setPaymentInitiationData] =
    useState<IInitialPayoutResponse | null>(null);
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

  useEffect(() => {
    if (timeLeft === 0 && intBeneficiary) {
      toast.info("Timed out! Please restart  process.");
      setStep("add-beneficiary");
      actions.selectIntBeneficiary(null);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  useEffect(() => {
    if (intBeneficiary) {
      setStep("details");
    }
  }, [intBeneficiary]);

  const goBackToStep2 = () => {
    actions.selectIntBeneficiary(null);
    actions.setAmountAndRemark({ amount: "", purpose: "" });
    setStep("add-beneficiary");
  };

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
      setTimeLeft(120);
      setPaymentInitiationData(response);
      setStep("category");
    },
  });
  const initiatePayout = () => {
    InitiatePayMutation.mutate();
  };

  const handleDone = () => {
    actions.reset("USD");
    actions.selectUSDSendOption(null);
    close();
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
              // cofirm if to use raiz charge or fee
              fee={paymentInitiationData?.fees || 0}
              paymentData={paymentInitiationData}
              timeLeft={timeLeft}
            />
          )
        );
      case "pay":
        return (
          <InternationPayout
            paymentInitiationId={
              paymentInitiationData?.payout_initiation_id || ""
            }
            goNext={() => setStep("status")}
            close={() => setStep("summary")}
            setPaymentError={setPaymentError}
            fee={paymentInitiationData?.raiz_charge || 0}
          />
        );
      case "status":
        return (
          currency &&
          intBeneficiary && (
            <PaymentStatusModal
              status={status}
              amount={parseFloat(amount)}
              currency={
                intBeneficiary?.foreign_payout_beneficiary?.beneficiary_currency
              }
              user={intBeneficiary}
              close={handleDone}
              error={paymentError}
              tryAgain={() => setStep("details")}
              viewReceipt={() => setStep("receipt")}
              type="external"
            />
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
