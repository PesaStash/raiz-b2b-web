import Image from "next/image";
import React, { Dispatch, SetStateAction, useState } from "react";
import CardAmount, { formCardValues } from "./CardAmount";
import { useSendStore } from "@/store/Send";
import { IBusinessPaymentData } from "@/types/services";
import PaySuccess from "./PaySuccess";
import ConfirmPayment from "./ConfirmPayment";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import {
  confirmStripePaymentIntent,
  createGuestStripePaymentIntent,
} from "@/services/transactions";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";
import { nameRegex } from "@/app/(auth)/register/_components/validation";
import { useGuestSendStore } from "@/store/GuestSend";
import { GuestPaymentType } from "../PayUserClient";
import GuestStripePayment from "./GuestStripePayment";
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY || ""
);

interface Props {
  setScreen: Dispatch<SetStateAction<GuestPaymentType | "detail" | null>>;
  data: IBusinessPaymentData;
  amountFromLink?: string;
}

export type CardSteps = "amount" | "confirm" | "payment" | "success";

const PayWithCard = ({ setScreen, data, amountFromLink }: Props) => {
  const [step, setStep] = useState<CardSteps>("amount");
  const { actions, purpose } = useSendStore();
  const {
    amount,
    actions: guestActions,
    stripeDetail,
    billingDetails,
  } = useGuestSendStore();
  const stripe = useStripe();
  // const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  React.useEffect(() => {
    if (amountFromLink) {
      guestActions.setField("amount", amountFromLink);
    }
  }, [amountFromLink, guestActions]);

  const goBack = () => {
    actions.reset("USD");
    guestActions.reset();
    setScreen(null);
  };

  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ amountInCents }: { amountInCents: number }) => {
      const response = await createGuestStripePaymentIntent({
        amountInCents,
        entity_id: data?.account_user?.entity_id || "",
        sender_name: `${billingDetails?.firstName} ${billingDetails?.lastName}`,
        sender_email: billingDetails?.email || "",
      });
      return response;
    },
    onSuccess: (data) => {
      guestActions.setField("stripeDetail", data);
      setStep("confirm");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create payment intent");
      console.error(err);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({
      // client_secret,
      payment_intent_id,
    }: // payment_method_id,
    {
      // client_secret: string;
      payment_intent_id: string;
      // payment_method_id: string;
    }) => {
      if (!stripe) {
        throw new Error("Stripe not initialized");
      }
      if (!billingDetails) {
        throw new Error("Billing details not available");
      }
      const transactionData = await confirmStripePaymentIntent(
        payment_intent_id,
        data,
        billingDetails,
        purpose
      );
      return transactionData;
    },
    onSuccess: (transactionData) => {
      actions.setTransactionDetail(transactionData);
      setStep("success");
    },
    onError: (err: Error) => {
      toast.error(
        err.message || "An error occurred during payment confirmation"
      );
      console.error(err);
    },
  });

  const handlePaymentIntent = (formValues: formCardValues) => {
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }
    if (
      !formValues.firstName ||
      !formValues.lastName ||
      !formValues.email ||
      !formValues.purpose
    ) {
      toast.error("Please provide complete billing details.");
      return;
    }
    guestActions.setField("billingDetails", formValues);
    const amountInCents = Math.round(parseFloat(amount) * 100);
    createPaymentIntentMutation.mutate({ amountInCents });
  };

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      purpose: "",
    },
    validationSchema: toFormikValidationSchema(
      z.object({
        firstName: z
          .string()
          .nonempty("First name is required")
          .min(3, "First name must be at least 3 characters")
          .regex(nameRegex, "First name can only contain letters and hyphens"),
        lastName: z
          .string()
          .nonempty("Last name is required")
          .min(3, "Last name must be at least 3 characters")
          .regex(nameRegex, "Last name can only contain letters and hyphens"),
        email: z.string().email("Invalid email address"),
        purpose: z
          .string()
          .min(3, { message: "Purpose must be at least 3 characters long" }),
      })
    ),
    onSubmit: (values) => console.log("values", values),
  });

  const displayScreen = () => {
    switch (step) {
      case "amount":
        return (
          <CardAmount
            goNext={handlePaymentIntent}
            data={data}
            loading={createPaymentIntentMutation.isPending}
            formik={formik}
            amountFromLink={amountFromLink}
          />
        );
      case "confirm":
        return (
          <>
            <div>
              <CardAmount
                goNext={handlePaymentIntent}
                data={data}
                loading={createPaymentIntentMutation.isPending}
                formik={formik}
                amountFromLink={amountFromLink}
              />
            </div>
            <ConfirmPayment
              // goNext={() =>
              //   handleConfirm(
              //     createPaymentIntentMutation.data?.payment_intent_id || ""
              //   )
              // }
              goNext={() => setStep("payment")}
              close={() => setStep("amount")}
              dollarRate={0}
              // handlePay={handlePaymentIntent}
              loading={confirmPaymentMutation.isPending}
            />
          </>
        );
      case "payment":
        return (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: stripeDetail?.client_secret }}
          >
            <GuestStripePayment
              goBack={() => setStep("confirm")}
              goNext={() => setStep("success")}
              data={data}
            />
          </Elements>
        );
      case "success":
        return (
          <PaySuccess
            data={data}
            senderName={`${formik.values.firstName} ${formik.values.lastName}`}
          />
        );
      default:
        break;
    }
  };
  return (
    <>
      {step === "amount" && (
        <div className="mt-10">
          {" "}
          <button onClick={goBack}>
            <Image
              src={"/icons/arrow-left.svg"}
              width={18.48}
              height={18.48}
              alt="back"
            />
          </button>
          <header className="flex items-center justify-between mt-2">
            <h2 className="text-raiz-gray-950 text-[23px] font-semibold  leading-10">
              Pay with card
            </h2>
            <svg width="40" height="41" viewBox="0 0 40 41" fill="none">
              <path
                opacity="0.35"
                d="M30 10.48H20V3.81329H13.3333V10.48H10C7.23833 10.48 5 12.7183 5 15.48V30.48C5 33.2416 7.23833 35.48 10 35.48H30C32.7617 35.48 35 33.2416 35 30.48V15.48C35 12.7183 32.7617 10.48 30 10.48Z"
                fill="#C6ADD5"
              />
              <path
                d="M29.1667 25.48C30.5474 25.48 31.6667 24.3607 31.6667 22.98C31.6667 21.5993 30.5474 20.48 29.1667 20.48C27.786 20.48 26.6667 21.5993 26.6667 22.98C26.6667 24.3607 27.786 25.48 29.1667 25.48Z"
                fill="#493260"
              />
              <path
                d="M10 7.14663V10.48H15V3.81329H13.3333C11.4917 3.81329 10 5.30496 10 7.14663Z"
                fill="#733B9C"
              />
              <path
                d="M18.3333 10.48H26.6666V7.14663C26.6666 5.30496 25.175 3.81329 23.3333 3.81329H18.3333V10.48Z"
                fill="#733B9C"
              />
            </svg>
          </header>
          <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug">
            Send money through a debit card
          </p>{" "}
        </div>
      )}
      {displayScreen()}
    </>
  );
};

const WithStripe = (props: Props) => (
  <Elements stripe={stripePromise}>
    <PayWithCard {...props} />
  </Elements>
);

export default WithStripe;
