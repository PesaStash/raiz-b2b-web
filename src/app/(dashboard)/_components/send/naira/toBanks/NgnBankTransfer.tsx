"use client";
// import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import React, { useEffect, useState } from "react";
import SelectUser from "./SelectUser";
import SendMoney from "@/components/transactions/SendMoney";
import Categories from "@/components/transactions/Categories";
import { useQuery } from "@tanstack/react-query";
import { GetIntTransactionFeeApi } from "@/services/transactions";
import SendSummary from "@/components/transactions/SendSummary";
import ExternalPayout from "./ExternalPayout";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import RaizReceipt from "@/components/transactions/RaizReceipt";

type NGNSendToBankStepType =
  | "select-user"
  | "details"
  | "summary"
  | "category"
  | "pay"
  | "status"
  | "receipt";

const NgnBankTransfer = () => {
  const { externalUser, actions, amount, currency, status, transactionDetail } =
    useSendStore();
  const [step, setStep] = useState<NGNSendToBankStepType>("select-user");
  const [paymentError, setPaymentError] = useState("");
  const { data: fee } = useQuery({
    queryKey: ["transactions-fee", amount, currency],
    queryFn: () =>
      GetIntTransactionFeeApi(
        Number(amount),
        currency as "USD" | "NGN" | "WIRE",
      ),
    enabled: !!amount,
  });

  useEffect(() => {
    if (step === "select-user" && externalUser) {
      setStep("details");
    }
  }, [externalUser, step]);
  const goBackToStep1 = () => {
    actions.reset("NGN");
    setStep("select-user");
  };

  const handleDone = () => {
    actions.reset("NGN");
    actions.selectNGNSendOption("to Raizer");
    close();
  };

  //   const totalPayable = fee ? parseFloat(amount) + fee : 0;

  const displayStep = () => {
    switch (step) {
      case "select-user":
        return <SelectUser />;
      case "details":
        return (
          <SendMoney
            goBack={goBackToStep1}
            goNext={() => setStep("category")}
            fee={fee || 0}
            minAmount={100}
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
            fee={fee || 0}
          />
        );
      case "pay":
        return (
          <>
            <SendSummary
              goBack={() => setStep("category")}
              goNext={() => setStep("pay")}
              fee={fee || 0}
            />
            <ExternalPayout
              goNext={() => setStep("status")}
              close={() => setStep("summary")}
              setPaymentError={setPaymentError}
              fee={fee || 0}
            />
          </>
        );
      case "status":
        return (
          currency &&
          externalUser && (
            <>
              <SendSummary
                goBack={() => setStep("category")}
                goNext={() => setStep("pay")}
                fee={fee || 0}
              />
              <PaymentStatusModal
                status={status}
                amount={parseFloat(amount)}
                currency={currency}
                user={externalUser}
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
            <RaizReceipt close={handleDone} data={transactionDetail} />
          )
        );
      default:
        break;
    }
  };
  return (
    <div className=" p-6 overflow-y-auto mb-6 h-full no-scrollbar">
      {displayStep()}
    </div>
  );
};

export default NgnBankTransfer;
