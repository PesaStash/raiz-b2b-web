"use client";
import { useSearchParams } from "next/navigation";
import InvitationOutcome from "@/components/team/InvitationOutcome";
import { TeamDialog } from "@/components/team/TeamUI";
import React, { useState } from "react";
import AuthLayout from "../_components/AuthLayout";
import EmailVerificationLayout from "../_components/EmailVerificationLayout";
import LoginForm from "./_components/LoginForm";
import LoginOtp from "./_components/LoginOtp";
import { AnimatePresence } from "motion/react";

const LoginPage = () => {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (step === 2) {
    return (
      <EmailVerificationLayout>
        <LoginOtp setStep={setStep} from="login" email={email} password={password} />
      </EmailVerificationLayout>
    );
  }

  return (
    <AuthLayout login>
      {params.get("reason") === "deactivated" && !dismissed && <TeamDialog title="You have been signed out" close={() => setDismissed(true)}><InvitationOutcome state="deactivated" /></TeamDialog>}
      <div className="w-full max-w-[400px]">
        <AnimatePresence>
          <LoginForm setStep={setStep} setEmail={setEmail} setPassword={setPassword} />
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
