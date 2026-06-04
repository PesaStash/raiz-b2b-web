"use client";

import React, { useState } from "react";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import { useFormik } from "formik";
import Image from "next/image";
import CountryCodeModal from "@/app/(auth)/register/_components/CountryCodeModal";
import Button from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { FetchCountriesWithIdApi } from "@/services/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUsernameApi } from "@/services/user";
import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const validationSchema = z.object({
  raiz_tag: z
    .string()
    .min(4, { message: "Raiz Tag must be at least 4 characters" })
    .regex(/^[a-zA-Z0-9_.]+$/, {
      message:
        "Raiz Tag can only contain letters, numbers, underscores, and dots",
    }),
});

const ProfileForm = () => {
  const { user } = useUser();
  const [showCountry, setShowCountry] = useState(false);
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const qc = useQueryClient();

  const {
    data: countryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["country", user?.business_account?.entity?.country_id],
    queryFn: () =>
      FetchCountriesWithIdApi(
        user?.business_account?.entity?.country_id || null,
      ),
    enabled: !!user?.business_account?.entity?.country_id,
  });

  const UpdateRaizTagMutation = useMutation({
    mutationFn: (username: string) => updateUsernameApi(username),
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const initialValues = {
    business_name: user?.business_account?.business_name || "",
    raiz_tag: user?.business_account?.username || "",
    email: user?.email || "",
    address: `${
      user?.business_account.entity.entity_address &&
      user?.business_account.entity.entity_address.length > 0
        ? `${user?.business_account?.entity?.entity_address[0]?.street}, ${user?.business_account?.entity?.entity_address[0]?.city}, ${user?.business_account?.entity?.entity_address[0]?.state}, ${user?.business_account?.entity?.entity_address[0]?.country?.country_name}`
        : ""
    }`,
    country_name: countryData?.country_name || "",
  };

  const formik = useFormik({
    initialValues,
    validationSchema: toFormikValidationSchema(validationSchema),
    onSubmit: (values) => UpdateRaizTagMutation.mutate(values.raiz_tag),
    enableReinitialize: true,
  });

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        className="w-full flex flex-col gap-5"
      >
        <InputField
          label="Business Name"
          className="!text-raiz-gray-950/50"
          icon="/icons/lock.svg"
          disabled
          {...formik.getFieldProps("business_name")}
        />
        <InputField
          key={focus}
          label="Raiz Tag"
          placeholder="@username"
          icon="/icons/pen.svg"
          autoFocus={focus === "raiz-tag"}
          {...formik.getFieldProps("raiz_tag")}
          className="!text-raiz-gray-950 placeholder:!text-raiz-gray-950"
          errorMessage={formik.touched.raiz_tag && formik.errors.raiz_tag}
        />
        <InputField
          type="email"
          label="Work Email"
          className="!text-raiz-gray-950/50"
          icon="/icons/lock.svg"
          disabled
          {...formik.getFieldProps("email")}
        />
        <InputField
          label="Address"
          icon="/icons/lock.svg"
          disabled
          {...formik.getFieldProps("address")}
          className="!text-raiz-gray-950/50"
        />
        <div>
          <InputLabel content="Country" />
          <button
            type="button"
            disabled
            className="flex justify-between w-full h-[50px] p-[15px] bg-raiz-gray-100 rounded-lg items-center"
          >
            <span
              className={`text-sm font-normal leading-tight ${
                formik.values.country_name
                  ? "text-raiz-gray-950/50"
                  : "text-raiz-gray-400"
              }`}
            >
              {isLoading
                ? "Loading..."
                : error
                  ? "Error fetching country"
                  : formik.values.country_name || ""}
            </span>
            <Image
              src="/icons/lock.svg"
              alt=""
              className="w-6 h-6"
              width={20}
              height={20}
            />
          </button>
        </div>
        <div className="px-[18px] py-5 bg-[#fff1ce]/60 rounded-[20px]">
          <p className="text-raiz-gray-950 text-[13px] font-normal leading-tight">
            You are unable to edit some of your profile information. If you need
            to make changes, please contact customer support.
          </p>
        </div>
        <Button
          loading={UpdateRaizTagMutation.isPending}
          disabled={
            UpdateRaizTagMutation.isPending || !formik.dirty || !formik.isValid
          }
          type="submit"
          className="mt-2 lg:mt-5"
        >
          Save
        </Button>
      </form>
      {showCountry && (
        <CountryCodeModal close={() => setShowCountry(false)} formik={formik} />
      )}
    </>
  );
};

export default ProfileForm;
