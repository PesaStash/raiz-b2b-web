"use client";
import React, { useState } from "react";
import { useFormik } from "formik";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
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
import Image from "next/image";

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
        // Contract: amount = USD; payout_amount / local_amount = local currency.
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
          Confirm the payment description before continuing.
        </p>
      </div>
      <form
        className="flex flex-col justify-between gap-3 h-full mt-3 md:mt-5"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-[15px]">
          <div className="p-4 rounded-2xl bg-indigo-50 space-y-2">
            <p className="text-xs text-zinc-500">Paying as</p>
            <p className="text-sm font-semibold text-zinc-900 capitalize">
              {sender_name ||
                `${payer_first_name} ${payer_last_name}`.trim() ||
                "Verified payer"}
            </p>
            <p className="text-sm text-zinc-700">{payer_email}</p>
          </div>
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
