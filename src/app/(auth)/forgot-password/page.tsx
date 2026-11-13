"use client";
import React, { useState } from "react";
import AuthLayout from "../_components/AuthLayout";
import EmailVerificationLayout from "../_components/EmailVerificationLayout";
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
  const [password, setPassword] = useState("");
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
        return (
          <WelcomeBack
            setPage={setPage}
            email={email}
            user={user}
            setPassword={setPassword}
          />
        );
      case 5:
        return (
          <LoginOtp
            from="welcome-back"
            setStep={setPage}
            email={email}
            password={password}
          />
        );
      default:
        break;
    }
  };
  if (page === 5) {
    return <EmailVerificationLayout>{displayPage()}</EmailVerificationLayout>;
  }

  return (
    <AuthLayout>
      <AnimatedSection
        key="forgot-password"
        className="auth-secondary auth-otp w-full max-w-[440px]"
      >
        {displayPage()}
      </AnimatedSection>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
