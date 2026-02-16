"use client";
import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";
import { useFormik } from "formik";
import InputField from "@/components/ui/InputField";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ICreateTaxPayload } from "@/types/services";
import { CreateInvoiceTaxApi } from "@/services/invoice";
import { toast } from "sonner";
import z from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

interface Props {
  close: () => void;
}

const validationSchema = z.object({
  taxName: z
    .string()
    .min(2, "Tax name must be at least 2 characters")
    .max(100, "Tax name is too long"),
  rate: z
    .number({ invalid_type_error: "Rate must be a number" })
    .min(0, "Rate cannot be less than 0")
    .max(100, "Rate cannot exceed 100"),
  isCompound: z.boolean().optional(),
});

const AddNewTax = ({ close }: Props) => {
  const qc = useQueryClient();
  const Mutation = useMutation({
    mutationFn: (payload: ICreateTaxPayload) => CreateInvoiceTaxApi(payload),
    onSuccess: () => {
      toast.success("New rate added!");
      qc.invalidateQueries({ queryKey: ["invoice-tax"] });
      close();
    },
  });
  const formik = useFormik({
    initialValues: {
      taxName: "",
      rate: 0,
      isCompound: false,
    },
    validationSchema: toFormikValidationSchema(validationSchema),
    onSubmit: (val, { resetForm }) => {
      console.log(val);
      try {
        Mutation.mutate({ tax_name: val.taxName, tax_percentage: val.rate });
      } catch (error) {
        console.log(error);
      } finally {
        resetForm();
      }
    },
  });
  return (
    <Overlay width="375px" close={close}>
      <div className="flex flex-col justify-center items-center  h-full py-8 px-5  text-center overflow-y-scroll">
        <div className="flex justify-between gap-4 mb-7  w-full items-center">
          <h3 className=" font-bold  text-xl text-zinc-900">New Tax</h3>

          <button onClick={close}>
            <Image
              src={"/icons/close.svg"}
              alt="close"
              width={16}
              height={16}
            />
          </button>
        </div>
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-5 w-full text-left"
        >
          <InputField
            label="Tax Name"
            placeholder="Enter tax name"
            {...formik.getFieldProps("taxName")}
            status={formik.errors.taxName ? "error" : null}
            errorMessage={formik.touched.taxName && formik.errors.taxName}
          />
          <InputField
            label="Rate (%)"
            type="number"
            max={100}
            placeholder="Enter rate in percentage"
            {...formik.getFieldProps("rate")}
            status={formik.errors.rate ? "error" : null}
            errorMessage={formik.touched.rate && formik.errors.rate}
          />
          <div className="flex gap-2 items-center">
            <Checkbox
              label="This is a Compound Tax"
              checked={formik.values.isCompound}
              onChange={(checked: boolean) =>
                formik.setFieldValue("isCompound", checked)
              }
              bgStyle="bg-[#5BC88A]/30 border-0"
              checkMarkColor="#5BC88A"
              labelClass="text-zinc-900"
            />
            <button className="cursor-default" type="button">
              <Image
                src={"/icons/info-green.svg"}
                alt=""
                width={16}
                height={16}
                title="Select this option if you charge a second tax in addition to the primary tax."
              />
            </button>
          </div>
          <div className="mt-2 flex-col flex gap-[15px]">
            <Button
              disabled={Mutation.isPending}
              loading={Mutation.isPending}
              type="submit"
            >
              Save
            </Button>
            <Button type="button" onClick={close} variant="secondary">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Overlay>
  );
};

export default AddNewTax;
