"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { FormikProps } from "formik";
import { IRegisterFormValues } from "@/types/misc";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SelectField from "@/components/ui/SelectField";
import useCountryStore from "@/store/useCountryStore";
import { newPasswordSchema } from "../validation";

export interface RegisterFormProps {
  formik: FormikProps<IRegisterFormValues>;
  goBack?: () => void;
  goForward?: () => void;
}

const CreateAccount = ({ formik }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { countries, fetchCountries, loading: countriesLoading, error } = useCountryStore();
  useEffect(() => { fetchCountries(); }, [fetchCountries]);
  const countryOptions = useMemo(() => countries.map(country => ({ value: String(country.country_id), label: country.country_name })), [countries]);
  const selectedCountry = countryOptions.find(option => option.value === formik.values.country_id) ?? null;
  const country = countries.find(country => String(country.country_id) === formik.values.country_id);
  const password = formik.values.password;
  const strongPassword = newPasswordSchema.safeParse(password).success;
  const strength = [password.length >= 8, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password), /[!@#$%^&*(),.?":{}|<>]/.test(password)].filter(Boolean).length;

  return (
    <AnimatedSection key="create-acct" className="auth-register-fields flex flex-col gap-6">
      <header>
        <h1 className="text-[28px] font-bold leading-10 md:text-[32px]">Open a business account</h1>
        <p className="mt-2.5 text-[15px] leading-[22px] text-[#6b6b80]">Start with the basics. You’ll add the business details after, and we save as you go.</p>
      </header>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            aria-label="First Name"
            label="First Name"
            placeholder="Enter first name"
            autoComplete="given-name"
            {...formik.getFieldProps("firstName")}
            status={formik.touched.firstName && formik.errors.firstName ? "error" : null}
            errorMessage={formik.touched.firstName && formik.errors.firstName}
          />
          <InputField
            aria-label="Last Name"
            label="Last Name"
            placeholder="Enter last name"
            autoComplete="family-name"
            {...formik.getFieldProps("lastName")}
            status={formik.touched.lastName && formik.errors.lastName ? "error" : null}
            errorMessage={formik.touched.lastName && formik.errors.lastName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <InputLabel content="Where is the business registered?" />
          <div className="relative">
            {country && (country.country_code?.toUpperCase() === "NG" || country.country_name === "Nigeria") && <Image
              className="pointer-events-none absolute left-4 top-4 z-10 rounded-[3px]"
              src="/images/auth/ng-flag.png"
              width={24}
              height={16}
              alt=""
            />}
            <SelectField
              instanceId="register-country"
              name="country_id"
              className="auth-country !rounded-xl !shadow-none"
              placeholder="Select country"
              options={countryOptions}
              value={selectedCountry}
              isLoading={countriesLoading}
              bgColor="#f4f4f8"
              minHeight="48px"
              height="48px"
              controlPadding={country?.country_code?.toUpperCase() === "NG" || country?.country_name === "Nigeria" ? "0 12px 0 48px" : "0 15px"}
              onChange={option => {
                formik.setFieldValue("country_id", option?.value != null ? String(option.value) : "", true);
                formik.setFieldValue("country_name", option?.label ?? "", false);
                formik.setFieldTouched("country_id", true, false);
              }}
              status={formik.touched.country_id && formik.errors.country_id ? "error" : null}
              helper={formik.touched.country_id && formik.errors.country_id ? String(formik.errors.country_id) : null}
            />
          </div>
          {error ? <p role="alert" className="text-[13px] text-raiz-error">Unable to load countries. <button
            type="button"
            className="underline"
            onClick={() => fetchCountries(true)}
          >Try again</button>
          </p> : country?.currency === "NGN" || country?.country_name === "Nigeria" ? <p className="text-[13px] leading-[19px] text-[#6b6b80]">You’ll also get a naira balance for local payments.</p> : null}
        </div>
        <InputField
          aria-label="Work email"
          label="Work email"
          placeholder="you@company.com"
          type="email"
          autoComplete="email"
          {...formik.getFieldProps("email")}
          status={formik.touched.email && formik.errors.email ? "error" : null}
          errorMessage={formik.touched.email && formik.errors.email}
        />
        <div className="flex flex-col gap-2.5">
          <InputField
            aria-label="Create a password"
            label="Create a password"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...formik.getFieldProps("password")}
            className="pr-12"
            icon={<button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              <Image
                src="/images/auth/eye.svg"
                width={20}
                height={20}
                alt=""
              />
            </button>}
            status={formik.touched.password && formik.errors.password ? "error" : null}
            errorMessage={formik.touched.password && formik.errors.password}
          />
          <div className="flex gap-1.5" aria-label={`Password strength: ${strongPassword ? "strong" : strength ? "needs improvement" : "empty"}`}>{[1, 2, 3, 4].map(bar => <span key={bar} className={`h-1 flex-1 rounded-sm ${bar <= strength ? strongPassword ? "bg-[#1f9d55]" : "bg-amber-500" : "bg-[#e4e0ea]"}`} />)}</div>
          <div className="flex flex-wrap justify-between gap-1 text-[13px] leading-[19px]">
            <p className={strongPassword ? "font-semibold text-[#1f9d55]" : "text-[#6b6b80]"}>{strongPassword ? "Strong password" : password ? "Keep going" : "Choose a password"}</p>
            <p className="text-[#6b6b80]" title="Include uppercase and lowercase letters">8+ characters, a number and a symbol</p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default CreateAccount;
