"use client";

import EnterPin from "@/components/transactions/EnterPin";
import { InitiateForeignWithdrawalApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ForeignCurrency, IForeignWithdrawalPayload } from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";
import {
  trackSendCompleted,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface Props {
  close: () => void;
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
}

const ForeignSendPay = ({ close, goNext, setPaymentError }: Props) => {
  const qc = useQueryClient();
  const { selectedCurrency } = useCurrencyStore();
  const [pin, setPin] = useState("");
  const { foreignBeneficiary, purpose, category, amount, actions } = useSendStore();
  const currency = selectedCurrency.name as ForeignCurrency;

  const foreignSendMutation = useMutation({
    mutationFn: (data: IForeignWithdrawalPayload) =>
      InitiateForeignWithdrawalApi(currency, data),
    onMutate: () => {
      actions.setStatus("loading");
      goNext();
    },
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["income-expense-chart"] });
      qc.invalidateQueries({ queryKey: ["transaction-report-categories"] });

      if (response?.transaction_status?.transaction_status === "completed") {
        actions.setStatus("success");
        trackSendCompleted({
          response,
          value: Number(amount),
          currency,
          recipientType: "external",
        });
      } else if (
        response?.transaction_status?.transaction_status === "pending"
      ) {
        actions.setStatus("pending");
      }

      actions.setTransactionDetail(response);
    },
    onError: (error) => {
      actions.setStatus("failed");
      setPaymentError(
        getApiErrorMessage(error, "Withdrawal failed. Please try again."),
      );
      trackTransactionFailed({
        transactionType: "send",
        error,
        value: Number(amount) || undefined,
        currency,
      });
    },
    onSettled: () => {
      goNext();
    },
  });

  const handleSend = () => {
    const payload: IForeignWithdrawalPayload = {
      transaction_reason: purpose,
      transaction_pin: pin,
      transaction_category_id: category?.transaction_category_id || 0,
      amount: Number(amount),
      foreign_currency_beneficiary_id:
        foreignBeneficiary?.foreign_currency_beneficiary_id || "",
    };

    foreignSendMutation.mutate(payload);
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return <EnterPin pin={pin} setPin={setPin} close={close} />;
};

export default ForeignSendPay;
