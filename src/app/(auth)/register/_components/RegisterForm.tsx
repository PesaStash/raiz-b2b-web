"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import CreateAccount from "./forms/CreateAccount";
import SetPassword from "./forms/SetPassword";
import Button from "@/components/ui/Button";
import Link from "next/link";
// import CreateUsername from "./forms/CreateUsername";
import RegisterOtp from "./forms/RegisterOtp";
// import UseCases from "./forms/UseCases";
import Congrats from "./forms/Congrats";
import { useFormik } from "formik";
import { registerFormSchemas, sanitizeOtpInput } from "./validation";
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
import Checkbox from "@/components/ui/Checkbox";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";

const RegisterForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2);
  const [checked, setChecked] = useState(false);
  const steps = [
    "createAccount",
    "setPassword",
    "otp",
    // "createUsername",
    // "useCases",
    "congrats",
  ];

  const initialValues: IRegisterFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    // username: "",
    // phone_number: "",
    country_id: "",
    referral_code: "",
    otp: "",
    confirmPassword: "",
    // useCases: [],
  };

  const validateCurrentStep = useMemo(
    () => toFormikValidate(registerFormSchemas[currentStep as keyof typeof registerFormSchemas]),
    [currentStep],
  );

  const formik = useFormik({
    initialValues,
    validate: validateCurrentStep,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => console.log("form values", values),
  });

  const signupMutation = useMutation({
    mutationFn: (data: IRegisterPayload) => SignupApi(data),
    onSuccess: (response) => {
     
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
      handleNavigate("next");
    },
    onError: (error) => {
      console.log("Signup failed:", error);
      formik.setErrors({ otp: "Signup failed. Please try again." });
    },
  });

  const disableProgress = () => {
    switch (currentStep) {
      case 1:
        return (
          !formik.values.email ||
          !formik.values.firstName ||
          !formik.values.lastName ||
          !formik.values.country_id ||
          !!formik.errors.email ||
          !!formik.errors.firstName ||
          !!formik.errors.lastName ||
          !!formik.errors.country_id ||
          !checked
        );
      case 2:
        return (
          !formik.values.password ||
          !formik.values.confirmPassword ||
          !!formik.errors.password ||
          !!formik.errors.confirmPassword
        );
      case 3: {
        const otp = sanitizeOtpInput(formik.values.otp);
        return otp.length !== 6 || !!formik.errors.otp;
      }
      case 4:
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
    if (!disableProgress()) {
      if (currentStep === 1) {
        handleNavigate("next");
      } else if (currentStep === 2) {
        const payload: IRegisterPayload = {
          email: formik.values.email,
          password: formik.values.password,
          first_name: formik.values.firstName,
          last_name: formik.values.lastName,
          country_id: formik.values.country_id,
          referral_code: formik.values.referral_code || null,
        };
        signupMutation.mutate(payload);
      } else if (currentStep === 3) {
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
        return (
          <SetPassword goBack={() => handleNavigate("back")} formik={formik} />
        );
      case 3:
        return (
          <RegisterOtp goBack={() => handleNavigate("back")} formik={formik} />
        );
      case 4:
        return <Congrats />;
      default:
    }
  };

  const isLoading = signupMutation.isPending || verifyOtpMutation.isPending;

  return (
    <div className="py-4 px-0 md:px-3 xl:px-8 lg:w-[50%] xl:w-[46%] h-full flex flex-col justify-between gap-6 md:gap-10 lg:gap-[60px]">
      <Image className="w-[80px] md:w-[91.78px]" src={"/icons/Logo.svg"} width={91.78} height={32} alt="Logo" />
      <div className="flex flex-col h-full  justify-between">
        <AnimatePresence>{displayStep(currentStep)}</AnimatePresence>
        <div className="flex flex-col gap-3 mt-3">
          {currentStep === 1 && (
            <div className="flex gap-1">
              <Checkbox
                checked={checked}
                onChange={(checked: boolean) => setChecked(checked)}
              />
              <p className="text-raiz-gray-600 text-xs md:text-[13px] font-normal  leading-tight">
                By continuing, you agree to Raiz&#39;s{" "}
                <Link
                  className="text-raiz-gray-800 font-bold leading-[18.20px] hover:underline"
                  href={"https://www.raiz.app/terms"}
                  target="_blank"
                >
                  Term of Service
                </Link>{" "}
                and acknowledge our{" "}
                <Link
                  className="text-raiz-gray-800 font-bold leading-[18.20px] hover:underline"
                  href={"https://www.raiz.app/privacy-policy"}
                  target="_blank"
                >
                  Privacy Policy
                </Link>{" "}
                .
              </p>
            </div>
          )}
          <Button
            // type={currentStep < steps.length - 1 ? "button" : "submit"}
            loading={isLoading}
            disabled={!!disableProgress()}
            onClick={btnAction}
          >
            {isLoading
              ? currentStep === 2
                ? "Signing Up..."
                : "Verifying..."
              : "Continue"}
          </Button>
          {currentStep === 1 && (
            <p className="text-raiz-gray-800 text-xs md:text-[13px] font-normal  leading-tight mt-3 text-center pb-3 lg:pb-0">
              Already have an account?{" "}
              <Link className=" font-bold leading-[18.20px]" href={"/login"}>
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
