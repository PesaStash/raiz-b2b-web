"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import Image from "next/image";
import { FormikProps } from "formik";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";

interface Props {
  setStep: Dispatch<SetStateAction<number>>;
  formik: FormikProps<{ pin: string; confirmPin: string }>;
  loading: boolean;
}

const EnterNewPinForm = ({ setStep, formik, loading }: Props) => {
  const [formState, setFormState] = useState<"pin" | "confirmPin">("pin");

  const handleSubmitButton = async () => {
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

  const handleBackButton = () => {
    if (formState === "pin") {
      setStep(1);
    } else {
      setFormState("pin");
    }
  };
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mt-3 md:mt-0">
        <button onClick={handleBackButton}>
          <Image
            src="/icons/arrow-left.svg"
            alt="arrow-left"
            width={18}
            height={18}
            className="size-3 md:size-[18px]"
          />
        </button>
        <span className="text-raiz-gray-950 text-sm md:text-base font-bold leading-tight">
          Change Transaction PIN
        </span>
        <div />
      </div>
      <p className="text-raiz-gray-950 text-sm md:text-base font-medium font-brSonoma leading-normal mb-3 mt-5">
        {`${formState === "pin" ? "Enter" : "Confirm"} New PIN`}
      </p>
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col h-full justify-between  lg:h-[65%] xl:h-[80%]"
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
        <Button
          disabled={
            (formState === "pin"
              ? !formik.values.pin || formik.values.pin.length < 4
              : !formik.values.confirmPin ||
                formik.values.confirmPin.length < 4) || loading
          }
          onClick={handleSubmitButton}
          loading={loading}
          className="mt-2 lg:mt-0"
        >
          {formState === "pin" ? "Continue" : "Submit Changes"}
        </Button>
      </form>
    </div>
  );
};

export default EnterNewPinForm;
