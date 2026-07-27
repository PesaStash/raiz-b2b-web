"use client";
import Button from "@/components/ui/Button";
import InputLabel from "@/components/ui/InputLabel";
import { useFormik } from "formik";
import Link from "next/link";
import React, { useState } from "react";
import InputField from "@/components/ui/InputField";
import { useMutation } from "@tanstack/react-query";
import { ILoginPayload, LoginApi } from "@/services/auth";
import { WelcomUserProps } from "../page";
import { getInitials } from "@/utils/helpers";

interface Props {
  setPage: (arg: number) => void;
  email: string;
  user: WelcomUserProps;
  setPassword: (arg: string) => void;
}

const WelcomeBack = ({ setPage, email, user, setPassword }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useMutation({
    mutationFn: (data: ILoginPayload) => LoginApi(data),
    onSuccess: () => {
      setPage(5);
      setPassword(formik.values.password);
    },
  });
  const formik = useFormik({
    initialValues: {
      password: "",
    },
    onSubmit: (val) => {
      loginMutation.mutate({ email, password: val.password });
    },
  });
  return (
    <form
      onSubmit={formik.handleSubmit}
      className="h-full flex flex-col -mt-2 justify-between "
    >
      <div>
        <header className="flex flex-col justify-center items-center mb-[62px]">
          <span className="bg-primary h-[54px] w-[54px] rounded-full flex justify-center items-center text-center text-[#fcfcfc]  font-semibold ">
            {getInitials(user.first_name, user.last_name)}
          </span>
          <h3 className="text-center text-raiz-gray-950 text-xl font-bold ">
            Welcome back, {user.first_name}
          </h3>
        </header>

        <div className="flex justify-between items-center mb-3">
          <InputLabel content="Password" />
          <button
            className="text-right text-raiz-purple-90 text-sm font-semibold  leading-[16.80px] hover:underline"
            onClick={() => setPage(1)}
          >
            Forgot your password?
          </button>
        </div>
        <InputField
          type={showPassword ? "text" : "password"}
          icon={!showPassword ? "/icons/eye-hide.svg" : "/icons/eye.svg"}
          onClick={() => setShowPassword(!showPassword)}
          iconPosition="right"
          status={formik.errors.password ? "error" : null}
          {...formik.getFieldProps("password")}
        />
        <Button
          type="submit"
          disabled={!formik.values.password}
          className="my-6"
          loading={loginMutation.isPending}
        >
          Login
        </Button>
        <p className="text-raiz-gray-600  text-sm font-normal leading-normal text-center">
          Not you?{" "}
          <Link
            href={"/login"}
            className="font-semibold hover:underline text-raiz-purple-90"
          >
            Sign in as another member
          </Link>
        </p>
      </div>
      <div className="flex gap-3">
        <div className="w-6 h-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3.74224 16.675C2.75324 17.664 2.75324 19.268 3.74224 20.258C4.73124 21.247 6.33524 21.247 7.32524 20.258C7.64724 19.936 12.3292 15.254 17.4582 10.125L13.8752 6.54199C8.74624 11.671 4.06424 16.353 3.74224 16.675Z"
              fill="#443852"
            />
            <path
              d="M20.258 7.32499C21.247 6.33599 21.247 4.73199 20.258 3.74199C19.269 2.75299 17.665 2.75299 16.675 3.74199C16.503 3.91399 16.62 3.79699 13.875 6.54199L17.458 10.125C20.203 7.37899 20.086 7.49699 20.258 7.32499Z"
              fill="#F79E1B"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.5759 2.29C10.6549 2.114 10.8299 2 11.0229 2C11.2159 2 11.3919 2.114 11.4709 2.29L11.8399 3.114C11.8469 3.129 11.8559 3.143 11.8679 3.155C11.8799 3.167 11.8939 3.177 11.9089 3.183L12.7329 3.552C12.9099 3.631 13.0229 3.806 13.0229 4C13.0229 4.194 12.9089 4.369 12.7329 4.448L11.9099 4.817C11.8949 4.824 11.8809 4.833 11.8689 4.845C11.8569 4.857 11.8469 4.871 11.8409 4.886L11.4709 5.71C11.3919 5.886 11.2169 6 11.0229 6C10.8299 6 10.6539 5.886 10.5749 5.71L10.2059 4.886C10.1999 4.871 10.1899 4.857 10.1779 4.845C10.1659 4.833 10.1519 4.823 10.1369 4.817L9.31395 4.448C9.13695 4.369 9.02295 4.193 9.02295 4C9.02295 3.807 9.13695 3.631 9.31295 3.552L10.1369 3.183C10.1519 3.176 10.1659 3.167 10.1779 3.155C10.1899 3.143 10.1999 3.129 10.2059 3.114L10.5759 2.29Z"
              fill="#F79E1B"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.328 5.435C4.447 5.17 4.71 5 5 5C5.29 5 5.553 5.17 5.672 5.435L6.225 6.67C6.235 6.693 6.25 6.714 6.268 6.732C6.286 6.75 6.307 6.764 6.33 6.775L7.565 7.328C7.83 7.447 8 7.71 8 8C8 8.29 7.83 8.553 7.565 8.672L6.329 9.225C6.306 9.235 6.285 9.25 6.268 9.268C6.25 9.285 6.235 9.306 6.225 9.329L5.672 10.564C5.553 10.83 5.29 11 5 11C4.71 11 4.447 10.83 4.328 10.565L3.775 9.329C3.765 9.306 3.75 9.285 3.732 9.268C3.715 9.25 3.694 9.235 3.671 9.225L2.435 8.672C2.17 8.553 2 8.29 2 8C2 7.71 2.17 7.447 2.435 7.328L3.67 6.775C3.693 6.765 3.714 6.75 3.732 6.732C3.75 6.714 3.764 6.693 3.775 6.67L4.328 5.435Z"
              fill="#F79E1B"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M18.552 15.29C18.631 15.114 18.807 15 19 15C19.193 15 19.369 15.114 19.448 15.29L19.817 16.114C19.824 16.129 19.833 16.143 19.845 16.155C19.857 16.167 19.871 16.177 19.886 16.183L20.71 16.552C20.886 16.631 21 16.807 21 17C21 17.193 20.886 17.369 20.71 17.448L19.886 17.817C19.871 17.824 19.857 17.833 19.845 17.845C19.833 17.857 19.823 17.871 19.817 17.886L19.448 18.71C19.369 18.886 19.193 19 19 19C18.807 19 18.631 18.886 18.552 18.71L18.183 17.886C18.176 17.871 18.167 17.857 18.155 17.845C18.143 17.833 18.129 17.823 18.114 17.817L17.29 17.448C17.114 17.369 17 17.193 17 17C17 16.807 17.114 16.631 17.29 16.552L18.114 16.183C18.129 16.176 18.143 16.167 18.155 16.155C18.167 16.143 18.177 16.129 18.183 16.114L18.552 15.29Z"
              fill="#F79E1B"
            />
          </svg>
        </div>
        <p className="text-raiz-gray-700 text-xs  leading-[18px]">
          <span className="font-semibold ">
            Life is full of financial seasons.
          </span>{" "}
          Raiz is here to help you weather them all. Whether you&#39;re saving
          for a rainy day or nurturing a long-term goal, login to your Raiz
          account and discover how we can help you navigate your financial
          journey.
        </p>
      </div>
    </form>
  );
};

export default WelcomeBack;
