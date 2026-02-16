/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import ModalTrigger from "@/components/ui/ModalTrigger";
import { useUser } from "@/lib/hooks/useUser";
import { CreateIntBeneficiary } from "@/services/transactions";
import {
  FormField,
  IIntBeneficiaryPayload,
  IntCountryType,
} from "@/types/services";
import { convertField } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormikProps, useFormik } from "formik";
import React, { useState } from "react";
import { toast } from "sonner";
import BeneficiaryTypeModal from "../toInternational/BeneficiaryTypeModal";
import AuPurposeModal from "./AuPurposeModal";
import AuSendTypeModal from "./AuSendTypeModal";

interface Props {
  fields: FormField[];
  countryCode: string;
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
  handleOpenModal: (value: string[] | undefined, name: string) => void
) => {
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
          value={formikProps.values[field.name]}
          onChange={(e) => {
            formikProps.setFieldValue(field.name, e.target.value);
            formikProps.setFieldValue(
              "beneficiary_account_name",
              e.target.value
            );
          }}
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
          value={formikProps.values[field.name]}
          disabled // Make it non-editable
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
          // disabled
          placeholder="Enter DOB (YYYY-MM-DD)"
          value={formikProps.values[field.name]}
          onChange={formikProps.handleChange(field.name)}
        />
      </div>
    );
  }
  if (field.name === "sender_account_name") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter account name"
          value={userName}
          onChange={formikProps.handleChange(field.name)}
        />
      </div>
    );
  }

  if (field.name === "beneficiary_country") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter Account Country Name"
          value={"France"}
          onChange={formikProps.handleChange(field.name)}
        />
      </div>
    );
  }
  if (field.name === "country" || field.name === "sender_country") {
    return (
      <div className="mt-[15px]">
        <InputField
          key={field.name}
          label={convertField(field.name)}
          name={field.name}
          disabled
          placeholder="Enter Account Country Name"
          value={userCountryName}
          onChange={formikProps.handleChange(field.name)}
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
        value={formikProps.values[field.name]}
        onChange={formikProps.handleChange(field.name)}
      />
    </div>
  );
};

const renderNestedFields = (
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
  handleOpenModal: (value: string[] | undefined, name: string) => void,
  fields?: FormField[]
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
            handleOpenModal,
            field.fields
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
      handleOpenModal
    );
  });

const FrBeneficiaryForm = ({ fields, countryCode, reset }: Props) => {
  const [openModal, setOpenModal] = useState<"ben" | "send" | "purpose" | null>(
    null
  );
  const [remittancePurpose, setRemittancePurpose] = useState<string>("");
  const [benType, setbenType] = useState<string>("");
  const [sendType, setSendType] = useState<string>("");
  const { user } = useUser();
  const initialValues = fields.reduce<Record<string, any>>((acc, field) => {
    if (field.type === "object" && field.fields) {
      acc[field.name] = field.fields.reduce<Record<string, any>>(
        (nestedAcc, nestedField) => {
          nestedAcc[nestedField.name] = "";
          return nestedAcc;
        },
        {}
      );
    } else if (field.const) {
      acc[field.name] = field.const;
    } else {
      acc[field.name] = "";
    }
    return acc;
  }, {});

  const entity = user?.business_account?.entity;
  const userName = `${user?.first_name} ${user?.last_name}`;
  const userCountryName =
    (entity &&
      entity.entity_address &&
      entity.entity_address[0].country.country_name) ||
    "";
  const userCountryCity =
    (entity && entity.entity_address && entity.entity_address[0].city) || "";
  const userZipCode =
    (entity && entity.entity_address && entity.entity_address[0].zip_code) ||
    "";

  const userState =
    (entity && entity.entity_address && entity.entity_address[0].state) || "";
  const remitanceFields = fields.find(
    (item) => item.name === "remittance_purpose"
  );
  const benFields = ["BUSINESS", "INDIVIDUAL"];
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
  const formik = useFormik({
    initialValues,
    onSubmit: (values) => {
      if (
        entity &&
        entity.entity_address &&
        entity.entity_address[0].country.country_name
      ) {
      }
      console.log(JSON.stringify(values, null, 2));
      let sendObject = {};
      if (sendType === "INDIVIDUAL") {
        sendObject = {
          type: "INDIVIDUAL",
          account_name: userName,
          country: userCountryName,
          city: userCountryCity,
          post_code: userZipCode,
          state: userState,
          address: values.sender_address,
          date_of_birth: values.sender_date_of_birth,
        };
      } else {
        sendObject = {
          type: "BUSINESS",
          account_name: userName,
          country: userCountryName,
          city: userCountryCity,
          post_code: userZipCode,
          state: userState,
          address: values.sender_address,
          business_registration_number:
            values.sender_business_registration_number,
        };
      }
      const data = {
        data: {
          beneficiary: {
            type: benType,
            account_name: values.account_name,
            country: "France",
            state: values.beneficiary_state,
            post_code: values.beneficiary_post_code,
            address: values.beneficiary_address,
            city: values.beneficiary_city,
          },
          sender: sendObject,
          type: "BANK",
          account_number: values.account_number,
          account_name: values.account_name,
          remittance_purpose: remittancePurpose,
        },
        customer_email: user?.business_account?.business_email || null,
        country: countryCode as IntCountryType,
      };
      console.log(JSON.stringify(data, null, 2));
      AddBeneficiaryMutation.mutate(data);
    },
  });
  const handleOpenModal = (value: string[] | undefined, name: string) => {
    if (name === "remittance_purpose") setOpenModal("purpose");
    if (name === "beneficiary_type") setOpenModal("ben");
    if (name === "sender_type") setOpenModal("send");
  };
  const closeModal = () => setOpenModal(null);
  const displayModal = () => {
    switch (openModal) {
      case "ben":
        return (
          <BeneficiaryTypeModal
            data={benFields}
            close={closeModal}
            setBenType={setbenType}
            benType={benType}
          />
        );
      case "purpose":
        return (
          <AuPurposeModal
            data={remitanceFields?.enum || []}
            close={closeModal}
            setRemittancePurpose={setRemittancePurpose}
            remittancePurpose={remittancePurpose}
          />
        );
      case "send":
        return (
          <AuSendTypeModal
            data={benFields}
            close={closeModal}
            setSendType={setSendType}
            sendType={sendType}
          />
        );
      default:
        break;
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
                  {convertField(field.name)}
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
                  handleOpenModal,
                  field?.fields
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
                <p className="text-raiz-gray-950 font-semibold my-3  border-b border-gray-500 py-0.5">
                  {convertField(field.name)}
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
                  handleOpenModal,
                  field.fields
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
              handleOpenModal
            );
          }
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

export default FrBeneficiaryForm;
