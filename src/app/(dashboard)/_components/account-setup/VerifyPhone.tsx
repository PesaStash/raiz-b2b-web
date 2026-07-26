import React from "react";
import Image from "next/image";
import OtpInputWithTimer from "@/components/ui/OtpInputWithTimer";
import { useFormik } from "formik";
import Button from "@/components/ui/Button";
import { AccountSetupProps } from "@/types/misc";

const VerifyPhone = ({ selectedStep, setSelectedStep }: AccountSetupProps) => {
  const formik = useFormik({
    initialValues: { otp: "" },
    validate: (values) => {
      const errors: { otp?: string } = {};
      if (values.otp.length !== 4) {
        errors.otp = "OTP must be 4 digits";
      }
      return errors;
    },
    onSubmit: () => {},
  });
  return (
    <div className=" h-full flex justify-between flex-col">
      <button onClick={() => setSelectedStep(null)}>
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
            {selectedStep.title}
          </h5>
          <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
            Please enter the OTP code sent to your phone number ending in XXXX{" "}
          </p>
        </div>
        <div className="w-10  h-10">{selectedStep.icon}</div>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col h-full justify-between"
      >
        <OtpInputWithTimer
          value={formik.values.otp}
          onChange={(val) => formik.setFieldValue("otp", val)}
          error={formik.errors.otp}
          touched={formik.touched.otp}
          onResend={() => {}}
        />
        <Button
          type="submit"
          disabled={!formik.values.otp || formik.values.otp.length < 4}
          className="bg-raiz-usd-primary hover:bg-raiz-usd-primary disabled:bg-raiz-gray-200"
        >
          Confirm & Continue
        </Button>
      </form>
    </div>
  );
};

export default VerifyPhone;
