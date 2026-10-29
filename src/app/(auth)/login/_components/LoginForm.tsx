"use client";
import Image from "next/image";
import Button from "@/components/ui/Button";
import InputLabel from "@/components/ui/InputLabel";
import { useFormik } from "formik";
import Link from "next/link";
import React, { Dispatch, SetStateAction, useState } from "react";
import InputField from "@/components/ui/InputField";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { loginSchema } from "../../register/_components/validation";
import { useMutation } from "@tanstack/react-query";
import { ILoginPayload, LoginApi } from "@/services/auth";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useRouter } from "next/navigation";

const LoginForm = ({
  setStep,
  setEmail,
  setPassword,
}: {
  setStep: Dispatch<SetStateAction<number>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useMutation({
    mutationFn: (data: ILoginPayload) => LoginApi(data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      if (
        error?.data?.message &&
        error?.data?.message?.includes("please verify your email")
      ) {
        router.push(`/verify?email=${formik.values.email}`);
      }
    },
    onSuccess: () => {
      setStep(2);
      setEmail(formik.values.email);
      setPassword(formik.values.password);
    },
  });

  const submitFn = () => {
    loginMutation.mutate({
      email: formik.values.email,
      password: formik.values.password,
    });
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: toFormikValidationSchema(loginSchema),
    onSubmit: () => submitFn(),
  });
  return (
    <AnimatedSection
      key="login-form"
      className="w-full flex flex-col gap-7"
    >
      <div className="flex flex-col h-full  justify-between">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold leading-10">
            Welcome back
          </h1>
          <p className="mt-2.5 text-[#6b6b80] text-[15px] leading-[22px]">Log in to manage your business account.</p>
          <form
            onSubmit={formik.handleSubmit}
            className="flex flex-col gap-5 mt-7"
          >
            <InputField
              placeholder="Enter your email address"
              label="Work email"
              aria-label="Work email"
              type="email"
              autoComplete="email"
              {...formik.getFieldProps("email")}
              status={formik.touched.email && formik.errors.email ? "error" : null}
              errorMessage={formik.touched.email && formik.errors.email}

            />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <InputLabel content="Password" />
                <Link
                  className="text-right text-raiz-usd-primary text-xs md:text-sm font-semibold  leading-[16.80px] hover:underline"
                  href={"/forgot-password"}
                >
                  Forgot your password?
                </Link>
              </div>

              <InputField
                type={showPassword ? "text" : "password"}
                aria-label="Password"
                className="pr-12"
                autoComplete="current-password"
                placeholder="Enter your password"
                icon={<button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Image
                    src="/images/auth/eye.svg"
                    width={20}
                    height={20}
                    alt=""
                  />
                </button>}
                iconPosition="right"
                status={formik.touched.password && formik.errors.password ? "error" : null}
                {...formik.getFieldProps("password")}
                errorMessage={formik.touched.password && formik.errors.password}

              />
            </div>
            <Button
              className="auth-submit mt-2"
              type="submit"
              disabled={!formik.dirty || !formik.isValid || loginMutation.isPending}
              loading={loginMutation.isPending}
            >Log in</Button>
          </form>
        </div>

      </div>
    </AnimatedSection>
  );
};

export default LoginForm;
