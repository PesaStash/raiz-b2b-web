import { NgnPayoutBlocker } from "@/types/services";

export const NGN_PAYOUT_BLOCKER_COPY: Record<NgnPayoutBlocker, string> = {
  missing_completed_ngn_wallet:
    "Create or complete an NGN wallet before enabling payouts.",
  source_wallet_not_completed_or_usable:
    "Select a completed NGN wallet that is not blocked.",
  kyb_incomplete: "Complete business verification before enabling payouts.",
  missing_per_transaction_limit: "Add a per-transaction payout limit.",
  missing_daily_limit: "Add a daily payout limit.",
  per_transaction_limit_exceeds_daily_limit:
    "Daily limit must be greater than or equal to the per-transaction limit.",
  missing_manual_approval_threshold:
    "Add a manual approval threshold or turn off manual approval.",
};

export const PAYOUT_WEBHOOK_EVENTS = [
  "payout.created",
  "payout.pending",
  "payout.requires_review",
  "payout.completed",
  "payout.failed",
  "payout.reversed",
] as const;

export type PayoutWebhookEvent = (typeof PAYOUT_WEBHOOK_EVENTS)[number];
