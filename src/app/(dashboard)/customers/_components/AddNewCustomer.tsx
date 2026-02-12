"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useFormik } from "formik";
import React from "react";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";

import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import z from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IAddCustomerPayload } from "@/types/services";
import { AddCustomerApi } from "@/services/invoice";
import SelectField from "@/components/ui/SelectField";
import { sanitizeAddressField } from "@/utils/helpers";

interface Props {
  close: () => void;
}


// Base schema with conditional validation
const AddCustomerSchema = z
  .object({
    customerType: z.string().min(1, "Please select a customer type"),
    fullname: z.string().optional(),
    companyName: z.string().optional(),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    phone: z
      .string()
      .min(10, "Invalid phone number")
      .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number"),
    address: z.string().min(3, "Address is required"),
  })
  .refine(
    (data) => {
      if (data.customerType === "individual") {
        return data.fullname && data.fullname.length >= 2;
      }
      return true;
    },
    {
      message: "Full name is required",
      path: ["fullname"],
    }
  )
  .refine(
    (data) => {
      if (data.customerType === "business") {
        return data.companyName && data.companyName.length >= 2;
      }
      return true;
    },
    {
      message: "Business name is required",
      path: ["companyName"],
    }
  );

const AddNewCustomer = ({ close }: Props) => {
  const qc = useQueryClient();
  const AddMutation = useMutation({
    mutationFn: (payload: IAddCustomerPayload) => AddCustomerApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      close();
    },
  });

  const formik = useFormik({
    initialValues: {
      fullname: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country_code: "",
      customerType: "",
    },
    validationSchema: toFormikValidationSchema(AddCustomerSchema),
    onSubmit: (values) => {
      const payload: IAddCustomerPayload = {
        ...(values.fullname && { full_name: values.fullname }),
        customer_type: values.customerType as "individual" | "business",
        email: values.email,
        phone_number: values.phone,
        street_address: sanitizeAddressField(values.address), 
        city: sanitizeAddressField(values?.city),            
        state: sanitizeAddressField(values?.state), 
        country: values?.country_code,
        ...(values.companyName && { business_name: values?.companyName }),
      };
      AddMutation.mutate(payload);
    },
  });

  const customerTypeOpt = [
    {
      value: "individual",
      label: "Individual",
    },
    {
      value: "business",
      label: "Business",
    },
  ];

  return (
    <form onSubmit={formik.handleSubmit} className="h-full flex flex-col">
      <SideWrapperHeader
        title="New Customer"
        close={close}
        titleColor="text-zinc-900"
      />
      <div className="flex-1 overflow-y-auto flex flex-col justify-between">
        <div className="flex flex-col gap-4">
          <SelectField
            placeholder="Customer Type"
            options={customerTypeOpt}
            value={
              formik.values.customerType
                ? customerTypeOpt.find(
                  (option) => option.value === formik.values.customerType
                ) || null
                : null
            }
            onChange={(i) =>
              formik.setFieldValue("customerType", i?.value as string)
            }
          />

          {/* Show remaining fields only after customer type is selected */}
          {formik.values.customerType && (
            <>
              {formik.values.customerType === "individual" && (
                <InputField
                  label="Full Name"
                  {...formik.getFieldProps("fullname")}
                  status={
                    formik.touched.fullname && formik.errors.fullname
                      ? "error"
                      : null
                  }
                  errorMessage={
                    formik.touched.fullname && formik.errors.fullname
                  }
                />
              )}
              {formik.values.customerType === "business" && (
                <InputField
                  label="Business Name"
                  {...formik.getFieldProps("companyName")}
                  status={
                    formik.touched.companyName && formik.errors.companyName
                      ? "error"
                      : null
                  }
                  errorMessage={
                    formik.touched.companyName && formik.errors.companyName
                  }
                />
              )}
              <InputField
                label="Email"
                type="email"
                {...formik.getFieldProps("email")}
                status={
                  formik.touched.email && formik.errors.email ? "error" : null
                }
                errorMessage={formik.touched.email && formik.errors.email}
              />
              <div className="">
                <PhoneNumberInput
                  label="Phone Number"
                  value={formik.values.phone}
                  onChange={(value) => formik.setFieldValue("phone", value)}
                  error={formik.errors.phone}
                  touched={formik.touched.phone}
                />
              </div>
              <AddressAutocomplete
                label="Business Address"
                value={formik.values.address}
                onChange={(value) => formik.setFieldValue("address", value)}
                onAddressSelect={(components) => {
                  formik.setValues({
                    ...formik.values,
                    ...components,
                  });
                }}
                touched={formik.touched.address}
                error={formik.errors.address}
              />
            </>
          )}
        </div>
        <div className="space-y-[15px]">
          <Button
            disabled={!formik.dirty || AddMutation.isPending || !formik.values.city || !formik.values.state}
            loading={AddMutation.isPending}
            type="submit"
          >
            Save and Continue
          </Button>
          <Button type="button" onClick={close} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AddNewCustomer;