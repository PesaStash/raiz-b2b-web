/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Radio from "@/components/ui/Radio";
import { GlobalCountryConfig } from "@/constants/send";
import {
  FormField,
  IntBeneficiaryMethodFields,
  IntCountryType,
} from "@/types/services";
import { convertField } from "@/utils/helpers";
import { FormikProps } from "formik";
import React, { useEffect } from "react";

interface Props {
  fields: FormField[];
  formik: FormikProps<any>;
  countryMethods: IntBeneficiaryMethodFields;
  activeMethod: string;
  reset: () => void;
}

const DynamicBeneficiaryForm = ({
  fields,
  formik,
  countryMethods,
  activeMethod,
  reset,
}: Props) => {
  const getEnumDefaultFields = (
    currentFields: FormField[],
    parentName = "",
  ): Array<{ key: string; value: string }> => {
    return currentFields.flatMap((field) => {
      if (!field.name) {
        return [];
      }

      const fieldName = parentName ? `${parentName}_${field.name}` : field.name;

      if (field.type === "object" && field.fields?.length) {
        return getEnumDefaultFields(field.fields, fieldName);
      }

      if (field.enum && field.enum.length === 1) {
        return [{ key: fieldName, value: field.enum[0] }];
      }

      return [];
    });
  };

  useEffect(() => {
    getEnumDefaultFields(fields).forEach(({ key, value }) => {
      if (!formik.values[key]) {
        formik.setFieldValue(key, value);
      }
    });
  }, [fields, formik]);
  if (!fields.length || !formik.values.country?.value) {
    return null;
  }

  const countryCode = formik.values.country.value as string;
  const config = GlobalCountryConfig[countryCode];

  if (!config) {
    const renderGenericField = (field: FormField, parentName = "") => {
      if (!field.name) {
        return null;
      }

      const fieldName = parentName ? `${parentName}_${field.name}` : field.name;
      const fieldLabel = convertField(field.name);

      if (field.type === "object" && field.fields?.length) {
        return (
          <div key={fieldName} className="flex flex-col gap-3">
            <p className="text-raiz-gray-950 font-semibold border-b border-gray-300 pb-1">
              {fieldLabel}
            </p>
            {field.fields.map((nestedField) =>
              renderGenericField(nestedField, fieldName),
            )}
          </div>
        );
      }

      if (field.enum) {
        return (
          <div key={fieldName} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 capitalize">
              {fieldLabel}
            </label>
            {field.enum.length === 1 ? (
              <div className="flex items-center gap-2 cursor-not-allowed">
                <Radio checked readOnly={true} onChange={() => {}} />
                <span className="text-sm text-gray-700">
                  {field.enum[0]
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/^./, (c) => c.toUpperCase())}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {field.enum.map((option) => (
                  <button
                    type="button"
                    onClick={() => formik.setFieldValue(fieldName, option)}
                    key={option}
                    className="flex items-center gap-2"
                  >
                    <Radio
                      checked={formik.values[fieldName] === option}
                      onChange={() => formik.setFieldValue(fieldName, option)}
                    />
                    <span className="text-sm text-gray-700">
                      {option
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/^./, (c) => c.toUpperCase())}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {formik.errors[fieldName] && formik.touched[fieldName] && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors[fieldName] as string}
              </div>
            )}
          </div>
        );
      }

      if (field.const) {
        return (
          <InputField
            key={fieldName}
            label={fieldLabel}
            name={fieldName}
            type="text"
            disabled
            value={field.const || ""}
          />
        );
      }

      return (
        <InputField
          key={fieldName}
          label={fieldLabel}
          name={fieldName}
          type="text"
          value={formik.values[fieldName] || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={
            formik.touched[fieldName] && formik.errors[fieldName]
              ? (formik.errors[fieldName] as string)
              : undefined
          }
          status={
            formik.touched[fieldName] && formik.errors[fieldName] ? "error" : null
          }
        />
      );
    };

    // Fallback to generic form for unconfigured countries
    return (
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col gap-[15px] justify-between mt-4 h-full pb-7"
      >
        <div className="flex flex-col gap-[15px]">
          {fields.map((field) => renderGenericField(field))}
        </div>
        <Button
          disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}
          type="submit"
          loading={formik.isSubmitting}
        >
          Add Beneficiary
        </Button>
      </form>
    );
  }
  const {
    countryName,
    bankDetailsFields,
    formComponent,
    banks: defaultBanks,
  } = config;
  const FormComponent = formComponent;

  const methodFields = activeMethod ? countryMethods[activeMethod] || [] : fields;
  const fallbackFields = Object.values(countryMethods).flat();
  const banks =
    (defaultBanks?.length ?? 0) > 0
      ? defaultBanks
      : methodFields.find((field: any) => field.name === "bank_code")?.banks ||
        fallbackFields.find((field: any) => field.name === "bank_code")?.banks ||
        [];

  return (
    <FormComponent
      fields={fields}
      countryCode={countryCode as IntCountryType}
      countryName={countryName}
      bankDetailsFields={bankDetailsFields}
      banks={banks}
      reset={reset}
    />
  );
};

export default DynamicBeneficiaryForm;
