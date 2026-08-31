"use client";
import Slider from "@/app/(auth)/_components/authSlide/Slider";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import PayWithCard from "./_components/PayWithCard";
import { useQuery } from "@tanstack/react-query";
import { FetchPaymentInfoApi } from "@/services/business";
import { useParams, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import SelectPayType from "./_components/SelectPayType";
import GuestPayDetail from "./_components/GuestPayDetail";
import PayLocalAmount from "./_components/PayLocalAmount";
import { decryptData } from "@/lib/headerEncryption";
import { useGuestSendStore } from "@/store/GuestSend";
import { GuestAfricaPayinStep } from "@/store/GuestSend/guestSendSlice.types";
import PayDetails from "./_components/PayDetails";
import { AnimatePresence } from "motion/react";
import ZelleTopupInfo from "@/app/(dashboard)/_components/topUp/UsdTopup/ZelleTopupInfo";
import { useTopupStore } from "@/store/TopUp";
import { toast } from "sonner";

export type LocalPaymentMethod = "bankTransfer" | "mobileMoney";
export type GuestPaymentType = "local" | "card" | "transfer" | "zelle";
export type GuestPayDetailsSteps = GuestAfricaPayinStep;

const PayUserClient = () => {
  const params = useParams();
  const username = (params?.raizTag as string) || "";
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState<string | undefined>();
  const [screen, setScreen] = useState<GuestPaymentType | "detail" | null>(
    null,
  );
  const [step, setStep] = useState<GuestAfricaPayinStep>("details");
  const [paymentType, setPaymentType] = useState<
    GuestPaymentType | undefined
  >();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const { actions } = useGuestSendStore();
  const { actions: topupActions } = useTopupStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ["business-payment-info"],
    queryFn: () => FetchPaymentInfoApi(username),
    enabled: !!username,
  });

  useEffect(() => {
    const encryptedData = searchParams.get("data");

    if (encryptedData) {
      try {
        const decrypted = decryptData(encryptedData);
        if (decrypted) {
          const parsed = JSON.parse(decrypted);
          if (parsed.amount) {
            setAmount(parsed.amount);
            actions.setField("amount", parsed.amount);
          }
        }
      } catch (err) {
        console.error("Failed to decrypt or parse data", err);
      }
    }
  }, [searchParams, actions]);

  const handleGeneralNextStep = () => {
    if (!paymentType) return;
    if (paymentType === "local") {
      setScreen("local");
    } else if (paymentType === "transfer") {
      setScreen("transfer");
    } else if (paymentType === "zelle") {
      setScreen("zelle");
    } else {
      setScreen("card");
    }
  };

  if ((error || !data) && !isLoading) {
    return (
      <section className="p-6 md:p-12 lg:px-8 xl:px-12 h-[calc(100vh-2rem)] md:h-full min-h-[100vh] flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 w-full max-w-md text-center shadow-md">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-red-700">
              We couldn&#39;t fetch the payment information. Please try again
              later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const handleDone = () => {
    setScreen(null);
    actions.reset();
    topupActions.reset();
    setPaymentType(undefined);
    setPaymentMethod(null);
    setStep("details");
  };

  return (
    <section className="p-6 md:p-12 lg:px-8 xl:px-12 h-[calc(100vh-2rem)] md:h-full min-h-[100vh]">
      <div className="flex flex-col lg:flex-row h-full gap-8">
        <Slider className="md:hidden lg:block" />
        <div className="py-4 px-0 xl:px-8 lg:w-[50%] xl:w-[46%] h-full flex flex-col">
          <Image src={"/icons/Logo.svg"} width={91.78} height={32} alt="Logo" />
          {isLoading ? (
            <div className="flex justify-center items-center w-full mt-5">
              <Spinner />
            </div>
          ) : (
            <AnimatePresence>
              <div className="flex flex-col h-full">
                {data && !screen && (
                  <SelectPayType
                    data={data}
                    goNext={handleGeneralNextStep}
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    amountFromLink={amount}
                  />
                )}
                {data && screen === "local" && (
                  <PayLocalAmount
                    data={data}
                    goBack={() => setScreen(null)}
                    goNext={() => setScreen("detail")}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    amountFromLink={amount}
                  />
                )}
                {data && screen === "transfer" && (
                  <PayDetails data={data} setScreen={setScreen} />
                )}
                {data && screen === "card" && (
                  <PayWithCard
                    setScreen={setScreen}
                    data={data}
                    amountFromLink={amount}
                  />
                )}
                {data && screen === "detail" && (
                  <GuestPayDetail
                    goBack={() => setScreen("local")}
                    close={handleDone}
                    data={data}
                    setStep={setStep}
                    step={step}
                    username={username}
                  />
                )}
                {data && screen === "zelle" && (
                  <>
                    <SelectPayType
                      data={data}
                      goNext={handleGeneralNextStep}
                      paymentType={paymentType}
                      setPaymentType={setPaymentType}
                      amountFromLink={amount}
                    />
                    <ZelleTopupInfo
                      goBack={() => setScreen(null)}
                      goNext={() => {
                        handleDone();
                        toast.success(
                          "Zelle top-up submitted — funds will reflect once verified.",
                        );
                      }}
                      type="guest"
                    />
                  </>
                )}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
};

export default PayUserClient;
