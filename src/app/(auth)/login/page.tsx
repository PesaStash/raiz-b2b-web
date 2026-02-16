"use client";
import React, { useState } from "react";
import Slider from "../_components/authSlide/Slider";
import LoginForm from "./_components/LoginForm";
import LoginOtp from "./_components/LoginOtp";
import { AnimatePresence } from "motion/react";

const LoginPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  return (
    <section className="p-6 md:p-12 lg:px-8 xl:px-12 h-[calc(100vh-2rem)] md:h-full min-h-[100vh]">
      <div className="flex flex-col  md:flex-row  h-full gap-8">
        <Slider />
        <AnimatePresence>
          {step === 1 ? (
            <LoginForm setStep={setStep} setEmail={setEmail} />
          ) : (
            <LoginOtp setStep={setStep} from="login" email={email} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LoginPage;
