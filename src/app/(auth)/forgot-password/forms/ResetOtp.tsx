"use client";
import { useFormik } from "formik";
import React, { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import Image from "next/image";
import OTPInput from "react-otp-input";
import { useTimer } from "@/lib/hooks/useTimer";

import Button from "@/components/ui/Button";
import { formatTime } from "@/utils/helpers";

interface Props {
  email: string;
  setPage: (arg: number) => void;
  setOtp: Dispatch<SetStateAction<string>>;
}

const ResetOtp = ({ email, setPage, setOtp }: Props) => {
  const [isTimerActive, setIsTimerActive] = useState(true);
  const { timeLeft } = useTimer(120, isTimerActive);

  const handleResend = () => {
    console.log("Resending OTP...");
    setIsTimerActive((prev) => !prev);
  };
  const formik = useFormik({
    initialValues: { otp: "" },
    validationSchema: toFormikValidationSchema(
      z.object({
        otp: z
          .string()
          .length(6, "OTP must be exactly 6 characters")
          .regex(
            /^[A-Za-z0-9]{6}$/,
            "OTP must only contain letters and numbers"
          ),
      })
    ),
    onSubmit: (val) => {
      setOtp(val.otp);
      setPage(3);
    },
  });
  return (
    <form
      onSubmit={formik.handleSubmit}
      className="h-full flex flex-col -mt-2 justify-between "
    >
      <div>
        <button onClick={() => setPage(1)} type="button">
          <Image
            src={"/icons/arrow-left.svg"}
            alt="back"
            width={18.48}
            height={18.48}
          />
        </button>
        <header className="flex  justify-between mt-2">
          <div>
            <h2 className="text-raiz-gray-950 text-[23px] font-semibold  leading-10">
              Enter OTP
            </h2>
            <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug mb-[44px]">
              Please enter the OTP code sent to your email {email}
            </p>
          </div>
          <svg
            width="40"
            height="41"
            viewBox="0 0 40 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.35"
              d="M26.6665 2.14648H13.3332C10.5715 2.14648 8.33317 4.38482 8.33317 7.14648V12.1465H1.6665V20.4798H8.33317V33.8132C8.33317 36.5748 10.5715 38.8132 13.3332 38.8132H26.6665C29.4282 38.8132 31.6665 36.5748 31.6665 33.8132V7.14648C31.6665 4.38482 29.4282 2.14648 26.6665 2.14648Z"
              fill="#C6ADD5"
            />
            <path
              d="M23.3333 32.1465C23.0233 32.1465 16.9767 32.1465 16.6667 32.1465C15.7467 32.1465 15 32.8932 15 33.8132C15 34.7332 15.7467 35.4798 16.6667 35.4798C16.9767 35.4798 23.0233 35.4798 23.3333 35.4798C24.2533 35.4798 25 34.7332 25 33.8132C25 32.8932 24.2533 32.1465 23.3333 32.1465Z"
              fill="#493260"
            />
            <path
              d="M23.3333 10.48H3.33333C1.5 10.48 0 11.98 0 13.8133V18.8133C0 20.6466 1.5 22.1466 3.33333 22.1466H23.3333C25.1667 22.1466 26.6667 20.6466 26.6667 18.8133V13.8133C26.6667 11.98 25.1667 10.48 23.3333 10.48ZM5.83333 18.8133C4.45 18.8133 3.33333 17.6966 3.33333 16.3133C3.33333 14.93 4.45 13.8133 5.83333 13.8133C7.21667 13.8133 8.33333 14.93 8.33333 16.3133C8.33333 17.6966 7.21667 18.8133 5.83333 18.8133ZM13.3333 18.8133C11.95 18.8133 10.8333 17.6966 10.8333 16.3133C10.8333 14.93 11.95 13.8133 13.3333 13.8133C14.7167 13.8133 15.8333 14.93 15.8333 16.3133C15.8333 17.6966 14.7167 18.8133 13.3333 18.8133ZM20.8333 18.8133C19.45 18.8133 18.3333 17.6966 18.3333 16.3133C18.3333 14.93 19.45 13.8133 20.8333 13.8133C22.2167 13.8133 23.3333 14.93 23.3333 16.3133C23.3333 17.6966 22.2167 18.8133 20.8333 18.8133Z"
              fill="#733B9C"
            />
          </svg>
        </header>
        <div className="">
          <OTPInput
            value={formik.values.otp}
            onChange={(val) => formik.setFieldValue("otp", val)}
            numInputs={6}
            renderSeparator={<span> </span>}
            renderInput={(props) => (
              <input
                {...props}
                className={`!w-[60px] !h-[60px] lg:!w-[50px] lg:!h-[50px] xl:!w-[72px] xl:!h-[72px]  p-2 focus:bg-[#fcfcfc] bg-raiz-gray-100 rounded-[14.57px]  code-input border focus:border-raiz-gray-800  outline-none flex-col justify-center items-center gap-2 inline-flex mr-3  text-raiz-gray-950 text-xl font-normal`}
              />
            )}
          />
          <div className="mt-5">
            {timeLeft > 0 ? (
              <p className="text-sm text-raiz-gray-500 font-normal  leading-normal ">
                We can send you another code in{" "}
                <span className="text-raiz-gray-950">
                  {" "}
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-raiz-gray-600 text-[15px] font-semibold  hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
      <Button type="submit" disabled={!formik.isValid || !formik.dirty}>
        Confirm & continue
      </Button>
    </form>
  );
};

export default ResetOtp;
