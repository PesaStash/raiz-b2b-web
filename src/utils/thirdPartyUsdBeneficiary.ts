import { USAstateCodes } from "@/constants/misc";
import {
  FormField,
  IThirdPartyUsdBeneficiary,
  IUsBeneficiaryPayload,
  UsdBeneficiaryAccountType,
  UsdBeneficiaryPaymentRail,
} from "@/types/services";

export const USD_PAYMENT_RAIL_LABELS: Record<UsdBeneficiaryPaymentRail, string> =
  {
    ach: "ACH",
    ach_same_day: "Same-day ACH",
    wire: "Wire",
    rtp: "RTP",
  };

export const USD_RTP_HELPER_COPY =
  "Fast USD bank transfer where supported by the receiving bank.";

export const FALLBACK_USD_BANK_PAYMENT_RAILS: UsdBeneficiaryPaymentRail[] = [
  "ach",
  "ach_same_day",
  "wire",
];

const USD_PAYMENT_RAILS = new Set<UsdBeneficiaryPaymentRail>([
  "ach",
  "wire",
  "ach_same_day",
  "rtp",
]);

export interface UsBankBeneficiaryFormValues {
  label: string;
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: UsdBeneficiaryAccountType | string;
  account_owner_name: string;
  street_line_1: string;
  street_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  payment_rail: UsdBeneficiaryPaymentRail | string;
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

export function isUsdBeneficiaryPaymentRail(
  rail: string,
): rail is UsdBeneficiaryPaymentRail {
  return USD_PAYMENT_RAILS.has(rail as UsdBeneficiaryPaymentRail);
}

export function normalizePaymentRail(
  rail: string,
): UsdBeneficiaryPaymentRail {
  const normalized = rail.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "ach_same_day") return "ach_same_day";
  if (normalized === "wire") return "wire";
  if (normalized === "rtp") return "rtp";
  return "ach";
}

export function formatUsdPaymentRailLabel(rail?: string | null): string {
  if (!rail) return "";
  const normalized = rail.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (isUsdBeneficiaryPaymentRail(normalized)) {
    return USD_PAYMENT_RAIL_LABELS[normalized];
  }
  return rail;
}

export function getUsdBankPaymentRails(
  fields?: FormField[] | null,
): UsdBeneficiaryPaymentRail[] {
  const railField = fields?.find((field) => field.name === "payment_rail");
  const advertised = (railField?.enum ?? [])
    .map((value) => value.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .filter(isUsdBeneficiaryPaymentRail);

  return advertised.length > 0 ? advertised : FALLBACK_USD_BANK_PAYMENT_RAILS;
}

export function getUsdBeneficiaryId(
  beneficiary?: {
    usd_beneficiary_id?: string | null;
    usd_beneficiary?: { usd_beneficiary_id?: string | null } | null;
  } | null,
): string {
  return (
    beneficiary?.usd_beneficiary?.usd_beneficiary_id ||
    beneficiary?.usd_beneficiary_id ||
    ""
  );
}

export function buildUsBankBeneficiaryPayload(
  values: UsBankBeneficiaryFormValues,
): IUsBeneficiaryPayload {
  return {
    data: {
      bank_name: values.bank_name,
      account_number: values.account_number,
      routing_number: values.routing_number,
      account_type: values.account_type as UsdBeneficiaryAccountType,
      account_owner_name: values.account_owner_name,
      street_line_1: values.street_line_1,
      street_line_2: values.street_line_2 || null,
      city: values.city,
      state: values.state,
      postal_code: values.postal_code,
      payment_rail: normalizePaymentRail(values.payment_rail),
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
  paymentRail: UsdBeneficiaryPaymentRail = "ach",
): IUsBeneficiaryPayload {
  return buildUsBankBeneficiaryPayload({
    ...mapThirdPartyUsdBeneficiaryToFormValues(
      template,
      defaultUsBankBeneficiaryFormValues,
    ),
    payment_rail: paymentRail,
  });
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
