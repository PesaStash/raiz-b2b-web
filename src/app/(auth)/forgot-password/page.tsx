"use client";
import React, { useState } from "react";
import Image from "next/image";
import Slider from "../_components/authSlide/Slider";
import InputEmailForm from "./forms/InputEmailForm";
import ResetOtp from "./forms/ResetOtp";
import CreateNewPassword from "./forms/CreateNewPassword";
import WelcomeBack from "./forms/WelcomeBack";
import AnimatedSection from "@/components/ui/AnimatedSection";
import LoginOtp from "../login/_components/LoginOtp";

export type WelcomUserProps = {
  first_name: string;
  last_name: string;
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [page, setPage] = useState(1);
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<WelcomUserProps>({
    first_name: "",
    last_name: "",
  });

  const displayPage = () => {
    switch (page) {
      case 1:
        return <InputEmailForm setEmail={setEmail} setPage={setPage} />;
      case 2:
        return <ResetOtp email={email} setPage={setPage} setOtp={setOtp} />;
      case 3:
        return (
          <CreateNewPassword
            setPage={setPage}
            otp={otp}
            setUser={setUser}
            email={email}
          />
        );
      case 4:
        return <WelcomeBack setPage={setPage} email={email} user={user} />;
      case 5:
        return <LoginOtp from="welcome-back" setStep={setPage} email={email} />;
      default:
        break;
    }
  };
  return (
    <section className="p-6 md:p-12 lg:px-8 xl:px-12 h-[calc(100vh-2rem)] md:h-full min-h-[100vh]">
      <div className="flex flex-col  md:flex-row h-full gap-12">
        <Slider />
        <AnimatedSection
          key="forgot-password"
          className="py-4 px-0 md:px-3 xl:px-8 lg:w-[50%] xl:w-[46%] h-full flex flex-col  justify-between gap-[60px]"
        >
          {page !== 5 && (
            <Image
              src={"/icons/Logo.svg"}
              width={91.78}
              height={32}
              alt="Logo"
            />
          )}
          {displayPage()}
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
