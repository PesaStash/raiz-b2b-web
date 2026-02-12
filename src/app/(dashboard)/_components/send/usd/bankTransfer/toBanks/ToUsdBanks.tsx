import React, { useEffect, useState } from "react";
// import BankTypeModal from "./BankTypeModal";
// import SendOptions from "../SendOptions";
import AddBeneficiary from "./AddBeneficiary";
import { useSendStore } from "@/store/Send";
import SendMoney from "@/components/transactions/SendMoney";
import Categories from "@/components/transactions/Categories";
import SendSummary from "@/components/transactions/SendSummary";
import UsdBankPay from "./UsdBankPay";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import { useQuery } from "@tanstack/react-query";
import { GetTransactionFeeApi } from "@/services/transactions";
import { bankTypeProp } from "../BankTransfer";

export type ToUsdBanksStepsType =
  | "add-beneficiary"
  | "details"
  | "category"
  | "summary"
  | "pay"
  | "status"
  | "receipt";

interface Props {
  close: () => void;
  bankType: bankTypeProp;
}

const ToUsdBanks = ({ close, bankType }: Props) => {
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
  useEffect(() => {
    if (bankType) {
      setTimeout(() => setStep("add-beneficiary"), 200);
    }
  }, [bankType]);

  const { data: fee } = useQuery({
    queryKey: ["transactions-fee", amount, currency],
    queryFn: () =>
      GetTransactionFeeApi(
        Number(amount),
        currency as "USD" | "NGN" | "WIRE",
        usdBeneficiary?.usd_beneficiary_id || ""
      ),
    enabled: !!amount,
  });

  useEffect(() => {
    if (usdBeneficiary) {
      setStep("details");
    }
  }, [usdBeneficiary]);

  const goBackToStep2 = () => {
    actions.selectUsdBeneficiary(null);
    setStep("add-beneficiary");
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
          <SendMoney
            goBack={goBackToStep2}
            goNext={() => setStep("category")}
            fee={fee || 0}
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
            <RaizReceipt close={handleDone} data={transactionDetail} />
          )
        );
      default:
        break;
    }
  };

  return <>{displayStep()}</>;
};

export default ToUsdBanks;
