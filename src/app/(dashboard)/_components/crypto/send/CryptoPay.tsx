"use client";
import { SendCryptoApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { IChain } from "@/types/misc";
import { ISendCryptoPayload } from "@/types/services";
import { findWalletByCurrency } from "@/utils/helpers";
import {
  trackSendCompleted,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { sbcType } from "./CryptoSend";
import EnterPin from "@/components/transactions/EnterPin";
import { useUser } from "@/lib/hooks/useUser";

interface Props {
  close: () => void;
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  fee: number;
}

const CryptoPay = ({ close, goNext, setPaymentError }: Props) => {
  const [pin, setPin] = useState<string>("");
  const {
    purpose,
    category,
    amount,
    actions,
    cryptoAddress,
    cryptoNetwork,
    cryptoType,
  } = useSendStore();
  const qc = useQueryClient();
  const { user } = useUser();
  const wallet = findWalletByCurrency(user, "SBC");
  const SendMoneyMutation = useMutation({
    mutationFn: (data: ISendCryptoPayload) =>
      SendCryptoApi(data, wallet?.wallet_id || ""),
    onMutate: () => {
      actions.setStatus("loading");
      goNext();
    },
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      if (response?.transaction_status?.transaction_status === "completed") {
        actions.setStatus("success");
        trackSendCompleted({
          response,
          value: Number(amount),
          currency: "SBC",
          recipientType: "external",
        });
      } else if (
        response?.transaction_status?.transaction_status === "pending"
      ) {
        actions.setStatus("pending");
      }
      actions.setTransactionDetail(response);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (response: any) => {
      actions.setStatus("failed");
      setPaymentError(response?.data?.message);
      trackTransactionFailed({
        transactionType: "send",
        error: response,
        value: Number(amount) || undefined,
        currency: "SBC",
      });
    },
    onSettled: () => {
      goNext();
    },
  });

  const handleSend = () => {
    const payload: ISendCryptoPayload = {
      transaction_description: purpose,
      transaction_pin: pin,
      transaction_category_id: category?.transaction_category_id || 0,
      transaction_amount: Number(amount),
      crypto_address: cryptoAddress,
      crypto_network: cryptoNetwork as IChain,
      crypto_type: cryptoType as sbcType,
    };
    SendMoneyMutation.mutate(payload);
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSend();
    }
  }, [pin]);
  return <EnterPin pin={pin} setPin={setPin} close={close} />;
};

export default CryptoPay;
