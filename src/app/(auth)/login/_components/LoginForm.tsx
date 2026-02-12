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
import { passwordHash } from "@/utils/helpers";
import { useRouter } from "next/navigation";

const LoginForm = ({
  setStep,
  setEmail,
}: {
  setStep: Dispatch<SetStateAction<number>>;
  setEmail: Dispatch<SetStateAction<string>>;
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
    },
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: toFormikValidationSchema(loginSchema),
    onSubmit: (values) => {
      loginMutation.mutate({
        email: values.email,
        password: passwordHash(values.password),
      });
    },
  });
  return (
    <AnimatedSection
      key="login-form"
      className="py-4 px-0 md:px-3 xl:px-8 w-full md:w-[50%] xl:w-[46%] h-full flex flex-col  justify-between gap-[30px] xl:gap-[60px]"
    >
      <Image src={"/icons/Logo.svg"} width={91.78} height={32} alt="Logo" />
      <div className="flex flex-col h-full  justify-between">
        <div>
          <h1 className="text-raiz-gray-950 text-[23px] font-semibold  leading-10">
            Welcome Back
          </h1>
          <h6 className="text-raiz-gray-600 text-sm  leading-snug">Log in</h6>
          <form
            onSubmit={formik.handleSubmit}
            className="flex flex-col gap-5 mt-8 xl:mt-[44px]"
          >
            <InputField
              placeholder="Enter your email address"
              label="Email"
              type="email"
              {...formik.getFieldProps("email")}
              status={formik.errors.email ? "error" : null}
              errorMessage={formik.touched.email && formik.errors.email}
            />
            <div className="flex justify-between items-center">
              <InputLabel content="Password" />
              <Link
                className="text-right text-raiz-purple-90 text-sm font-semibold  leading-[16.80px] hover:underline"
                href={"/forgot-password"}
              >
                Forgot your password?
              </Link>
            </div>

            <InputField
              type={showPassword ? "text" : "password"}
              icon={!showPassword ? "/icons/eye-hide.svg" : "/icons/eye.svg"}
              onClick={() => setShowPassword(!showPassword)}
              iconPosition="right"
              status={formik.errors.password ? "error" : null}
              {...formik.getFieldProps("password")}
            />
          </form>
        </div>
        <div>
          <Button
            onClick={formik.handleSubmit}
            disabled={
              !formik.dirty || !formik.isValid || loginMutation.isPending
            }
            loading={loginMutation.isPending}
          >
            Login
          </Button>
          <p className="text-raiz-gray-800 text-[13px] leading-tight text-center mt-6">
            Don&#39;t have an account?{" "}
            <Link href={"/register"} className="leading-[18.20px] font-bold ">
              {" "}
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default LoginForm;
