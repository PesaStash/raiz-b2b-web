"use client";
import Button from "@/components/ui/Button";
import { IBusinessPaymentData } from "@/types/services";
import React, {  useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import CardDetails from "./CardDetails";
import InputField from "@/components/ui/InputField";
import { FormikProps } from "formik";
import { useGuestSendStore } from "@/store/GuestSend";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY || ""
);

interface Props {
  goNext: ( formValues: formCardValues) => void;
  data: IBusinessPaymentData;
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
  amountFromLink?: string;
}

export type formCardValues = {
  firstName: string;
  lastName: string;
  email: string;
  purpose: string
};

const CardAmount = ({
  loading,
  goNext,
  formik,
}: Props) => {
  const { amount,} = useGuestSendStore();
  const [showPayModal, setShowPayModal] = useState(false);
  const stripe = useStripe();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  return (
    <div
      className="w-full flex flex-col h-full
    "
    >
      <div className="flex flex-col h-full justify-between items-center w-full">
        <div className="w-full h-full">
          <div className="flex flex-col justify-center items-center">         
            <div className="w-full">
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
                  errorMessage={formik.touched.firstName && typeof formik.errors.firstName === 'string' ? formik.errors.firstName : undefined}
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
                  errorMessage={formik.touched.lastName && typeof formik.errors.lastName === 'string' ? formik.errors.lastName : undefined}
                />
                <InputField
                  placeholder="Enter your email address"
                  label="Email"
                  type="email"
                  {...formik.getFieldProps("email")}
                  status={
                    formik.touched.email && formik.errors.email ? "error" : null
                  }
                  errorMessage={formik.touched.email && typeof formik.errors.email === 'string' ? formik.errors.email : undefined}
                />
                <InputField
                   
                    label="Purpose"
                  placeholder="What is the purpose?"
                    {...formik.getFieldProps("purpose")}
                    status={
                      formik.touched.purpose && formik.errors.purpose ? "error" : null
                    }
                    errorMessage={formik.touched.purpose && typeof formik.errors.purpose === 'string' ? formik.errors.purpose : undefined}
                />
                </div>
                </form>
              </div>
             
          </div>
        </div>
        <div className="w-full py-5">
          <Button
            disabled={ !amount || !stripe || loading}
            loading={loading}
            onClick={() => goNext({
              firstName: formik.values.firstName,
              lastName: formik.values.lastName,
              email: formik.values.email,
              purpose: formik.values.purpose,
            })}
          >
            Continue
          </Button>
        </div>
      </div>

      {showPayModal && (
        <CardDetails
          close={() => setShowPayModal(false)}
          loading={loading}
          formik={formik}
          disableBtn={ !amount || !stripe || loading}
          goNext={goNext}
          clientSecret=""
        />
      )}
    </div>
  );
};

const CardAmountWithStripe = (props: Props) => (
  <Elements stripe={stripePromise}>
    <CardAmount {...props} />
  </Elements>
);

export default CardAmountWithStripe;
