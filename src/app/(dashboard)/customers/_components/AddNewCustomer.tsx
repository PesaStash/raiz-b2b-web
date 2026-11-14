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
import type { ICustomer } from "@/types/invoice";
import { IAddCustomerPayload } from "@/types/services";
import { AddCustomerApi } from "@/services/invoice";
import SelectField from "@/components/ui/SelectField";
import { sanitizeAddressField } from "@/utils/helpers";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserId } from "@/utils/analytics/userProps";
import { useUser } from "@/lib/hooks/useUser";

interface Props {
  close: () => void;
  onCreated?: (customer: ICustomer) => void;
}

const AddNewCustomer = ({ close, onCreated }: Props) => {
  const qc = useQueryClient();
  const { user } = useUser();
  const AddMutation = useMutation({
    mutationFn: (payload: IAddCustomerPayload) => AddCustomerApi(payload),
    onSuccess: (response) => {
      const customer = response?.data ?? response;
      if (customer?.customer_id) onCreated?.(customer);
      qc.invalidateQueries({ queryKey: ["customers"] });
      const userId = getAnalyticsUserId(user);
      if (userId) {
        pushDataLayerEvent("customer_added", {
          user_id: userId,
        });
      }
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
    validate: validateCustomer,
    onSubmit: (values) => {
      const payload: IAddCustomerPayload = {
        ...(values.customerType === "individual" && { full_name: values.fullname.trim() }),
        customer_type: values.customerType as "individual" | "business",
        email: values.email.trim(),
        phone_number: values.phone,
        street_address: sanitizeAddressField(values.address),
        city: sanitizeAddressField(values?.city),
        state: sanitizeAddressField(values?.state),
        country: values?.country_code,
        ...(values.customerType === "business" && { business_name: values.companyName.trim() }),
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
    <form noValidate onSubmit={formik.handleSubmit} className="h-full flex flex-col min-h-0">
      <CenterModalHeader close={close} />

      <h2 className="text-lg sm:text-xl font-bold text-raiz-gray-950 mb-3 sm:mb-4">
        New Customer
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

          {/* Show remaining fields only after customer type is selected */}
          {formik.values.customerType && (
            <>
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
                  errorMessage={
                    formik.touched.fullname && formik.errors.fullname
                  }
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
            </>
          )}
        </div>
        <CustomerValidationSummary errors={formik.errors} submitted={formik.submitCount > 0} />
        <div className="flex flex-col gap-3 pt-2 shrink-0">
          <Button
            disabled={
              AddMutation.isPending
            }
            loading={AddMutation.isPending}
            type="submit"
            className="w-full"
          >
            Save and Continue
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

export default withBusinessWrite(AddNewCustomer);
