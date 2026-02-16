"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import Image from "next/image";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useMutation } from "@tanstack/react-query";
import { IResetPasswordPayload, ResetPasswordApi } from "@/services/auth";
import { passwordHash } from "@/utils/helpers";
import { encryptData } from "@/lib/headerEncryption";

interface Props {
  setPage: Dispatch<SetStateAction<number>>;
  otp: string;
  setUser: Dispatch<SetStateAction<{ first_name: string; last_name: string }>>;
  email: string;
}

const CreateNewPassword = ({ setPage, otp, setUser, email }: Props) => {
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: (data: IResetPasswordPayload) => ResetPasswordApi(data),
    onSuccess: (response) => {
      setUser({
        first_name: response?.data?.first_name,
        last_name: response?.data?.last_name,
      });
      setPage(4);
    },
  });
  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema: toFormikValidationSchema(
      z
        .object({
          password: z
            .string({
              required_error: "Password is required",
            })
            .min(8, "Password must be at least 8 characters")
            .refine(
              (password) =>
                [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/].filter(
                  (regex) => regex.test(password)
                ).length >= 2,
              {
                message:
                  "Password must contain at least 2 of these rules: one uppercase letter, one lowercase letter, one numeric character, one special character",
              }
            ),
          confirmPassword: z.string({
            required_error: "Confirm Password is required",
          }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        })
    ),
    onSubmit: (val) => {
      resetPasswordMutation.mutate({
        otp: encryptData(otp),
        password: passwordHash(val.password),
        email,
      });
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="h-full flex flex-col -mt-2 justify-between"
    >
      <div>
        <button onClick={() => setPage(2)} type="button">
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
              Create a new password
            </h2>
            <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug mb-[44px]">
              Create a new password
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
              d="M10 7.14648C10 4.38482 12.2383 2.14648 15 2.14648H28.3333C31.095 2.14648 33.3333 4.38482 33.3333 7.14648V33.8132C33.3333 36.5748 31.095 38.8132 28.3333 38.8132H15C12.2383 38.8132 10 36.5748 10 33.8132V24.3298L5 23.8132V12.1465L10 8.81315V7.14648Z"
              fill="#C6ADD5"
            />
            <path
              d="M18.3332 32.1465C18.6432 32.1465 24.6898 32.1465 24.9998 32.1465C25.9198 32.1465 26.6665 32.8932 26.6665 33.8132C26.6665 34.7332 25.9198 35.4798 24.9998 35.4798C24.6898 35.4798 18.6432 35.4798 18.3332 35.4798C17.4132 35.4798 16.6665 34.7332 16.6665 33.8132C16.6665 32.8932 17.4132 32.1465 18.3332 32.1465Z"
              fill="#493260"
            />
            <path
              d="M0 16.3135V24.6468C0 26.0218 1.125 27.1468 2.5 27.1468H17.5C18.875 27.1468 20 26.0218 20 24.6468V16.3135C20 14.9385 18.875 13.8135 17.5 13.8135H2.5C1.125 13.8135 0 14.9385 0 16.3135ZM7.91667 20.4801C7.91667 19.3301 8.85 18.3968 10 18.3968C11.15 18.3968 12.0833 19.3301 12.0833 20.4801C12.0833 21.6301 11.15 22.5635 10 22.5635C8.85 22.5635 7.91667 21.6301 7.91667 20.4801Z"
              fill="#733B9C"
            />
            <path
              d="M3.3335 13.8132L5.00016 15.4798L6.66683 13.8132C6.66683 11.9798 8.16683 10.4798 10.0002 10.4798C11.8335 10.4798 13.3335 11.9798 13.3335 13.8132L15.0002 15.4798L16.6668 13.8132C16.6668 10.1298 13.6835 7.14648 10.0002 7.14648C6.31683 7.14648 3.3335 10.1298 3.3335 13.8132Z"
              fill="#733B9C"
            />
          </svg>
        </header>
        <div className="mt-[44px] flex flex-col gap-5">
          <InputField
            label="Password"
            type={showPassword1 ? "text" : "password"}
            icon={!showPassword1 ? "/icons/eye-hide.svg" : "/icons/eye.svg"}
            onClick={() => setShowPassword1(!showPassword1)}
            iconPosition="right"
            status={formik.errors.password ? "error" : null}
            {...formik.getFieldProps("password")}
          />
          <InputField
            label="Confirm Password"
            type={showPassword2 ? "text" : "password"}
            icon={!showPassword2 ? "/icons/eye-hide.svg" : "/icons/eye.svg"}
            onClick={() => setShowPassword2(!showPassword2)}
            iconPosition="right"
            {...formik.getFieldProps("confirmPassword")}
            status={formik.errors.confirmPassword ? "error" : null}
            errorMessage={
              formik.touched.confirmPassword && formik.errors.confirmPassword
            }
          />
          <div className="flex flex-col gap-[15px] mb-6">
            <div className="flex gap-3">
              <div className="w-6 h-6">
                {formik.errors.password &&
                formik.touched.password &&
                formik.errors.password.includes(
                  "Password must be at least 8 characters"
                ) ? (
                  <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path
                      d="M12 2.48047C6.48603 2.48047 2 6.96651 2 12.4805C2 17.9944 6.48603 22.4805 12 22.4805C17.514 22.4805 22 17.9944 22 12.4805C22 6.96651 17.514 2.48047 12 2.48047ZM12 3.98047C16.7033 3.98047 20.5 7.77716 20.5 12.4805C20.5 17.1838 16.7033 20.9805 12 20.9805C7.29669 20.9805 3.5 17.1838 3.5 12.4805C3.5 7.77716 7.29669 3.98047 12 3.98047ZM15.2432 8.46973C15.0451 8.4744 14.8569 8.55726 14.7197 8.7002L12 11.4199L9.28027 8.7002C9.21036 8.6282 9.12672 8.57097 9.03429 8.53189C8.94187 8.4928 8.84254 8.47266 8.74219 8.47266C8.59293 8.47269 8.44707 8.51726 8.32328 8.60066C8.19949 8.68405 8.1034 8.80249 8.0473 8.9408C7.99119 9.07912 7.97763 9.23103 8.00835 9.37709C8.03907 9.52316 8.11267 9.65674 8.21973 9.76074L10.9395 12.4805L8.21973 15.2002C8.14775 15.2693 8.09028 15.3521 8.0507 15.4437C8.01111 15.5353 7.9902 15.6338 7.98918 15.7336C7.98817 15.8334 8.00707 15.9324 8.04479 16.0248C8.08251 16.1171 8.13828 16.2011 8.20883 16.2716C8.27939 16.3422 8.36332 16.398 8.4557 16.4357C8.54808 16.4734 8.64706 16.4923 8.74684 16.4913C8.84662 16.4903 8.9452 16.4694 9.03679 16.4298C9.12839 16.3902 9.21116 16.3327 9.28027 16.2607L12 13.541L14.7197 16.2607C14.7888 16.3327 14.8716 16.3902 14.9632 16.4298C15.0548 16.4694 15.1534 16.4903 15.2532 16.4913C15.3529 16.4923 15.4519 16.4734 15.5443 16.4357C15.6367 16.398 15.7206 16.3422 15.7912 16.2716C15.8617 16.2011 15.9175 16.1171 15.9552 16.0248C15.9929 15.9324 16.0118 15.8334 16.0108 15.7336C16.0098 15.6338 15.9889 15.5353 15.9493 15.4437C15.9097 15.3521 15.8523 15.2693 15.7803 15.2002L13.0605 12.4805L15.7803 9.76074C15.8893 9.65606 15.9642 9.52087 15.9951 9.37289C16.026 9.22491 16.0115 9.07105 15.9534 8.93147C15.8953 8.7919 15.7965 8.67313 15.6697 8.59073C15.543 8.50833 15.3943 8.46616 15.2432 8.46973Z"
                      fill="#DC180D"
                    />
                  </svg>
                ) : (
                  <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path
                      d="M12 22.4805C17.5 22.4805 22 17.9805 22 12.4805C22 6.98047 17.5 2.48047 12 2.48047C6.5 2.48047 2 6.98047 2 12.4805C2 17.9805 6.5 22.4805 12 22.4805Z"
                      stroke="#14AA5B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.75 12.4804L10.58 15.3104L16.25 9.65039"
                      stroke="#14AA5B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={` text-[13px] font-normal  leading-[18px] ${
                  formik.errors.password &&
                  formik.touched.password &&
                  formik.errors.password.includes(
                    "Password must be at least 8 characters"
                  )
                    ? "text-raiz-error"
                    : "text-raiz-gray-700"
                }`}
              >
                Please set a password with minimum length of 8 characters
              </span>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6">
                {formik.errors.password &&
                formik.touched.password &&
                formik.errors.password.includes(
                  "Password must contain at least 2 of these rules: one uppercase letter, one lowercase letter, one numeric character, one special character"
                ) ? (
                  <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path
                      d="M12 2.48047C6.48603 2.48047 2 6.96651 2 12.4805C2 17.9944 6.48603 22.4805 12 22.4805C17.514 22.4805 22 17.9944 22 12.4805C22 6.96651 17.514 2.48047 12 2.48047ZM12 3.98047C16.7033 3.98047 20.5 7.77716 20.5 12.4805C20.5 17.1838 16.7033 20.9805 12 20.9805C7.29669 20.9805 3.5 17.1838 3.5 12.4805C3.5 7.77716 7.29669 3.98047 12 3.98047ZM15.2432 8.46973C15.0451 8.4744 14.8569 8.55726 14.7197 8.7002L12 11.4199L9.28027 8.7002C9.21036 8.6282 9.12672 8.57097 9.03429 8.53189C8.94187 8.4928 8.84254 8.47266 8.74219 8.47266C8.59293 8.47269 8.44707 8.51726 8.32328 8.60066C8.19949 8.68405 8.1034 8.80249 8.0473 8.9408C7.99119 9.07912 7.97763 9.23103 8.00835 9.37709C8.03907 9.52316 8.11267 9.65674 8.21973 9.76074L10.9395 12.4805L8.21973 15.2002C8.14775 15.2693 8.09028 15.3521 8.0507 15.4437C8.01111 15.5353 7.9902 15.6338 7.98918 15.7336C7.98817 15.8334 8.00707 15.9324 8.04479 16.0248C8.08251 16.1171 8.13828 16.2011 8.20883 16.2716C8.27939 16.3422 8.36332 16.398 8.4557 16.4357C8.54808 16.4734 8.64706 16.4923 8.74684 16.4913C8.84662 16.4903 8.9452 16.4694 9.03679 16.4298C9.12839 16.3902 9.21116 16.3327 9.28027 16.2607L12 13.541L14.7197 16.2607C14.7888 16.3327 14.8716 16.3902 14.9632 16.4298C15.0548 16.4694 15.1534 16.4903 15.2532 16.4913C15.3529 16.4923 15.4519 16.4734 15.5443 16.4357C15.6367 16.398 15.7206 16.3422 15.7912 16.2716C15.8617 16.2011 15.9175 16.1171 15.9552 16.0248C15.9929 15.9324 16.0118 15.8334 16.0108 15.7336C16.0098 15.6338 15.9889 15.5353 15.9493 15.4437C15.9097 15.3521 15.8523 15.2693 15.7803 15.2002L13.0605 12.4805L15.7803 9.76074C15.8893 9.65606 15.9642 9.52087 15.9951 9.37289C16.026 9.22491 16.0115 9.07105 15.9534 8.93147C15.8953 8.7919 15.7965 8.67313 15.6697 8.59073C15.543 8.50833 15.3943 8.46616 15.2432 8.46973Z"
                      fill="#DC180D"
                    />
                  </svg>
                ) : (
                  <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path
                      d="M12 22.4805C17.5 22.4805 22 17.9805 22 12.4805C22 6.98047 17.5 2.48047 12 2.48047C6.5 2.48047 2 6.98047 2 12.4805C2 17.9805 6.5 22.4805 12 22.4805Z"
                      stroke="#14AA5B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.75 12.4804L10.58 15.3104L16.25 9.65039"
                      stroke="#14AA5B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-raiz-gray-700 text-[13px] font-normal  leading-[18px] ${
                  formik.errors.password &&
                  formik.touched.password &&
                  formik.errors.password.includes(
                    "Password must contain at least 2 of these rules: one uppercase letter, one lowercase letter, one numeric character, one special character"
                  )
                    ? "text-raiz-error"
                    : "text-raiz-gray-700"
                }`}
              >
                Password must contain at least 2 of these rules: one uppercase
                letter, one lowercase letter, one numeric character, one special
                character
              </span>
            </div>
          </div>
        </div>
      </div>
      <Button
        loading={resetPasswordMutation.isPending}
        type="submit"
        disabled={!formik.isValid || !formik.dirty}
      >
        Reset your password
      </Button>
    </form>
  );
};

export default CreateNewPassword;
