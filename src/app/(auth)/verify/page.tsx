"use client";
import React from "react";
import { useFormik } from "formik";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { ResendSignupOtpApi, SignupVerifyOtpApi } from "@/services/auth";
import { otpSchema, sanitizeOtpInput } from "../register/_components/validation";
import EmailVerificationLayout from "../_components/EmailVerificationLayout";
import EmailVerificationCard from "../_components/EmailVerificationCard";

const VerifyPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const verifyOtpMutation = useMutation({
    mutationFn: (data: { otp: string; email: string }) => SignupVerifyOtpApi(data),
    onSuccess: response => {
      router.push("/login");
      toast.success(response?.message || "Email verified successfully!");
    },
    onError: () => formik.setErrors({ otp: "We couldn’t verify your code. Check it and try again." }),
  });
  const resendOtpMutation = useMutation({
    mutationFn: (data: { email: string }) => ResendSignupOtpApi(data),
    onSuccess: () => toast.success("OTP sent successfully! Check your email"),
    onError: () => formik.setErrors({ otp: "Could not resend your code. Please try again." }),
  });
  const submitCode = (otp: string) => {
    if (!email) {
      formik.setErrors({ otp: "Your email is missing. Go back to login and try again." });
      return;
    }
    if (otpSchema.safeParse(otp).success && !verifyOtpMutation.isPending) {
      verifyOtpMutation.mutate({ otp, email });
    }
  };
  const formik = useFormik({
    initialValues: { otp: "" },
    onSubmit: values => submitCode(values.otp),
  });

  return (
    <EmailVerificationLayout>
      <form onSubmit={formik.handleSubmit} className="w-full max-w-[488px]">
        <EmailVerificationCard
          email={email}
          value={formik.values.otp}
          error={formik.errors.otp}
          loading={verifyOtpMutation.isPending}
          resending={resendOtpMutation.isPending}
          onChange={value => {
            formik.setFieldValue("otp", sanitizeOtpInput(value));
            formik.setErrors({});
          }}
          onComplete={submitCode}
          goBack={() => router.push("/login")}
          onResend={() => resendOtpMutation.mutateAsync({ email })}
        />
      </form>
    </EmailVerificationLayout>
  );
};

export default VerifyPage;
