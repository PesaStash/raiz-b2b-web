"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormikProps } from "formik";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import useCountryStore from "@/store/useCountryStore";
import type { CustomerValues } from "@/lib/customerValidation";

export default function CustomerAddressFields({ formik }: { formik: FormikProps<CustomerValues> }) {
  const [manual, setManual] = useState(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || !!formik.values.address);
  const { countries, fetchCountries, loading } = useCountryStore();
  useEffect(() => { void fetchCountries(); }, [fetchCountries]);
  const options = useMemo(() => countries
    .filter(country => /^[A-Z]{2}$/.test(country.country_code.toUpperCase()))
    .map(country => ({ value: country.country_code.toUpperCase(), label: country.country_name }))
    .sort((a, b) => a.label.localeCompare(b.label)), [countries]);
  const error = (field: keyof CustomerValues) => formik.touched[field] ? formik.errors[field] : undefined;
  return <fieldset className="flex flex-col gap-4">
    <legend className="text-sm font-medium mb-2">Customer address *</legend>
    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API && <button type="button" className="text-sm underline self-start" onClick={() => setManual(value => !value)}>
      {manual ? "Search for an address" : "Enter address manually"}
    </button>}
    {manual ? <InputField label="Street address *" aria-label="Street address" {...formik.getFieldProps("address")} status={error("address") ? "error" : null} errorMessage={error("address")} /> :
      <AddressAutocomplete label="Search address" value={formik.values.address}
        onChange={address => formik.setValues(values => ({ ...values, address, city: "", state: "", country_code: "" }))}
        onAddressSelect={components => formik.setValues(values => ({ ...values, address: components.address ?? "", city: components.city ?? "", state: components.state ?? "", country_code: components.country_code?.toUpperCase() ?? "" }))}
        touched={formik.touched.address} error={formik.errors.address} />}
    <InputField label="City *" aria-label="City" {...formik.getFieldProps("city")} status={error("city") ? "error" : null} errorMessage={error("city")} />
    <InputField label="State / region *" aria-label="State or region" {...formik.getFieldProps("state")} status={error("state") ? "error" : null} errorMessage={error("state")} />
    <SelectField label="Country *" placeholder="Select address country" options={options} isLoading={loading}
      value={options.find(option => option.value === formik.values.country_code) ?? (formik.values.country_code ? { value: formik.values.country_code, label: formik.values.country_code } : null)}
      onChange={option => formik.setFieldValue("country_code", option?.value ?? "")}
      status={error("country_code") ? "error" : null} helper={error("country_code")} />
  </fieldset>;
}
