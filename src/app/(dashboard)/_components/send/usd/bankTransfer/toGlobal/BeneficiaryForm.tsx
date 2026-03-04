/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import InputField from "@/components/ui/InputField";
import { useUser } from "@/lib/hooks/useUser";
import {
  FormField,
  IIntBeneficiaryPayload,
  IntCountryType,
} from "@/types/services";
import { convertField, getReadablePatternMessage } from "@/utils/helpers";
import { FormikProps, useFormik } from "formik";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import ModalTrigger from "@/components/ui/ModalTrigger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateIntBeneficiary } from "@/services/transactions";
import { toast } from "sonner";
import BeneficiaryTypeModal from "../toInternational/BeneficiaryTypeModal";
import BankSelectModal, { IBeneficiaryBank } from "./BankSelectModal";
import SendTypeModal from "./SendTypeModal";
import PurposeModal from "./PurposeModal";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

export interface Bank {
  id: number;
  code: string;
  name: string;
}

interface Props {
  fields: FormField[];
  countryCode: string;
  countryName?: string;
  bankDetailsFields?: { name: string; label: string; pattern?: string }[];
  banks?: Bank[];
  reset?: () => void;
}

const renderField = (
  field: FormField,
  formikProps: FormikProps<any>,
  userCountryName: string,
  userCountryCity: string,
  userZipCode: string,
  userState: string,
  userName: string,
  remittancePurpose: string,
  benType: string,
  sendType: string,
  countryName: string,
  selectedBank: IBeneficiaryBank,
  bankDetailsFieldNames: string[],
  handleOpenModal: (value: string[] | Bank[] | undefined, name: string) => void,
) => {
  if (bankDetailsFieldNames.includes(field.name)) {
    return null;
  }
  if (field.const) {
    return (
      <div key={field.name}>
        <InputField
          label={convertField(field.name)}
          name={field.name}
          disabled
          value={field.const || "BANK"}
          placeholder={`Enter ${convertField(field.name)}`}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }

  if (field.enum && field.name === "remittance_purpose") {
    return (
      <div className="mt-[15px]" key={field.name}>
        <p className="text-raiz-gray-950 text-sm font-medium font-brSonoma leading-normal mb-3">
          Remittance Purpose
        </p>
        <ModalTrigger
          onClick={() => {
            handleOpenModal(field.enum, "remittance_purpose");
          }}
          placeholder={"Choose remittance purpose"}
          value={convertField(remittancePurpose)}
        />
      </div>
    );
  }

  if (field.name === "beneficiary_type") {
    return (
      <div className="mt-[15px]" key={field.name}>
        <p className="text-raiz-gray-950 text-sm font-medium font-brSonoma leading-normal mb-3">
          Beneficiary Type
        </p>
        <ModalTrigger
          onClick={() => {
            handleOpenModal(field.enum, "beneficiary_type");
          }}
          placeholder={"Choose beneficiary type"}
          value={convertField(benType)}
        />
      </div>
    );
  }
  if (field.name === "sender_undefined") {
    return (
      <div className="mt-[15px]" key={field.name}>
        <p className="text-raiz-gray-950 text-sm font-medium font-brSonoma leading-normal mb-3">
          Sender Type
        </p>
        <ModalTrigger
          onClick={() => {
            handleOpenModal(field.enum, "sender_type");
          }}
          placeholder={"Choose sender type"}
          value={convertField(sendType)}
        />
      </div>
    );
  }

  if (field.name === "account_name") {
    return (
      <div className="mt-[15px]" key={field.name}>
        <InputField
          label={convertField(field.name)}
          name={field.name}
          placeholder={`Enter ${convertField(field.name)}`}
          value={formikProps.values[field.name] ?? ""}
          onChange={(e) => {
            formikProps.setFieldValue(field.name, e.target.value);
            formikProps.setFieldValue(
              "beneficiary_account_name",
              e.target.value,
            );
          }}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }

  if (field.name === "beneficiary_account_name") {
    return (
      <div className="mt-[15px]" key={field.name}>
        <InputField
          label={convertField(field.name)}
          name={field.name}
          placeholder={`Enter ${convertField(field.name)}`}
          value={formikProps.values[field.name] ?? ""}
          disabled
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (
    sendType === "INDIVIDUAL" &&
    field.name === "sender_business_registration_number"
  ) {
    return;
  }
  if (sendType === "BUSINESS" && field.name === "sender_date_of_birth") {
    return;
  }
  if (sendType === "BUSINESS" && field.name === "sender_country_of_birth") {
    return;
  }

  if (field.enum) {
    return;
  }

  if (field.name === "sender_state") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter sender state"
          value={userState}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (field.name === "sender_post_code") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter sender zip code"
          value={userZipCode}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (field.name === "sender_city") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter sender city"
          value={userCountryCity}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (sendType === "INDIVIDUAL" && field.name === "sender_date_of_birth") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          placeholder="Enter DOB (YYYY-MM-DD)"
          value={formikProps.values[field.name] ?? ""}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (sendType === "INDIVIDUAL" && field.name === "sender_country_of_birth") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          placeholder="Enter country of birth"
          value={formikProps.values[field.name] ?? ""}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (field.name === "sender_account_name") {
    return (
      <div key={field.name} className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter account name"
          value={userName}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }

  if (field.name === "beneficiary_country") {
    return (
      <div key={field.name} className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter Account Country Name"
          value={countryName}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }
  if (field.name === "country" || field.name === "sender_country") {
    return (
      <div key={field.name} className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter Account Country Name"
          value={userCountryName}
          onChange={formikProps.handleChange(field.name)}
          onBlur={formikProps.handleBlur}
          errorMessage={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? (formikProps.errors[field.name] as string)
              : undefined
          }
          status={
            formikProps.touched[field.name] && formikProps.errors[field.name]
              ? "error"
              : null
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-[15px]" key={field.name}>
      <InputField
        label={convertField(field.name)}
        name={field.name}
        placeholder={`Enter ${convertField(field.name)}`}
        value={formikProps.values[field.name] ?? ""}
        onChange={formikProps.handleChange(field.name)}
        onBlur={formikProps.handleBlur}
        errorMessage={
          formikProps.touched[field.name] && formikProps.errors[field.name]
            ? (formikProps.errors[field.name] as string)
            : undefined
        }
        status={
          formikProps.touched[field.name] && formikProps.errors[field.name]
            ? "error"
            : null
        }
        pattern={field.pattern}
      />
    </div>
  );
};

export const renderNestedFields = (
  formikProps: FormikProps<any>,
  type: string,
  userCountryName: string,
  userCountryCity: string,
  userZipCode: string,
  userState: string,
  userName: string,
  remittancePurpose: string,
  benType: string,
  sendType: string,
  countryName: string,
  selectedBank: IBeneficiaryBank,
  bankDetailsFieldNames: string[],
  handleOpenModal: (value: string[] | Bank[] | undefined, name: string) => void,
  fields?: FormField[],
  bankDetailsFields?: { name: string; label: string; pattern?: string }[],
) =>
  fields?.map((field) => {
    if (field.type === "object" && field.fields) {
      return (
        <div key={`${field.name}`} className="mt-[15px]">
          <p className="text-raiz-gray-950 mb-3">{convertField(field.name)}</p>
          {renderNestedFields(
            formikProps,
            type,
            userCountryName,
            userCountryCity,
            userZipCode,
            userState,
            userName,
            remittancePurpose,
            benType,
            sendType,
            countryName,
            selectedBank,
            bankDetailsFieldNames,
            handleOpenModal,
            field.fields,
            bankDetailsFields,
          )}
        </div>
      );
    }

    return renderField(
      {
        ...field,
        name: `${type}_${field.name}`,
      },
      formikProps,
      userCountryName,
      userCountryCity,
      userZipCode,
      userState,
      userName,
      remittancePurpose,
      benType,
      sendType,
      countryName,
      selectedBank,
      bankDetailsFieldNames,
      handleOpenModal,
    );
  });

const BeneficiaryForm = ({
  fields,
  countryCode,
  countryName = "",
  bankDetailsFields = [],
  banks,
  reset,
}: Props) => {
  const [openModal, setOpenModal] = useState<
    "ben" | "send" | "purpose" | "bank" | null
  >(null);
  const [remittancePurpose, setRemittancePurpose] = useState<string>("");
  const [benType, setBenType] = useState<string>("");
  const [sendType, setSendType] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<IBeneficiaryBank>({
    id: 0,
    code: "",
    name: "",
  });
  const { user } = useUser();
  const qc = useQueryClient();
  const AddBeneficiaryMutation = useMutation({
    mutationFn: (data: IIntBeneficiaryPayload) => CreateIntBeneficiary(data),
    onSuccess: () => {
      toast.success("Beneficiary added!");
      qc.invalidateQueries({ queryKey: ["int-bank-beneficiaries"] });
      formik.resetForm();
      reset?.();
    },
  });

  const initialValues = fields.reduce<Record<string, any>>((acc, field) => {
    if (field.type === "object" && field.fields) {
      acc[field.name] = field.fields.reduce<Record<string, any>>(
        (nestedAcc, nestedField) => {
          nestedAcc[nestedField.name] =
            nestedField.type === "string" ? "" : undefined;
          return nestedAcc;
        },
        {},
      );
    } else if (field.const) {
      acc[field.name] = field.const;
    } else {
      acc[field.name] = field.type === "string" ? "" : undefined;
    }
    // Initialize bankDetailsFields
    bankDetailsFields.forEach((bankField) => {
      acc[bankField.name] = "";
    });
    return acc;
  }, {});

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

  const remittanceFields = fields.find(
    (item) => item.name === "remittance_purpose",
  );
  const benFields = ["BUSINESS", "INDIVIDUAL"];
  const bankDetailsFieldNames = bankDetailsFields.map((field) => field.name);

  const createValidationSchema = (
    fields: FormField[],
    bankDetailsFields: { name: string; label: string; pattern?: string }[],
  ) => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      country: z.any().refine((val) => val !== "", "Country is required"),
    };

    fields.forEach((field) => {
      if (bankDetailsFieldNames.includes(field.name)) {
        return;
      }
      let fieldSchema = z.string();

      if (field.required) {
        fieldSchema = fieldSchema.min(
          1,
          `${convertField(field.name)} is required`,
        );
      }

      if (field.pattern) {
        try {
          const regex = new RegExp(field.pattern);
          const readableMessage = getReadablePatternMessage(
            field.pattern,
            field.name,
          );
          fieldSchema = fieldSchema.regex(regex, readableMessage);
        } catch (error) {
          console.error(
            `Invalid regex pattern for ${field.name}: ${field.pattern}`,
            error,
          );
        }
      }

      let finalSchema: z.ZodType<string> = fieldSchema;

      if (field.enum) {
        finalSchema = fieldSchema.refine((val) => field.enum!.includes(val), {
          message: `Must be one of: ${field.enum!.join(", ")}`,
        });
      }

      schemaShape[field.name] = finalSchema;
    });

    // Add validation for bankDetailsFields, including bank_code
    bankDetailsFields.forEach((bankField) => {
      let bankFieldSchema = z.string().min(1, `${bankField.label} is required`);
      if (bankField.pattern) {
        try {
          const regex = new RegExp(bankField.pattern);
          const readableMessage = getReadablePatternMessage(
            bankField.pattern,
            bankField.name,
          );
          bankFieldSchema = bankFieldSchema.regex(regex, readableMessage);
        } catch (error) {
          console.error(
            `Invalid regex pattern for ${bankField.name}: ${bankField.pattern}`,
            error,
          );
        }
      }
      schemaShape[bankField.name] = bankFieldSchema;
    });

    return z.object(schemaShape);
  };

  const formik = useFormik({
    initialValues,
    validationSchema: toFormikValidationSchema(
      createValidationSchema(fields, bankDetailsFields),
    ),
    onSubmit: (values) => {
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

      const bankDetails = bankDetailsFields.reduce(
        (acc, field) => {
          acc[field.name] = values[field.name];
          return acc;
        },
        {} as Record<string, string>,
      );

      const data = {
        data: {
          beneficiary: {
            type: benType,
            // account_name: values.account_name,
            country: countryName,
            city: values.beneficiary_city,
            address: values.beneficiary_address,
            ...(values.beneficiary_post_code
              ? {
                  post_code: values.beneficiary_post_code,
                }
              : {}),
          },
          sender: sendObject,
          type: "BANK",
          ...bankDetails,
          account_name: values.account_name,
          remittance_purpose: remittancePurpose,
        },
        customer_email: user?.business_account?.business_email || "",
        country: countryCode as IntCountryType,
      };

      AddBeneficiaryMutation.mutate(data);
    },
  });

  // console.log("formik.errors", formik.errors);
  // console.log("values", formik.values);

  const handleOpenModal = (
    value: string[] | Bank[] | undefined,
    name: string,
  ) => {
    if (name === "remittance_purpose") setOpenModal("purpose");
    if (name === "beneficiary_type") setOpenModal("ben");
    if (name === "sender_type") setOpenModal("send");
    if (name === "bank_code") setOpenModal("bank");
  };

  const closeModal = () => setOpenModal(null);

  const displayModal = () => {
    switch (openModal) {
      case "ben":
        return (
          <BeneficiaryTypeModal
            data={benFields}
            close={closeModal}
            setBenType={setBenType}
            benType={benType}
            formik={formik}
          />
        );
      case "purpose":
        return (
          <PurposeModal
            data={remittanceFields?.enum || []}
            close={closeModal}
            setRemittancePurpose={setRemittancePurpose}
            remittancePurpose={remittancePurpose}
            formik={formik}
          />
        );
      case "send":
        return (
          <SendTypeModal
            data={benFields}
            close={closeModal}
            setSendType={setSendType}
            sendType={sendType}
            formik={formik}
          />
        );
      case "bank":
        return (
          <BankSelectModal
            data={banks || []}
            close={closeModal}
            setSelectedBank={setSelectedBank}
            selectedBank={selectedBank}
            formik={formik}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <form className="flex flex-col pb-7 mt-5" onSubmit={formik.handleSubmit}>
        {fields?.map((field, index) => {
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
                  remittancePurpose,
                  benType,
                  sendType,
                  countryName,
                  selectedBank,
                  bankDetailsFieldNames,
                  handleOpenModal,
                  field?.fields,
                  bankDetailsFields,
                )}
                {/* <p className="text-raiz-gray-950 text-sm font-medium mt-3 -mb-3">
                  Bank Details
                </p> */}
                {bankDetailsFields.map((bankField) =>
                  bankField.name === "bank_code" ? (
                    <div className="mt-[15px]" key={bankField.name}>
                      <p className="text-raiz-gray-950 text-sm font-medium font-brSonoma leading-normal mb-3">
                        {bankField.label}
                      </p>
                      <ModalTrigger
                        onClick={() => {
                          handleOpenModal(banks, "bank_code");
                        }}
                        placeholder={`Choose ${bankField.label.toLowerCase()}`}
                        value={selectedBank.name}
                      />
                      {formik.touched.bank_code && formik.errors.bank_code && (
                        <p className="text-red-500 text-sm mt-1">
                          {formik.errors.bank_code as string}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-[15px]" key={bankField.name}>
                      <InputField
                        label={bankField.label}
                        name={bankField.name}
                        placeholder={`Enter ${bankField.label}`}
                        value={formik.values[bankField.name] ?? ""}
                        onChange={formik.handleChange(bankField.name)}
                        onBlur={formik.handleBlur}
                        errorMessage={
                          formik.touched[bankField.name] &&
                          formik.errors[bankField.name]
                            ? (formik.errors[bankField.name] as string)
                            : undefined
                        }
                        status={
                          formik.touched[bankField.name] &&
                          formik.errors[bankField.name]
                            ? "error"
                            : null
                        }
                        pattern={bankField.pattern}
                      />
                    </div>
                  ),
                )}
              </div>
            );
          }
          if (
            field.name === "sender" &&
            field.type === "object" &&
            field.fields &&
            userCountryName &&
            userCountryCity &&
            userZipCode &&
            userState &&
            userName
          ) {
            const type = "sender";
            return (
              <div key={index}>
                <p className="text-raiz-gray-950 font-semibold my-3 border-b border-gray-500 py-0.5">
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
                  remittancePurpose,
                  benType,
                  sendType,
                  countryName,
                  selectedBank,
                  bankDetailsFieldNames,
                  handleOpenModal,
                  field.fields,
                  bankDetailsFields,
                )}
              </div>
            );
          }
          if (
            userCountryName &&
            userCountryCity &&
            userZipCode &&
            userName &&
            userState
          ) {
            return renderField(
              field,
              formik,
              userCountryName,
              userCountryCity,
              userZipCode,
              userState,
              userName,
              remittancePurpose,
              benType,
              sendType,
              countryName,
              selectedBank,
              bankDetailsFieldNames,
              handleOpenModal,
            );
          }
          return null;
        })}
        <Button
          type="submit"
          className="mt-8"
          loading={AddBeneficiaryMutation.isPending}
        >
          Submit
        </Button>
      </form>
      {displayModal()}
    </>
  );
};

export default BeneficiaryForm;
