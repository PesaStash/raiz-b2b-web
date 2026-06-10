"use client";

import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import Categories from "@/components/transactions/Categories";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import SendMoney from "@/components/transactions/SendMoney";
import SendSummary from "@/components/transactions/SendSummary";
import { FOREIGN_MIN_SEND_AMOUNT } from "@/constants/misc";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
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
  hideBeneficiaryHeader?: boolean;
}

export const FOREIGN_SEND_FEE = 5;

const ForeignBankSend = ({ close, hideBeneficiaryHeader }: Props) => {
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
  const { selectedCurrency } = useCurrencyStore();

  useEffect(() => {
    if (foreignBeneficiary) {
      setStep("details");
    }
  }, [foreignBeneficiary]);

  const handleDone = () => {
    actions.reset(currency || selectedCurrency.name);
    close();
  };

  const displayStep = () => {
    switch (step) {
      case "add-beneficiary":
        return (
          <ForeignBeneficiaryForm
            close={close}
            goNext={() => setStep("details")}
            hideHeader={hideBeneficiaryHeader}
          />
        );
      case "details":
        return (
          <SendMoney
            goBack={() => {
              actions.selectForeignBeneficiary(null);
              setStep("add-beneficiary");
            }}
            goNext={() => setStep("category")}
            fee={FOREIGN_SEND_FEE}
            minAmount={FOREIGN_MIN_SEND_AMOUNT}
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
            fee={FOREIGN_SEND_FEE}
          />
        );
      case "pay":
        return (
          <>
            <SendSummary
              goBack={() => setStep("category")}
              goNext={() => setStep("pay")}
              fee={FOREIGN_SEND_FEE}
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
                fee={FOREIGN_SEND_FEE}
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

export default ForeignBankSend;
