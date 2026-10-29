"use client";
import React, { useMemo, useState } from "react";
import CreateAccount from "./forms/CreateAccount";
import Button from "@/components/ui/Button";
import Link from "next/link";
import RegisterOtp from "./forms/RegisterOtp";
import Congrats from "./forms/Congrats";
import AuthLayout from "../../_components/AuthLayout";
import EmailVerificationLayout from "../../_components/EmailVerificationLayout";
import { useFormik } from "formik";
import { registerFormSchemas, createAccountSchema, sanitizeOtpInput } from "./validation";
import { IRegisterFormValues } from "@/types/misc";
import { toFormikValidate } from "zod-formik-adapter";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  IRegisterPayload,
  SignupApi,
  SignupVerifyOtpApi,
} from "@/services/auth";
import { AnimatePresence } from "motion/react";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";

const RegisterForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    "createAccount",
    "otp",
    "congrats",
  ];

  const initialValues: IRegisterFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    country_id: "",
    referral_code: "",
    otp: "",
    confirmPassword: "",
  };

  const validateCurrentStep = useMemo(
    () => toFormikValidate(currentStep === 1 ? createAccountSchema : registerFormSchemas[currentStep === 2 ? 3 : 4]),
    [currentStep],
  );

  const formik = useFormik({
    initialValues,
    validate: validateCurrentStep,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => btnAction(),
  });

  const signupMutation = useMutation({
    mutationFn: (data: IRegisterPayload) => SignupApi(data),
    onSuccess: () => {
      handleNavigate("next");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { otp: string; email: string }) =>
      SignupVerifyOtpApi(data),
    onSuccess: (response) => {
      // Prefer opaque backend ids; fall back to a stable signup-session key (never email).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = response as any;
      const userId =
        res?.business_account_user_id ||
        res?.entity_id ||
        res?.user_id ||
        res?.business_account_id ||
        `signup_${Date.now()}`;

      pushDataLayerEvent(
        "sign_up",
        {
          method: "email",
          user_id: String(userId),
          user_type: getAnalyticsUserType(),
        },
        { dedupId: `sign_up:${userId}` },
      );
      setCurrentStep(3);
      formik.setErrors({});
      formik.setTouched({});
    },
    onError: () => {
      formik.setErrors({ otp: "We couldn’t verify your code. Check it and try again." });
    },
  });

  const disableProgress = () => {
    switch (currentStep) {
      case 1:
        return !createAccountSchema.safeParse(formik.values).success;
      case 2: {
        const otp = sanitizeOtpInput(formik.values.otp);
        return otp.length !== 6 || !!formik.errors.otp;
      }
      case 3:
        return false;
      default:
        return true;
    }
  };

  const handleNavigate = (direction: "next" | "back") => {
    if (
      direction === "next" &&
      !disableProgress() &&
      currentStep < steps.length
    ) {
      setCurrentStep((prev) => prev + 1);
      formik.setErrors({});
      formik.setTouched({});
    } else if (direction === "back") {
      setCurrentStep((prev) => prev - 1);
      formik.setErrors({});
      formik.setTouched({});
    }
  };

  const btnAction = () => {
    if (!isLoading && !disableProgress()) {
      if (currentStep === 1) {
        const payload: IRegisterPayload = {
          email: formik.values.email,
          password: formik.values.password,
          first_name: formik.values.firstName,
          last_name: formik.values.lastName,
          country_id: formik.values.country_id,
          referral_code: formik.values.referral_code || null,
        };
        signupMutation.mutate(payload);
      } else if (currentStep === 2) {
        verifyOtpMutation.mutate({
          otp: formik.values.otp,
          email: formik.values.email,
        });
      } else if (currentStep === steps.length) {
        router.push("/login");
      }
    }
  };

  const displayStep = (step: number) => {
    switch (step) {
      case 1:
        return <CreateAccount formik={formik} />;
      case 2:
        return <RegisterOtp
          goBack={() => handleNavigate("back")}
          formik={formik}
          loading={verifyOtpMutation.isPending}
          onComplete={otp => {
            if (!verifyOtpMutation.isPending) verifyOtpMutation.mutate({ otp, email: formik.values.email });
          }}
        />;
      case 3:
        return <Congrats />;
      default:
    }
  };

  const isLoading = signupMutation.isPending || verifyOtpMutation.isPending;

  const content = (
    <form onSubmit={formik.handleSubmit} className={`w-full ${currentStep === 2 ? "max-w-[488px]" : "auth-register-form max-w-[440px]"}`}>
      <AnimatePresence mode="wait">{displayStep(currentStep)}</AnimatePresence>
      {currentStep !== 2 && <div className="auth-register-actions mt-6 flex flex-col gap-3">
        <Button
          className="auth-submit"
          type="submit"
          loading={isLoading}
          disabled={!!disableProgress() || isLoading}
        >
          {currentStep === 1 ? "Create account" : "Continue to login"}
        </Button>
        {currentStep === 1 && <p className="text-[13px] leading-5 text-[#6b6b80]">By creating an account you agree to our <Link
          className="font-semibold text-[#14141e] hover:underline"
          href="https://www.raiz.app/terms"
          target="_blank"
          rel="noopener noreferrer"
        >Terms</Link> and <Link
          className="font-semibold text-[#14141e] hover:underline"
          href="https://www.raiz.app/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
        >Privacy Policy</Link>.</p>}
      </div>}
    </form>
  );

  return currentStep === 2
    ? <EmailVerificationLayout>{content}</EmailVerificationLayout>
    : <AuthLayout>{content}</AuthLayout>;
};

export default RegisterForm;
