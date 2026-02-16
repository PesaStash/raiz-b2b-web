import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useFormik } from "formik";
import React, { useRef } from "react";
import { z } from "zod";
import { useLoadScript, Autocomplete, Libraries } from "@react-google-maps/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessVerificationApi } from "@/services/user";
import { IBusinessVerificationPayload } from "@/types/services";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { sanitizeAddressField } from "@/utils/helpers";

const nigerianRegNumberRegex = /^(RC|BN|IT|LP)?[\s-]*\d{4,9}$/i;
const libraries: Libraries = ["places"];
const BusinessSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_registration_number: z
    .string()
    .min(1, "Registration number is required"),
  business_email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  address: z.string().min(1, "Address is required"),
  country_code: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  street: z.string().optional(),
  building_number: z.string().optional(),
  city: z.string().optional(),
  length_of_stay_months: z.number().min(6).optional(),
});

type BusinessFormValues = z.infer<typeof BusinessSchema>;

const BusinessVerificationModal = ({ close }: { close: () => void }) => {
  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "",
    libraries,
  });
  const { user } = useUser();
  const isNigerian =
    user?.business_account?.entity?.country?.country_name?.toLowerCase() ===
    "nigeria";
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const qc = useQueryClient();
  const BusinessVerificationMutation = useMutation({
    mutationFn: (payload: IBusinessVerificationPayload) =>
      BusinessVerificationApi(payload),
    onSuccess: () => {
      toast.success(
        "Account registration successful. You'll receive an email from our banking partner regarding the next step for your onboarding"
      );
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      close();
    },
  });

  const getEffectiveSchema = () =>
    BusinessSchema.refine(
      (data) => {
        if (!isNigerian) return true;

        return nigerianRegNumberRegex.test(
          data.business_registration_number?.toUpperCase()
        );
      },
      {
        message:
          "Invalid Nigerian business registration number. Must start with RC, BN, IT, or LP and contain 4–9 digits.",
        path: ["business_registration_number"],
      }
    );

  const formik = useFormik<BusinessFormValues>({
    initialValues: {
      business_registration_number: "",
      business_name: "",
      business_email: "",
      country_code: "",
      state: "",
      zip_code: "",
      street: "",
      building_number: "",
      city: "",
      length_of_stay_months: 0,
      address: "",
    },
    validate: (values) => {
      const result = getEffectiveSchema().safeParse(values);

      if (!result.success) {
        return result.error.flatten().fieldErrors;
      }
    },
    onSubmit: (values) => {
      BusinessVerificationMutation.mutate({
        business_name: values.business_name,
        business_registration_number: values.business_registration_number,
        business_email: values.business_email,
        country_code: values.country_code || null,
        state: sanitizeAddressField(values.state || "") || null,
        zip_code: values.zip_code || null,
        street: sanitizeAddressField(values.street || "") || null,
        building_number: values.building_number || null,
        city: sanitizeAddressField(values.city || "") || null,
        length_of_stay_months: values.length_of_stay_months || 0,
      });
    },
  });

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.address_components) return;
    console.log("places", place.address_components);

    const components: Record<string, string> = {
      street: "",
      city: "",
      state: "",
      zip_code: "",
      country_code: "",
      building_number: "",
    };

    for (const component of place.address_components) {
      const types = component.types;
      if (types.includes("street_number"))
        components.building_number = component.long_name;
      if (types.includes("route")) components.street = component.long_name;
      if (types.includes("administrative_area_level_2"))
        components.city = component.long_name;
      if (types.includes("administrative_area_level_1"))
        components.state = component.long_name;
      if (types.includes("postal_code"))
        components.zip_code = component.long_name;
      if (types.includes("country"))
        components.country_code = component.short_name;
    }

    formik.setValues({
      ...formik.values,
      address: place.formatted_address ?? "",
      ...components,
    });
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex gap-3 flex-col h-full justify-between"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-raiz-gray-950 font-bold text-xl my-2">
          Basic Business Verification
        </h2>
        <InputField
          label="Business Name"
          {...formik.getFieldProps("business_name")}
          status={
            formik.touched.business_name && formik.errors.business_name
              ? "error"
              : null
          }
          errorMessage={
            formik.touched.business_name && formik.errors.business_name
          }
        />
        <InputField
          label="Business Registration Number"
          {...formik.getFieldProps("business_registration_number")}
          status={
            formik.touched.business_registration_number &&
            formik.errors.business_registration_number
              ? "error"
              : null
          }
          errorMessage={
            formik.touched.business_registration_number &&
            formik.errors.business_registration_number
          }
        />
        <InputField
          label="Business Email"
          type="email"
          {...formik.getFieldProps("business_email")}
          status={
            formik.touched.business_email && formik.errors.business_email
              ? "error"
              : null
          }
          errorMessage={
            formik.touched.business_email && formik.errors.business_email
          }
        />
        {/* Address Autocomplete */}
        <label className="text-sm font-medium text-gray-700">
          Business Address
        </label>
        <Autocomplete
          onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Start typing address..."
            className={`w-full p-[15px] h-[50px] text-sm text-raiz-gray-950  border bg-raiz-gray-100 focus:bg-white focus:border-raiz-gray-600 active:border-raiz-gray-600  outline-none rounded-lg leading-tight placeholder:text-raiz-gray-400 placeholder:text-sm border-raiz-gray-100`}
          />
        </Autocomplete>
        {formik.touched.address && formik.errors.address && (
          <p className="text-red-500 text-xs">{formik.errors.address}</p>
        )}

        <InputField
          label="Length of Stay (Months)"
          {...formik.getFieldProps("length_of_stay_months")}
          type="number"
          status={
            formik.touched.length_of_stay_months &&
            formik.errors.length_of_stay_months
              ? "error"
              : null
          }
          errorMessage={
            formik.touched.length_of_stay_months &&
            formik.errors.length_of_stay_months
          }
        />
      </div>
      <Button
        disabled={
          !formik.dirty ||
          !formik.values.city ||
          !formik.values.state ||
          BusinessVerificationMutation.isPending
        }
        loading={BusinessVerificationMutation.isPending}
        type="submit"
      >
        {BusinessVerificationMutation?.isPending
          ? "Loading...."
          : "Verify Business"}
      </Button>
    </form>
  );
};

export default BusinessVerificationModal;
