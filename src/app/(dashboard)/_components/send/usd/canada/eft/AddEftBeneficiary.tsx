import SideWrapperHeader from "@/components/SideWrapperHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import ModalTrigger from "@/components/ui/ModalTrigger";
import {
  // CreateUsBeneficiary,
  FetchUsBeneficiariesApi,
  GetCanadianBanks,
  //   GetUSBeneficiaryFormFields,
} from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import {
  //   FormField,
  IUsBeneficiariesParams,
  // IUsBeneficiaryPayload,
} from "@/types/services";
import { truncateString } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import React, { useState } from "react";
// import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import CanadianBanksModal, { ICanadianBank } from "./CanadianBanksModal";

interface Props {
  close: () => void;
}

const AddEftBeneficiary = ({ close }: Props) => {
  const [showModal, setShowModal] = useState<"type" | null>(null);
  const [selectedBank, setSelectedBank] = useState<ICanadianBank>({
    bank_name: "",
    institution_number: "",
  });
  const { actions } = useSendStore();
  const { data, isLoading } = useQuery({
    queryKey: [
      "eft-beneficiaries",
      {
        option_type: "eft",
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
  //   const { data: fieldsData } = useQuery({
  //     queryKey: ["us-bank-benefiary-fields"],
  //     queryFn: GetUSBeneficiaryFormFields,
  //   });
  const { data: banks } = useQuery({
    queryKey: ["canadian-banks"],
    queryFn: GetCanadianBanks,
  });
  const beneficiaries = data?.beneficiaries || [];
  //   const fields: FormField[] = fieldsData?.eft || [];
  // const qc = useQueryClient();
  // const AddBeneficiaryMutation = useMutation({
  //   mutationFn: (data: IUsBeneficiaryPayload) => CreateUsBeneficiary(data),
  //   onSuccess: () => {
  //     toast.success("Beneficiary added!");
  //     qc.invalidateQueries({ queryKey: ["eft-beneficiaries"] });
  //   },
  // });
  const validationSchema = z.object({
    bankName: z.string().nonempty("Bank name is required"),
    accountNumber: z
      .string()
      .nonempty("Account number is required")
      .regex(/^\d{8,17}$/, "Account number must be 8-17 digits"),
    transitCode: z
      .string()
      .nonempty("Transit code is required")
      .regex(/^\d{5}$/, "Transit code must be exactly 5 digits"),
    name: z
      .string()
      .nonempty("Beneficiary name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    label: z.string().nonempty("Label is required"),
  });
  const formik = useFormik({
    initialValues: {
      bankName: "",
      accountNumber: "",
      transitCode: "",
      name: "",
      label: "",
    },
    validationSchema: toFormikValidationSchema(validationSchema),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = {
          data: {
            name: values.name,
            account: values.accountNumber,
            institution_code: selectedBank.institution_number,
            transit_code: values.transitCode,
          },
          label: values.label,
          optionType: "eft",
        };
        console.log(payload);

        // await AddBeneficiaryMutation.mutateAsync(payload);
        resetForm();
      } catch (error) {
        console.log("Submission error:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });
  return (
    <div className="flex flex-col h-full">
      <SideWrapperHeader
        title="Send to EFT"
        close={close}
        titleColor="text-zinc-900"
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
                  {user?.label}
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
      <form
        onSubmit={formik.handleSubmit}
        className={`flex flex-col gap-[15px] justify-between h-full pb-4`}
      >
        <div className="flex flex-col gap-[15px] h-full">
          <div className="">
            <InputLabel content="Bank Name" />
            <ModalTrigger
              onClick={() => setShowModal("type")}
              placeholder="Select bank"
              value={formik.values.bankName}
            />
          </div>
          <InputField
            label="Transit Code"
            placeholder="Enter transit code"
            {...formik.getFieldProps("transitCode")}
            type="text"
            errorMessage={
              formik.touched.transitCode && formik.errors.transitCode
            }
            status={
              formik.touched.transitCode && formik.errors.transitCode
                ? "error"
                : null
            }
          />
          <InputField
            label="Account Number"
            placeholder="Enter account number"
            {...formik.getFieldProps("accountNumber")}
            type="text"
            errorMessage={
              formik.touched.accountNumber && formik.errors.accountNumber
            }
            status={
              formik.touched.accountNumber && formik.errors.accountNumber
                ? "error"
                : null
            }
          />
          <InputField
            label="Beneficiary Name "
            placeholder=" Enter beneficiary name"
            {...formik.getFieldProps("name")}
            type="text"
            errorMessage={formik.touched.name && formik.errors.name}
            status={formik.touched.name && formik.errors.name ? "error" : null}
          />
          <InputField
            label="Label/Nickname"
            placeholder="E.g. mikey"
            {...formik.getFieldProps("label")}
            type="text"
            errorMessage={formik.touched.label && formik.errors.label}
            status={
              formik.touched.label && formik.errors.label ? "error" : null
            }
          />
        </div>
        <Button
          type="submit"
          disabled={formik.isSubmitting || !formik.isValid}
          loading={formik.isSubmitting}
        >
          Continue
        </Button>
      </form>
      {showModal === "type" && (
        <CanadianBanksModal
          data={banks || []}
          close={() => setShowModal(null)}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          formik={formik}
        />
      )}
    </div>
  );
};

export default AddEftBeneficiary;
