"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useFormik } from "formik";
import React from "react";
import CustomerAddressFields from "./CustomerAddressFields";
import CustomerValidationSummary from "./CustomerValidationSummary";
import { validateCustomer } from "@/lib/customerValidation";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IUpdateCustomerPayload } from "@/types/services";
import { UpdateCustomerApi } from "@/services/invoice";
import { ICustomer } from "@/types/invoice";
import SelectField from "@/components/ui/SelectField";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  close: () => void;
  customer: ICustomer;
}

const EditCustomer = ({ close, customer }: Props) => {
  const qc = useQueryClient();
  const UpdateMutation = useMutation({
    mutationFn: (payload: IUpdateCustomerPayload) =>
      UpdateCustomerApi(customer.customer_id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", customer.customer_id] });
      close();
    },
  });

  // Determine initial customer type based on which field has value
  const initialCustomerType = customer.business_name
    ? "business"
    : "individual";

  const formik = useFormik({
    initialValues: {
      customerType: initialCustomerType,
      fullname: customer.full_name || "",
      companyName: customer.business_name || "",
      email: customer.email || "",
      phone: customer.phone_number || "",
      address: customer.street_address || "",
      city: customer.city || "",
      state: customer.state || "",
      country_code: customer.country || "",
    },
    validate: validateCustomer,
    onSubmit: (values) => {
      const payload: IUpdateCustomerPayload = {
        ...(values.customerType === "individual" && values.fullname
          ? { full_name: values.fullname.trim() }
          : { full_name: null }),
        email: values.email.trim() || null,
        phone_number: values.phone || null,
        street_address: values.address || null,
        city: values?.city || null,
        state: values?.state || null,
        country: values?.country_code || null,
        ...(values.customerType === "business" && values.companyName
          ? { business_name: values.companyName.trim() }
          : { business_name: null }),
        business_account_id: customer.business_account_id || null,
        customer_type: values.customerType as "individual" | "business",
      };
      UpdateMutation.mutate(payload);
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
    <form noValidate onSubmit={formik.handleSubmit} className="h-full flex flex-col min-h-0">
      <CenterModalHeader close={close} />

      <h2 className="text-lg sm:text-xl font-bold text-raiz-gray-950 mb-3 sm:mb-4">
        Edit Customer
      </h2>
      <div className="flex-1 overflow-y-auto flex flex-col justify-between min-h-0 gap-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-raiz-gray-50 p-4 sm:p-6">
          <SelectField
            label="Customer type *"
            placeholder="Select customer type"
            status={formik.touched.customerType && formik.errors.customerType ? "error" : null}
            helper={formik.touched.customerType ? formik.errors.customerType : undefined}
            options={customerTypeOpt}
            value={
              formik.values.customerType
                ? customerTypeOpt.find(
                    (option) => option.value === formik.values.customerType,
                  ) || null
                : null
            }
            onChange={(i) =>
              formik.setFieldValue("customerType", (i?.value as string) ?? "")
            }
          />

          {formik.values.customerType === "individual" && (
            <InputField
              label="Full Name *"
                  aria-label="Full Name"
              {...formik.getFieldProps("fullname")}
              status={
                formik.touched.fullname && formik.errors.fullname
                  ? "error"
                  : null
              }
              errorMessage={formik.touched.fullname && formik.errors.fullname}
            />
          )}

          {formik.values.customerType === "business" && (
            <InputField
              label="Business Name *"
                  aria-label="Business Name"
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
            label="Email *"
                  aria-label="Email"
            type="email"
            {...formik.getFieldProps("email")}
            status={
              formik.touched.email && formik.errors.email ? "error" : null
            }
            errorMessage={formik.touched.email && formik.errors.email}
          />
          <div className="">
            <PhoneNumberInput
              label="Phone Number *"
              value={formik.values.phone}
              onChange={(value) => formik.setFieldValue("phone", value ?? "")}
              error={formik.errors.phone}
              touched={formik.touched.phone}
            />
          </div>
          <CustomerAddressFields formik={formik} />
        </div>
        <CustomerValidationSummary errors={formik.errors} submitted={formik.submitCount > 0} />
        <div className="flex flex-col gap-3 pt-2 shrink-0">
          <Button
            disabled={!formik.dirty || UpdateMutation.isPending}
            loading={UpdateMutation.isPending}
            type="submit"
            className="w-full"
          >
            Update Customer
          </Button>
          <Button
            type="button"
            onClick={close}
            variant="secondary"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default withBusinessWrite(EditCustomer);
