"use client";

import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import Categories from "@/components/transactions/Categories";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import SendMoney from "@/components/transactions/SendMoney";
import SendSummary from "@/components/transactions/SendSummary";
import { useSendStore } from "@/store/Send";
import React, { useEffect, useState } from "react";
import ForeignBeneficiaryForm from "./ForeignBeneficiaryForm";
import ForeignSendPay from "./ForeignSendPay";

export type ForeignSendStepsType =
  | "add-beneficiary"
  | "details"
  | "category"
  | "summary"
  | "pay"
  | "status"
  | "receipt";

interface Props {
  close: () => void;
}

const ForeignSend = ({ close }: Props) => {
  const [step, setStep] = useState<ForeignSendStepsType>("add-beneficiary");
  const [paymentError, setPaymentError] = useState("");
  const {
    foreignBeneficiary,
    actions,
    amount,
    currency,
    status,
    transactionDetail,
  } = useSendStore();

  useEffect(() => {
    if (foreignBeneficiary) {
      setStep("details");
    }
  }, [foreignBeneficiary]);

  const handleDone = () => {
    actions.reset(currency || "USD");
    close();
  };

  const displayStep = () => {
    switch (step) {
      case "add-beneficiary":
        return <ForeignBeneficiaryForm close={close} goNext={() => setStep("details")} />;
      case "details":
        return (
          <SendMoney
            goBack={() => {
              actions.selectForeignBeneficiary(null);
              setStep("add-beneficiary");
            }}
            goNext={() => setStep("category")}
            fee={0}
            minAmount={1}
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
          <SendSummary
            goBack={() => setStep("category")}
            goNext={() => setStep("pay")}
            fee={0}
          />
        );
      case "pay":
        return (
          <>
            <SendSummary
              goBack={() => setStep("category")}
              goNext={() => setStep("pay")}
              fee={0}
            />
            <ForeignSendPay
              goNext={() => setStep("status")}
              close={() => setStep("summary")}
              setPaymentError={setPaymentError}
            />
          </>
        );
      case "status":
        return (
          currency &&
          foreignBeneficiary && (
            <>
              <SendSummary
                goBack={() => setStep("category")}
                goNext={() => setStep("pay")}
                fee={0}
              />
              <PaymentStatusModal
                status={status}
                amount={parseFloat(amount)}
                currency={currency}
                user={foreignBeneficiary}
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
          transactionDetail && <RaizReceipt close={handleDone} data={transactionDetail} />
        );
      default:
        return null;
    }
  };

  return <>{displayStep()}</>;
};

export default ForeignSend;
