"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
import ModalTrigger from "@/components/ui/ModalTrigger";
// import Radio from "@/components/ui/Radio";
import Spinner from "@/components/ui/Spinner";
import { useUser } from "@/lib/hooks/useUser";
import {
  CreateIntBeneficiary,
  FetchIntBeneficiariesApi,
  FetchNgnAcctDetailsApi,
  GetIntBeneficiaryFormFields,
} from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import {
  FormField,
  IntBeneficiaryMethodFields,
  IIntBeneficiariesParams,
  IIntBeneficiaryPayload,
  IntCountryType,
} from "@/types/services";
import {
  // convertField,
  getReadablePatternMessage,
  truncateString,
} from "@/utils/helpers";
import { resolveCountryMethodFields } from "@/utils/remittanceFormFields";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormikConfig, useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { IIntCountry } from "@/constants/send";
import { NGNAcctNoSchema } from "../../../naira/toBanks/SelectUser";
import BankModal from "@/components/modals/BankModal";
import { IBank } from "@/types/misc";
import { ImSpinner2 } from "react-icons/im";
import InputLabel from "@/components/ui/InputLabel";
import IntBeneficiaryModal from "../toInternational/IntBeneficiaryModal";
import IntCountriesModal from "../toInternational/IntCountriesModal";
import Image from "next/image";
import GbBeneficiaryForm from "./GbBeneficiaryForm";
import DynamicBeneficiaryForm from "./DynamicBeneficiaryForm";
import CNBeneficiaryForm from "./CNBeneficiaryForm";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface FormValues {
  country: IIntCountry | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface Props {
  close: () => void;
}

const GlobalBeneficiary = ({ close }: Props) => {
  const { actions } = useSendStore();
  const { user } = useUser();
  const [showModal, setShowModal] = useState<
    "country" | "beneficiary" | "bank" | null
  >(null);
  const [bank, setBank] = useState<IBank>();
  const [fields, setFields] = useState<FormField[]>([]);
  const [countryMethods, setCountryMethods] = useState<IntBeneficiaryMethodFields>(
    {},
  );
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: fieldsData, isLoading: fieldLoading } = useQuery({
    queryKey: ["int-bank-benefiary-fields"],
    queryFn: GetIntBeneficiaryFormFields,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "int-bank-beneficiaries",
      {
        option_type: "bank",
        // label: labelFilter,
        page: 1,
        limit: 50,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IIntBeneficiariesParams];
      return FetchIntBeneficiariesApi(params);
    },
  });
  const beneficiaries = data?.beneficiaries || [];
  const qc = useQueryClient();
  const AddBeneficiaryMutation = useMutation({
    mutationFn: (data: IIntBeneficiaryPayload) => CreateIntBeneficiary(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["int-bank-beneficiaries"] });
      NgFormik.resetForm();
    },
  });

  const initialValues: FormValues = {
    country: null,
  };

  const createValidationSchema = (fields: FormField[]) => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      country: z.any().refine((val) => val !== "", "Country is required"),
    };

    fields.forEach((field) => {
      let fieldSchema = z.string();

      // Add required validation
      if (field.required && !field.const) {
        fieldSchema = fieldSchema.min(1, `${field.name} is required`);
      }

      const minLength = field.min_length ?? field.minLength;
      const maxLength = field.max_length ?? field.maxLength;
      if (typeof minLength === "number" && minLength > 0) {
        fieldSchema = fieldSchema.min(
          minLength,
          `${field.name} must be at least ${minLength} characters`,
        );
      }
      if (typeof maxLength === "number" && maxLength > 0) {
        fieldSchema = fieldSchema.max(
          maxLength,
          `${field.name} must be at most ${maxLength} characters`,
        );
      }

      // Add pattern validation if it exists
      if (field.pattern) {
        try {
          const regex = new RegExp(field.pattern);
          const readableMessage = getReadablePatternMessage(
            field.pattern,
            field.name,
          );

          fieldSchema = fieldSchema.regex(regex, readableMessage);
        } catch (error) {
          console.log(
            `Invalid regex pattern for ${field.name}: ${field.pattern}`,
            error,
          );
        }
      }

      let finalSchema: z.ZodType<string> = fieldSchema;

      // Add enum validation if it exists
      if (field.enum) {
        finalSchema = fieldSchema.refine((val) => field.enum!.includes(val), {
          message: `Must be one of: ${field.enum!.join(", ")}`,
        });
      }

      schemaShape[field.name] = finalSchema;
    });

    return z.object(schemaShape);
  };

  const formikConfig: FormikConfig<FormValues> = {
    initialValues,
    validationSchema: toFormikValidationSchema(createValidationSchema(fields)),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const { country, ...restValues } = values;
        const payload = {
          country: country?.value as IntCountryType,
          customer_email: user?.business_account?.business_email || null,
          data: { ...restValues },
        };
        await AddBeneficiaryMutation.mutateAsync(payload);
        resetForm();
      } catch (error) {
        console.log("Submission error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    validateOnMount: true,
  };

  const formik = useFormik<FormValues>(formikConfig);

  const NgFormik = useFormik({
    initialValues: {
      account_number: "",
    },
    validationSchema: toFormikValidationSchema(NGNAcctNoSchema),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          country: formik.values.country?.value as IntCountryType,
          customer_email: user?.business_account?.business_email || "",
          data: {
            type: "BANK",
            account_number: values.account_number,
            account_name: ngData?.account_name,
            bank_name: bank?.bankName,
            bank_code: bank?.bankCode,
          },
        };
        await AddBeneficiaryMutation.mutateAsync(payload);
        // resetForm();
      } catch (error) {
        console.log("Submission error:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const countryCode =
    typeof formik.values.country === "string" || !formik.values.country
      ? ""
      : formik.values.country.value;

  // Update fields and validation when country/method changes
  useEffect(() => {
    if (!fieldsData || !countryCode) {
      setFields([]);
      setCountryMethods({});
      setSelectedMethod("");
      return;
    }

    const resolved = resolveCountryMethodFields(
      fieldsData,
      countryCode,
      selectedMethod,
    );

    if (!resolved.activeMethod) {
      setFields([]);
      setCountryMethods({});
      setSelectedMethod("");
      return;
    }

    if (resolved.activeMethod !== selectedMethod) {
      setSelectedMethod(resolved.activeMethod);
    }

    setCountryMethods(resolved.methods);
    setFields(resolved.fields);
    formik.setFormikState((prev) => ({
      ...prev,
      validationSchema: toFormikValidationSchema(
        createValidationSchema(resolved.fields),
      ),
    }));
    const newValues: FormValues = {
      country: formik.values.country,
      ...resolved.fields.reduce<Record<string, string>>(
        (acc: Record<string, string>, field: FormField) => {
          acc[field.name] = formik.values[field.name] || field.const || "";
          return acc;
        },
        {},
      ),
    };
    formik.setValues(newValues);
  }, [countryCode, fieldsData, selectedMethod]);

  useEffect(() => {
    const result = NGNAcctNoSchema.safeParse(NgFormik.values.account_number);
    setIsValid(result.success);
    setError(result.success ? null : result.error.errors[0].message);
  }, [NgFormik.values.account_number]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    NgFormik.setFieldValue("account_number", value);

    const result = NGNAcctNoSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };
  const { data: ngData, isFetching } = useQuery({
    queryKey: [
      "ngnAcctDetails",
      {
        account_number: NgFormik.values.account_number,
        bank_code: bank?.bankCode,
      },
    ],
    queryFn: async ({ queryKey }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, params] = queryKey as [
        string,
        { account_number: string; bank_code: string },
      ];
      return await FetchNgnAcctDetailsApi(params);
    },
    enabled: isValid && !!bank,
  });

  if (fieldLoading) {
    return (
      <div className="flex flex-col gap-5 mt-10 justify-center items-center">
        <Spinner />
        <p> Loading form fields...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CenterModalHeader close={close} />
      <h2 className="text-xl font-bold text-raiz-gray-950 mb-10">
        International Remittance
      </h2>
      <div className="flex-1  flex flex-col justify-between gap-4 h-[65vh] xl:h-[70vh]">
        <div className="bg-raiz-gray-50 p-6 overflow-y-auto rounded-[20px]">
          <div className="mb-11">
            <h5 className="text-raiz-gray-950 text-sm font-bold  leading-[16.80px] mb-[15px]">
              Beneficiary
            </h5>
            {isLoading ? (
              <div>Loading beneficiaries...</div>
            ) : beneficiaries?.length > 0 ? (
              <div className="flex gap-2 overflow-x-scroll no-scrollbar">
                {beneficiaries?.map((user, index) => (
                  <button
                    key={index}
                    className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
                    onClick={() => actions.selectIntBeneficiary(user)}
                  >
                    <div className="flex relative">
                      <Avatar
                        src={""}
                        name={
                          user?.foreign_payout_beneficiary?.beneficiary_name
                        }
                      />
                      {user?.foreign_payout_beneficiary
                        ?.beneficiary_country && (
                        <Image
                          className="absolute bottom-0 -right-3 w-7 h-5"
                          src={`/icons/flag-${user.foreign_payout_beneficiary.beneficiary_country.toLowerCase()}.png`}
                          width={30}
                          height={20}
                          alt={user.foreign_payout_beneficiary.beneficiary_country.toLowerCase()}
                        />
                      )}
                    </div>

                    <p className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none">
                      {truncateString(
                        user?.foreign_payout_beneficiary?.beneficiary_name ||
                          "",
                        15,
                      )}
                    </p>
                    <p className="text-center text-raiz-gray-700 text-xs leading-[18px]">
                      {truncateString(
                        user?.foreign_payout_beneficiary
                          ?.beneficiary_account_number || "",
                        15,
                      )}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyList text={"No beneficiary yet"} />
            )}
          </div>
          <div className="flex justify-between w-full mb-[15px]">
            <h4 className="text-zinc-900 text-sm font-bold leading-none">
              Add Beneficiary
            </h4>
            {beneficiaries?.length > 0 && (
              <button
                type="button"
                onClick={() => setShowModal("beneficiary")}
                className="text-indigo-900 text-xs font-bold leading-tight"
              >
                Choose Beneficiary
              </button>
            )}
          </div>
          <ModalTrigger
            onClick={() => setShowModal("country")}
            placeholder="Enter country"
            value={
              typeof formik.values.country === "string"
                ? formik.values.country
                : formik.values.country?.name || ""
            }
          />
          {Object.keys(countryMethods).length > 1 &&
            formik.values.country?.value !== "GB" &&
            formik.values.country?.value !== "CN" && (
              <div className="mt-4">
                <InputLabel content="Payout Method" />
                <select
                  className="w-full mt-2 rounded-xl border border-raiz-gray-200 px-4 py-3 bg-white text-raiz-gray-900"
                  value={selectedMethod}
                  onChange={(event) => setSelectedMethod(event.target.value)}
                >
                  {Object.keys(countryMethods).map((method) => (
                    <option value={method} key={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {fields.length > 0 && formik.values.country?.value === "NG" && (
            <form
              onSubmit={NgFormik.handleSubmit}
              className="flex flex-col gap-[15px] justify-between h-[60vh] lg:h-[65vh] pb-7"
            >
              <div className="flex flex-col gap-[15px]">
                <div className="mt-[15px]">
                  <InputLabel content={"Bank Name"} />
                  <ModalTrigger
                    onClick={() => setShowModal("bank")}
                    placeholder="Enter bank name"
                    value={bank?.bankName || ""}
                  />
                </div>
                <InputField
                  label="Account Number"
                  {...NgFormik.getFieldProps("account_number")}
                  placeholder="Enter account number"
                  errorMessage={error ? error : undefined}
                  onChange={handleAccountChange}
                />
                <div className="flex gap-2 mt-2 items-center">
                  {isFetching ? (
                    <ImSpinner2 className="animate-spin w-4 h-4" />
                  ) : (
                    <span>{ngData?.account_name}</span>
                  )}
                </div>
              </div>
              <Button
                loading={AddBeneficiaryMutation.isPending}
                type="submit"
                disabled={!ngData || isFetching}
              >
                Continue
              </Button>
            </form>
          )}
          {fields.length > 0 && formik.values.country?.value === "GB" && (
            <GbBeneficiaryForm
              methods={countryMethods}
              countryCode={formik.values.country.value}
            />
          )}
          {fields.length > 0 && formik.values.country?.value === "CN" && (
            <CNBeneficiaryForm
              methods={countryMethods}
              countryCode={formik.values.country.value}
              countryName={"China"}
              bankDetailsFields={[
                { name: "bank_code", label: "Bank" },
                {
                  name: "account_number",
                  label: "Account Number",
                  pattern: "^\\+86[1][3-9]\\d{9}$",
                },
                // {
                //   name: "account_name",
                //   label: "Account Name",
                //   pattern: "[^\\s@]+(\\s+)[^\\s@]+",
                // },
              ]}
            />
          )}

          {fields.length > 0 &&
            formik.values.country?.value !== "NG" &&
            formik.values.country?.value !== "GB" &&
            formik.values.country?.value !== "CN" && (
              <DynamicBeneficiaryForm
                fields={fields}
                formik={formik}
                countryMethods={countryMethods}
                activeMethod={selectedMethod}
                reset={() => formik.resetForm()}
              />
            )}
        </div>
      </div>
      {showModal === "country" && (
        <IntCountriesModal
          setCountry={(country) => formik.setFieldValue("country", country)}
          close={() => setShowModal(null)}
        />
      )}
      {showModal === "bank" && (
        <BankModal setSelectedBank={setBank} close={() => setShowModal(null)} />
      )}
      {showModal === "beneficiary" && (
        <IntBeneficiaryModal
          close={() => setShowModal(null)}
          users={beneficiaries}
        />
      )}
    </div>
  );
};

export default GlobalBeneficiary;
