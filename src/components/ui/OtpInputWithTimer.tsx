"use client";
import React, { useState } from "react";
import OTPInput from "react-otp-input";
import { useTimer } from "@/lib/hooks/useTimer";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { formatTime } from "@/utils/helpers";

type OtpInputWithTimerProps = {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  touched?: boolean;
  onResend?: () => void;
  length?: number;
};

const OtpInputWithTimer = ({
  value,
  onChange,
  error,
  touched,
  onResend,
  length = 4,
}: OtpInputWithTimerProps) => {
  const [isTimerActive, setIsTimerActive] = useState(true);
  const { timeLeft } = useTimer(60, isTimerActive);

  const handleResend = () => {
    setIsTimerActive(false);
    onResend?.();
    setTimeout(() => setIsTimerActive(true), 1000); // Restart timer after resending
  };

  return (
    <div>
      <OTPInput
        value={value}
        onChange={onChange}
        numInputs={length}
        renderSeparator={<span> </span>}
        renderInput={(props) => (
          <input
            {...props}
            className="!w-[60px] !h-[60px] lg:!w-[50px] lg:!h-[50px] xl:!w-[72px] xl:!h-[72px] p-2 focus:bg-[#fcfcfc] bg-raiz-gray-100 rounded-[14.57px] border focus:border-raiz-gray-800 outline-none flex-col justify-center items-center gap-2 inline-flex mr-3 text-raiz-gray-950 text-xl font-normal"
          />
        )}
      />
      {onResend && (
        <div className="mt-5">
          {timeLeft > 0 ? (
            <p className="text-sm text-raiz-gray-500 font-normal leading-normal">
              We can send you another code in{" "}
              <span className="text-raiz-gray-950">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-raiz-gray-600 text-[15px] font-semibold hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>
      )}
      {touched && error && <ErrorMessage message={error} />}
    </div>
  );
};

export default OtpInputWithTimer;
