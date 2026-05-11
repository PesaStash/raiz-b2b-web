"use client";
import ModalTrigger from "@/components/ui/ModalTrigger";
import { convertField, getReadablePatternMessage } from "@/utils/helpers";
import React, { useState } from "react";
import {
  FormField,
  IntBeneficiaryMethodFields,
  IIntBeneficiaryPayload,
  IntCountryType,
} from "@/types/services";
import { FormikConfig, useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useUser } from "@/lib/hooks/useUser";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateIntBeneficiary } from "@/services/transactions";
import { toast } from "sonner";
import Radio from "@/components/ui/Radio";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import InputLabel from "@/components/ui/InputLabel";
import GbTypeModal from "./GbTypeModal";
import PurposeModal from "./PurposeModal";
import { Bank, renderNestedFields } from "./BeneficiaryForm";
import { IBeneficiaryBank } from "./BankSelectModal";
import SendTypeModal from "./SendTypeModal";
import BeneficiaryTypeModal from "../toInternational/BeneficiaryTypeModal";

export type gbBenType = "DOMESTIC_GBP" | "SEPA_EUR" | null;

interface FieldsMap {
  [key: string]: FormField[];
  DOMESTIC_GBP: FormField[];
  SEPA_EUR: FormField[];
}

interface Props {
  methods: IntBeneficiaryMethodFields;
  countryCode: IntCountryType;
}

interface FormValues {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const GbBeneficiaryForm = ({ methods, countryCode }: Props) => {
  const { user } = useUser();
  const [showModal, setShowModal] = useState<
    "type" | null | "purpose" | "ben" | "send"
  >(null);
  const [remittanceFields, setRemittanceFields] = useState([""]);
  const [benType, setBenType] = useState<string>("");
  const [sendType, setSendType] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedBank, setSelectedBank] = useState<IBeneficiaryBank>({
    id: 0,
    code: "",
    name: "",
  });
  const [type, setType] = useState<gbBenType>(null);
  const typeFields = ["DOMESTIC_GBP", "SEPA_EUR"] as gbBenType[];
  const fieldsMap: FieldsMap = {
    DOMESTIC_GBP: methods.DOMESTIC_GBP || [],
    SEPA_EUR: methods.SEPA_EUR || [],
    ...methods,
  };

  const entity = user?.business_account?.entity;
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const userCountryName =
    (entity &&
      entity.entity_address &&
      entity.entity_address[0]?.country?.country_name) ||
    "";
  const userCountryCity =
    (entity && entity.entity_address && entity.entity_address[0]?.city) || "";
  const userZipCode =
    (entity && entity.entity_address && entity.entity_address[0]?.zip_code) ||
    "";
  const userState =
    (entity && entity.entity_address && entity.entity_address[0]?.state) || "";
  const userEmail = user?.business_account?.business_email || "";

  const formDetail = type !== null ? fieldsMap[type] || [] : [];

  const createValidationSchema = () => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      country: z.any().refine((val) => val !== "", "Country is required"),
    };

    formDetail.forEach((field) => {
      let fieldSchema = z.string();

      // Add required validation
      if (field.required) {
        fieldSchema = fieldSchema.min(1, `${field.name} is required`);
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
  const qc = useQueryClient();

  const AddBeneficiaryMutation = useMutation({
    mutationFn: (data: IIntBeneficiaryPayload) => CreateIntBeneficiary(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["int-bank-beneficiaries"] });
      setType(null);
    },
  });
  const formikConfig: FormikConfig<FormValues> = {
    initialValues: {},
    validationSchema: toFormikValidationSchema(createValidationSchema()),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      let payload: IIntBeneficiaryPayload = {
        customer_email: "",
        country: countryCode,
        data: {},
      };
      if (type === "DOMESTIC_GBP") {
        let sendObject = {};
        if (sendType === "INDIVIDUAL") {
          sendObject = {
            type: "INDIVIDUAL",
            account_name: userName,
            country: userCountryName,
            city: userCountryCity,
            post_code: userZipCode,
            address: values.sender_address,
            date_of_birth: values.sender_date_of_birth,
            country_of_birth: values.sender_country_of_birth,
          };
        } else {
          sendObject = {
            type: "BUSINESS",
            account_name: userName,
            country: userCountryName,
            city: userCountryCity,
            post_code: userZipCode,
            address: values.sender_address,
            business_registration_number:
              values.sender_business_registration_number,
          };
        }
        payload = {
          data: {
            beneficiary: {
              type: benType,
              country: "FR",
              post_code: values.beneficiary_post_code,
              address: values.beneficiary_address,
              city: values.beneficiary_city,
            },
            sender: sendObject,
            type,
            sort_code: values.sort_code,
            account_number: values.account_number,
            account_name: values.account_name,
            remittance_purpose: values.remittance_purpose,
          },
          customer_email: userEmail,
          country: countryCode,
        };
      } else {
        let sendObject = {};
        if (sendType === "INDIVIDUAL") {
          sendObject = {
            type: "INDIVIDUAL",
            account_name: userName,
            country: userCountryName,
            city: userCountryCity,
            post_code: userZipCode,
            address: values.sender_address,
            date_of_birth: values.sender_date_of_birth,
            country_of_birth: values.sender_country_of_birth,
          };
        } else {
          sendObject = {
            type: "BUSINESS",
            account_name: userName,
            country: userCountryName,
            city: userCountryCity,
            post_code: userZipCode,
            address: values.sender_address,
            business_registration_number:
              values.sender_business_registration_number,
          };
        }
        payload = {
          data: {
            beneficiary: {
              type: benType,
              country: "United Kingdom",
              post_code: values.beneficiary_post_code,
              address: values.beneficiary_address,
              city: values.beneficiary_city,
            },
            sender: sendObject,
            type,
            account_number: values.account_number,
            account_name: values.account_name,
            remittance_purpose: values.remittance_purpose,
          },
          customer_email: userEmail,
          country: countryCode,
        };
      }
      try {
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

  const handleOpenModal = (
    value: string[] | Bank[] | undefined,
    name: string,
  ) => {
    if (name === "remittance_purpose") setShowModal("purpose");
    if (name === "type") setShowModal("type");
    if (name === "beneficiary_type") setShowModal("ben");
    if (name === "sender_type") setShowModal("send");
    // if (name === "bank_code") setShowModal("bank");
  };

  const closeModal = () => setShowModal(null);
  const benFields = ["BUSINESS", "INDIVIDUAL"];
  const displayModal = () => {
    switch (showModal) {
      case "ben":
        return (
          <BeneficiaryTypeModal
            data={benFields}
            close={closeModal}
            setBenType={(val) => {
              setBenType(val);
              formik.setFieldValue("beneficiary", val);
            }}
            benType={benType}
            formik={formik}
          />
        );
      case "purpose":
        return (
          <PurposeModal
            data={remittanceFields || []}
            close={closeModal}
            formik={formik}
          />
        );
      case "send":
        return (
          <SendTypeModal
            data={benFields}
            close={closeModal}
            setSendType={(val) => {
              setSendType(val);
              formik.setFieldValue("sender", val);
            }}
            sendType={sendType}
            formik={formik}
          />
        );
      case "type":
        return (
          <GbTypeModal
            data={typeFields}
            close={closeModal}
            setType={(value) => {
              setType(value);
              formik.setFieldValue("type", value);
            }}
            type={type}
          />
        );
      default:
        return null;
    }
  };

  // console.log("formik valluess--------", formik.values);

  // console.log("f--------errrrrs", formik.errors);
  return (
    <div className="my-5">
      <InputLabel content="UK Send type" />
      <ModalTrigger
        onClick={() => setShowModal("type")}
        placeholder="Select type "
        value={convertField(type || "")}
      />
      <form
        onSubmit={formik.handleSubmit}
        className={`flex flex-col gap-[15px] justify-between mt-4 min-h-[75vh]
         pb-7`}
      >
        <div className="flex flex-col gap-[15px]">
          {formDetail.map((field, index) => {
            if (field.name === "remittance_purpose") {
              return (
                <ModalTrigger
                  label="Remittance purpose"
                  key={index}
                  onClick={() => {
                    setShowModal("purpose");
                    setRemittanceFields(field.enum as string[]);
                  }}
                  placeholder={`Choose remittance purpose`}
                  value={convertField(formik?.values.remittance_purpose) || ""}
                />
              );
            }
            if (field.name === "beneficiary") {
              const type = "beneficiary";
              return (
                <div key={index}>
                  <p className="text-raiz-gray-950 font-semibold my-3  border-b border-gray-500 py-0.5">
                    Beneficiary Information
                  </p>
                  {renderNestedFields(
                    formik,
                    type,
                    userCountryName,
                    userCountryCity,
                    userZipCode,
                    userState,
                    userName,
                    formik.values.remittance_purpose,
                    benType,
                    sendType,
                    countryCode,
                    selectedBank,
                    [],
                    handleOpenModal,
                    field?.fields,
                    [],
                  )}
                </div>
              );
            }
            if (field.name === "sender") {
              const type = "sender";
              return (
                <div key={index}>
                  <p className="text-raiz-gray-950 font-semibold my-3  border-b border-gray-500 py-0.5">
                    Sender Information
                  </p>
                  {renderNestedFields(
                    formik,
                    type,
                    userCountryName,
                    userCountryCity,
                    userZipCode,
                    userState,
                    userName,
                    formik.values.remittance_purpose,
                    benType,
                    sendType,
                    countryCode,
                    selectedBank,
                    [],
                    handleOpenModal,
                    field?.fields,
                    [],
                  )}
                </div>
              );
            }
            return (
              <div key={index} className="flex flex-col">
                {field.enum ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {convertField(field.name)}
                    </label>
                    <div className="flex flex-col gap-3">
                      {field.enum.map((option) => (
                        <button
                          type="button"
                          onClick={() =>
                            formik.setFieldValue(field.name, option)
                          }
                          key={option}
                          className="flex items-center gap-2"
                        >
                          <Radio
                            checked={formik.values[field.name] === option}
                            onChange={() =>
                              formik.setFieldValue(field.name, option)
                            }
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
                    {formik.errors[field.name] &&
                      formik.touched[field.name] && (
                        <div className="text-red-500 text-sm mt-1">
                          {formik.errors[field.name] as string}
                        </div>
                      )}
                  </div>
                ) : field.const ? (
                  <InputField
                    label={convertField(field.name)}
                    name={field.name}
                    type="text"
                    disabled
                    value={field.const || ""}
                  />
                ) : (
                  <InputField
                    label={convertField(field.name)}
                    name={field.name}
                    max={field?.max_length || field?.maxLength}
                    min={field?.min_length || field?.minLength}
                    type="text"
                    value={formik.values[field.name] || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    // pattern={field.pattern}
                    errorMessage={
                      formik.touched[field.name] && formik.errors[field.name]
                        ? (formik.errors[field.name] as string)
                        : undefined
                    }
                    status={
                      formik.touched[field.name] && formik.errors[field.name]
                        ? "error"
                        : null
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        <Button
          disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}
          type="submit"
          loading={formik.isSubmitting}
        >
          Add Beneficiary
        </Button>
      </form>
      {displayModal()}
    </div>
  );
};

export default GbBeneficiaryForm;
