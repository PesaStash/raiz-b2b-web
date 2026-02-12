"use client";
import React from "react";
import { Formik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import SideWrapperHeader from "@/components/SideWrapperHeader";
import Radio from "@/components/ui/Radio";
import Button from "@/components/ui/Button";
import TextareaField from "@/components/ui/TextareaField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateInvoiceSettings,
  FetchInvoiceSettings,
} from "@/services/invoice";
import { IInvoiceSettingsPayload } from "@/types/services";

interface Props {
  close: () => void;
}

const settingsSchema = z.object({
  discount_level: z.enum(["line", "total"]).optional().or(z.literal("")),
  tax_level: z.enum(["line", "total"]).optional().or(z.literal("")),
  terms: z
    .string()
    .refine((val) => val === "" || val.length >= 5, {
      message: "Please enter at least 5 characters",
    })
    .refine((val) => val.length <= 500, {
      message: "Terms cannot exceed 500 characters",
    }),
});

const InvoiceSettings = ({ close }: Props) => {
  const { data } = useQuery({
    queryKey: ["invoice-settings"],
    queryFn: FetchInvoiceSettings,
  });
  const qc = useQueryClient();

  const CreateInvoiceMutation = useMutation({
    mutationFn: (payload: IInvoiceSettingsPayload) =>
      CreateInvoiceSettings(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-settings"] });
      close();
    },
  });

  console.log(data);

  return (
    <Formik
      initialValues={{
        discount_level: "",
        tax_level: "",
        terms: "",
      }}
      validationSchema={toFormikValidationSchema(settingsSchema)}
      onSubmit={(values) => {
        // console.log({
        //   discount_level:
        //     values.discount_level === ""
        //       ? null
        //       : (values.discount_level as "line" | "total"),
        //   tax_level:
        //     values.tax_level === ""
        //       ? null
        //       : (values.tax_level as "line" | "total"),
        //   terms_and_conditions: values.terms,
        // });
        CreateInvoiceMutation.mutate({
          discount_level:
            values.discount_level === ""
              ? null
              : (values.discount_level as "line" | "total"),
          tax_level:
            values.tax_level === ""
              ? null
              : (values.tax_level as "line" | "total"),
          terms_and_conditions: values.terms,
        });
      }}
    >
      {(formik) => {
        // console.log("errr", formik.errors);
        return (
          <form onSubmit={formik.handleSubmit} className="h-full flex flex-col">
            {/* Header */}
            <SideWrapperHeader
              title="Invoice Settings Preference"
              close={close}
              titleColor="text-zinc-900"
            />

            {/* Main Body */}
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-8">
                {/* Discounts */}
                <div>
                  <h2 className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma">
                    Do you give Discounts?
                  </h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { value: "", label: "I don't give discounts" },
                      { value: "line", label: "At Line Item level" },
                      { value: "total", label: "At Transactional Level" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Radio
                          checked={formik.values.discount_level === opt.value}
                          onChange={() =>
                            formik.setFieldValue("discount_level", opt.value)
                          }
                        />

                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tax Preference */}
                <div>
                  <h2 className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma">
                    Do you sell your Items at rates inclusive of Tax?
                  </h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { value: "line", label: "Tax Inclusive" },
                      { value: "total", label: "Tax Exclusive" },
                      { value: "", label: "Tax Inclusive or Exclusive" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Radio
                          checked={formik.values.tax_level === opt.value}
                          onChange={() =>
                            formik.setFieldValue("tax_level", opt.value)
                          }
                        />

                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Terms Field */}
                <TextareaField
                  label="Terms and Conditions"
                  placeholder="Enter the terms and conditions of your business"
                  {...formik.getFieldProps("terms")}
                  status={
                    formik.touched.terms && formik.errors.terms ? "error" : null
                  }
                  errorMessage={formik.touched.terms && formik.errors.terms}
                  className=" !min-h-[91px]"
                />
              </div>

              {/* Footer */}
              <div className="mt-10 space-y-4">
                <div className="px-5 h-11 text-left py-2 bg-indigo-100/60 rounded-[20px] text-xs text-zinc-900 flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.35"
                      d="M10.0001 18.3333C14.6025 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6025 1.66663 10.0001 1.66663C5.39771 1.66663 1.66675 5.39759 1.66675 9.99996C1.66675 14.6023 5.39771 18.3333 10.0001 18.3333Z"
                      fill="#39A062"
                    />
                    <path
                      d="M9.16675 14.1666V9.99996C9.16675 9.53996 9.54008 9.16663 10.0001 9.16663C10.4601 9.16663 10.8334 9.53996 10.8334 9.99996V14.1666C10.8334 14.6266 10.4601 15 10.0001 15C9.54008 15 9.16675 14.6266 9.16675 14.1666Z"
                      fill="#39A062"
                    />
                    <path
                      d="M10 7.5C10.6904 7.5 11.25 6.94036 11.25 6.25C11.25 5.55964 10.6904 5 10 5C9.30964 5 8.75 5.55964 8.75 6.25C8.75 6.94036 9.30964 7.5 10 7.5Z"
                      fill="#39A062"
                    />
                  </svg>
                  Change preference at any time from invoice settings
                </div>

                <Button type="submit">Confirm & continue</Button>
                <Button onClick={close} variant="secondary" type="button">
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        );
      }}
    </Formik>
  );
};

export default InvoiceSettings;
