"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { FormikProps } from "formik";
import { formCardValues } from "./CardAmount";
import {
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import SideModalWrapper from "../../../(dashboard)/_components/SideModalWrapper";
import Image from "next/image";
import { toast } from "sonner";
import ErrorMessage from "@/components/ui/ErrorMessage";

interface Props {
  close: () => void;
  loading: boolean;
  formik: FormikProps<formCardValues>;
  disableBtn: boolean;
  goNext: ( formValues: formCardValues) => void;
  clientSecret: string; // Add client secret prop
}

const CardDetails = ({
  close,
  loading,
  formik,
  disableBtn,
  goNext,
  clientSecret
}: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe or elements not initialized");
      return;
    }

    if (
      !formik.values.firstName ||
      !formik.values.lastName ||
      !formik.values.email
    ) {
      toast.error("Please provide complete billing details");
      return;
    }

    try {
      // Submit the form to validate all fields
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrMsg(submitError.message || "");
        return;
      }

      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: clientSecret,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: `${formik.values.firstName} ${formik.values.lastName}`,
              email: formik.values.email,
            },
          },
        },
      });

      if (stripeError) {
        setErrMsg(stripeError?.message || "");
        toast.error(stripeError.message || "Payment failed");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        toast.success("Payment confirmed successfully!");
        goNext(formik.values);
      } else {
        toast.info(`Payment status: ${paymentIntent?.status}`);
      }
    } catch (err) {
      toast.error("An error occurred while processing payment");
      console.error(err);
    }
  };

  // if (!clientSecret || !stripe || !elements) {
  //   return (
  //     <SideModalWrapper close={close}>
  //       <div className="flex flex-col gap-5 mt-10 justify-center items-center">
  //         <Spinner />
  //         <p>Loading stripe...</p>
  //       </div>
  //     </SideModalWrapper>
  //   );
  // }

  return (
    <SideModalWrapper close={close}>
      <div className="w-full h-full flex flex-col">
        <button onClick={close}>
          <Image
            src={"/icons/arrow-left.svg"}
            alt="back"
            width={18.48}
            height={18.48}
          />
        </button>
        <div className="flex justify-between mt-4 mb-11">
          <div className="">
            <h5 className="text-raiz-gray-950 text-xl lg:text-[23px] font-semibold leading-10">
              Enter card details
            </h5>
            <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
              Send money through a debit card
            </p>
          </div>
          <div className="w-10 h-10">
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
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full justify-between items-center"
        >
          <div className="space-y-4 w-full mt-4 rounded-lg">
            <InputField
              placeholder="Enter first name"
              label="First Name"
              {...formik.getFieldProps("firstName")}
              status={
                formik.touched.firstName && formik.errors.firstName
                  ? "error"
                  : null
              }
              errorMessage={formik.touched.firstName && formik.errors.firstName}
            />
            <InputField
              placeholder="Enter last name"
              label="Last Name"
              {...formik.getFieldProps("lastName")}
              status={
                formik.touched.lastName && formik.errors.lastName
                  ? "error"
                  : null
              }
              errorMessage={formik.touched.lastName && formik.errors.lastName}
            />
            <InputField
              placeholder="Enter your email address"
              label="Email"
              type="email"
              {...formik.getFieldProps("email")}
              status={
                formik.touched.email && formik.errors.email ? "error" : null
              }
              errorMessage={formik.touched.email && formik.errors.email}
            />

            {/* {!paymentElementReady && (
              <div className="flex flex-col gap-5 mt-10 justify-center items-center w-full">
                <Spinner />
                <p>Loading payment form...</p>
              </div>
            )} */}

            {/* <div className={!paymentElementReady ? "hidden" : "w-full"}>
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
            </div> */}

            {errMsg && <ErrorMessage message={errMsg} />}
          </div>

          <div className="flex flex-col gap-4 w-full my-3">
            <Button
              type="submit"
              loading={loading}
              disabled={disableBtn || !formik.isValid || !stripe }
            >
              Proceed to pay
            </Button>
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </SideModalWrapper>
  );
};

export default CardDetails;