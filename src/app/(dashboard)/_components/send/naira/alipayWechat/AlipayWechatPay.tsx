"use client";
import React, { useEffect, useState } from "react";
import EnterPin from "@/components/transactions/EnterPin";
import { AlipayWechatSendApi } from "@/services/transactions";
import { IAlipayWechatSendResponse } from "@/types/services";
import { passwordHash } from "@/utils/helpers";
import {
  getTransactionId,
  getTransactionStatus,
  trackMoneyMovementSuccess,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  channel: "alipay" | "wechat";
  beneficiaryId: string;
  amount: string;
  onSuccess: (result: IAlipayWechatSendResponse) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

const AlipayWechatPay = ({
  channel,
  beneficiaryId,
  amount,
  onSuccess,
  onError,
  onClose,
}: Props) => {
  const [pin, setPin] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (pin.length === 4 && !submitting) {
      handleSend();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleSend = async () => {
    setSubmitting(true);
    try {
      const result = await AlipayWechatSendApi({
        beneficiary_id: beneficiaryId,
        channel,
        amount,
        transaction_pin: passwordHash(pin),
      });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["alipay-wechat-beneficiaries"] });
      if (getTransactionStatus(result) === "completed") {
        const transactionId = getTransactionId(result);
        if (transactionId) {
          trackMoneyMovementSuccess({
            event: "send_completed",
            transactionId,
            value: Number(amount) || 0,
            currency: "NGN",
            extra: { recipient_type: "external" },
          });
        }
      }
      onSuccess(result);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Transaction failed. Please try again.";
      trackTransactionFailed({
        transactionType: "send",
        error: (err as { response?: unknown })?.response ?? err,
        value: Number(amount) || undefined,
        currency: "NGN",
      });
      onError(msg);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EnterPin
      pin={submitting ? "----" : pin}
      setPin={(val) => {
        if (!submitting) setPin(val);
      }}
      close={onClose}
    />
  );
};

export default AlipayWechatPay;
