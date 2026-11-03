"use client";
import { useRouter } from "next/navigation";
import React, { Dispatch, SetStateAction } from "react";
import { useFormik } from "formik";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginOtpApi, LoginApi, ILoginPayload } from "@/services/auth";
import { toast } from "sonner";
import { clearUsdOnboardingSessionState, USD_ONBOARDING_QUERY_KEY } from "@/lib/hooks/useUsdOnboarding";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import EmailVerificationCard from "../../_components/EmailVerificationCard";
import { otpSchema, sanitizeOtpInput } from "../../register/_components/validation";

interface Props {
  setStep: Dispatch<SetStateAction<number>>;
  from: "login" | "welcome-back";
  email: string;
  password?: string;
}

const LoginOtp = ({ setStep, from, email, password }: Props) => {
  const router = useRouter();
  const qc = useQueryClient();
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; otp: string }) => LoginOtpApi(data),
    onSuccess: (response) => {
      // The /api/raiz proxy stores the token in an httpOnly cookie.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = response as any;
      const userId =
        res?.business_account_user_id ||
        res?.entity_id ||
        res?.user_id ||
        res?.business_account_id ||
        "authenticated";

      pushDataLayerEvent("login", {
        method: "email",
        user_id: String(userId),
      });
      clearUsdOnboardingSessionState();
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: USD_ONBOARDING_QUERY_KEY });
      router.push("/");
    },
    onError: () => {
      formik.setErrors({ otp: "We couldn’t verify your code. Check it and try again." });
    },
  });
  const resendOtpMutation = useMutation({
    mutationFn: (data: ILoginPayload) => LoginApi(data),
    onSuccess: () => {
      toast.success("OTP sent successfully! Check your email");
    },
    onError: () => {
      formik.setErrors({ otp: "Could not resend your code. Please try again." });
    },
  });
  const formik = useFormik({
    initialValues: {
      otp: "",
    },
    onSubmit: () => {
      submitCode(formik.values.otp);
    },
  });

  const goBack = () => {
    if (from === "login") {
      setStep(1);
    } else {
      setStep(4);
    }
  };

  const submitCode = (otp: string) => {
    if (otpSchema.safeParse(otp).success && !loginMutation.isPending && !resendOtpMutation.isPending) {
      loginMutation.mutate({ otp, email });
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="w-full max-w-[488px]">
      <EmailVerificationCard
        email={email}
        value={formik.values.otp}
        error={formik.errors.otp}
        loading={loginMutation.isPending}
        resending={resendOtpMutation.isPending}
        onChange={value => {
          formik.setFieldValue("otp", sanitizeOtpInput(value));
          formik.setErrors({});
        }}
        onComplete={submitCode}
        goBack={goBack}
        onResend={async () => {
          if (!password) {
            formik.setErrors({ otp: "Please go back to login and try again." });
            throw new Error("Login credentials are unavailable");
          }
          return resendOtpMutation.mutateAsync({ email, password });
        }}
      />
    </form>
  );
};

export default LoginOtp;
