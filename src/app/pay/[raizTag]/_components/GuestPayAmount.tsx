"use client";
import React, { useState } from "react";
import { useFormik } from "formik";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { useGuestSendStore } from "@/store/GuestSend";
import { useMutation } from "@tanstack/react-query";
import { InitiateAfricaPayinApi } from "@/services/business";
import { InitiateAfricaPayinPayload } from "@/types/services";
import { useParams } from "next/navigation";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import { toast } from "sonner";
import { mapAfricaPayinError } from "./africaPayinUtils";
import { GuestPayStatusType } from "@/types/transactions";
import Image from "next/image";

interface Props {
  close: () => void;
  goNext: () => void;
}

const GuestPayAmount = ({ close, goNext }: Props) => {
  const {
    guestAccount,
    sender_name,
    purpose,
    guestLocalCurrency,
    channel_id,
    actions,
    amount,
    channel_name,
  } = useGuestSendStore();
  const params = useParams();
  const username = Array.isArray(params?.raizTag)
    ? params.raizTag[0]
    : (params?.raizTag as string);
  const [formError, setFormError] = useState<string | null>(null);

  const isMomo =
    channel_id === "momo" ||
    channel_name === "momo" ||
    channel_name === "mobile_money" ||
    channel_name === "mobile-money" ||
    channel_name?.toLowerCase().includes("mobile");

  const guestPayAmountSchema = z.object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .trim()
      .min(3, "Full name must be at least 3 characters")
      .max(255, "Full name must be at most 255 characters")
      .regex(
        /^[A-Za-z\- ]+$/,
        "Full name can only contain letters, spaces, and hyphens",
      ),
    accountNo: isMomo
      ? z
          .string({ required_error: "Phone number is required" })
          .min(1, "Phone number is required")
          .regex(
            /^\+?\d+$/,
            "Phone number must contain only digits and may start with '+'",
          )
      : z.string().optional(),
    reason: z
      .string({ required_error: "Payment description is required" })
      .trim()
      .min(3, "At least 3 characters")
      .max(255, "Description must be at most 255 characters"),
  });

  const initiateMutation = useMutation({
    mutationFn: (data: InitiateAfricaPayinPayload) =>
      InitiateAfricaPayinApi({ data: data.data, username: data.username }),
    onSuccess: (res, variables) => {
      actions.setFields({
        payin_id: res.payin_id,
        amount: String(res.amount),
        payout_amount: String(res.payout_amount ?? 0),
        rate: res.rate ?? 0,
        expires_at: res.expires_at,
        payout_currency: res.payout_currency,
        collection_method: res.collection_method || "",
        provider: res.provider || "",
        status: (res.transaction_status as GuestPayStatusType) || "created",
        lifecycleStep: "summary",
        sender_name: variables.data.sender_name,
        purpose: variables.data.transaction_description,
        transaction_description: variables.data.transaction_description,
        guestAccount: variables.data.account_number || "",
      });
      goNext();
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const formik = useFormik({
    initialValues: {
      fullName: sender_name || "",
      accountNo: guestAccount || "",
      reason: purpose || "",
    },
    validationSchema: toFormikValidationSchema(guestPayAmountSchema),
    onSubmit: (values) => {
      setFormError(null);
      initiateMutation.mutate({
        data: {
          channel_id: channel_id || (isMomo ? "momo" : "bank"),
          network_id: null,
          account_type: isMomo ? "momo" : "bank",
          account_number: isMomo ? values.accountNo || null : null,
          amount: Number(amount),
          sender_name: values.fullName.trim(),
          transaction_description: values.reason.trim(),
        },
        username,
      });
    },
  });

  return (
    <section className="flex flex-col h-full px-4">
      <div className="mt-4">
        <button type="button" onClick={close}>
          <Image
            className="w-3 h-3 md:w-[18px] md:h-[18px]"
            src={"/icons/arrow-left.svg"}
            width={18.48}
            height={18.48}
            alt="back"
          />
        </button>
        <header className="flex items-center justify-between">
          <h2 className="text-raiz-gray-950 text-lg md:text-[23px] font-semibold leading-10">
            Payment details
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[13px] md:text-[15px] font-normal leading-snug">
          Tell us who is paying and what this payment is for.
        </p>
      </div>
      <form
        className="flex flex-col justify-between gap-3 h-full mt-3 md:mt-5"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-[15px]">
          <InputField
            placeholder="Enter Full name"
            label="Full Name"
            {...formik.getFieldProps("fullName")}
            status={
              formik.touched.fullName && formik.errors.fullName ? "error" : null
            }
            errorMessage={formik.touched.fullName && formik.errors.fullName}
          />
          {isMomo && (
            <PhoneNumberInput
              defaultCountry={guestLocalCurrency?.value || "NG"}
              label="Phone Number"
              value={formik.values.accountNo}
              onChange={(value) =>
                formik.setFieldValue("accountNo", value || "")
              }
              error={formik.errors.accountNo}
              touched={formik.touched.accountNo}
            />
          )}
          <InputField
            placeholder="Enter payment description"
            label="Payment description"
            {...formik.getFieldProps("reason")}
            status={
              formik.touched.reason && formik.errors.reason ? "error" : null
            }
            errorMessage={formik.touched.reason && formik.errors.reason}
          />
          {formError && (
            <p className="text-sm text-red-600 leading-snug">{formError}</p>
          )}
        </div>
        <Button
          disabled={initiateMutation.isPending}
          loading={initiateMutation.isPending}
          type="submit"
        >
          Continue
        </Button>
      </form>
    </section>
  );
};

export default GuestPayAmount;
