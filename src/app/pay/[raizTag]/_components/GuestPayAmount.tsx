"use client";
import React, { useState } from "react";
import { useFormik } from "formik";
import InputField from "@/components/ui/InputField";
import PayStepActions from "./PayStepActions";
import { useGuestSendStore } from "@/store/GuestSend";
import { useMutation } from "@tanstack/react-query";
import { InitiateAfricaPayinApi } from "@/services/business";
import { AfricaCollectionRequest, InitiateAfricaPayinPayload } from "@/types/services";
import { useParams } from "next/navigation";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { toast } from "sonner";
import { isMomoChannel, mapAfricaPayinError, resolveAccountType } from "./africaPayinUtils";
import { GuestPayStatusType } from "@/types/transactions";

interface Props {
  close: () => void;
  goNext: () => void;
  onNigeriaPalmPay?: () => void;
  onNeedVerify?: () => void;
  onNeedRegister?: () => void;
}

const GuestPayAmount = ({
  close,
  goNext,
  onNigeriaPalmPay,
  onNeedVerify,
  onNeedRegister,
}: Props) => {
  const {
    purpose,
    channel_id,
    channel_name,
    network_id,
    account_type,
    actions,
    amount,
    guestAccount,
    payer_email,
    payer_id,
    payer_email_verified,
    sender_name,
    payer_first_name,
    payer_last_name,
  } = useGuestSendStore();
  const params = useParams();
  const username = Array.isArray(params?.raizTag)
    ? params.raizTag[0]
    : (params?.raizTag as string);
  const [formError, setFormError] = useState<string | null>(null);

  const isMomo = isMomoChannel(
    null,
    account_type,
    channel_name,
    channel_id,
  );
  const resolvedAccountType = resolveAccountType(
    null,
    account_type,
    channel_name,
    channel_id,
  );

  const initiateMutation = useMutation({
    mutationFn: (data: InitiateAfricaPayinPayload) =>
      InitiateAfricaPayinApi({ data: data.data, username: data.username }),
    onSuccess: (res, variables) => {
      actions.setFields({
        payin_id: res.payin_id,
        amount: String(res.amount),
        local_amount: String(res.payout_amount ?? ""),
        payout_amount: String(res.payout_amount ?? 0),
        rate: res.rate ?? 0,
        expires_at: res.expires_at,
        payout_currency: res.payout_currency,
        collection_method: res.collection_method || "",
        provider: res.provider || "",
        status: (res.transaction_status as GuestPayStatusType) || "created",
        lifecycleStep: "summary",
        sender_name: variables.data.sender_name || sender_name,
        purpose: variables.data.transaction_description,
        transaction_description: variables.data.transaction_description,
        guestAccount: variables.data.account_number || guestAccount || "",
        account_type: variables.data.account_type,
      });
      goNext();
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      if (mapped.kind === "nigeria_palmpay") {
        toast.error(mapped.message);
        onNigeriaPalmPay?.();
        return;
      }
      if (mapped.kind === "payer_verification_required") {
        toast.error(mapped.message);
        onNeedVerify?.();
        return;
      }
      if (mapped.kind === "payer_not_found") {
        toast.error(mapped.message);
        onNeedRegister?.();
        return;
      }
      if (
        mapped.kind === "unsupported_country" ||
        mapped.kind === "ghana_unsupported"
      ) {
        toast.error(mapped.message);
        setFormError(mapped.message);
        return;
      }
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const formik = useFormik({
    initialValues: {
      reason: purpose || "",
    },
    validationSchema: toFormikValidationSchema(
      z.object({
        reason: z
          .string({ required_error: "Payment description is required" })
          .trim()
          .min(3, "At least 3 characters")
          .max(255, "Description must be at most 255 characters"),
      }),
    ),
    onSubmit: (values) => {
      setFormError(null);

      if (!payer_email_verified || !payer_email) {
        const message = "Verify your email to continue.";
        setFormError(message);
        toast.error(message);
        return;
      }

      if (isMomo && (!network_id || !guestAccount)) {
        const message =
          "Select a mobile money network and account number to continue.";
        setFormError(message);
        toast.error(message);
        return;
      }

      const payload: AfricaCollectionRequest = {
        channel_id: channel_id,
        account_type: resolvedAccountType,
        amount: Number(amount),
        transaction_description: values.reason.trim(),
        payer_email: payer_email,
        payer_id: payer_id || undefined,
        sender_name:
          sender_name ||
          `${payer_first_name} ${payer_last_name}`.trim() ||
          undefined,
      };

      if (isMomo) {
        payload.network_id = network_id;
        payload.account_number = guestAccount;
      }

      initiateMutation.mutate({
        data: payload,
        username,
      });
    },
  });

  const payerDisplayName =
    sender_name ||
    `${payer_first_name} ${payer_last_name}`.trim() ||
    "Verified payer";

  return (
    <section className="flex flex-col h-full">
      <div className="">
       
        <header className="flex items-start justify-between mt-2">
          <div>
            <h2 className="text-raiz-gray-950 text-xl mt-7 md:mt-0 md:text-[23px] font-bold md:font-semibold leading-tight md:leading-10">
              Payment description
            </h2>
            <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
              Confirm the payment narrative below.
            </p>
          </div>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block shrink-0"
          >
            <rect
              width="48"
              height="48"
              rx="16"
              fill="#EAECFF"
              fillOpacity="0.4"
            />
            <path
              d="M34.084 16.376C33.872 15.147 32.906 14.119 31.688 13.849C30.385 13.56 29.199 14.086 28.489 15H24V33H30C31.657 33 33 31.657 33 30V19.33C33.814 18.643 34.289 17.567 34.084 16.376Z"
              fill="#F2ED9F"
            />
            <path
              d="M31 12C28.239 12 26 14.239 26 17C26 18.977 28.001 21.704 29.471 23.441C30.27 24.385 31.73 24.385 32.529 23.441C33.999 21.704 36 18.977 36 17C36 14.239 33.761 12 31 12ZM31 19.143C29.817 19.143 28.857 18.184 28.857 17C28.857 15.816 29.817 14.857 31 14.857C32.183 14.857 33.143 15.817 33.143 17C33.143 18.183 32.183 19.143 31 19.143Z"
              fill="#EDB637"
            />
            <path
              d="M18.697 13.786L16.459 15.126C15.554 15.668 15 16.645 15 17.7V31.106C15 32.38 16.39 33.167 17.482 32.512L18.696 31.785C19.098 31.544 19.547 31.415 20 31.395V13.397C19.547 13.417 19.098 13.546 18.697 13.786Z"
              fill="#F2ED9F"
            />
            <path
              d="M21.359 13.6829C20.931 13.4699 20.463 13.3759 20 13.3969V31.3949C20.464 31.3749 20.932 31.4689 21.36 31.6829L24 32.9999V14.9999L21.359 13.6829Z"
              fill="#EDB637"
            />
          </svg>
        </header>
      </div>
      <form
        className="flex flex-col justify-between gap-3 h-full mt-3 md:mt-5"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-[15px]">
          <div className="p-4 rounded-2xl bg-[#EAECFF99] space-y-1">
            <p className="text-sm font-semibold text-zinc-900 capitalize">
              {payerDisplayName}
            </p>
            <p className="text-sm text-zinc-700">{payer_email}</p>
          </div>
          <InputField
            placeholder="Enter payment description"
            label="Payment Description"
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
        <PayStepActions
          onBack={close}
          continueType="submit"
          continueLabel="Continue to review"
          continueDisabled={initiateMutation.isPending}
          continueLoading={initiateMutation.isPending}
        />
      </form>
    </section>
  );
};

export default GuestPayAmount;
