"use client";
import React from "react";
import Image from "next/image";
import { RegisterFormProps } from "./CreateAccount";
import OtpInputWithTimer from "@/components/ui/OtpInputWithTimer";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResendSignupOtpApi } from "@/services/auth";
import AnimatedSection from "@/components/ui/AnimatedSection";

const RegisterOtp = ({ goBack, formik }: RegisterFormProps) => {
  const resendOtpMutation = useMutation({
    mutationFn: (data: { email: string }) => ResendSignupOtpApi(data),
    onSuccess: (response) => {
      console.log("Signup successful:", response);
      toast.success("OTP sent successfully! Check your email");
    },
    onError: (error) => {
      console.log("Signup failed:", error);
      formik.setErrors({ otp: "Signup failed. Please try again." });
    },
  });
  return (
    <AnimatedSection
      key="register-otp"
      className="h-full flex flex-col justify-between -mt-2 "
    >
      <div>
        <button onClick={goBack}>
          <Image
            src={"/icons/arrow-left.svg"}
            alt="back"
            width={18.48}
            height={18.48}
          />
        </button>
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-[23px] font-semibold  leading-10">
            Enter OTP
          </h2>
          <svg width="40" height="41" viewBox="0 0 40 41" fill="none">
            <path
              opacity="0.35"
              d="M26.6665 2.14746H13.3332C10.5715 2.14746 8.33317 4.38579 8.33317 7.14746V12.1475H1.6665V20.4808H8.33317V33.8141C8.33317 36.5758 10.5715 38.8141 13.3332 38.8141H26.6665C29.4282 38.8141 31.6665 36.5758 31.6665 33.8141V7.14746C31.6665 4.38579 29.4282 2.14746 26.6665 2.14746Z"
              fill="#C6ADD5"
            />
            <path
              d="M23.3333 32.1475C23.0233 32.1475 16.9767 32.1475 16.6667 32.1475C15.7467 32.1475 15 32.8941 15 33.8141C15 34.7341 15.7467 35.4808 16.6667 35.4808C16.9767 35.4808 23.0233 35.4808 23.3333 35.4808C24.2533 35.4808 25 34.7341 25 33.8141C25 32.8941 24.2533 32.1475 23.3333 32.1475Z"
              fill="#493260"
            />
            <path
              d="M23.3333 10.4805H3.33333C1.5 10.4805 0 11.9805 0 13.8138V18.8138C0 20.6471 1.5 22.1471 3.33333 22.1471H23.3333C25.1667 22.1471 26.6667 20.6471 26.6667 18.8138V13.8138C26.6667 11.9805 25.1667 10.4805 23.3333 10.4805ZM5.83333 18.8138C4.45 18.8138 3.33333 17.6971 3.33333 16.3138C3.33333 14.9305 4.45 13.8138 5.83333 13.8138C7.21667 13.8138 8.33333 14.9305 8.33333 16.3138C8.33333 17.6971 7.21667 18.8138 5.83333 18.8138ZM13.3333 18.8138C11.95 18.8138 10.8333 17.6971 10.8333 16.3138C10.8333 14.9305 11.95 13.8138 13.3333 13.8138C14.7167 13.8138 15.8333 14.9305 15.8333 16.3138C15.8333 17.6971 14.7167 18.8138 13.3333 18.8138ZM20.8333 18.8138C19.45 18.8138 18.3333 17.6971 18.3333 16.3138C18.3333 14.9305 19.45 13.8138 20.8333 13.8138C22.2167 13.8138 23.3333 14.9305 23.3333 16.3138C23.3333 17.6971 22.2167 18.8138 20.8333 18.8138Z"
              fill="#733B9C"
            />
          </svg>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug mb-[44px]">
          Please enter the OTP code sent to your Email Address
        </p>
        <OtpInputWithTimer
          value={formik.values.otp}
          onChange={(val) => formik.setFieldValue("otp", val)}
          error={formik.errors.otp}
          touched={formik.touched.otp}
          onResend={() =>
            resendOtpMutation.mutate({ email: formik.values.email })
          }
          length={6}
        />
      </div>
      <p className="text-raiz-gray-600 text-[13px] font-normal leading-tight">
        **Do not forget to check your spam/junk email folder.
      </p>
    </AnimatedSection>
  );
};

export default RegisterOtp;
