import { USAstateCodes } from "@/constants/misc";
import {
  IThirdPartyUsdBeneficiary,
  IUsBeneficiaryPayload,
} from "@/types/services";

export interface UsBankBeneficiaryFormValues {
  label: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  account_owner_name: string;
  street_line_1: string;
  street_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  payment_rail: string;
}

function normalizeUsState(state: string): string {
  const trimmed = state.trim();
  if (!trimmed) return "";

  const stateMatch = USAstateCodes.find(
    (entry) =>
      entry.abbreviation === trimmed.toUpperCase() ||
      entry.name.toLowerCase() === trimmed.toLowerCase(),
  );

  return stateMatch?.abbreviation ?? trimmed;
}

function parseUsAddress(
  address: string,
): Pick<UsBankBeneficiaryFormValues, "street_line_1" | "city" | "state"> {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const stateRaw = parts[parts.length - 1];
    const city = parts[parts.length - 2];
    const street_line_1 = parts.slice(0, -2).join(", ");

    return {
      street_line_1,
      city,
      state: normalizeUsState(stateRaw),
    };
  }

  return { street_line_1: address, city: "", state: "" };
}

export function mapThirdPartyUsdBeneficiaryToFormValues(
  template: IThirdPartyUsdBeneficiary,
  currentValues: UsBankBeneficiaryFormValues,
): UsBankBeneficiaryFormValues {
  const parsedAddress = parseUsAddress(template.address);

  return {
    ...currentValues,
    label: template.third_party_name,
    account_owner_name: template.account_name,
    account_number: template.account_number,
    routing_number: template.routing_number,
    bank_name: template.bank_name,
    street_line_1: parsedAddress.street_line_1,
    street_line_2: "",
    city: template.city?.trim() || parsedAddress.city,
    state: normalizeUsState(template.state || parsedAddress.state),
    postal_code: template.zip_code,
  };
}

export function buildUsBankBeneficiaryPayload(
  values: UsBankBeneficiaryFormValues,
): IUsBeneficiaryPayload {
  return {
    data: {
      bank_name: values.bank_name,
      account_number: values.account_number,
      routing_number: values.routing_number,
      account_type: values.account_type as "checking" | "savings",
      account_owner_name: values.account_owner_name,
      street_line_1: values.street_line_1,
      street_line_2: values.street_line_2 || null,
      city: values.city,
      state: values.state,
      postal_code: values.postal_code,
      payment_rail: values.payment_rail as "ach" | "wire" | "ach-same-day",
    },
    label: values.label,
    optionType: "bank",
  };
}

const defaultUsBankBeneficiaryFormValues: UsBankBeneficiaryFormValues = {
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

export function mapThirdPartyUsdBeneficiaryToPayload(
  template: IThirdPartyUsdBeneficiary,
): IUsBeneficiaryPayload {
  return buildUsBankBeneficiaryPayload(
    mapThirdPartyUsdBeneficiaryToFormValues(
      template,
      defaultUsBankBeneficiaryFormValues,
    ),
  );
}

const THIRD_PARTY_PARTNER_LOGOS: Record<string, string> = {
  copart: "/icons/copart.png",
  iaai: "/icons/iaai.png",
};

export function getThirdPartyPartnerLogoSrc(
  thirdPartyName: string,
): string | null {
  return THIRD_PARTY_PARTNER_LOGOS[thirdPartyName.trim().toLowerCase()] ?? null;
}

export function formatPartnerBannerText(
  partners: IThirdPartyUsdBeneficiary[],
): string {
  if (partners.length === 0) return "";

  const names = partners.slice(0, 2).map((partner) => partner.third_party_name);
  const namesText =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;

  return `Paying ${namesText}? Link verified beneficiaries in less time`;
}
