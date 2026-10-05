"use client";
import { useSearchParams } from "next/navigation";
import InvitationOutcome from "@/components/team/InvitationOutcome";
import { TeamDialog } from "@/components/team/TeamUI";
import React, { useState } from "react";
import Slider from "../_components/authSlide/Slider";
import LoginForm from "./_components/LoginForm";
import LoginOtp from "./_components/LoginOtp";
import { AnimatePresence } from "motion/react";

const LoginPage = () => {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="p-4 md:p-12 lg:px-8 xl:px-12 h-[calc(100vh-2rem)] md:h-full min-h-[100vh]">
      {params.get("reason") === "deactivated" && !dismissed && <TeamDialog title="You have been signed out" close={() => setDismissed(true)}><InvitationOutcome state="deactivated" /></TeamDialog>}
      <div className="flex flex-col  md:flex-row  h-full gap-8">
        <Slider />
        <AnimatePresence>
          {step === 1 ? (
            <LoginForm setStep={setStep} setEmail={setEmail} setPassword={setPassword} />
          ) : (
            <LoginOtp setStep={setStep} from="login" email={email} password={password} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LoginPage;
