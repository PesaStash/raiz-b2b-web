"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
import Radio from "@/components/ui/Radio";
import Spinner from "@/components/ui/Spinner";
import {
  // CreateUsBeneficiary,
  FetchUsBeneficiariesApi,
  GetUSBeneficiaryFormFields,
} from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import {
  FormField,
  IUsBeneficiariesParams,
  // IUsBeneficiaryPayload,
} from "@/types/services";
import { convertField, truncateString } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import { Form, Formik, FormikProps } from "formik";
import React, { useRef, useState } from "react";
// import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import USBeneficiaryModal from "../toBanks/USBeneficiaryModal";
import ModalTrigger from "@/components/ui/ModalTrigger";
import { ICountry } from "@/types/misc";
import InputLabel from "@/components/ui/InputLabel";
import ChooseCountryModal from "../toGlobal/ChooseCountryModal";

interface FormValues {
  label: string;
  [key: string]: string;
}

interface Props {
  close: () => void;
}
const InternationalBeneficiary = ({ close }: Props) => {
  const { actions } = useSendStore();
  const [showBeneficiary, setShowBeneficiary] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const { data: fieldsData, isLoading: fieldLoading } = useQuery({
    queryKey: ["us-bank-benefiary-fields"],
    queryFn: GetUSBeneficiaryFormFields,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "us-bank-beneficiaries",
      {
        option_type: "international_bank",
        page: 1,
        limit: 50,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IUsBeneficiariesParams];
      return FetchUsBeneficiariesApi(params);
    },
  });

  const formikRef = useRef<FormikProps<FormValues>>(null);

  const fields: FormField[] = fieldsData?.international_bank || [];
  const beneficiaries = data?.beneficiaries || [];
  const createValidationSchema = () => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      label: z.string().min(1, "Label is required"),
    };

    fields.forEach((field) => {
      let fieldSchema = z.string();

      if (field.required) {
        fieldSchema = fieldSchema.min(1, `${field.name} is required`);
      }
      let finalSchema: z.ZodType<string> = fieldSchema;
      if (field.enum) {
        finalSchema = fieldSchema.refine((val) => field.enum!.includes(val), {
          message: `Must be one of: ${field.enum!.join(", ")}`,
        });
      }

      schemaShape[field.name] = finalSchema;
    });

    return z.object(schemaShape);
  };

  const handleCountrySelect = (country: ICountry) => {
    setSelectedCountry(country);
    setShowCountry(false);
    formikRef?.current?.setFieldValue("country", country.country_name);
  };

  // const qc = useQueryClient();
  // const AddBeneficiaryMutation = useMutation({
  //   mutationFn: (data: IUsBeneficiaryPayload) => CreateUsBeneficiary(data),
  //   onSuccess: () => {
  //     toast.success("Beneficiary added!");
  //     qc.invalidateQueries({ queryKey: ["us-bank-beneficiaries"] });
  //   },
  // });
  const initialValues: FormValues = {
    label: "",
    ...fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {}),
  };

  const handleSubmit = async (
    values: FormValues,
    {
      resetForm,
      setSubmitting,
    }: { resetForm: () => void; setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      const { label, ...restValues } = values;
      const payload = {
        data: {
          ...restValues,
        },
        label,
        optionType: "international_bank",
      };
      // await AddBeneficiaryMutation.mutateAsync(payload);
      console.log(payload);
      resetForm();
    } catch (error) {
      console.log("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (fieldLoading) {
    return (
      <div className="flex flex-col gap-5 mt-10 justify-center items-center">
        <Spinner />
        <p> Loading form fields...</p>
      </div>
    );
  }
  return (
    <div>
      <SideWrapperHeader
        title="International Bank"
        close={close}
        titleColor="text-zincc-900"
      />
      <div className="mb-11">
        <h5 className="text-raiz-gray-950 text-sm font-bold  leading-[16.80px] mb-[15px]">
          Beneficiary
        </h5>
        {isLoading ? (
          <div>Loading beneficiaries...</div>
        ) : beneficiaries?.length > 0 ? (
          <div className="flex gap-2 overflow-x-scroll no-scrollbar">
            {beneficiaries?.map((user) => (
              <button
                key={user?.usd_beneficiary_id}
                className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
                onClick={() => actions.selectUsdBeneficiary(user)}
              >
                <Avatar src={""} name={user?.usd_beneficiary?.account_name} />
                <p className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none">
                  {user?.usd_beneficiary?.label}
                </p>
                <p className="text-center text-raiz-gray-700 text-xs leading-[18px]">
                  {" "}
                  {truncateString(
                    user?.usd_beneficiary?.account_name || "",
                    20
                  )}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyList text={"No beneficiary yet"} />
        )}
      </div>
      {fields.length > 0 && (
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(createValidationSchema())}
          onSubmit={handleSubmit}
        >
          {({
            errors,
            touched,
            values,
            handleChange,
            handleBlur,
            setFieldValue,
            isValid,
            dirty,
            isSubmitting,
          }) => (
            <Form
              className={`flex flex-col gap-[15px] justify-between ${
                beneficiaries?.length > 0 ? "min-h-[75vh]" : "min-h-[80vh]"
              }  pb-7`}
            >
              <div className="flex flex-col gap-[15px]">
                <div className="flex justify-between w-full">
                  <h4 className="text-zinc-900 text-sm font-bold leading-none">
                    Add Beneficiary
                  </h4>
                  {beneficiaries?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBeneficiary(true)}
                      className=" text-indigo-900 text-xs font-bold leading-tight"
                    >
                      Choose Beneficiary
                    </button>
                  )}
                </div>
                {fields.map((field) => (
                  <div key={field.name} className="flex flex-col">
                    {field.enum ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {field.name}{" "}
                          {/* {field.required && (
                            <span className="text-red-500">*</span>
                          )} */}
                        </label>
                        <div className="flex flex-col gap-3">
                          {field.enum.map((option) => (
                            <div
                              key={option}
                              className="flex items-center gap-2"
                            >
                              <Radio
                                checked={values[field.name] === option}
                                onChange={() =>
                                  setFieldValue(field.name, option)
                                }
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {option.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                        {errors[field.name] && touched[field.name] && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors[field.name] as string}
                          </div>
                        )}
                      </div>
                    ) : field.name !== "country" ? (
                      <InputField
                        label={convertField(field.name)}
                        name={field.name}
                        type="text"
                        value={values[field.name] || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={
                          touched[field.name] && errors[field.name]
                            ? (errors[field.name] as string)
                            : undefined
                        }
                        status={
                          touched[field.name] && errors[field.name]
                            ? "error"
                            : null
                        }
                      />
                    ) : (
                      <>
                        <InputLabel content="Country" />
                        <ModalTrigger
                          placeholder="Select country"
                          value={selectedCountry?.country_name || ""}
                          onClick={() => setShowCountry(true)}
                        />
                      </>
                    )}
                  </div>
                ))}
                <InputField
                  label="Label/Nickname"
                  placeholder="E.g  mikey"
                  name="label"
                  type="text"
                  value={values.label}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={
                    touched.label && errors.label ? errors.label : undefined
                  }
                  status={touched.label && errors.label ? "error" : null}
                />
              </div>
              <Button
                disabled={!isValid || !dirty || isSubmitting}
                type="submit"
                loading={isSubmitting}
              >
                Add Beneficiary
              </Button>
            </Form>
          )}
        </Formik>
      )}
      {showBeneficiary ? (
        <USBeneficiaryModal
          close={() => setShowBeneficiary(false)}
          users={beneficiaries}
        />
      ) : null}
      {showCountry ? (
        <ChooseCountryModal
          close={() => setShowCountry(false)}
          onChange={handleCountrySelect}
        />
      ) : null}
    </div>
  );
};

export default InternationalBeneficiary;
