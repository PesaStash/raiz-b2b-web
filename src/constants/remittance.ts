import { z } from "zod";

/** Legacy dedicated forms kept for reference; disabled for API-driven African remittance. */
export const ENABLE_LEGACY_REMITTANCE_FORMS: boolean = false;

export const LEGACY_REMITTANCE_FORM_COUNTRIES = new Set(["GB", "CN"]);

export const IntRemittanceNgAccountSchema = z
  .string()
  .nonempty("Account number is required")
  .regex(/^\d+$/, "Account number must contain only digits")
  .min(7, "Account number must be at least 7 digits")
  .max(13, "Account number must not exceed 13 digits");

export const IntRemittanceNgBankCodeSchema = z
  .string()
  .regex(/^\d+$/, "Bank code must contain only digits")
  .min(4, "Bank code must be at least 4 digits")
  .max(8, "Bank code must not exceed 8 digits");

export const BENEFICIARY_POLL_INTERVAL_MS = 3000;
export const BENEFICIARY_POLL_MAX_ATTEMPTS = 20;
