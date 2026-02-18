"use client";
import React, { useEffect, useState } from "react";
import { useSendStore } from "@/store/Send";
import FindRecipients from "@/components/transactions/FindRecipients";
import Categories from "@/components/transactions/Categories";
import SendSummary from "@/components/transactions/SendSummary";
import Payout from "./Payout";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import { useUser } from "@/lib/hooks/useUser";
import { useP2PBeneficiaries } from "@/lib/hooks/useP2pBeneficiaries";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import SendMoney from "@/components/transactions/SendMoney";

export type SendToRaizStepType =
  | "select-user"
  | "details"
  | "category"
  | "summary"
  | "pay"
  | "status"
  | "receipt";

const ToRaizers = ({ close }: { close: () => void }) => {
  const {
    actions,
    user: selectedUser,
    status,
    amount,
    currency,
    transactionDetail,
  } = useSendStore();
  const { user } = useUser();
  const [step, setStep] = useState<SendToRaizStepType>("select-user");
  const [paymentError, setPaymentError] = useState("");
  const currentWallet = useCurrentWallet(user);
  const { favourites, recents } = useP2PBeneficiaries({
    walletId: currentWallet?.wallet_id,
    limit: 50,
  });

  useEffect(() => {
    if (step === "select-user" && selectedUser) {
      setStep("details");
    }
  }, [step, selectedUser]);

  const goBackToStep1 = () => {
    actions.selectUser(null);
    actions.setAmountAndRemark({ amount: "", purpose: "" });
    setStep("select-user");
  };

  const handleDone = () => {
    actions.reset("USD");
    close();
  };

  const displayStep = () => {
    switch (step) {
      case "select-user":
        return (
          <FindRecipients
            recentUsers={recents}
            beneficiaries={favourites}
            setSelectedUser={actions.selectUser}
            header
            goBack={() => actions.selectUSDSendOption(null)}
          />
        );
      case "details":
        return (
          <SendMoney
            goBack={goBackToStep1}
            goNext={() => setStep("category")}
            fee={0}
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
            <Payout
              goNext={() => setStep("status")}
              close={() => setStep("summary")}
              setPaymentError={setPaymentError}
              fee={0}
            />
          </>
        );

      case "status":
        return (
          currency &&
          selectedUser && (
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
                user={selectedUser}
                close={handleDone}
                error={paymentError}
                tryAgain={() => setStep("summary")}
                viewReceipt={() => setStep("receipt")}
                type="p2p"
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

export default ToRaizers;
