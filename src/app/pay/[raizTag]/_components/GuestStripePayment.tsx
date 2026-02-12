"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Spinner from "@/components/ui/Spinner";
import { confirmGuestStripeTopPaymentIntent } from "@/services/transactions";
import { useGuestSendStore } from "@/store/GuestSend";
import { useSendStore } from "@/store/Send";
import { IBusinessPaymentData } from "@/types/services";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { toast } from "sonner";

interface Props {
  goBack: () => void;
  goNext: () => void;
  data: IBusinessPaymentData;
}

const GuestStripePayment = ({ goBack, goNext, data }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const { stripeDetail, billingDetails } = useGuestSendStore()
  const { actions } = useSendStore()
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
        const res = await confirmGuestStripeTopPaymentIntent({
          payment_intent: paymentIntent.id,
          entity_id: data?.account_user?.entity_id,
          payer_first_name: billingDetails?.firstName || "",
          payer_last_name: billingDetails?.lastName || "",
          payer_email: billingDetails?.email || "",
          payment_description: billingDetails?.purpose || "",
        });
        // toast.success("Payment confirmed successfully!");
        goNext();
        console.log(res)
        actions.setTransactionDetail(res)
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
    <div className="py-4">
      <SideWrapperHeader
        close={goBack}
        title="Enter your card detail"
        titleColor="text-zinc-900"
        backArrow={false}
      />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col h-full justify-between gap-8 items-center w-full"
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
                  card: "auto",
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
    </div>
  );
};

export default GuestStripePayment;
