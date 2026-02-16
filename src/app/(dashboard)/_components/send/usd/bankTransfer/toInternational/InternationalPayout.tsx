import EnterPin from "@/components/transactions/EnterPin";
import { useUser } from "@/lib/hooks/useUser";
import { SendIntBeneficiariesApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IIntSendPayload } from "@/types/services";
import { findWalletByCurrency, passwordHash } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface Props {
  close: () => void;
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  fee: number;
  paymentInitiationId: string;
}
const InternationPayout = ({
  close,
  goNext,
  setPaymentError,
  paymentInitiationId,
}: Props) => {
  const [pin, setPin] = useState<string>("");
  const { purpose, category, actions } = useSendStore();
  const { user } = useUser();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");

  const { selectedCurrency } = useCurrencyStore();
  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    }
  };

  const currentWallet = getCurrentWallet();
  const qc = useQueryClient();
  const SendMoneyMutation = useMutation({
    mutationFn: (data: IIntSendPayload) => SendIntBeneficiariesApi(data),
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
  const handleSend = () => {
    const payload: IIntSendPayload = {
      payout_initiation_id: paymentInitiationId,
      wallet_id: currentWallet?.wallet_id || null,
      transaction_category_id: category?.transaction_category_id || 0,
      transaction_description: purpose,
      data: {
        transaction_pin: passwordHash(pin),
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

export default InternationPayout;
