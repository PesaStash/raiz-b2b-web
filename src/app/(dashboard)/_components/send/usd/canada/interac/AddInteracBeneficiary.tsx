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
import Image from "next/image";
import InputLabel from "@/components/ui/InputLabel";

interface Props {
  close: () => void;
}

const AddInteracBeneficiary = ({ close }: Props) => {
  const { actions } = useSendStore();
  const { data, isLoading } = useQuery({
    queryKey: [
      "interac-beneficiaries",
      {
        option_type: "interac",
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
  const fields: FormField[] = fieldsData?.interac || [];

  // const qc = useQueryClient();
  // const AddBeneficiaryMutation = useMutation({
  //   mutationFn: (data: IUsBeneficiaryPayload) => CreateUsBeneficiary(data),
  //   onSuccess: () => {
  //     toast.success("Beneficiary added!");
  //     qc.invalidateQueries({ queryKey: ["interac-beneficiaries"] });
  //   },
  // });
  const validationSchema = z.object({
    label: z
      .string()
      .min(2, "Label must be at least 2 characters")
      .max(50, "Label must not exceed 50 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          // Canadian phone number regex: +1 followed by 10 digits, allowing spaces, dashes, or parentheses
          const canadianPhoneRegex =
            /^\+?1?\s*\(?[2-9][0-9]{2}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/;
          return canadianPhoneRegex.test(value);
        },
        {
          message: "Invalid Canadian phone number",
        }
      ),
  });
  const formik = useFormik({
    initialValues: {
      label: "",
      email: "",
      phoneNumber: "",
    },
    validationSchema: toFormikValidationSchema(validationSchema),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = {
          data: {
            username: values.email,
            ...(values.phoneNumber && { phone: values.phoneNumber }),
          },
          label: values.label,
          optionType: "interac",
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
        title="Send to Interac"
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
            <div className="">
              <InputLabel content="Phone Number (Optional)" />
              <div className="flex gap-3 w-full mt-2">
                <button className="w-[30%] xl:[25%] flex p-3 xl:p-[15px] gap-2 rounded-lg bg-raiz-gray-100 h-fit items-center">
                  <Image
                    src={"/icons/flag-ca.png"}
                    alt="canada"
                    width={34}
                    height={17}
                    className="w-7 h-[17px]"
                  />
                  <span className="text-raiz-gray-900 text-[10px] xl:text-[13px] font-medium font-brSonoma leading-tight">
                    (+1)
                  </span>
                </button>
                <div className="w-[70%] xl:w-[75%]">
                  <InputField
                    placeholder="Enter phone number"
                    {...formik.getFieldProps("phoneNumber")}
                    status={formik.errors.phoneNumber ? "error" : null}
                    errorMessage={
                      formik.touched.phoneNumber && formik.errors.phoneNumber
                    }
                  />
                </div>
              </div>
            </div>
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

export default AddInteracBeneficiary;
