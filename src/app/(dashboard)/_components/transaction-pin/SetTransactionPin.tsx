"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { pinSchema } from "@/app/(auth)/register/_components/validation";
import Button from "@/components/ui/Button";
import { FlowCard } from "@/components/transactions/send-flow/Flow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SetTransactionPinApi } from "@/services/auth";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import type { IUser } from "@/types/user";
import { canSetTransactionPin } from "@/utils/onboardingBranch";
import type { AxiosError } from "axios";

interface Props {
  close: () => void;
}

const SetTransactionPin = ({ close }: Props) => {
  const [formState, setFormState] = useState<"pin" | "confirmPin">("pin");
  const qc = useQueryClient();
  const { user, refetch, updateUser } = useUser();
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
    onSuccess: async (response) => {
      toast.success(response?.message);
      setPinForbidden(false);
      updateUser({ has_transaction_pin: true });
      qc.setQueryData<IUser>(["user"], current => current ? { ...current, has_transaction_pin: true } : current);
      close();
      await qc.invalidateQueries({ queryKey: ["user"] });
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
      if (!canSubmit || PinMutation.isPending) return;
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
    if (!canSubmit || PinMutation.isPending) return;
    // Mark the field as touched before proceeding
    if (formState === "pin") {
      formik.setTouched({ pin: true });
      const errors = await formik.validateForm();
      if (!errors.pin) {
        setFormState("confirmPin");
      }
    } else {
      formik.setTouched({ confirmPin: true });
      formik.handleSubmit();
    }
  };
  const activeField = formState === "pin" ? "pin" : "confirmPin";
  const value = formik.values[activeField];
  const error = formik.touched[activeField] ? formik.errors[activeField] : undefined;
  const title = formState === "pin" ? "Set up transaction PIN" : "Confirm transaction PIN";

  return (
    <section className="flex min-h-0 w-full flex-col gap-5 py-5 font-monzo text-[#19151e]">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackButton}
            disabled={PinMutation.isPending}
            className="flex min-h-11 items-center gap-2 text-left text-[13px] text-[#79708d] disabled:opacity-50"
          >
            <Image src="/images/send/back.svg" width={22} height={22} alt="" />
            {formState === "pin" ? "Back" : "Set up PIN"}
          </button>
          <span className="text-xs font-medium text-[#79708d]">
            Step {formState === "pin" ? "1" : "2"} of 2
          </span>
        </div>
        <h1 className="text-2xl font-semibold leading-[1.4]">{title}</h1>
      </header>
      <FlowCard>
        <p className="text-sm leading-relaxed text-[#79708d]">
          {formState === "pin"
            ? "Create a 4-digit PIN to approve transfers and other sensitive actions."
            : "Enter your 4-digit PIN again to confirm it."}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmitButton();
          }}
          className="flex flex-col gap-5"
        >
          <fieldset disabled={!canSubmit || PinMutation.isPending} className="min-w-0 disabled:opacity-60">
            <label className="relative block">
              <span className="sr-only">{title}</span>
              <input
                key={activeField}
                id={`transaction-${activeField}`}
                name={activeField}
                autoFocus
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                value={value}
                onChange={(event) => {
                  const next = event.target.value.replace(/\D/g, "").slice(0, 4);
                  void formik.setFieldValue(activeField, next);
                  if (activeField === "pin") {
                    void formik.setFieldValue("confirmPin", "", false);
                    void formik.setFieldTouched("confirmPin", false, false);
                  }
                }}
                onBlur={formik.handleBlur}
                aria-invalid={!!error}
                aria-describedby={error ? "transaction-pin-error" : "transaction-pin-help"}
                className="peer absolute inset-0 h-full w-full cursor-text opacity-0"
              />
              <span className="pointer-events-none grid grid-cols-4 gap-3 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-primary2 peer-focus-visible:ring-offset-2 sm:gap-4" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`flex h-[72px] items-center justify-center rounded-xl bg-[#f4f4f8] text-3xl text-primary2 sm:h-[82px] ${value.length === index ? "ring-1 ring-primary2" : ""}`}
                  >
                    {value[index] ? "•" : ""}
                  </span>
                ))}
              </span>
            </label>
          </fieldset>
          {error && (
            <p id="transaction-pin-error" role="alert" className="text-sm font-medium text-[#d92d20]">
              {error}
            </p>
          )}
          <p id="transaction-pin-help" className="text-xs leading-relaxed text-[#79708d]">
            For your security, never share your PIN with anyone.
          </p>
          {!canSubmit && (
            <p role="alert" className="text-sm leading-relaxed text-[#79708d]">
              Complete business verification before setting a transaction PIN.
            </p>
          )}
          <Button
            type="submit"
            disabled={value.length !== 4 || PinMutation.isPending || !canSubmit}
            loading={PinMutation.isPending}
            className="!min-h-12 !rounded-xl !text-sm !font-semibold enabled:!bg-[#0d6494] enabled:hover:!bg-[#0b567f]"
          >
            {formState === "pin" ? "Continue" : "Confirm PIN"}
          </Button>
        </form>
      </FlowCard>
    </section>
  );
};

export default withBusinessWrite(SetTransactionPin);
