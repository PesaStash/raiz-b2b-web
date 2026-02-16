"use client";
import React, { useState } from "react";
import RouteSectionInfo from "./_components/RouteSectionInfo";
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

const Settingspage = () => {
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
        user?.business_account?.entity?.country_id || null
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
    phone_number: user?.business_account?.business_phone_number || "",
    address: `${
      user?.business_account.entity.entity_address &&
      user?.business_account.entity.entity_address.length > 0
        ? `${user?.business_account?.entity?.entity_address[0]?.street}, ${user?.business_account?.entity?.entity_address[0]?.city}, ${user?.business_account?.entity?.entity_address[0]?.state}, ${user?.business_account?.entity?.entity_address[0]?.country?.country_name}`
        : ""
    }`,
    country_id: user?.business_account?.entity?.country_id || "",
    country_name: countryData?.country_name || "",
  };
  const formik = useFormik({
    initialValues,
    validationSchema: toFormikValidationSchema(validationSchema),
    onSubmit: () => {
      handleSubmit();
    },
    enableReinitialize: true,
  });

  const handleSubmit = () => {
    UpdateRaizTagMutation.mutate(formik.values.raiz_tag);
  };
  return (
    <section className="gap-10 flex w-full  ">
      <RouteSectionInfo
        title="Your Profile"
        subtitle="Update account information"
        icon={
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect
              width="40"
              height="40"
              rx="20"
              fill="#EAECFF"
              fillOpacity="0.6"
            />
            <path
              opacity="0.65"
              d="M19.9999 20C22.3011 20 24.1666 18.1345 24.1666 15.8333C24.1666 13.5321 22.3011 11.6667 19.9999 11.6667C17.6987 11.6667 15.8333 13.5321 15.8333 15.8333C15.8333 18.1345 17.6987 20 19.9999 20Z"
              fill="#8A5E35"
            />
            <path
              d="M25 22.5H15C13.6192 22.5 12.5 23.6192 12.5 25C12.5 26.3808 13.6192 27.5 15 27.5H25C26.3808 27.5 27.5 26.3808 27.5 25C27.5 23.6192 26.3808 22.5 25 22.5Z"
              fill="#A03976"
            />
          </svg>
        }
      />
      <form
        onSubmit={formik.handleSubmit}
        className="w-[70%] xl:w-[73.5%] flex flex-col gap-5"
      >
        <InputField
          label="Business Name"
          className="!text-raiz-gray-400"
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
          className="!text-raiz-gray-400"
          errorMessage={formik.touched.raiz_tag && formik.errors.raiz_tag}
        />
        <InputField
          type="email"
          label="Work Email"
          className="!text-raiz-gray-400"
          icon="/icons/lock.svg"
          disabled
          {...formik.getFieldProps("email")}
        />
        <InputField
          label="Phone Number"
          icon="/icons/lock.svg"
          disabled
          {...formik.getFieldProps("phone_number")}
          className="!text-raiz-gray-400"
        />
        <InputField
          label="Address"
          icon="/icons/lock.svg"
          disabled
          {...formik.getFieldProps("address")}
        />
        <div className="">
          <InputLabel content="Country" />
          <button
            type="button"
            disabled
            onClick={() => setShowCountry(true)}
            className="flex justify-between w-full h-[50px] p-[15px] bg-raiz-gray-100 rounded-lg  items-center"
          >
            <span
              className={`
                    ${
                      formik.values.country_name
                        ? "text-raiz-gray-950"
                        : "text-raiz-gray-400"
                    }
                       text-sm font-normal  leading-tight`}
            >
              {isLoading
                ? "Loading..."
                : error
                ? "Error fetching country"
                : formik.values.country_name || ""}
            </span>
            <Image
              src={"/icons/lock.svg"}
              alt="dropdown"
              className="w-6 h-6"
              width={20}
              height={20}
            />
          </button>
        </div>
        <div className="px-[18px] py-5 bg-[#fff1ce]/60 rounded-[20px] justify-start items-start gap-2 inline-flex">
          <p className="text-raiz-gray-950 text-[13px] font-normal  leading-tight">
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
          className="mt-5"
        >
          Save
        </Button>
      </form>
      {showCountry && (
        <CountryCodeModal close={() => setShowCountry(false)} formik={formik} />
      )}
    </section>
  );
};

export default Settingspage;
