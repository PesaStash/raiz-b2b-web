"use client";
import React, { useEffect, useState } from "react";
import EnterPin from "@/components/transactions/EnterPin";

interface Props {
  submitting: boolean;
  onSubmit: (pin: string) => void;
  onClose: () => void;
}

const AlipayWechatPay = ({ submitting, onSubmit, onClose }: Props) => {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (pin.length === 4 && !submitting) {
      onSubmit(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <EnterPin
      pin={submitting ? "----" : pin}
      setPin={(value) => {
        if (!submitting) setPin(value);
      }}
      close={onClose}
    />
  );
};

export default AlipayWechatPay;
