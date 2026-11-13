"use client";
import React from "react";
import Image from "next/image";
import { useFormik } from "formik";
import Button from "@/components/ui/Button";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useRouter } from "next/navigation";
import InputField from "@/components/ui/InputField";
import { useMutation } from "@tanstack/react-query";
import { ForgotPasswordApi } from "@/services/auth";
import { toast } from "sonner";

interface Props {
  setEmail: (arg: string) => void;
  setPage: (arg: number) => void;
}

const InputEmailForm = ({ setEmail, setPage }: Props) => {
  const router = useRouter();

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => ForgotPasswordApi(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      setPage(2);
    },
  });
  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: toFormikValidationSchema(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    ),
    onSubmit: (val) => {
      forgotPasswordMutation.mutate({ email: val.email });
    },
  });
  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-6"
    >
      <div>
        <button onClick={() => router.back()} type="button">
          <Image
            src={"/icons/arrow-left.svg"}
            alt="back"
            width={18.48}
            height={18.48}
          />
        </button>
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-[28px] font-bold  leading-10">
            Reset your password
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
              d="M0 16.3135V24.6468C0 26.0218 1.125 27.1468 2.5 27.1468H17.5C18.875 27.1468 20 26.0218 20 24.6468V16.3135C20 14.9385 18.875 13.8135 17.5 13.8135H2.5C1.125 13.8135 0 14.9385 0 16.3135ZM7.91667 20.4801C7.91667 19.3301 8.85 18.3968 10 18.3968C11.15 18.3968 12.0833 19.3301 12.0833 20.4801C12.0833 21.6301 11.15 22.5635 10 22.5635C8.85 22.5635 7.91667 21.6301 7.91667 20.4801Z"
              fill="#733B9C"
            />
            <path
              d="M3.3335 13.8132L5.00016 15.4798L6.66683 13.8132C6.66683 11.9798 8.16683 10.4798 10.0002 10.4798C11.8335 10.4798 13.3335 11.9798 13.3335 13.8132L15.0002 15.4798L16.6668 13.8132C16.6668 10.1298 13.6835 7.14648 10.0002 7.14648C6.31683 7.14648 3.3335 10.1298 3.3335 13.8132Z"
              fill="#733B9C"
            />
          </svg>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug mb-6">
          Enter the email registered with your account to reset your password
        </p>
        <InputField
          placeholder="Enter your email address"
          label="Email"
          type="email"
          onChange={(e) => {
            setEmail(e.target.value);
            formik.setFieldValue("email", e.target.value);
          }}
          name="email"
          onBlur={formik.handleBlur}
          status={formik.errors.email ? "error" : null}
          errorMessage={formik.touched.email && formik.errors.email}
        />
      </div>
      <Button
        className="auth-submit"
        loading={forgotPasswordMutation.isPending}
        type="submit"
        disabled={!formik.isValid || !formik.dirty}
      >
        Send OTP to email
      </Button>
    </form>
  );
};

export default InputEmailForm;
