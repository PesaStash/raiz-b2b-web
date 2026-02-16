"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
import Radio from "@/components/ui/Radio";
import {
  CreateUsBeneficiary,
  FetchUsBeneficiariesApi,
} from "@/services/transactions";
import {
  IUsBeneficiariesParams,
  IUsBeneficiaryPayload,
} from "@/types/services";
import { truncateString } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useSendStore } from "@/store/Send";
import USBeneficiaryModal from "./USBeneficiaryModal";

interface FormValues {
  label: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  account_owner_name: string;
  street_line_1: string;
  street_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  payment_rail: string;
}

interface Props {
  close: () => void;
}

const USBankBeneficiary = ({ close }: Props) => {
  // const [labelFilter, setLabelFilter] = useState("");
  const { actions } = useSendStore();
  const [showBeneficiary, setShowBeneficiary] = useState(false);
  // const { data: fieldsData, isLoading: fieldLoading } = useQuery({
  //   queryKey: ["us-bank-benefiary-fields"],
  //   queryFn: GetUSBeneficiaryFormFields,
  // });

  const { data, isLoading } = useQuery({
    queryKey: [
      "us-bank-beneficiaries",
      {
        option_type: "bank",
        // label: labelFilter,
        page: 1,
        limit: 50,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IUsBeneficiariesParams];
      return FetchUsBeneficiariesApi(params);
    },
  });

  const beneficiaries = data?.beneficiaries || [];

  const validationSchema = z.object({
    label: z.string().min(1, "Label is required"),
    bank_name: z.string().min(1, "Bank name is required"),
    account_number: z.string().min(1, "Account number is required"),
    routing_number: z.string().min(1, "Routing number is required"),
    account_type: z.string().min(1, "Account type is required"),
    account_owner_name: z.string().min(1, "Account owner name is required"),
    street_line_1: z.string().min(1, "Street line 1 is required"),
    street_line_2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postal_code: z.string().min(1, "Postal code is required"),
    payment_rail: z.string().min(1, "Payment rail is required"),
  });

  const qc = useQueryClient();
  const AddBeneficiaryMutation = useMutation({
    mutationFn: (data: IUsBeneficiaryPayload) => CreateUsBeneficiary(data),
    onSuccess: () => {
      toast.success("Beneficiary added!");
      qc.invalidateQueries({ queryKey: ["us-bank-beneficiaries"] });
    },
  });

  const initialValues: FormValues = {
    label: "",
    bank_name: "",
    account_number: "",
    routing_number: "",
    account_type: "checking",
    account_owner_name: "",
    street_line_1: "",
    street_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    payment_rail: "ach",
  };

  const handleSubmit = async (
    values: FormValues,
    {
      resetForm,
      setSubmitting,
    }: { resetForm: () => void; setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      const payload: IUsBeneficiaryPayload = {
        data: {
          bank_name: values.bank_name,
          account_number: values.account_number,
          routing_number: values.routing_number,
          account_type: values.account_type as "checking" | "savings",
          account_owner_name: values.account_owner_name,
          street_line_1: values.street_line_1,
          street_line_2: values.street_line_2,
          city: values.city,
          state: values.state,
          postal_code: values.postal_code,
          payment_rail: values.payment_rail as "ach" | "wire",
        },
        label: values.label,
        optionType: "bank",
      };
      await AddBeneficiaryMutation.mutateAsync(payload);
      resetForm();
    } catch (error) {
      // Error is handled in onError callback of mutation
      console.log("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SideWrapperHeader
        title="US Bank"
        close={close}
        titleColor="text-zincc-900"
      />
      <div className="mb-11">
        <h5 className="text-raiz-gray-950 text-sm font-bold  leading-[16.80px] mb-[15px]">
          Beneficiary
        </h5>
        {isLoading ? (
          <div>Loading beneficiaries...</div>
        ) : beneficiaries?.length > 0 ? (
          <div className="flex gap-2 overflow-x-scroll no-scrollbar">
            {beneficiaries?.map((user) => (
              <button
                key={user?.usd_beneficiary_id}
                className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
                onClick={() => actions.selectUsdBeneficiary(user)}
              >
                <Avatar src={""} name={user?.usd_beneficiary?.account_name} />
                <p className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none">
                  {user?.usd_beneficiary?.label}
                </p>
                <p className="text-center text-raiz-gray-700 text-xs leading-[18px]">
                  {" "}
                  {truncateString(
                    user?.usd_beneficiary?.account_name || "",
                    20
                  )}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyList text={"No beneficiary yet"} />
        )}
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(validationSchema)}
        onSubmit={handleSubmit}
      >
        {({
          errors,
          touched,
          values,
          handleChange,
          handleBlur,
          setFieldValue,
          isValid,
          dirty,
          isSubmitting,
        }) => (
          <Form
            className={`flex flex-col gap-[15px] justify-between ${
              beneficiaries?.length > 0 ? "min-h-[75vh]" : "min-h-[80vh]"
            }  pb-7`}
          >
            <div className="flex flex-col gap-[15px]">
              <div className="flex justify-between w-full">
                <h4 className="text-zinc-900 text-sm font-bold leading-none">
                  Add Beneficiary
                </h4>
                {beneficiaries?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBeneficiary(true)}
                    className=" text-indigo-900 text-xs font-bold leading-tight"
                  >
                    Choose Beneficiary
                  </button>
                )}
              </div>

              <InputField
                label="Bank Name"
                name="bank_name"
                type="text"
                value={values.bank_name}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.bank_name && errors.bank_name
                    ? errors.bank_name
                    : undefined
                }
                status={touched.bank_name && errors.bank_name ? "error" : null}
              />

              <InputField
                label="Account Number"
                name="account_number"
                type="text"
                value={values.account_number}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.account_number && errors.account_number
                    ? errors.account_number
                    : undefined
                }
                status={
                  touched.account_number && errors.account_number
                    ? "error"
                    : null
                }
              />

              <InputField
                label="Routing Number"
                name="routing_number"
                type="text"
                value={values.routing_number}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.routing_number && errors.routing_number
                    ? errors.routing_number
                    : undefined
                }
                status={
                  touched.routing_number && errors.routing_number
                    ? "error"
                    : null
                }
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <div className="flex flex-col gap-3">
                  {["checking", "savings"].map((option) => (
                    <div
                      onClick={() => setFieldValue("account_type", option)}
                      role="button"
                      key={option}
                      className="flex items-center gap-2"
                    >
                      <Radio
                        checked={values.account_type === option}
                        onChange={() => setFieldValue("account_type", option)}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
                {errors.account_type && touched.account_type && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.account_type}
                  </div>
                )}
              </div>

              <InputField
                label="Account Owner Name"
                name="account_owner_name"
                type="text"
                value={values.account_owner_name}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.account_owner_name && errors.account_owner_name
                    ? errors.account_owner_name
                    : undefined
                }
                status={
                  touched.account_owner_name && errors.account_owner_name
                    ? "error"
                    : null
                }
              />

              <InputField
                label="Street Line 1"
                name="street_line_1"
                type="text"
                value={values.street_line_1}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.street_line_1 && errors.street_line_1
                    ? errors.street_line_1
                    : undefined
                }
                status={
                  touched.street_line_1 && errors.street_line_1 ? "error" : null
                }
              />

              <InputField
                label="Street Line 2 (Optional)"
                name="street_line_2"
                type="text"
                value={values.street_line_2}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.street_line_2 && errors.street_line_2
                    ? errors.street_line_2
                    : undefined
                }
                status={
                  touched.street_line_2 && errors.street_line_2 ? "error" : null
                }
              />

              <InputField
                label="City"
                name="city"
                type="text"
                value={values.city}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.city && errors.city ? errors.city : undefined
                }
                status={touched.city && errors.city ? "error" : null}
              />

              <InputField
                label="State"
                name="state"
                type="text"
                value={values.state}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.state && errors.state ? errors.state : undefined
                }
                status={touched.state && errors.state ? "error" : null}
              />

              <InputField
                label="Postal Code"
                name="postal_code"
                type="text"
                value={values.postal_code}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.postal_code && errors.postal_code
                    ? errors.postal_code
                    : undefined
                }
                status={
                  touched.postal_code && errors.postal_code ? "error" : null
                }
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Payment Rail
                </label>
                <div className="flex flex-col gap-3">
                  {["ach", "wire"].map((option) => (
                    <div
                      onClick={() => setFieldValue("payment_rail", option)}
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Radio
                        checked={values.payment_rail === option}
                        onChange={() => setFieldValue("payment_rail", option)}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {option.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
                {errors.payment_rail && touched.payment_rail && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.payment_rail}
                  </div>
                )}
              </div>

              <InputField
                label="Label/Nickname"
                placeholder="E.g  mikey"
                name="label"
                type="text"
                value={values.label}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={
                  touched.label && errors.label ? errors.label : undefined
                }
                status={touched.label && errors.label ? "error" : null}
              />
            </div>
            <Button
              disabled={!isValid || !dirty || isSubmitting}
              type="submit"
              loading={isSubmitting}
            >
              Add Beneficiary
            </Button>
          </Form>
        )}
      </Formik>
      {showBeneficiary ? (
        <USBeneficiaryModal
          close={() => setShowBeneficiary(false)}
          users={beneficiaries}
        />
      ) : null}
    </div>
  );
};

export default USBankBeneficiary;
