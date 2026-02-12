import EnterPin from "@/components/transactions/EnterPin";
import { SendMoneyUSBankApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { ISendMoneyUsBankPayload } from "@/types/services";
import { passwordHash } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface Props {
  close: () => void;
  goNext: () => void;
  setPaymentError: Dispatch<SetStateAction<string>>;
  fee: number;
}
const UsdBankPay = ({ close, goNext, setPaymentError }: Props) => {
  const [pin, setPin] = useState<string>("");
  const { usdBeneficiary, purpose, category, amount, actions } = useSendStore();
  const qc = useQueryClient();
  const SendMoneyMutation = useMutation({
    mutationFn: (data: ISendMoneyUsBankPayload) => SendMoneyUSBankApi(data),
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
    const payload: ISendMoneyUsBankPayload = {
      transaction_reason: purpose,
      transaction_pin: passwordHash(pin),
      transaction_category_id: category?.transaction_category_id || 0,
      amount: Number(amount),
      usd_beneficiary_id: usdBeneficiary?.usd_beneficiary_id || null,
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

export default UsdBankPay;
