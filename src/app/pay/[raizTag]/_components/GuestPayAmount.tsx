"use client";
import React from "react";
import SideModalWrapper from "../../../(dashboard)/_components/SideModalWrapper";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import { useFormik } from "formik";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import { useGuestSendStore } from "@/store/GuestSend";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FinalizeAfricaPayinApi,
  GetAfricaPayinNetworksApi,
  InitiateAfricaPayinApi,
} from "@/services/business";
import { InitiateAfricaPayinPayload } from "@/types/services";
import { useParams } from "next/navigation";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";

interface Props {
  close: () => void;
  //   loading: boolean;
  //   formik: FormikProps<formCardValues>;
  //   disableBtn: boolean;
  goNext: () => void;
}


const GuestPayAmount = ({ close, goNext }: Props) => {
  const {
    guestAccount,
    network_id,
    sender_name,
    purpose,
    guestLocalCurrency,
    channel_id,
    actions,
    amount,
    channel_name,
  } = useGuestSendStore();
  const params = useParams();
  const username = Array.isArray(params) ? params[0].raizTag : params.raizTag;
  const { data: networks } = useQuery({
    queryKey: ["afican-payin-networks", guestLocalCurrency?.value, channel_id],
    queryFn: () =>
      GetAfricaPayinNetworksApi(guestLocalCurrency?.value || null, channel_id),
    enabled: !!guestLocalCurrency?.value,
  });

  const isMomo = channel_name === "momo";

  const guestPayAmountSchema = z.object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .regex(
        /^[A-Za-z\- ]+$/,
        "Full name can only contain letters, spaces, and hyphens"
      ),
    accountNo: isMomo
      ? z.string().regex(
        /^\+?\d+$/,
        "Account number must contain only digits and may start with '+'"
      )
      : z.string().optional(),
    network: isMomo
      ? z.string().min(1, "Network is required")
      : z.string().optional(),
    reason: z
      .string({ required_error: "Reason for sending is required" })
      .min(3, "At least 3 characters"),
  });

  const formik = useFormik({
    initialValues: {
      fullName: sender_name,
      accountNo: guestAccount,
      network: network_id,
      reason: purpose,
    },
    validationSchema: toFormikValidationSchema(guestPayAmountSchema),
    onSubmit: (val) => console.log(val),
  });

  const networksArr =
    networks
      ?.map((each) => ({
        label: each.network_name,
        value: each.network_id,
      }))
      ?.sort((a, b) => a.label.localeCompare(b.label)) || [];

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => FinalizeAfricaPayinApi(id),
    onSuccess: (res) => {
      actions.setFields({
        payin_id: res.payin_id,
        amount: String(res.amount),
        payout_amount: String(res.payout_amount),
        rate: res.rate,
        expires_at: res.expires_at,
        payout_currency: res.payout_currency,
        collection_account_number: res.collection_account_number,
        collection_bank_name: res.collection_bank_name,
        collection_account_name: res.collection_account_name,
      });
      goNext();
    },
  });

  const initiateMutation = useMutation({
    mutationFn: (data: InitiateAfricaPayinPayload) =>
      InitiateAfricaPayinApi({ data: data.data, username: data.username }),
    onSuccess: (res) => {
      actions.setFields({
        payin_id: res.payin_id,
      });
      finalizeMutation.mutate(res.payin_id);
    },
  });

  const handleContinue = () => {
    initiateMutation.mutate({
      data: {
        channel_id,
        ...(isMomo && { network_id : network_id || null }),
         account_type : isMomo ? "momo" : "bank",
        ...(isMomo && { account_number: formik.values.accountNo || null }),
        amount: Number(amount),
        sender_name: formik.values.fullName,
        transaction_description: formik.values.reason,
      },
      username,
    });
  };

  return (
    <SideModalWrapper close={close}>
      <div className="w-full h-full flex flex-col">
        <SideWrapperHeader
          title="Payment Details"
          close={close}
          titleColor="text-zinc-900"
        />
        <form
          className="flex flex-col justify-between gap-3 h-full"
          onSubmit={formik.handleSubmit}
        >
          <div className="flex flex-col gap-[15px]">
            <InputField
              placeholder="Enter Full name"
              label="Full Name"
              {...formik.getFieldProps("fullName")}
              status={
                formik.touched.fullName && formik.errors.fullName
                  ? "error"
                  : null
              }
              errorMessage={formik.touched.fullName && formik.errors.fullName}
            />
            {isMomo && (
              <PhoneNumberInput
                defaultCountry={guestLocalCurrency?.value || "NG"}
                                label="Phone Number"
                                value={formik.values.accountNo}
                                onChange={(value) => formik.setFieldValue("accountNo", value)}
                                error={formik.errors.accountNo}
                                touched={formik.touched.accountNo}
                              />
              // <InputField
              //   placeholder="Enter your account number"
              //   label="Account Number"
              //   {...formik.getFieldProps("accountNo")}
              //   status={
              //     formik.touched.accountNo && formik.errors.accountNo
              //       ? "error"
              //       : null
              //   }
              //   errorMessage={formik.touched.accountNo && formik.errors.accountNo}
              // />
            )}
            {isMomo && (
              <SelectField
                placeholder="Select your network"
                name="network"
                label="Network"
                options={networksArr}
                value={
                  formik.values.network
                    ? networksArr.find(
                      (option) => option.value === formik.values.network
                    ) || null
                    : null
                }
                onChange={(i) => {
                  const selected = networks?.find(
                    (j) => j.network_id === i?.value
                  );
                  formik.setFieldValue("network", i?.value);
                  actions.setFields({
                    network_id: selected?.network_id,
                    network_name: selected?.network_name,
                    account_type: selected?.account_type,
                  });
                }}
              />
            )}
            <InputField
              placeholder="Enter reason for sending"
              label="Reason for Sending"
              {...formik.getFieldProps("reason")}
              status={
                formik.touched.reason && formik.errors.reason ? "error" : null
              }
              errorMessage={formik.touched.reason && formik.errors.reason}
            />
          </div>
          <Button
            disabled={
              initiateMutation.isPending ||
              finalizeMutation.isPending ||
              !formik.isValid
            }
            loading={initiateMutation.isPending || finalizeMutation.isPending}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </form>
      </div>
    </SideModalWrapper>
  );
};

export default GuestPayAmount;
