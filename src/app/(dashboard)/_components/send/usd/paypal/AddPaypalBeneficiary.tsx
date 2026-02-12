import SideWrapperHeader from "@/components/SideWrapperHeader";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
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
import { truncateString } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import React from "react";
// import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

interface Props {
  close: () => void;
}

const AddPaypalBeneficiary = ({ close }: Props) => {
  const { actions } = useSendStore();
  const { data, isLoading } = useQuery({
    queryKey: [
      "us-paypal-beneficiaries",
      {
        option_type: "paypal",
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
  const { data: fieldsData } = useQuery({
    queryKey: ["us-bank-benefiary-fields"],
    queryFn: GetUSBeneficiaryFormFields,
  });
  const beneficiaries = data?.beneficiaries || [];
  const fields: FormField[] = fieldsData?.paypal || [];

  // const qc = useQueryClient();
  // const AddBeneficiaryMutation = useMutation({
  //   mutationFn: (data: IUsBeneficiaryPayload) => CreateUsBeneficiary(data),
  //   onSuccess: () => {
  //     toast.success("Beneficiary added!");
  //     qc.invalidateQueries({ queryKey: ["us-paypal-beneficiaries"] });
  //   },
  // });
  const validationSchema = z.object({
    label: z
      .string()
      .min(2, "Label must be at least 2 characters")
      .max(50, "Label must not exceed 50 characters"),
    email: z.string().email("Invalid email address"),
  });
  const formik = useFormik({
    initialValues: {
      label: "",
      email: "",
    },
    validationSchema: toFormikValidationSchema(validationSchema),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = {
          data: {
            // email: values.email,
            username: values.email,
          },
          label: values.label,
          optionType: "paypal",
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
        title="Send to Paypal"
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
      {fields.length > 0 && (
        <form
          onSubmit={formik.handleSubmit}
          className={`flex flex-col gap-[15px] justify-between h-full pb-4`}
        >
          <div className="flex flex-col gap-[15px] h-full">
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
            <InputField
              label="Email"
              placeholder="Enter email address"
              {...formik.getFieldProps("email")}
              type="email"
              errorMessage={formik.touched.email && formik.errors.email}
              status={
                formik.touched.email && formik.errors.email ? "error" : null
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
      )}
    </div>
  );
};

export default AddPaypalBeneficiary;
