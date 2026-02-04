"use client";
import Categories from "@/components/transactions/Categories";
import RaizReceipt from "@/components/transactions/RaizReceipt";
// import SendSummary from "@/components/transactions/SendSummary";
import {
  GetCadTransactionFeeApi,
  GetTransactionFeeApi,
} from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ToUsdBanksStepsType } from "../../bankTransfer/toBanks/ToUsdBanks";
import UsdBankPay from "../../bankTransfer/toBanks/UsdBankPay";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import AddEftBeneficiary from "./AddEftBeneficiary";
import CadSendMoney from "../CadSendMoney";
import CadSendSummary from "../CadSendSummary";
import { toast } from "sonner";

interface Props {
  close: () => void;
}

const ToEft = ({}: Props) => {
  const [step, setStep] = useState<ToUsdBanksStepsType>("add-beneficiary");
  const [paymentError, setPaymentError] = useState("");
  const {
    usdBeneficiary,
    actions,
    amount,
    currency,
    status,
    transactionDetail,
  } = useSendStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (timeLeft === 0 && usdBeneficiary) {
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

  const goBackToStep1 = () => {
    actions.selectUsdBeneficiary(null);
    setStep("add-beneficiary");
  };
  const { data: rate, isLoading: rateLoading } = useQuery({
    queryKey: ["cad-transactions-rate", amount, currency],
    queryFn: () => GetCadTransactionFeeApi(Number(amount)),
    enabled: !!amount,
  });

  const { data: fee } = useQuery({
    queryKey: ["transactions-fee", amount],
    queryFn: () =>
      GetTransactionFeeApi(
        Number(amount),
        "USD",
        usdBeneficiary?.usd_beneficiary_id || ""
      ),
    enabled: !!amount,
  });

  useEffect(() => {
    if (!rateLoading && rate) {
      setTimeLeft(120);
    }
  }, [rateLoading, rate]);

  useEffect(() => {
    if (usdBeneficiary) {
      setStep("details");
    }
  }, [usdBeneficiary]);
  const handleDone = () => {
    actions.reset("USD");
    actions.selectUSDSendOption(null);
    close();
  };

  const displayScreen = () => {
    switch (step) {
      case "add-beneficiary":
        return <AddEftBeneficiary close={close} />;
      case "details":
        return (
          <CadSendMoney
            goBack={goBackToStep1}
            goNext={() => setStep("category")}
            rate={rate || 0}
            loading={rateLoading}
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
          // <SendSummary
          //   goBack={() => setStep("category")}
          //   goNext={() => setStep("pay")}
          //   fee={fee || 0}
          // />
          <CadSendSummary
            goBack={() => setStep("category")}
            goNext={() => setStep("pay")}
            fee={fee || 0}
            timeLeft={timeLeft}
            rate={rate || 0}
          />
        );
      case "pay":
        return (
          <UsdBankPay
            goNext={() => setStep("status")}
            close={() => setStep("summary")}
            setPaymentError={setPaymentError}
            fee={fee || 0}
          />
        );
      case "status":
        return (
          currency &&
          usdBeneficiary && (
            <PaymentStatusModal
              status={status}
              amount={parseFloat(amount)}
              currency={currency}
              user={usdBeneficiary}
              close={handleDone}
              error={paymentError}
              tryAgain={() => setStep("summary")}
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

  return <>{displayScreen()}</>;
};

export default ToEft;
