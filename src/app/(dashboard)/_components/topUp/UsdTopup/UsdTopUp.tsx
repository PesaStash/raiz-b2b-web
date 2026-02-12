"use client";

import { useState } from "react";
import TopupAmount from "./TopupAmount";
import TopupTypeModal from "./TopupTypeModal";
import { useTopupStore } from "@/store/TopUp";
import ZelleTopupInfo from "./ZelleTopupInfo";
import { useQueryClient } from "@tanstack/react-query";
import StripeCheckoutSummary from "./StripeCheckoutSummary";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePayment from "./StripePayment";
import TopupSuccess from "./TopupSuccess";
import { toast } from "sonner";
import TopUp from "../TopUp";

interface Props {
  close: () => void;
}

export type UsdTopupType =
  | "amount"
  | "type"
  | "detail"
  | "confirm"
  | "status"
  | "payment"
  | "success";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY || ""
);

const UsdTopUp = ({ close }: Props) => {
  const [step, setStep] = useState<UsdTopupType>("type");
  const { paymentOption, actions, stripeDetail } = useTopupStore();
  const qc = useQueryClient();
  const handleDone = () => {
    close();
    qc.refetchQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["transactions-report"] });
  };
  const displayScreen = () => {
    switch (step) {
      case "type":
        return (
          <>
            {/* <TopupAmount goNext={() => setStep("type")} close={close} /> */}
            <TopupTypeModal
              goBack={() => {
                // setStep("amount");
                actions.setPaymentOption(null);
                close();
              }}
              goNext={() => setStep("amount")}
            />
          </>
        );
      case "amount":
        return <TopupAmount goNext={() => setStep("detail")} close={close} />;
      case "detail":
        return (
          <>
            <TopupAmount goNext={() => setStep("type")} close={close} />
            {paymentOption === "zelle" && (
              <ZelleTopupInfo
                goBack={() => setStep("type")}
                goNext={() => {
                  handleDone();
                  toast.success(
                    "Zelle top-up submitted — funds will reflect once verified."
                  );
                }}
                type="top-up"
              />
            )}
            {paymentOption === "debit-card" && (
              <StripeCheckoutSummary
                goBack={() => setStep("type")}
                goNext={() => setStep("payment")}
              />
            )}
          </>
        );
      case "payment":
        return (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: stripeDetail?.client_secret }}
          >
            <StripePayment
              goBack={() => setStep("detail")}
              goNext={() => setStep("success")}
            />
          </Elements>
        );
      case "success":
        return <TopupSuccess close={handleDone} />;
      default:
        break;
    }
  };

  if (paymentOption === "bank-transfer") {
    return <TopUp close={close} />;
  }

  return <>{displayScreen()}</>;
};

export default UsdTopUp;
