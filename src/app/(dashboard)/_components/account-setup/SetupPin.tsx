import { AccountSetupProps } from "@/types/misc";
import { useFormik } from "formik";
import React, { useState } from "react";
import Image from "next/image";
import OtpInput from "@/components/ui/OtpInput";
import Button from "@/components/ui/Button";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { pinSchema } from "@/app/(auth)/register/_components/validation";

const SetupPin = ({ selectedStep, setSelectedStep }: AccountSetupProps) => {
  const [formState, setFormState] = useState<"pin" | "confirmPin">("pin");
  const formik = useFormik({
    initialValues: { pin: "", confirmPin: "" },
    validationSchema: toFormikValidationSchema(pinSchema),
    onSubmit: (values) => {
    },
  });

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
      setSelectedStep(null);
    } else {
      setFormState("pin");
    }
  };
  return (
    <div className=" h-full flex justify-between flex-col">
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
          <h5 className="text-raiz-gray-950 text-[23px] font-semibold leading-10">
            {formState === "pin" ? selectedStep.title : "Confirm PIN"}
          </h5>
          <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
            Create your 4-digit PIN for transactions. For your security
            don&#39;t share your PIN with anyone.
          </p>
        </div>
        <div className="w-10  h-10">{selectedStep.icon}</div>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col h-full justify-between"
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
            formState === "pin"
              ? !formik.values.pin || formik.values.pin.length < 4
              : !formik.values.confirmPin || formik.values.confirmPin.length < 4
          }
          onClick={handleSubmitButton}
          className="bg-raiz-usd-primary hover:bg-raiz-usd-primary disabled:bg-raiz-gray-200"
        >
          {formState === "pin" ? "Continue" : "Confirm"}
        </Button>
      </form>
    </div>
  );
};

export default SetupPin;
