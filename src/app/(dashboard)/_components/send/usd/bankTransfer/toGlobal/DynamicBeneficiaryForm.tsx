/* eslint-disable @typescript-eslint/no-explicit-any */
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import ModalTrigger from "@/components/ui/ModalTrigger";
import SelectField, { Option } from "@/components/ui/SelectField";
import { GlobalCountryConfig } from "@/constants/send";
import { ENABLE_LEGACY_REMITTANCE_FORMS } from "@/constants/remittance";
import useCountryStore from "@/store/useCountryStore";
import {
  FormField,
  IntBeneficiaryMethodFields,
  IntCountryType,
} from "@/types/services";
import { convertField } from "@/utils/helpers";
import { FormikProps } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import BankSelectModal, { IBeneficiaryBank } from "./BankSelectModal";

interface Props {
  fields: FormField[];
  formik: FormikProps<any>;
  countryMethods: IntBeneficiaryMethodFields;
  activeMethod: string;
  reset: () => void;
}

const isCountryField = (fieldName: string) => /country/i.test(fieldName);
const isSwiftField = (fieldName: string) => /swift/i.test(fieldName);
const isBankCodeField = (fieldName: string) => fieldName === "bank_code";

const formatEnumLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());

const DynamicBeneficiaryForm = ({
  fields,
  formik,
  countryMethods,
  activeMethod,
  reset,
}: Props) => {
  const { countries, fetchCountries, loading: countriesLoading } =
    useCountryStore();
  const [bankModalField, setBankModalField] = useState<{
    fieldName: string;
    banks: IBeneficiaryBank[];
  } | null>(null);
  const [selectedBanks, setSelectedBanks] = useState<
    Record<string, IBeneficiaryBank>
  >({});

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.country_code,
        label: country.country_name,
      })),
    [countries],
  );

  const getDefaultFields = (
    currentFields: FormField[],
    parentName = "",
  ): Array<{ key: string; value: string }> =>
    currentFields.flatMap((field) => {
      if (!field.name) return [];

      const fieldName = parentName ? `${parentName}_${field.name}` : field.name;

      if (field.type === "object" && field.fields?.length) {
        return getDefaultFields(field.fields, fieldName);
      }

      if (field.const) {
        return [{ key: fieldName, value: field.const }];
      }

      if (field.enum && field.enum.length === 1) {
        return [{ key: fieldName, value: field.enum[0] }];
      }

      return [];
    });

  useEffect(() => {
    getDefaultFields(fields).forEach(({ key, value }) => {
      if (formik.values[key] !== value) {
        formik.setFieldValue(key, value, true);
      }
    });
  }, [fields, formik]);

  if (!fields.length || !formik.values.country?.value) {
    return null;
  }

  const countryCode = formik.values.country.value as string;
  const legacyConfig =
    ENABLE_LEGACY_REMITTANCE_FORMS && GlobalCountryConfig[countryCode];

  if (legacyConfig) {
    const {
      countryName,
      bankDetailsFields,
      formComponent,
      banks: defaultBanks,
    } = legacyConfig;
    const FormComponent = formComponent;
    const methodFields = activeMethod
      ? countryMethods[activeMethod] || []
      : fields;
    const fallbackFields = Object.values(countryMethods).flat();
    const banks =
      (defaultBanks?.length ?? 0) > 0
        ? defaultBanks
        : methodFields.find((field: FormField) => field.name === "bank_code")
            ?.banks ||
          fallbackFields.find((field: FormField) => field.name === "bank_code")
            ?.banks ||
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
  }

  const renderEnumSelect = (
    fieldName: string,
    fieldLabel: string,
    enumValues: string[],
  ) => {
    const options: Option[] = enumValues.map((value) => ({
      value,
      label: formatEnumLabel(value),
    }));
    const selected =
      options.find((option) => option.value === formik.values[fieldName]) ??
      null;
    const hasError = !!formik.touched[fieldName] && !!formik.errors[fieldName];

    return (
      <SelectField
        key={fieldName}
        label={fieldLabel}
        name={fieldName}
        placeholder={`Select ${fieldLabel.toLowerCase()}`}
        options={options}
        value={selected}
        onChange={(option) => {
          formik.setFieldValue(fieldName, option?.value ?? "", true);
          formik.setFieldTouched(fieldName, true, false);
        }}
        status={hasError ? "error" : null}
        helper={hasError ? String(formik.errors[fieldName]) : null}
      />
    );
  };

  const renderCountrySelect = (
    fieldName: string,
    fieldLabel: string,
    options: Option[],
  ) => {
    const selected =
      options.find((option) => option.value === formik.values[fieldName]) ??
      null;
    const hasError = !!formik.touched[fieldName] && !!formik.errors[fieldName];

    return (
      <SelectField
        key={fieldName}
        label={fieldLabel}
        name={fieldName}
        placeholder={`Select ${fieldLabel.toLowerCase()}`}
        options={options}
        value={selected}
        isLoading={countriesLoading}
        onChange={(option) => {
          const code = option?.value != null ? String(option.value) : "";
          formik.setFieldValue(fieldName, code, true);
          formik.setFieldTouched(fieldName, true, false);
        }}
        status={hasError ? "error" : null}
        helper={hasError ? String(formik.errors[fieldName]) : null}
      />
    );
  };

  const renderGenericField = (field: FormField, parentName = "") => {
    if (!field.name) return null;

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

    if (isBankCodeField(field.name) && field.banks?.length) {
      const selectedBank = selectedBanks[fieldName];
      const hasError = !!formik.touched[fieldName] && !!formik.errors[fieldName];

      return (
        <div key={fieldName}>
          <InputLabel content={fieldLabel} />
          <ModalTrigger
            onClick={() =>
              setBankModalField({
                fieldName,
                banks: field.banks as IBeneficiaryBank[],
              })
            }
            placeholder={`Select ${fieldLabel.toLowerCase()}`}
            value={selectedBank?.name || formik.values[fieldName] || ""}
          />
          {hasError && (
            <p className="text-red-500 text-sm mt-1">
              {formik.errors[fieldName] as string}
            </p>
          )}
        </div>
      );
    }

    if (isCountryField(field.name)) {
      if (field.enum && field.enum.length === 1) {
        return (
          <InputField
            key={fieldName}
            label={fieldLabel}
            name={fieldName}
            type="text"
            disabled
            value={field.enum[0]}
          />
        );
      }

      const options =
        field.enum && field.enum.length > 1
          ? countryOptions.filter((option) =>
              field.enum!.includes(String(option.value)),
            )
          : countryOptions;

      return renderCountrySelect(fieldName, fieldLabel, options);
    }

    if (field.enum) {
      if (field.enum.length === 1) {
        return (
          <InputField
            key={fieldName}
            label={fieldLabel}
            name={fieldName}
            type="text"
            disabled
            value={field.enum[0]}
          />
        );
      }

      return renderEnumSelect(fieldName, fieldLabel, field.enum);
    }

    return (
      <InputField
        key={fieldName}
        label={fieldLabel}
        name={fieldName}
        type="text"
        value={formik.values[fieldName] || ""}
        onChange={(event) => {
          const value = isSwiftField(field.name)
            ? event.target.value.toUpperCase()
            : event.target.value;
          formik.setFieldValue(fieldName, value);
        }}
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

  return (
    <>
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

      {bankModalField && (
        <BankSelectModal
          data={bankModalField.banks}
          close={() => setBankModalField(null)}
          selectedBank={
            selectedBanks[bankModalField.fieldName] || {
              id: 0,
              code: "",
              name: "",
            }
          }
          setSelectedBank={(bank) => {
            setSelectedBanks((prev) => ({
              ...prev,
              [bankModalField.fieldName]: bank,
            }));
            formik.setFieldValue(bankModalField.fieldName, bank.code, true);
            formik.setFieldTouched(bankModalField.fieldName, true, false);
          }}
          formik={formik}
        />
      )}
    </>
  );
};

export default DynamicBeneficiaryForm;
