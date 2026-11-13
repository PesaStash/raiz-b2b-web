"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResendSignupOtpApi } from "@/services/auth";
import EmailVerificationCard from "../../../_components/EmailVerificationCard";
import { RegisterFormProps } from "./CreateAccount";
import { sanitizeOtpInput } from "../validation";

interface Props extends RegisterFormProps {
  loading: boolean;
  onComplete: (otp: string) => void;
}

const RegisterOtp = ({ goBack, formik, loading, onComplete }: Props) => {
  const resendOtpMutation = useMutation({
    mutationFn: (data: { email: string }) => ResendSignupOtpApi(data),
    onSuccess: () => toast.success("OTP sent successfully! Check your email"),
    onError: () => formik.setErrors({ otp: "Could not resend your code. Please try again." }),
  });

  return (
    <EmailVerificationCard
      email={formik.values.email}
      value={formik.values.otp}
      error={formik.errors.otp}
      loading={loading}
      resending={resendOtpMutation.isPending}
      onChange={value => {
        void formik.setFieldValue("otp", sanitizeOtpInput(value), true);
        formik.setFieldTouched("otp", true, false);
      }}
      onComplete={onComplete}
      goBack={() => {
        formik.setFieldValue("otp", "", false);
        goBack?.();
      }}
      onResend={() => resendOtpMutation.mutateAsync({ email: formik.values.email })}
    />
  );
};

export default RegisterOtp;
