"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import OtpInputWithTimer from "@/components/ui/OtpInputWithTimer";
import { useGuestSendStore } from "@/store/GuestSend";
import {
  RequestRaizPaymentsPayerEmailOtpApi,
  VerifyRaizPaymentsPayerEmailOtpApi,
} from "@/services/business";
import { mapAfricaPayinError } from "./africaPayinUtils";
import { toast } from "sonner";

interface Props {
  goBack: () => void;
  goNext: () => void;
}

const GuestPayerVerify = ({ goBack, goNext }: Props) => {
  const { payer_email, actions } = useGuestSendStore();
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const requestOtpMutation = useMutation({
    mutationFn: (email: string) => RequestRaizPaymentsPayerEmailOtpApi(email),
    onSuccess: () => {
      toast.success("OTP sent to your email");
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string }) =>
      VerifyRaizPaymentsPayerEmailOtpApi(payload),
    onSuccess: (res) => {
      actions.setFields({
        payer_id: res.payer_id,
        payer_email: res.email,
        payer_first_name: res.first_name,
        payer_last_name: res.last_name,
        payer_country_code: res.country_code,
        payer_email_verified: true,
        payer_exists: true,
        sender_name: `${res.first_name} ${res.last_name}`.trim(),
      });
      goNext();
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const handleVerify = () => {
    if (!payer_email || otp.length < 6) {
      setFormError("Enter the 6-digit code sent to your email");
      return;
    }
    setFormError(null);
    verifyOtpMutation.mutate({ email: payer_email, otp });
  };

  const handleResend = () => {
    if (!payer_email || requestOtpMutation.isPending) return;
    setFormError(null);
    requestOtpMutation.mutate(payer_email);
  };

  return (
    <section className="flex flex-col h-full px-4">
      <div className="mt-4">
        <button type="button" onClick={goBack}>
          <Image
            className="w-3 h-3 md:w-[18px] md:h-[18px]"
            src={"/icons/arrow-left.svg"}
            width={18.48}
            height={18.48}
            alt="back"
          />
        </button>
        <header className="flex items-center justify-between">
          <h2 className="text-raiz-gray-950 text-lg md:text-[23px] font-semibold leading-10">
            Verify your email
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[13px] md:text-[15px] font-normal leading-snug">
          Verify your email to continue. We sent a code to{" "}
          <span className="font-semibold">{payer_email}</span>.
        </p>
      </div>
      <div className="flex flex-col justify-between h-full mt-8">
        <div>
          <OtpInputWithTimer
            value={otp}
            onChange={setOtp}
            length={6}
            error={formError || undefined}
            touched={!!formError}
            onResend={handleResend}
          />
        </div>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={verifyOtpMutation.isPending || otp.length < 6}
          loading={verifyOtpMutation.isPending}
        >
          Verify email
        </Button>
      </div>
    </section>
  );
};

export default GuestPayerVerify;
