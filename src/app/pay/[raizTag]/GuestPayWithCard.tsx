"use client";
import React, { useEffect, useState } from "react";
import GuestCardPayForm, { formCardValues } from "./GuestCardPayForm";
import { loadStripe } from "@stripe/stripe-js";
import { IBusinessPaymentData } from "@/types/services";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  confirmGuestStripeTopPaymentIntent,
  createGuestStripePaymentIntent,
  GetAllRates,
} from "@/services/transactions";
import { toast } from "sonner";
import { useGuestSendStore } from "@/store/GuestSend";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { nameRegex } from "@/app/(auth)/register/_components/validation";
import z from "zod";
import { useFormik } from "formik";
import ConfirmPayment from "./_components/ConfirmPayment";
import GuestStripePayment from "./_components/GuestStripePayment";
import PaySuccess from "./_components/PaySuccess";

export type CardSteps = "amount" | "confirm" | "payment" | "success";

interface Props {
  //   setScreen: Dispatch<SetStateAction<GuestPaymentType | "detail" | null>>;
  data: IBusinessPaymentData;
  amountFromLink?: string;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY || ""
);
const GuestPayWithCard = ({ data, amountFromLink }: Props) => {
  const [step, setStep] = useState<CardSteps>("amount");
  const {
    amount,
    actions: guestActions,
    stripeDetail,
    billingDetails,
    purpose,
    guestLocalCurrency,
  } = useGuestSendStore();
  const stripe = useStripe();

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
    onSubmit: (values) => guestActions.setField("billingDetails", values),
  });
  const { data: ratesData } = useQuery({
    queryKey: ["rates"],
    queryFn: GetAllRates,
  });

  const selectedCurrency = ratesData?.find(
    (item) => item.currency === guestLocalCurrency?.currency
  );
  const dollarRate = selectedCurrency
    ? Number(amount) / selectedCurrency?.buy_rate || 0
    : 0;

  useEffect(() => {
    if (amountFromLink) {
      guestActions.setField("amount", amountFromLink);
    }
  }, [amountFromLink, guestActions]);

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
      const transactionData = await confirmGuestStripeTopPaymentIntent({
        payment_intent: payment_intent_id,
        entity_id: data?.account_user?.entity_id || "",
        payer_first_name: billingDetails?.firstName || "",
        payer_email: billingDetails?.email || "",
        payer_last_name: billingDetails?.lastName || "",
        payment_description: purpose || "",
      });
      return transactionData;
    },
    onSuccess: (transactionData) => {
      guestActions.setField("transactionDetail", transactionData);
      setStep("success");
    },
  });
  const amountInCents = dollarRate * 100;

  const handlePaymentIntent = (formValues: formCardValues) => {
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }
    if (amountInCents <= 100) {
      toast.error("Minimum payment amount is $1.00");
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

    createPaymentIntentMutation.mutate({
      amountInCents: Number(Math.round(amountInCents)),
    });
  };

  const displayScreen = () => {
    switch (step) {
      case "amount":
        return (
          <GuestCardPayForm
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
            <GuestCardPayForm
              goNext={handlePaymentIntent}
              data={data}
              loading={createPaymentIntentMutation.isPending}
              formik={formik}
              amountFromLink={amountFromLink}
            />
            <ConfirmPayment
              goNext={() => setStep("payment")}
              close={() => setStep("amount")}
              loading={confirmPaymentMutation.isPending}
              dollarRate={dollarRate}
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
  return <>{displayScreen()}</>;
};

const WithStripe = (props: Props) => (
  <Elements stripe={stripePromise}>
    <GuestPayWithCard {...props} />
  </Elements>
);

export default WithStripe;
