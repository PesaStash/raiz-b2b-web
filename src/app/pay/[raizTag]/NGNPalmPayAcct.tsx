"use client";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import InputField from "@/components/ui/InputField";
import {
  CreateNgnTempPaymentLink,
  GetUsdAmountTempPaymentLink,
} from "@/services/transactions";
import { useGuestSendStore } from "@/store/GuestSend";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import React, { useRef, useState } from "react";
import z from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { INgnTempPaymentLinkPayload } from "@/types/transactions";
import { formatAmount } from "@/utils/helpers";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { ImSpinner3 } from "react-icons/im";

const NGNPalmPayAcct = ({
  walletId,
  userName,
}: {
  walletId: string;
  userName: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { amount, actions } = useGuestSendStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine(
      (val) => {
        const parsed = parseFloat(val);
        return parsed >= 1000;
      },
      {
        message: "Amount must be at least 1000",
      }
    );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, ""); // Remove non-numeric except "."
    if (value.startsWith(".")) value = "0" + value;

    const decimalCount = value.split(".").length - 1;
    if (decimalCount > 1) return;

    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

    setRawAmount(formattedValue);
    actions.setField("amount", value);

    const result = amountSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };
  const displayValue = () => {
    if (isFocused) {
      return rawAmount ? `₦${rawAmount}` : "";
    }
    if (!rawAmount) return "";
    const cleaned = rawAmount.replace(/,/g, "");
    const num = Number(cleaned);
    if (isNaN(num)) return "";
    return `₦${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const createLinkMutation = useMutation({
    mutationFn: (data: INgnTempPaymentLinkPayload) =>
      CreateNgnTempPaymentLink(data),
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
      formik.resetForm();
      actions.reset();
      setRawAmount("");
    },
  });
  const debounceAmount = useDebounce(amount, 500);

  const { data: UsdEquivalent, isLoading } = useQuery({
    queryKey: ["usdPalmpayRate", debounceAmount],
    queryFn: () => GetUsdAmountTempPaymentLink(debounceAmount),
    enabled: !!amount && Number(amount) >= 1000,
  });

  const formik = useFormik({
    initialValues: {
      purpose: "",
      name: "",
    },
    validationSchema: toFormikValidationSchema(
      z.object({
        purpose: z.string().min(1, "Purpose is required"),
        name: z.string().min(1, "Name is required"),
      })
    ),
    onSubmit: (values) => {
      createLinkMutation.mutate({
        ngn_amount: amount,
        wallet_id: walletId,
        transaction_purpose: values.purpose.trim(),
        sender_name: values.name.trim(),
      });
    },
  });

  return (
    <div className="flex flex-col gap-8 justify-between py-6">
      <div className="flex items-center justify-center flex-col">
        <svg
          width="31"
          height="31"
          viewBox="0 0 31 31"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0.304443"
            y="0.304321"
            width="30"
            height="30"
            rx="15"
            fill="#EAECFF"
          />
          <rect
            x="0.304443"
            y="0.304321"
            width="30"
            height="30"
            rx="15"
            stroke="#E4E0EA"
            strokeWidth="0.608696"
          />
          <path
            d="M18.7545 7.77096L11.2295 10.271C6.17121 11.9626 6.17121 14.721 11.2295 16.4043L13.4629 17.146L14.2045 19.3793C15.8879 24.4376 18.6545 24.4376 20.3379 19.3793L22.8462 11.8626C23.9629 8.48763 22.1295 6.64596 18.7545 7.77096ZM19.0212 12.2543L15.8545 15.4376C15.7295 15.5626 15.5712 15.621 15.4129 15.621C15.2545 15.621 15.0962 15.5626 14.9712 15.4376C14.7295 15.196 14.7295 14.796 14.9712 14.5543L18.1379 11.371C18.3795 11.1293 18.7795 11.1293 19.0212 11.371C19.2629 11.6126 19.2629 12.0126 19.0212 12.2543Z"
            fill="#4B0082"
          />
        </svg>
        <p className="text-center mt-5 justify-start text-zinc-900 text-sm md:text-base mb-3">
          How much do you want to send?
        </p>
        <div className="relative w-full">
          <input
            ref={inputRef}
            value={displayValue()}
            onChange={handleAmountChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            // disabled={!!amountFromLink}
            placeholder="₦0.00"
            className="w-full h-16 bg-transparent text-center text-3xl font-semibold focus:outline-none"
          />
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
      <form className="flex flex-col gap-2" onSubmit={formik.handleSubmit}>
        <InputField
          label="Full Name"
          placeholder="Enter your name"
          {...formik.getFieldProps("name")}
          status={formik.touched.name && formik.errors.name ? "error" : null}
          errorMessage={formik.touched.name && formik.errors.name}
        />
        <InputField
          label="Purpose"
          placeholder="Enter purpose"
          {...formik.getFieldProps("purpose")}
          status={
            formik.touched.purpose && formik.errors.purpose ? "error" : null
          }
          errorMessage={formik.touched.purpose && formik.errors.purpose}
        />
      </form>
      <div className="mt-3 flex flex-col gap-3">
        <div className="w-full bg-raiz-gray-100 p-[15px] rounded-xl flex justify-between items-center">
          <span className="text-raiz-usd-primary text-xs font-normal font-brSonoma leading-normal">
            {`${userName} gets:`}
          </span>
          <div className="h-0.5 w-[56%] px-4 bg-white"></div>
          <span className="text-zinc-900  text-xs font-bold leading-5">
            {isLoading ? (
              <ImSpinner3 className="animate-spin" />
            ) : (
              `$${formatAmount(UsdEquivalent || 0.0)}`
            )}
          </span>
        </div>
        <Button
          onClick={formik.handleSubmit}
          disabled={
            !amount ||
            !formik.isValid ||
            !!error ||
            createLinkMutation.isPending ||
            isLoading
          }
          loading={createLinkMutation.isPending}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default NGNPalmPayAcct;
