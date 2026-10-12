import AuBeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/AuBeneficiaryForm";
import BeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/BeneficiaryForm";
import FrBeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/FrBeneficiaryForm";
import { IUSDSendOptions } from "@/types/misc";
import { FormField, IntCountryType, IntCurrencyCode } from "@/types/services";
import { ComponentType, ReactNode } from "react";
import Image from "next/image";

interface Options {
  title: string;
  subtitle: string;
  icon: ReactNode;
  key: IUSDSendOptions;
}

export interface IBankDetailField {
  name: string;
  label: string;
  pattern?: string;
}

export interface BeneficiaryFormProps {
  fields: FormField[];
  countryCode: string;
  countryName: string;
  bankDetailsFields?: IBankDetailField[];
  banks?: { id: number; code: string; name: string }[];
  reset?: () => void;
}

export interface CountryConfig {
  countryName: string;
  bankDetailsFields: IBankDetailField[];
  banks?: { id: number; code: string; name: string }[];
  formComponent: ComponentType<BeneficiaryFormProps>;
}

export interface IIntCountry {
  name: string;
  value: IntCountryType;
  logo: string;
  currency?: IntCurrencyCode;
}

export const usdSendOptions: Options[] = [
  {
    title: "Send to Raizer",
    subtitle: "Send money to raizers on the app",
    icon: (
      <svg width="30" height="31" viewBox="0 0 30 31" fill="none">
        <path
          opacity="0.35"
          d="M22.5 17.23V4.73001C22.5 3.34876 21.3813 2.23001 20 2.23001H10C8.61875 2.23001 7.5 3.34876 7.5 4.73001V17.23L15 20.98L22.5 17.23Z"
          fill="#B7A4EB"
        />
        <path
          d="M15 17.23C17.7614 17.23 20 15.5511 20 13.48C20 11.4089 17.7614 9.73001 15 9.73001C12.2386 9.73001 10 11.4089 10 13.48C10 15.5511 12.2386 17.23 15 17.23Z"
          fill="#3C2875"
        />
        <path
          d="M15 7.23001C15.6904 7.23001 16.25 6.67037 16.25 5.98001C16.25 5.28966 15.6904 4.73001 15 4.73001C14.3096 4.73001 13.75 5.28966 13.75 5.98001C13.75 6.67037 14.3096 7.23001 15 7.23001Z"
          fill="#3C2875"
        />
        <path
          d="M25.0725 8.69251L22.5 7.14876V17.23L15 20.98L7.5 17.23V7.14876L4.9275 8.69251C3.42125 9.59626 2.5 11.2238 2.5 12.98V23.48C2.5 25.5513 4.17875 27.23 6.25 27.23H23.75C25.8212 27.23 27.5 25.5513 27.5 23.48V12.98C27.5 11.2238 26.5788 9.59626 25.0725 8.69251Z"
          fill="#3C2875"
        />
      </svg>
    ),
    key: "to Raizer",
  },
  {
    title: "US Bank",
    subtitle: "Send to a US bank",
    icon: (
      <Image
        width={30}
        height={30}
        src={"/icons/us-bank.svg"}
        alt="USA banks"
      />
    ),
    key: "usBank",
  },
  {
    title: "International Remittance",
    subtitle: "Send to an International bank",
    icon: (
      <Image
        width={30}
        height={30}
        src={"/icons/glo-bank.svg"}
        alt="International remittance"
      />
    ),
    key: "internationalRemittance",
  },
  {
    title: "SWIFT",
    subtitle: "Send USD to any SWIFT globally",
    icon: (
      <Image
        width={30}
        height={30}
        src={"/icons/swift.svg"}
        alt="SWIFT payout"
      />
    ),
    key: "swift",
  },
];
export const GlobalCountryConfig: Record<string, CountryConfig> = {
  AE: {
    countryName: "United Arab Emirates",
    bankDetailsFields: [
      { name: "bank_code", label: "Bank" },
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{23}$",
      },
    ],
    banks: [],
    formComponent: BeneficiaryForm,
  },
  AD: {
    countryName: "Andorra",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  AT: {
    countryName: "Austria",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  AU: {
    countryName: "Australia",
    bankDetailsFields: [
      { name: "bank_code", label: "Bank Code" },
      {
        name: "BSB_number",
        label: "BSB Number",
        pattern: "^[0-9]{6}$",
      },
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[0-9]{6,9}$",
      },
    ],
    banks: [],
    formComponent: AuBeneficiaryForm,
  },
  FR: {
    countryName: "France",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: FrBeneficiaryForm,
  },
  BE: {
    countryName: "Belgium",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{16}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  BG: {
    countryName: "Bulgaria",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  CZ: {
    countryName: "Czech Republic",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  DE: {
    countryName: "Germany",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  DK: {
    countryName: "Denmark",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{18}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  EE: {
    countryName: "Estonia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  ES: {
    countryName: "Spain",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  FI: {
    countryName: "Finland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{18}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  GR: {
    countryName: "Greece",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  HR: {
    countryName: "Croatia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{21}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  HU: {
    countryName: "Hungary",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{28}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  IE: {
    countryName: "Ireland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  IS: {
    countryName: "Iceland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{26}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  IT: {
    countryName: "Italy",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LV: {
    countryName: "Latvia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{21}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LT: {
    countryName: "Lithuania",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LI: {
    countryName: "Liechtenstein",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{21}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LU: {
    countryName: "Luxembourg",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  MC: {
    countryName: "Monaco",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  MT: {
    countryName: "Malta",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{31}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  NL: {
    countryName: "Netherlands",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{18}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  NO: {
    countryName: "Norway",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{15}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  PL: {
    countryName: "Poland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{28}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  PT: {
    countryName: "Portugal",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{25}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  RO: {
    countryName: "Romania",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SK: {
    countryName: "Slovakia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SI: {
    countryName: "Slovenia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{19}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SE: {
    countryName: "Sweden",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SG: {
    countryName: "Singapore",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[0-9]{7,16}$",
      },
      {
        name: "bank_code",
        label: "Bank",
      },
    ],
    banks: [],
    formComponent: BeneficiaryForm,
  },
  SM: {
    countryName: "San Marino",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  VA: {
    countryName: "Vatican City",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
};