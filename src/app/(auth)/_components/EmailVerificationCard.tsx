"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import OTPInput from "react-otp-input";
import AnimatedSection from "@/components/ui/AnimatedSection";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useTimer } from "@/lib/hooks/useTimer";
import { formatTime } from "@/utils/helpers";
import { sanitizeOtpInput } from "../register/_components/validation";

interface Props {
  email: string;
  value: string;
  error?: string;
  loading?: boolean;
  resending?: boolean;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  onResend: () => Promise<unknown>;
  goBack: () => void;
}

const EmailVerificationCard = ({ email, value, error, loading, resending, onChange, onComplete, onResend, goBack }: Props) => {
  const [timerReset, setTimerReset] = useState(false);
  const { timeLeft } = useTimer(60, timerReset);
  const submittedCode = useRef("");
  const resendLock = useRef(false);

  const handleChange = (input: string) => {
    const code = sanitizeOtpInput(input);
    onChange(code);
    if (code.length < 6) submittedCode.current = "";
    if (code.length === 6 && code !== submittedCode.current && !loading && !resending) {
      submittedCode.current = code;
      onComplete(code);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || loading || resending || resendLock.current) return;
    resendLock.current = true;
    try {
      await onResend();
      onChange("");
      submittedCode.current = "";
      setTimerReset(previous => !previous);
    } catch {
      // The mutation reports the error; keep resend available for another attempt.
    } finally {
      resendLock.current = false;
    }
  };

  return (
    <AnimatedSection direction="up" className="email-verification-card flex w-full flex-col gap-7 rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-[0_24px_60px_rgba(13,26,51,0.08)] sm:p-10">
      <button type="button" onClick={goBack} disabled={loading || resending} className="flex w-fit items-center gap-1.5 text-sm font-semibold disabled:opacity-50">
        <Image src="/images/auth/otp-back.svg" width={18} height={18} alt="" />Back
      </button>
      <header className="flex flex-col gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-[rgba(234,236,255,0.6)]">
          <Image src="/images/auth/otp-mail.svg" width={28} height={28} alt="" />
        </div>
        <h1 className="text-[28px] font-bold leading-9">Check your email</h1>
        <p className="text-[15px] leading-[22px] text-[#6b6b80]">Enter the 6-digit code we sent to confirm it’s really you.</p>
        <div className="flex items-center gap-2 rounded-xl bg-[#f4f4f8] px-3.5 py-2.5 text-sm font-semibold">
          <p className="min-w-0 flex-1 break-all">{email}</p>
          <button type="button" onClick={goBack} disabled={loading || resending} className="text-raiz-usd-primary hover:underline disabled:opacity-50">Edit</button>
        </div>
      </header>
      <div className="flex flex-col gap-3" aria-busy={loading}>
        <OTPInput value={value} onChange={handleChange} numInputs={6} inputType="text" shouldAutoFocus
          containerStyle={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
          renderSeparator={index => index === 2 ? <span aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-sm bg-[#c8ccd6]" /> : null}
          renderInput={props => <input {...props} disabled={loading || resending} autoComplete={props['aria-label'] === "Please enter OTP character 1" ? "one-time-code" : "off"} className="email-verification-digit" />}
        />
        <p role="status" className="text-[13px] leading-[19px] text-[#6b6b80]">{loading ? "Checking your code…" : "We’ll check it as soon as all 6 digits are in."}</p>
        {error && <div role="alert"><ErrorMessage message={error} />{value.length === 6 && <button type="button" disabled={loading || resending} onClick={() => onComplete(value)} className="mt-2 text-sm font-semibold text-raiz-usd-primary hover:underline">Try again</button>}</div>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["Gmail", "https://mail.google.com/"], ["Outlook", "https://outlook.live.com/mail/"]].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dadee6] text-sm font-semibold hover:bg-[#f7f9fb]">
            Open {label}<Image src="/images/auth/external-link.svg" width={16} height={16} alt="" />
          </a>
        ))}
      </div>
      <div className="border-t border-[#eaecf0] pt-7 text-sm leading-[21px] text-[#6b6b80]">
        Didn’t get it? Check spam, or{" "}
        {timeLeft > 0 ? <span className="font-semibold text-[#14141e]">resend in {formatTime(timeLeft)}</span> : <button type="button" onClick={handleResend} disabled={loading || resending} className="font-semibold text-raiz-usd-primary hover:underline disabled:opacity-50">{resending ? "Sending…" : "Resend code"}</button>}
      </div>
    </AnimatedSection>
  );
};

export default EmailVerificationCard;
