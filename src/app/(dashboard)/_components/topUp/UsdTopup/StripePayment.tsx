"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import { confirmStripeTopPaymentIntent } from "@/services/transactions";
import { useTopupStore } from "@/store/TopUp";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { toast } from "sonner";
import SideModalWrapper from "../../SideModalWrapper";

interface Props {
  goBack: () => void;
  goNext: () => void;
}

const StripePayment = ({ goBack, goNext }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const { stripeDetail } = useTopupStore();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!stripe || !elements) {
      toast.error("Stripe or elements not initialized");
      return;
    }
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrMsg(submitError.message || "");
      setLoading(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: stripeDetail?.client_secret || "",
      redirect: "if_required",
    });
    if (stripeError) {
      setErrMsg(stripeError?.message || "");
    }
    if (paymentIntent?.status === "succeeded") {
      try {
        await confirmStripeTopPaymentIntent(paymentIntent.id);
        toast.success("Payment confirmed successfully!");
        goNext();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(error);
        setErrMsg(
          error?.response?.data?.message || "Failed to confirm payment"
        );
        toast.error(
          error?.response?.data?.message || "Payment confirmation failed"
        );
      }
    } else {
      toast.info(`Payment status: ${paymentIntent?.status}`);
    }
    setLoading(false);
  };

  if (!stripeDetail?.client_secret || !stripe || !elements) {
    return (
      <div className="flex flex-col gap-5 mt-10 justify-center items-center">
        <Spinner />
        <p>Loading stripe...</p>
      </div>
    );
  }

  return (
    <SideModalWrapper close={goBack}>
      <SideWrapperHeader
        close={goBack}
        title="Enter your card detail"
        titleColor="text-zinc-900"
      />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col h-full justify-between items-center w-full"
      >
        {!paymentElementReady && (
          <div className="flex flex-col gap-5 mt-10 justify-center items-center w-full">
            <Spinner />
            <p>Loading payment form...</p>
          </div>
        )}
        <div className={!paymentElementReady ? "hidden" : "w-full"}>
          {stripeDetail?.client_secret && (
            <PaymentElement
              options={{
                terms: {
                  card: "auto", // Show terms based on setup_future_usage
                },
                fields: {
                  billingDetails: {
                    email: "auto",
                    phone: "auto",
                    name: "auto",
                    address: "auto",
                  },
                },
              }}
              onReady={() => setPaymentElementReady(true)}
              onChange={() => {
                if (errMsg) setErrMsg("");
              }}
            />
          )}
        </div>
        {errMsg && <ErrorMessage message={errMsg} />}
        <div className="flex flex-col gap-4 w-full my-3">
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !stripe || !paymentElementReady}
          >
            Proceed to pay
          </Button>
          <Button type="button" variant="secondary" onClick={goBack}>
            Cancel
          </Button>
        </div>
      </form>
    </SideModalWrapper>
  );
};

export default StripePayment;
