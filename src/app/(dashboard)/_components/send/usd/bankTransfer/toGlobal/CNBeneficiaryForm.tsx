"use client";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import ModalTrigger from "@/components/ui/ModalTrigger";
import Radio from "@/components/ui/Radio";
import { useUser } from "@/lib/hooks/useUser";
import { CreateIntBeneficiary } from "@/services/transactions";
import {
  FormField,
  IIntBeneficiaryPayload,
  IntCountryType,
} from "@/types/services";
import {
  convertField,
  // getReadablePatternMessage,
  // removeUndefinedValues,
} from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormikConfig, useFormik } from "formik";
import React, { useState } from "react";
import { toast } from "sonner";
// import { z } from "zod";
// import { toFormikValidationSchema } from "zod-formik-adapter";
import CnTypeModal from "./CnTypeModal";
import { Bank } from "./BeneficiaryForm";
import BankSelectModal, { IBeneficiaryBank } from "./BankSelectModal";
import ChinaCurrencyTypeModal from "./ChinaCurrencyTypeModal";
import IdSelectModal from "./IdSelectModal";

export type cnBenType = "BANK" | "ALIPAY" | "WECHATPAY" | null;

interface FieldEntry {
  [key: string]: FormField[];
}

interface FieldsMap {
  [key: string]: FormField[];
  BANK: FormField[];
  ALIPAY: FormField[];
  WECHATPAY: FormField[];
}

interface Props {
  fields: FieldEntry[];
  countryCode: IntCountryType;
  countryName: string;
  bankDetailsFields?: { name: string; label: string; pattern?: string }[];
}

interface FormValues {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const CNBeneficiaryForm = ({
  fields,
  countryCode,
  countryName,
  bankDetailsFields = [],
}: Props) => {
  const { user } = useUser();
  const [openModal, setOpenModal] = useState<
    | "type"
    | "ben"
    | "send"
    | "purpose"
    | "bank"
    | "bankCurrency"
    | "id_type"
    | null
  >(null);
  const [type, setType] = useState<cnBenType>(null);
  // const [benType, setBenType] = useState<string>("");
  // const [sendType, setSendType] = useState<string>("");
  // const [remittancePurpose, setRemittancePurpose] = useState<string>("");
  const [idType, setIdType] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<IBeneficiaryBank>({
    id: 0,
    code: "",
    name: "",
  });
  const [bankCurrency, setBankCurrency] = useState<"USD" | "CNY">("CNY");
  const typeFields = ["BANK", "ALIPAY", "WECHATPAY"] as cnBenType[];
  const fieldsMap: FieldsMap = fields.reduce<FieldsMap>(
    (acc, entry) => {
      const key = Object.keys(entry)[0] as "BANK" | "ALIPAY" | "WECHATPAY";
      acc[key] = entry[key];
      return acc;
    },
    { BANK: [], ALIPAY: [], WECHATPAY: [] }
  );
  const formDetail = type !== null ? fieldsMap[type] || [] : [];
  const bankDetailsFieldNames = bankDetailsFields.map((field) => field.name);
  // console.log("bbb", bankDetailsFieldNames);
  // const createValidationSchema = () => {
  //   const schemaShape: Record<string, z.ZodTypeAny> = {
  //     country: z.any().refine((val) => val !== "", "Country is required"),
  //   };

  //   formDetail.forEach((field) => {
  //     let fieldSchema = z.string();

  //     if (field.required) {
  //       fieldSchema = fieldSchema.min(1, `${field.name} is required`);
  //     }

  //     if (field.pattern) {
  //       try {
  //         const regex = new RegExp(field.pattern);
  //         const readableMessage = getReadablePatternMessage(
  //           field.pattern,
  //           field.name
  //         );
  //         fieldSchema = fieldSchema.regex(regex, readableMessage);
  //       } catch (error) {
  //         console.log(
  //           `Invalid regex pattern for ${field.name}: ${field.pattern}`,
  //           error
  //         );
  //       }
  //     }

  //     let finalSchema: z.ZodType<string> = fieldSchema;

  //     if (field.enum) {
  //       finalSchema = fieldSchema.refine((val) => field.enum!.includes(val), {
  //         message: `Must be one of: ${field.enum!.join(", ")}`,
  //       });
  //     }

  //     schemaShape[field.name] = finalSchema;

  //     // Handle nested fields
  //     if (
  //       field.fields &&
  //       (field.name === "sender" || field.name === "beneficiary")
  //     ) {
  //       field.fields.forEach((subField) => {
  //         let subFieldSchema = z.string();
  //         if (subField.required) {
  //           subFieldSchema = subFieldSchema.min(
  //             1,
  //             `${subField.name} is required`
  //           );
  //         }
  //         if (subField.pattern) {
  //           try {
  //             const regex = new RegExp(subField.pattern);
  //             const readableMessage = getReadablePatternMessage(
  //               subField.pattern,
  //               subField.name
  //             );
  //             subFieldSchema = subFieldSchema.regex(regex, readableMessage);
  //           } catch (error) {
  //             console.log(
  //               `Invalid regex pattern for ${subField.name}: ${subField.pattern}`,
  //               error
  //             );
  //           }
  //         }
  //         schemaShape[`${field.name}_${subField.name}`] = subFieldSchema;
  //       });
  //     }
  //   });

  //   return z.object(schemaShape);
  // };
  const qc = useQueryClient();
  const AddBeneficiaryMutation = useMutation({
    mutationFn: (data: IIntBeneficiaryPayload) => CreateIntBeneficiary(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["int-bank-beneficiaries"] });
      setType(null);
    },
  });

  const entity = user?.business_account?.entity;
  const userCountryName =
    (entity &&
      entity.entity_address &&
      entity.entity_address[0]?.country?.country_name) ||
    "";
  const userZipCode =
    (entity && entity.entity_address && entity.entity_address[0]?.zip_code) ||
    "";
  const userAddress =
    `${entity?.entity_address[0].street}, ${entity?.entity_address[0].city}, ${entity?.entity_address[0].state},  ${entity?.entity_address[0].country.country_name}` ||
    "";

  const formikConfig: FormikConfig<FormValues> = {
    initialValues: {
      // Initialize sender fields with user data
      sender_first_name: user?.first_name || "",
      sender_last_name: user?.last_name || "",
      sender_country: userCountryName || "",
      sender_post_code: userZipCode || "",
      sender_address: userAddress || "",
      // Add other sender fields if needed (e.g., for ALIPAY)
      sender_type: "",
      sender_country_of_birth: "",
      sender_date_of_birth: "",
      sender_nationality_country: "",
      sender_id_type: "",
      sender_id_number: "",
      // Initialize other fields based on formDetail
      type: "",
      account_number: "",
      account_name: "",
      remittance_purpose: "",
      bank_code: "",
      // Add beneficiary fields if applicable
      beneficiary_country: countryName || "",
    },
    // validationSchema: toFormikValidationSchema(createValidationSchema()),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      const result: {
        sender?: { [key: string]: string };
        beneficiary?: { [key: string]: string };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      } = {
        sender: {},
        beneficiary: {},
      };
      for (const [key, value] of Object.entries(values)) {
        if (key.startsWith("sender_")) {
          const newKey = key.replace("sender_", "");
          result.sender![newKey] = value;
        } else if (key.startsWith("beneficiary_")) {
          const newKey = key.replace("beneficiary_", "");
          result.beneficiary![newKey] = value;
        } else {
          result[key] = value;
        }
      }
      if (Object.keys(result.sender!).length === 0) {
        delete result.sender;
      }
      if (Object.keys(result.beneficiary!).length === 0) {
        delete result.beneficiary;
      }
      try {
        const bankPayload = {
          ...result,
          bank_code: Number(values.bank_code),
          // bank_currency: bankCurrency,
          ...(type === "BANK" ? { type: "BANK" } : {}),
          beneficiary: {
            ...result.beneficiary,
            ...(type === "BANK" ? { type: "BUSINESS" } : { type: "BANK" }),
            country: countryCode,
          },
          sender: {
            ...result.sender,
            ...(type === "BANK" ? { type: "BUSINESS" } : {}),
          },
        };
        const data = type === "BANK" ? bankPayload : result;
        const finalPayload = {
          data: { ...data, type },
          customer_email: user?.business_account?.business_email || null,
          country: countryCode as IntCountryType,
        };

        await AddBeneficiaryMutation.mutateAsync(finalPayload);
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
  // console.log("errr", formik.errors);
  // console.log("vals", formik.values);

  const idTypeFields =
    fieldsMap?.ALIPAY?.find((i) => i.name === "sender")?.fields?.find(
      (i) => i.name === "id_type"
    )?.enum || [];

  // const idTypesFields = fields.find(
  //   (item) => item
  // );

  const handleOpenModal = (
    value: string[] | Bank[] | undefined,
    name: string
  ) => {
    if (name === "remittance_purpose") setOpenModal("purpose");
    if (name === "beneficiary_type") setOpenModal("ben");
    if (name === "sender_type") setOpenModal("send");
    if (name === "bank_code") setOpenModal("bank");
    if (name === "bank_currency") setOpenModal("bankCurrency");
    if (name === "id_type") setOpenModal("id_type");
  };

  const closeModal = () => setOpenModal(null);

  const banks =
    fieldsMap.BANK.find((field) => field.name === "bank_code")?.banks || [];

  const filteredBanks = banks?.filter((j) => j.currency === bankCurrency);

  const displayModal = () => {
    switch (openModal) {
      case "type":
        return (
          <CnTypeModal
            data={typeFields}
            close={closeModal}
            setType={setType}
            type={type}
          />
        );
      case "bankCurrency":
        return (
          <ChinaCurrencyTypeModal
            bankCurrency={bankCurrency}
            setBankCurrency={setBankCurrency}
            close={closeModal}
          />
        );
      // case "purpose":
      //   return (
      //     <PurposeModal
      //       data={remittanceFields?.enum || []}
      //       close={closeModal}
      //       setRemittancePurpose={setRemittancePurpose}
      //       remittancePurpose={remittancePurpose}
      //       formik={formik}
      //     />
      //   );
      // case "send":
      //   return (
      //     <SendTypeModal
      //       data={benFields}
      //       close={closeModal}
      //       setSendType={setSendType}
      //       sendType={sendType}
      //       formik={formik}
      //     />
      //   );
      case "bank":
        return (
          <BankSelectModal
            data={filteredBanks || []}
            close={closeModal}
            setSelectedBank={setSelectedBank}
            selectedBank={selectedBank}
            formik={formik}
          />
        );
      case "id_type":
        return (
          <IdSelectModal
            data={idTypeFields}
            close={closeModal}
            setIdType={setIdType}
            idType={idType}
            formik={formik}
          />
        );
      default:
        return null;
    }
  };

  const renderNestedFieldsManually = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formik: any,
    parentField: FormField,
    type: "sender" | "beneficiary"
  ) => {
    if (!parentField.fields) return null;

    return parentField.fields.map((subField, subIndex) => {
      const fieldName = `${parentField.name}_${subField.name}`;
      // Handle const fields (disabled inputs)
      if (subField.const) {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              label={convertField(subField.name)}
              name={fieldName}
              type="text"
              disabled
              value={subField.const || ""}
            />
          </div>
        );
      }

      if (subField.name === "id_type") {
        return (
          <div className="mt-[15px]" key={fieldName}>
            <p className="text-raiz-gray-950 text-sm font-medium font-brSonoma leading-normal mb-3">
              ID Type
            </p>
            <ModalTrigger
              onClick={() => {
                handleOpenModal(subField.enum, "id_type");
              }}
              placeholder={"Choose id type"}
              value={convertField(idType)}
            />
          </div>
        );
      }

      // Handle enum fields (radio buttons)
      if (subField.enum) {
        return (
          <div key={subIndex} className="flex flex-col gap-2 mt-[15px]">
            <label className="text-sm font-medium text-gray-700 capitalize">
              {convertField(subField.name)}
            </label>
            <div className="flex flex-col gap-3">
              {subField.enum.map((option) => (
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
            {formik.errors[fieldName] && formik.touched[fieldName] && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors[fieldName] as string}
              </div>
            )}
          </div>
        );
      }

      // Handle fields that trigger modals (e.g., sender_type, beneficiary_type)
      if (subField.name === "type" && type === "sender") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <p className="text-raiz-gray-950 text-sm font-medium font-brSonoma leading-normal mb-3">
              {convertField(subField.name)}
            </p>
            <ModalTrigger
              onClick={() => handleOpenModal(subField.enum, "sender_type")}
              placeholder={`Choose ${convertField(
                subField.name
              ).toLowerCase()}`}
              value={""}
            />
            {formik.touched[fieldName] && formik.errors[fieldName] && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors[fieldName] as string}
              </p>
            )}
          </div>
        );
      }

      if (fieldName === "beneficiary_country") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              label={convertField(subField.name)}
              name={fieldName}
              type="text"
              placeholder={`Enter ${convertField(subField.name)}`}
              value={countryName}
              disabled
            />
          </div>
        );
      }
      if (fieldName === "sender_first_name") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              key={fieldName}
              label={"First Name"}
              name={fieldName}
              disabled
              placeholder="Enter first name"
              value={user?.first_name || ""}
              onChange={formik.handleChange(fieldName)}
              onBlur={formik.handleBlur}
              errorMessage={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? (formik.errors[fieldName] as string)
                  : undefined
              }
              status={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? "error"
                  : null
              }
            />
          </div>
        );
      }
      if (fieldName === "sender_last_name") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              key={fieldName}
              label={"Last Name"}
              name={fieldName}
              disabled
              placeholder="Enter last name"
              value={user?.last_name || ""}
              onChange={formik.handleChange(fieldName)}
              onBlur={formik.handleBlur}
              errorMessage={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? (formik.errors[fieldName] as string)
                  : undefined
              }
              status={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? "error"
                  : null
              }
            />
          </div>
        );
      }
      if (fieldName === "sender_country") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              key={fieldName}
              label={"Country"}
              name={fieldName}
              disabled
              placeholder="Enter country"
              value={userCountryName || ""}
              onChange={formik.handleChange(fieldName)}
              onBlur={formik.handleBlur}
              errorMessage={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? (formik.errors[fieldName] as string)
                  : undefined
              }
              status={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? "error"
                  : null
              }
            />
          </div>
        );
      }
      if (fieldName === "sender_post_code") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              key={fieldName}
              label={"Post code"}
              name={fieldName}
              disabled
              placeholder="Enter post code"
              value={userZipCode || ""}
              onChange={formik.handleChange(fieldName)}
              onBlur={formik.handleBlur}
              errorMessage={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? (formik.errors[fieldName] as string)
                  : undefined
              }
              status={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? "error"
                  : null
              }
            />
          </div>
        );
      }
      if (fieldName === "sender_address") {
        return (
          <div key={subIndex} className="mt-[15px]">
            <InputField
              key={fieldName}
              label={"Address"}
              name={fieldName}
              disabled
              placeholder="Enter address"
              value={userAddress || ""}
              onChange={formik.handleChange(fieldName)}
              onBlur={formik.handleBlur}
              errorMessage={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? (formik.errors[fieldName] as string)
                  : undefined
              }
              status={
                formik.touched[fieldName] && formik.errors[fieldName]
                  ? "error"
                  : null
              }
            />
          </div>
        );
      }

      // Handle regular input fields
      return (
        <div key={subIndex} className="mt-[15px]">
          <InputField
            label={convertField(subField.name)}
            name={fieldName}
            type="text"
            placeholder={`Enter ${convertField(subField.name)}`}
            value={formik.values[fieldName] || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            errorMessage={
              formik.touched[fieldName] && formik.errors[fieldName]
                ? (formik.errors[fieldName] as string)
                : undefined
            }
            status={
              formik.touched[fieldName] && formik.errors[fieldName]
                ? "error"
                : null
            }
            pattern={subField.pattern}
          />
        </div>
      );
    });
  };
  return (
    <div className="my-5">
      <InputLabel content="Send type" />
      <ModalTrigger
        onClick={() => setOpenModal("type")}
        placeholder="Select type "
        value={convertField(type || "")}
      />
      {type === "BANK" && (
        <div className="my-4">
          <InputLabel content="Choose prefered bank currency" />
          <ModalTrigger
            onClick={() => {
              handleOpenModal(banks, "bank_currency");
            }}
            placeholder={`Choose prefered bank currency`}
            value={bankCurrency}
          />
        </div>
      )}
      <form
        onSubmit={formik.handleSubmit}
        className={`flex flex-col gap-[15px] justify-between mt-4 min-h-[75vh]
         pb-7`}
      >
        <div className="flex flex-col gap-[15px]">
          {formDetail.map((field, index) => {
            if (type === "BANK" && bankDetailsFieldNames.includes(field.name)) {
              return null;
            }
            if (field.name === "beneficiary") {
              return (
                <div key={index}>
                  <p className="text-raiz-gray-950 font-semibold my-3">
                    {convertField(field.name)}
                  </p>
                  {renderNestedFieldsManually(formik, field, "beneficiary")}
                  <p className="text-raiz-gray-950 font-medium mt-3 mb-3">
                    Bank Details
                  </p>
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
                        {formik.touched.bank_code &&
                          formik.errors.bank_code && (
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
                          pattern={
                            type === "BANK" ? undefined : bankField.pattern
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              );
            }
            if (field.name === "sender" && field.type === "object") {
              return (
                <div key={index}>
                  <p className="text-raiz-gray-950 font-semibold my-3">
                    {convertField(field.name)}
                  </p>
                  {renderNestedFieldsManually(formik, field, "sender")}
                </div>
              );
            }
            return (
              <div key={field.name} className="flex flex-col">
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
                    type="text"
                    value={formik.values[field.name] || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
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
                    pattern={field.pattern}
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

export default CNBeneficiaryForm;
