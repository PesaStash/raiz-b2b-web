"use client";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
import Radio from "@/components/ui/Radio";
import {
  CreateUsBeneficiary,
  FetchThirdPartyUsdBeneficiariesApi,
  FetchUsBeneficiariesApi,
} from "@/services/transactions";
import {
  IThirdPartyUsdBeneficiary,
  IUsBeneficiariesParams,
  IUsBeneficiariesResponse,
  IUsBeneficiaryPayload,
  UsdBeneficiaryAccountType,
  UsdBeneficiaryPaymentRail,
} from "@/types/services";
import { convertField, truncateString } from "@/utils/helpers";
import {
  buildUsBankBeneficiaryPayload,
  formatPartnerBannerText,
  mapThirdPartyUsdBeneficiaryToPayload,
} from "@/utils/thirdPartyUsdBeneficiary";
import { mapUsdBeneficiaryError } from "@/utils/usdBeneficiaryErrors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  Formik,
  FormikHelpers,
  FormikProps,
  useFormikContext,
} from "formik";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useSendStore } from "@/store/Send";
import USBeneficiaryModal from "./USBeneficiaryModal";
import ThirdPartyPartnerModal from "./ThirdPartyPartnerModal";
import ThirdPartyPartnerReviewModal from "./ThirdPartyPartnerReviewModal";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import { GetUsdBankName } from "@/services/utils";
import SelectField from "@/components/ui/SelectField";
import { USAstateCodes } from "@/constants/misc";
import { useDebounce } from "@/lib/hooks/useDebounce";
import Image from "next/image";

interface FormValues {
  label: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: UsdBeneficiaryAccountType;
  account_owner_name: string;
  street_line_1: string;
  street_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  payment_rail: UsdBeneficiaryPaymentRail;
}

interface Props {
  close: () => void;
  goNext: () => void;
}

interface FormContentProps {
  submitRef: React.RefObject<HTMLButtonElement | null>;
  beneficiaries: IUsBeneficiariesResponse["beneficiaries"];
  setShowBeneficiary: (show: boolean) => void;
  setIsFormValid: (valid: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  routingRailHint?: string | null;
  onClearRoutingRailError?: () => void;
}

const PAYMENT_RAIL_OPTIONS: UsdBeneficiaryPaymentRail[] = [
  "ach_same_day",
  "ach",
  "wire",
];

const FormContent = ({
  submitRef,
  beneficiaries,
  setShowBeneficiary,
  setIsFormValid,
  setIsSubmitting,
  routingRailHint,
  onClearRoutingRailError,
}: FormContentProps) => {
  const {
    errors,
    touched,
    values,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    isValid,
    dirty,
    isSubmitting: formikSubmitting,
  } = useFormikContext<FormValues>();

  const clearRoutingRailMismatch = () => {
    if (errors.routing_number || errors.payment_rail || routingRailHint) {
      setFieldError("routing_number", undefined);
      setFieldError("payment_rail", undefined);
      onClearRoutingRailError?.();
    }
  };

  const debouncedRoutingNumber = useDebounce(values.routing_number, 500);

  const qcForm = useQueryClient();

  const {
    data: routingInfo,
    isFetching: routingFetching,
    error,
  } = useQuery({
    queryKey: ["usd-bank-routing-info", debouncedRoutingNumber],
    queryFn: () => GetUsdBankName({ rn: values.routing_number }),
    enabled: !!values.routing_number && values.routing_number.length === 9,
  });

  useEffect(() => {
    setIsFormValid(isValid && dirty);
    setIsSubmitting(formikSubmitting);
  }, [isValid, dirty, formikSubmitting]);

  // Clear bank_name and purge cached routing lookup when navigating away
  useEffect(() => {
    return () => {
      setFieldValue("bank_name", "");
      qcForm.removeQueries({ queryKey: ["usd-bank-routing-info"] });
    };
  }, []);

  useEffect(() => {
    if (error as any) {
      toast.error((error as any)?.data[0]?.data?.message);
      return;
    }
    if (routingInfo?.data?.name) {
      setFieldValue(
        "bank_name",
        routingInfo.data?.name || routingInfo.data?.telegraphicName || "",
      );
    }
  }, [routingInfo, error]);

  return (
    <Form
      className={`flex flex-col gap-[15px] justify-between ${
        beneficiaries?.length > 0 ? "min-h-[75vh]" : "min-h-[80vh]"
      }  pb-7`}
    >
      <div className="flex flex-col gap-[15px]">
        <div className="flex justify-between w-full">
          <h4 className="text-zinc-900 md:text-sm text-xs font-bold leading-none">
            Add Beneficiary
          </h4>
          {beneficiaries?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBeneficiary(true)}
              className=" text-indigo-900 md:text-xs text-xs font-bold leading-tight"
            >
              Choose Beneficiary
            </button>
          )}
        </div>
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
        <InputField
          label="Account Owner Name"
          name="account_owner_name"
          type="text"
          value={values.account_owner_name}
          onChange={handleChange}
          onBlur={handleBlur}
          errorMessage={
            touched.account_owner_name && errors.account_owner_name
              ? errors.account_owner_name
              : undefined
          }
          status={
            touched.account_owner_name && errors.account_owner_name
              ? "error"
              : null
          }
        />
        <InputField
          label="Account Number"
          name="account_number"
          type="text"
          value={values.account_number}
          onChange={handleChange}
          onBlur={handleBlur}
          errorMessage={
            touched.account_number && errors.account_number
              ? errors.account_number
              : undefined
          }
          status={
            touched.account_number && errors.account_number ? "error" : null
          }
        />
        <InputField
          label="Routing Number"
          name="routing_number"
          type="text"
          value={values.routing_number}
          onChange={(e) => {
            clearRoutingRailMismatch();
            handleChange(e);
          }}
          onBlur={handleBlur}
          errorMessage={
            touched.routing_number && errors.routing_number
              ? errors.routing_number
              : undefined
          }
          status={
            touched.routing_number && errors.routing_number ? "error" : null
          }
        />
        <InputField
          label="Bank Name"
          name="bank_name"
          type="text"
          value={routingFetching ? "Looking up bank..." : values.bank_name}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={routingFetching}
          errorMessage={
            touched.bank_name && errors.bank_name ? errors.bank_name : undefined
          }
          status={touched.bank_name && errors.bank_name ? "error" : null}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Account Type
          </label>
          <div className="flex flex-col gap-3">
            {(["checking", "savings"] as UsdBeneficiaryAccountType[]).map(
              (option) => (
                <div
                  onClick={() => setFieldValue("account_type", option)}
                  role="button"
                  key={option}
                  className="flex items-center gap-2"
                >
                  <Radio
                    checked={values.account_type === option}
                    onChange={() => setFieldValue("account_type", option)}
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {option}
                  </span>
                </div>
              ),
            )}
          </div>
          {errors.account_type && touched.account_type && (
            <div className="text-red-500 text-sm mt-1">
              {errors.account_type}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Payment Rail
          </label>
          <div className="flex flex-col gap-3">
            {PAYMENT_RAIL_OPTIONS.map((option) => (
              <div
                onClick={() => {
                  clearRoutingRailMismatch();
                  setFieldValue("payment_rail", option);
                }}
                key={option}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Radio
                  checked={values.payment_rail === option}
                  onChange={() => {
                    clearRoutingRailMismatch();
                    setFieldValue("payment_rail", option);
                  }}
                />
                <span className="text-sm text-gray-700 capitalize">
                  {convertField(option).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          {errors.payment_rail && touched.payment_rail && (
            <div className="text-red-500 text-sm mt-1">
              {errors.payment_rail}
            </div>
          )}
          {routingRailHint ? (
            <div className="text-amber-700 text-xs mt-1">{routingRailHint}</div>
          ) : null}
        </div>
        <InputField
          label="Street Line 1"
          name="street_line_1"
          type="text"
          value={values.street_line_1}
          onChange={handleChange}
          onBlur={handleBlur}
          errorMessage={
            touched.street_line_1 && errors.street_line_1
              ? errors.street_line_1
              : undefined
          }
          status={
            touched.street_line_1 && errors.street_line_1 ? "error" : null
          }
        />
        <InputField
          label="Street Line 2 (Optional)"
          name="street_line_2"
          type="text"
          value={values.street_line_2}
          onChange={handleChange}
          onBlur={handleBlur}
          errorMessage={
            touched.street_line_2 && errors.street_line_2
              ? errors.street_line_2
              : undefined
          }
          status={
            touched.street_line_2 && errors.street_line_2 ? "error" : null
          }
        />
        <SelectField
          label="State"
          name="state"
          placeholder="Select a state"
          options={USAstateCodes.map((s) => ({
            value: s.abbreviation,
            label: `${s.name} (${s.abbreviation})`,
          }))}
          value={
            values.state
              ? {
                  value: values.state,
                  label:
                    USAstateCodes.find((s) => s.abbreviation === values.state)
                      ?.name + ` (${values.state})`,
                }
              : null
          }
          onChange={(opt) => setFieldValue("state", opt?.value ?? "")}
          status={touched.state && errors.state ? "error" : null}
          helper={touched.state && errors.state ? errors.state : null}
        />
        <InputField
          label="City"
          name="city"
          type="text"
          value={values.city}
          onChange={handleChange}
          onBlur={handleBlur}
          errorMessage={touched.city && errors.city ? errors.city : undefined}
          status={touched.city && errors.city ? "error" : null}
        />
        <InputField
          label="Postal Code"
          name="postal_code"
          type="text"
          value={values.postal_code}
          onChange={handleChange}
          onBlur={handleBlur}
          errorMessage={
            touched.postal_code && errors.postal_code
              ? errors.postal_code
              : undefined
          }
          status={touched.postal_code && errors.postal_code ? "error" : null}
        />
      </div>
      <button ref={submitRef} type="submit" className="hidden" />
    </Form>
  );
};

const USBankBeneficiary = ({ close, goNext }: Props) => {
  // const [labelFilter, setLabelFilter] = useState("");
  const { actions } = useSendStore();
  const [showBeneficiary, setShowBeneficiary] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPartner, setSelectedPartner] =
    useState<IThirdPartyUsdBeneficiary | null>(null);
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [routingRailHint, setRoutingRailHint] = useState<string | null>(null);
  // const { data: fieldsData, isLoading: fieldLoading } = useQuery({
  //   queryKey: ["us-bank-benefiary-fields"],
  //   queryFn: GetUSBeneficiaryFormFields,
  // });
  const submitRef = useRef<HTMLButtonElement>(null);
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [
      "us-bank-beneficiaries",
      {
        option_type: "bank",
        // label: labelFilter,
        page: 1,
        limit: 50,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IUsBeneficiariesParams];
      return FetchUsBeneficiariesApi(params);
    },
  });

  const { data: thirdPartyData } = useQuery({
    queryKey: ["third-party-usd-beneficiaries"],
    queryFn: FetchThirdPartyUsdBeneficiariesApi,
  });

  const beneficiaries = data?.beneficiaries || [];
  const thirdPartyPartners = thirdPartyData?.data || [];
  const hasThirdPartyPartners = thirdPartyPartners.length > 0;
  const partnerBannerText = formatPartnerBannerText(thirdPartyPartners);

  const stringField = (label: string, max = 40) =>
    z
      .string()
      .min(1, `${label} is required`)
      .max(max, `${label} must be at most ${max} characters`);

  const validationSchema = z.object({
    label: stringField("Label", 100),
    bank_name: stringField("Bank name"),
    account_number: stringField("Account number"),
    routing_number: stringField("Routing number"),
    account_type: z.enum(["checking", "savings"], {
      required_error: "Account type is required",
    }),
    account_owner_name: stringField("Account owner name"),
    street_line_1: stringField("Street line 1"),
    street_line_2: z.string().max(40).optional(),
    city: stringField("City"),
    state: stringField("State"),
    postal_code: stringField("Postal code"),
    payment_rail: z.enum(["ach", "wire", "ach_same_day"], {
      required_error: "Payment rail is required",
    }),
  });

  const applyFieldErrors = (fieldErrors: Record<string, string>) => {
    const formik = formikRef.current;
    if (!formik) return;
    Object.entries(fieldErrors).forEach(([field, message]) => {
      formik.setFieldError(field, message);
      formik.setFieldTouched(field, true, false);
    });
  };

  const handleCreateError = (
    error: unknown,
    options?: { partner?: boolean },
  ) => {
    const mapped = mapUsdBeneficiaryError(error);

    if (mapped.kind === "routing_rail_mismatch") {
      if (mapped.fieldErrors) {
        applyFieldErrors(mapped.fieldErrors);
      }
      setRoutingRailHint(mapped.hint ?? null);
      if (options?.partner) {
        toast.error(mapped.message);
      }
      return;
    }

    setRoutingRailHint(null);

    if (
      mapped.kind === "validation" &&
      mapped.fieldErrors &&
      Object.keys(mapped.fieldErrors).length > 0
    ) {
      applyFieldErrors(mapped.fieldErrors);
      return;
    }

    toast.error(mapped.message);
  };

  const qc = useQueryClient();
  const AddBeneficiaryMutation = useMutation({
    mutationFn: (data: IUsBeneficiaryPayload) => CreateUsBeneficiary(data),
    retry: false,
    onSuccess: async () => {
      toast.success("Beneficiary added!");
      setRoutingRailHint(null);

      const queryParams = {
        option_type: "bank",
        page: 1,
        limit: 50,
      };

      try {
        // Bypass QueryClient cache entirely to ensure we get the fresh DB list
        const updatedData = await FetchUsBeneficiariesApi(queryParams as any);

        const oldIds = new Set(beneficiaries.map((b) => b.usd_beneficiary_id));
        const newBen = updatedData?.beneficiaries?.find(
          (b) => !oldIds.has(b.usd_beneficiary_id),
        );

        if (newBen) {
          actions.selectUsdBeneficiary(newBen);
          goNext();
        }
      } catch (err) {
        console.log("Failed to fetch latest beneficiaries", err);
      }

      qc.invalidateQueries({ queryKey: ["us-bank-beneficiaries"] });
    },
  });

  const handlePartnerSelect = (partner: IThirdPartyUsdBeneficiary) => {
    setSelectedPartner(partner);
    setShowPartnerModal(false);
    setShowReviewModal(true);
  };

  const handlePartnerReviewConfirm = async () => {
    if (!selectedPartner || isAddingPartner) return;

    try {
      setIsAddingPartner(true);
      const payload = mapThirdPartyUsdBeneficiaryToPayload(selectedPartner);
      await AddBeneficiaryMutation.mutateAsync(payload);
      setShowReviewModal(false);
      setSelectedPartner(null);
    } catch (error) {
      handleCreateError(error, { partner: true });
    } finally {
      setIsAddingPartner(false);
    }
  };

  const handlePartnerReviewClose = () => {
    if (isAddingPartner) return;
    setShowReviewModal(false);
    setSelectedPartner(null);
  };

  const initialValues: FormValues = {
    label: "",
    bank_name: "",
    account_number: "",
    routing_number: "",
    account_type: "checking",
    account_owner_name: "",
    street_line_1: "",
    street_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    payment_rail: "ach",
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm, setSubmitting }: FormikHelpers<FormValues>,
  ) => {
    try {
      setRoutingRailHint(null);
      const payload = buildUsBankBeneficiaryPayload(values);
      await AddBeneficiaryMutation.mutateAsync(payload);
      resetForm();
    } catch (error) {
      handleCreateError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <CenterModalHeader close={close} />
      <h2 className="md:text-xl text-lg font-semibold md:font-bold text-raiz-gray-950 md:mb-10 mb-4">
        US Bank
      </h2>
      <div className="flex-1  flex flex-col justify-between gap-4 h-[65vh] xl:h-[70vh]">
        <div className="bg-raiz-gray-50 md:p-6 p-3 overflow-y-auto rounded-[20px]">
          <div className="md:mb-11 mb-7">
            <h5 className="text-raiz-gray-950 md:text-sm text-xs font-bold  leading-[16.80px] mb-[15px]">
              Beneficiary
            </h5>
            {isLoading ? (
              <div>Loading beneficiaries...</div>
            ) : beneficiaries?.length > 0 || hasThirdPartyPartners ? (
              <div className="flex gap-2 overflow-x-scroll no-scrollbar">
                {hasThirdPartyPartners && (
                  <button
                    type="button"
                    className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
                    onClick={() => setShowPartnerModal(true)}
                  >
                    <div className="size-12 rounded-full border-2 border-dashed border-raiz-gray-200 flex items-center justify-center bg-white">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="text-indigo-900"
                        aria-hidden
                      >
                        <path
                          d="M10 4v12M4 10h12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <p className="text-center text-indigo-900 md:text-[13px] text-xs font-semibold leading-none">
                      Quick Partner
                    </p>
                  </button>
                )}
                {beneficiaries?.map((user) => (
                  <button
                    key={user?.usd_beneficiary_id}
                    className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
                    onClick={() => actions.selectUsdBeneficiary(user)}
                  >
                    <Avatar
                      src={""}
                      name={user?.usd_beneficiary?.account_name}
                    />
                    <p className="text-center text-raiz-gray-950 md:text-[13px] text-xs font-semibold leading-none">
                      {user?.label}
                    </p>
                    <p className="text-center text-raiz-gray-700 md:text-xs text-xs leading-[18px]">
                      {" "}
                      {truncateString(
                        user?.usd_beneficiary?.account_name || "",
                        20,
                      )}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyList text={"No beneficiary yet"} />
            )}
          </div>
          {hasThirdPartyPartners && (
            <button
              type="button"
              onClick={() => setShowPartnerModal(true)}
              className="w-full mb-7 px-4 py-3 rounded-2xl bg-[#e5ebff]/60 hover:bg-[#e5ebff]/80 transition-colors flex items-center justify-between gap-3 text-left"
            >
              <span className="text-indigo-900 md:text-sm text-xs font-semibold leading-snug">
                {partnerBannerText}
              </span>
              <Image
                src="/icons/arrow-right.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden
              />
            </button>
          )}
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(validationSchema)}
            onSubmit={handleSubmit}
          >
            <FormContent
              submitRef={submitRef}
              beneficiaries={beneficiaries}
              setShowBeneficiary={setShowBeneficiary}
              setIsFormValid={setIsFormValid}
              setIsSubmitting={setIsSubmitting}
              routingRailHint={routingRailHint}
              onClearRoutingRailError={() => setRoutingRailHint(null)}
            />
          </Formik>
        </div>
        <Button
          disabled={!isFormValid || isSubmitting}
          loading={isSubmitting}
          onClick={() => submitRef.current?.click()}
        >
          Add Beneficiary
        </Button>
      </div>
      {showBeneficiary ? (
        <USBeneficiaryModal
          close={() => setShowBeneficiary(false)}
          users={beneficiaries}
        />
      ) : null}
      {showPartnerModal ? (
        <ThirdPartyPartnerModal
          close={() => setShowPartnerModal(false)}
          partners={thirdPartyPartners}
          onSelect={handlePartnerSelect}
        />
      ) : null}
      {showReviewModal && selectedPartner ? (
        <ThirdPartyPartnerReviewModal
          close={handlePartnerReviewClose}
          partner={selectedPartner}
          onConfirm={handlePartnerReviewConfirm}
          loading={isAddingPartner}
        />
      ) : null}
    </div>
  );
};

export default USBankBeneficiary;
