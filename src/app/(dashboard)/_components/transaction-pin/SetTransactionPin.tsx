"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { pinSchema } from "@/app/(auth)/register/_components/validation";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/ui/OtpInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SetTransactionPinApi } from "@/services/auth";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { canSetTransactionPin } from "@/utils/onboardingBranch";
import type { AxiosError } from "axios";

interface Props {
  close: () => void;
}

const SetTransactionPin = ({ close }: Props) => {
  const [formState, setFormState] = useState<"pin" | "confirmPin">("pin");
  const qc = useQueryClient();
  const { user, refetch } = useUser();
  const [pinForbidden, setPinForbidden] = useState(false);

  const verificationStatus =
    user?.business_account?.business_verifications?.[0]
      ?.verification_status;

  const isEligible = canSetTransactionPin(verificationStatus);
  const canSubmit = isEligible && !pinForbidden;

  useEffect(() => {
    // If the user becomes eligible again, hide the server-denied copy.
    if (canSetTransactionPin(verificationStatus)) {
      setPinForbidden(false);
    }
  }, [verificationStatus]);

  const PinMutation = useMutation({
    mutationFn: (data: { transaction_pin: string }) =>
      SetTransactionPinApi(data, { silent: true }),
    onSuccess: (response) => {
      toast.success(response?.message);
      setPinForbidden(false);
      close();
      qc.invalidateQueries({ queryKey: ["user"] });
      refetch();
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 403) {
        setPinForbidden(true);
        qc.invalidateQueries({ queryKey: ["user"] });
        refetch();
        return;
      }

      toast.error(
        axiosError.response?.data?.message || "An Error Occurred"
      );
    },
  });
  const formik = useFormik({
    initialValues: { pin: "", confirmPin: "" },
    validationSchema: toFormikValidationSchema(pinSchema),
    onSubmit: (values) => {
      if (!canSubmit) return;
      PinMutation.mutate({ transaction_pin: values.pin });
    },
  });
  const handleBackButton = () => {
    if (formState === "pin") {
      close();
    } else {
      setFormState("pin");
    }
  };

  const handleSubmitButton = async () => {
    if (!canSubmit) return;
    // Mark the field as touched before proceeding
    if (formState === "pin") {
      formik.setTouched({ pin: true });
      await formik.validateForm();
      if (!formik.errors.pin) {
        setFormState("confirmPin");
      }
    } else {
      formik.setTouched({ confirmPin: true });
      formik.handleSubmit();
    }
  };
  return (
    <div className=" h-full flex justify-between flex-col mt-5">
      <button onClick={handleBackButton}>
        <Image
          src={"/icons/arrow-left.svg"}
          alt="go back"
          width={18.48}
          height={18.48}
        />
      </button>
      <div className="flex justify-between mt-4 mb-11">
        <div className="">
          <h5 className="text-raiz-gray-950 md:text-[23px] text-xl font-semibold leading-10">
            {formState === "pin" ? "Secure your account" : "Confirm PIN"}
          </h5>
          <p className="text-raiz-gray-700 text-sm font-normal leading-snug">
            Create your 4-digit PIN for transactions. For your security
            don&#39;t share your PIN with anyone.
          </p>
          {!canSubmit && (
            <p className="mt-3 text-sm font-normal leading-snug text-raiz-gray-700">
              Complete business verification before setting a transaction PIN.
            </p>
          )}
        </div>
        <div className="w-10  h-10">
          <svg
            width="40"
            height="41"
            viewBox="0 0 40 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.55"
              d="M30 35.4798H10C7.23833 35.4798 5 33.2415 5 30.4798V17.1465C5 14.3848 7.23833 12.1465 10 12.1465H30C32.7617 12.1465 35 14.3848 35 17.1465V30.4798C35 33.2415 32.7617 35.4798 30 35.4798Z"
              fill="#F7A900"
            />
            <path
              d="M13.3333 12.1465C13.3333 8.46482 16.3183 5.47982 20 5.47982C23.6817 5.47982 26.6667 8.46482 26.6667 12.1465H30C30 6.62315 25.5233 2.14648 20 2.14648C14.4767 2.14648 10 6.62315 10 12.1465H13.3333Z"
              fill="#292D32"
            />
            <path
              d="M20 26.3145C21.3807 26.3145 22.5 25.1952 22.5 23.8145C22.5 22.4337 21.3807 21.3145 20 21.3145C18.6193 21.3145 17.5 22.4337 17.5 23.8145C17.5 25.1952 18.6193 26.3145 20 26.3145Z"
              fill="#6C265B"
            />
            <path
              d="M28.3335 26.3145C29.7142 26.3145 30.8335 25.1952 30.8335 23.8145C30.8335 22.4337 29.7142 21.3145 28.3335 21.3145C26.9528 21.3145 25.8335 22.4337 25.8335 23.8145C25.8335 25.1952 26.9528 26.3145 28.3335 26.3145Z"
              fill="#6C265B"
            />
            <path
              d="M11.6665 26.3145C13.0472 26.3145 14.1665 25.1952 14.1665 23.8145C14.1665 22.4337 13.0472 21.3145 11.6665 21.3145C10.2858 21.3145 9.1665 22.4337 9.1665 23.8145C9.1665 25.1952 10.2858 26.3145 11.6665 26.3145Z"
              fill="#6C265B"
            />
          </svg>
        </div>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col h-full gap-5 justify-between"
      >
        <div
          className={`bg-white rounded-[20px] p-6 ${
            canSubmit ? "" : "opacity-60 pointer-events-none"
          }`}
        >
        {formState === "pin" ? (
          <OtpInput
            value={formik.values.pin}
            onChange={(val) => formik.setFieldValue("pin", val)}
            error={formik.errors.pin}
            touched={formik.touched.pin}
          />
        ) : (
          <OtpInput
            value={formik.values.confirmPin}
            onChange={(val) => formik.setFieldValue("confirmPin", val)}
            error={formik.errors.confirmPin}
            touched={formik.touched.confirmPin}
          />
        )}
        </div>
        <Button
          disabled={
            (formState === "pin"
              ? !formik.values.pin || formik.values.pin.length < 4
              : !formik.values.confirmPin ||
                formik.values.confirmPin.length < 4) ||
            PinMutation.isPending ||
            !canSubmit
          }
          loading={PinMutation.isPending}
          onClick={handleSubmitButton}
          className="bg-raiz-usd-primary hover:bg-raiz-usd-primary disabled:bg-raiz-gray-200"
        >
          {formState === "pin" ? "Continue" : "Confirm"}
        </Button>
      </form>
    </div>
  );
};

export default SetTransactionPin;
