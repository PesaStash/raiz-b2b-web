"use client";
import React, { useState } from "react";
import Image from "next/image";
import { RegisterFormProps } from "./CreateAccount";
import InputField from "@/components/ui/InputField";
import AnimatedSection from "@/components/ui/AnimatedSection";

const ConfirmPassword = ({ goBack, formik }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <AnimatedSection
      key="confirm-password"
      className="h-full flex flex-col -mt-2"
    >
      <button onClick={goBack}>
        <Image
          src={"/icons/arrow-left.svg"}
          alt="back"
          width={18.48}
          height={18.48}
          className="size-3 md:size-[18px]"
        />
      </button>
      <header className="flex items-center justify-between mt-2">
        <h2 className="text-raiz-gray-950 md:text-[23px] text-xl font-semibold  leading-10">
          Verify your password
        </h2>
        <svg width="40" height="41" viewBox="0 0 40 41" fill="none">
          <path
            opacity="0.35"
            d="M10 7.14648C10 4.38482 12.2383 2.14648 15 2.14648H28.3333C31.095 2.14648 33.3333 4.38482 33.3333 7.14648V33.8132C33.3333 36.5748 31.095 38.8132 28.3333 38.8132H15C12.2383 38.8132 10 36.5748 10 33.8132V24.3298L5 23.8132V12.1465L10 8.81315V7.14648Z"
            fill="#C6ADD5"
          />
          <path
            d="M18.3332 32.1465C18.6432 32.1465 24.6898 32.1465 24.9998 32.1465C25.9198 32.1465 26.6665 32.8932 26.6665 33.8132C26.6665 34.7332 25.9198 35.4798 24.9998 35.4798C24.6898 35.4798 18.6432 35.4798 18.3332 35.4798C17.4132 35.4798 16.6665 34.7332 16.6665 33.8132C16.6665 32.8932 17.4132 32.1465 18.3332 32.1465Z"
            fill="#493260"
          />
          <path
            d="M0 16.3145V24.6478C0 26.0228 1.125 27.1478 2.5 27.1478H17.5C18.875 27.1478 20 26.0228 20 24.6478V16.3145C20 14.9395 18.875 13.8145 17.5 13.8145H2.5C1.125 13.8145 0 14.9395 0 16.3145ZM7.91667 20.4811C7.91667 19.3311 8.85 18.3978 10 18.3978C11.15 18.3978 12.0833 19.3311 12.0833 20.4811C12.0833 21.6311 11.15 22.5645 10 22.5645C8.85 22.5645 7.91667 21.6311 7.91667 20.4811Z"
            fill="#733B9C"
          />
          <path
            d="M3.3335 13.8132L5.00016 15.4798L6.66683 13.8132C6.66683 11.9798 8.16683 10.4798 10.0002 10.4798C11.8335 10.4798 13.3335 11.9798 13.3335 13.8132L15.0002 15.4798L16.6668 13.8132C16.6668 10.1298 13.6835 7.14648 10.0002 7.14648C6.31683 7.14648 3.3335 10.1298 3.3335 13.8132Z"
            fill="#733B9C"
          />
        </svg>
      </header>
      <p className="text-raiz-gray-700 text-sm md:text-[15px] font-normal  leading-snug">
        Create a password to use when signing in
      </p>
      <div className="mt-8 xl:mt-[44px]">
        <div className="flex flex-col xl:pb-20">
          <InputField
            label="Verify Password"
            type={showPassword ? "text" : "password"}
            icon={!showPassword ? "/icons/eye-hide.svg" : "/icons/eye.svg"}
            onClick={() => setShowPassword(!showPassword)}
            iconPosition="right"
            status={formik.errors.confirmPassword ? "error" : null}
            {...formik.getFieldProps("confirmPassword")}
            errorMessage={
              formik.touched.confirmPassword && formik.errors.confirmPassword
            }
          />
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ConfirmPassword;
