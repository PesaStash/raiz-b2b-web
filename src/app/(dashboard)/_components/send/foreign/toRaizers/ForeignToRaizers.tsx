"use client";

import FindRecipients from "@/components/transactions/FindRecipients";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import Categories from "@/components/transactions/Categories";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import SendMoney from "@/components/transactions/SendMoney";
import SendSummary from "@/components/transactions/SendSummary";
import { useP2PBeneficiaries } from "@/lib/hooks/useP2pBeneficiaries";
import { useUser } from "@/lib/hooks/useUser";
import { ICurrencyName } from "@/types/misc";
import { findWalletByCurrency } from "@/utils/helpers";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { AnimatePresence } from "motion/react";
import * as motion from "motion/react-client";
import React, { useEffect, useState } from "react";
import Payout from "../../usd/toRaizers/Payout";
import { SendToRaizStepType } from "../../usd/toRaizers/ToRaizers";

const ForeignToRaizers = () => {
  const {
    actions,
    user: selectedUser,
    status,
    amount,
    currency,
    transactionDetail,
  } = useSendStore();
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const [step, setStep] = useState<SendToRaizStepType>("select-user");
  const [paymentError, setPaymentError] = useState("");
  const currentWallet = findWalletByCurrency(
    user,
    selectedCurrency.name as ICurrencyName,
  );

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
    actions.reset(selectedCurrency.name);
    actions.selectForeignSendOption("to Raizer");
    setStep("select-user");
  };

  const stepInitial = { opacity: 0, scale: 0.95, y: 20 };
  const stepAnimate = { opacity: 1, scale: 1, y: 0 };
  const stepExit = { opacity: 0, scale: 0.95, y: 20 };
  const shouldAnimate = !["status", "pay"].includes(step);

  const handleDone = () => {
    actions.reset(selectedCurrency.name);
    actions.selectForeignSendOption("to Raizer");
    setStep("select-user");
  };

  const displayStep = () => {
    switch (step) {
      case "select-user":
        return (
          <FindRecipients
            recentUsers={recents || []}
            beneficiaries={favourites || []}
            setSelectedUser={actions.selectUser}
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
            <RaizReceipt close={handleDone} data={transactionDetail} />
          )
        );
      default:
        break;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={shouldAnimate ? stepInitial : false}
        animate={stepAnimate}
        exit={shouldAnimate ? stepExit : {}}
        transition={
          shouldAnimate
            ? {
                type: "spring",
                stiffness: 260,
                damping: 30,
              }
            : { duration: 0 }
        }
        className="w-full h-full"
      >
        {displayStep()}
      </motion.div>
    </AnimatePresence>
  );
};

export default ForeignToRaizers;
