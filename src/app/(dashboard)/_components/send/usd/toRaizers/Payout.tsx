"use cliet";
import EnterPin from "@/components/transactions/EnterPin";
import { useUser } from "@/lib/hooks/useUser";
import { P2PDebitApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IP2PTransferPayload } from "@/types/services";
import { findWalletByCurrency, passwordHash } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface Props {
  close: () => void;
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  fee: number;
}

const Payout = ({ close, goNext, setPaymentError }: Props) => {
  const [pin, setPin] = useState<string>("");
  const {
    user: selectedUser,
    purpose,
    category,
    amount,
    actions,
  } = useSendStore();
  const qc = useQueryClient();
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    }
  };

  const currentWallet = getCurrentWallet();

  const SendMoneyMutation = useMutation({
    mutationFn: (data: IP2PTransferPayload) =>
      P2PDebitApi({ wallet_id: data.wallet_id, payload: data.payload }),
    onMutate: () => {
      actions.setStatus("loading");
      goNext();
    },
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["p2p-beneficiaries-recents"] });
      qc.invalidateQueries({ queryKey: ["income-expense-chart"] });
      qc.invalidateQueries({ queryKey: ["transaction-report-categories"] });
      if (response?.transaction_status?.transaction_status === "completed") {
        actions.setStatus("success");
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
    },
    onSettled: () => {
      goNext();
    },
  });

  // const totalPayable = fee ? parseFloat(amount) + fee : 0;

  const handleSend = () => {
    const payload: IP2PTransferPayload = {
      wallet_id: currentWallet?.wallet_id || null,
      payload: {
        receiver_entity_id: selectedUser?.entity_id || null,
        transaction_amount: Number(amount),
        transaction_remarks: purpose,
        transaction_pin: passwordHash(pin),
        transaction_category_id: category?.transaction_category_id || 0,
      },
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

export default Payout;
