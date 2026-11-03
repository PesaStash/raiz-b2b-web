import EnterPin from "@/components/transactions/EnterPin";
import { useUser } from "@/lib/hooks/useUser";
import { SendIntBeneficiariesApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { IIntSendPayload } from "@/types/services";
import { findWalletByCurrency } from "@/utils/helpers";
import { mapRemittanceError } from "@/utils/remittancePayoutErrors";
import {
  trackSendCompleted,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  close: () => void;
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  fee: number;
  paymentInitiationId: string;
  disabled?: boolean;
}
const InternationPayout = ({
  close,
  goNext,
  setPaymentError,
  paymentInitiationId,
  disabled = false,
}: Props) => {
  const [pin, setPin] = useState<string>("");
  const { purpose, category, actions, amount } = useSendStore();
  const { user } = useUser();
  const usdWallet = findWalletByCurrency(user, "USD");
  const hasSubmittedRef = useRef(false);
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
        trackSendCompleted({
          response,
          value: Number(amount),
          currency: "USD",
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
      const remittanceError = mapRemittanceError(
        response,
        "Unable to complete this transfer.",
      );
      setPaymentError(remittanceError.message);
      if (remittanceError.kind === "incorrect_pin") {
        setPin("");
        hasSubmittedRef.current = false;
      } else if (
        remittanceError.kind === "quote_expired" ||
        remittanceError.kind === "already_finalized"
      ) {
        hasSubmittedRef.current = true;
      } else {
        hasSubmittedRef.current = false;
      }
      trackTransactionFailed({
        transactionType: "send",
        error: response,
        value: Number(amount) || undefined,
        currency: "USD",
      });
      if (remittanceError.kind !== "incorrect_pin") {
        toast.error(remittanceError.message);
      }
    },
    onSettled: () => {
      goNext();
    },
  });

  useEffect(() => {
    if (disabled || pin.length !== 4) return;
    if (SendMoneyMutation.isPending || hasSubmittedRef.current) return;

    if (!usdWallet?.wallet_id) {
      toast.error("Please open a USD wallet to continue.");
      return;
    }

    hasSubmittedRef.current = true;
    const payload: IIntSendPayload = {
      payout_initiation_id: paymentInitiationId,
      wallet_id: usdWallet.wallet_id,
      transaction_category_id: category?.transaction_category_id || 0,
      transaction_description: purpose,
      data: {
        transaction_pin: pin,
      },
    };
    SendMoneyMutation.mutate(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, disabled]);

  return <EnterPin pin={pin} setPin={setPin} close={close} />;
};

export default InternationPayout;
