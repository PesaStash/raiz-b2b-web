import test from "node:test";
import assert from "node:assert/strict";
import {
  detectKind,
  filterTransactionsLocally,
  groupTransactions,
  heroStatusLabel,
  mapStatus,
  toTransactionView,
} from "../src/lib/transactionView.ts";

const base = (overrides = {}) => ({
  wallet_id: "usd-1",
  transaction_type_id: 1,
  transaction_class_id: 1,
  payment_method_id: 1,
  transaction_status_id: 1,
  transaction_category_id: 1,
  transaction_amount: 50,
  currency: "GBP",
  transaction_remarks: "",
  transaction_reference: "0100100033404201623356",
  transaction_date_time: "2026-10-15T16:42:00Z",
  fee_amount: 1,
  vat_amount: 0,
  account_balance: 30000,
  transaction_description: "GBP deposit",
  third_party_name: "John Smith",
  third_party_profile_image_url: null,
  session_id: "s1",
  order_number: null,
  source_account_number: "12344321",
  source_bank_name: "UK bank",
  beneficiary_account_number: null,
  beneficiary_bank: null,
  beneficiary_bank_name: null,
  transaction_report_id: "tx-1",
  created_at: "2026-10-15T16:42:00Z",
  updated_at: "2026-10-15T16:42:00Z",
  transaction_type: {
    transaction_type: "credit",
    transaction_type_description: "",
    transaction_type_code: 1,
    transaction_type_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  transaction_status: {
    transaction_status: "completed",
    transaction_status_description: "",
    transaction_status_code: 2,
    transaction_status_id: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
  transaction_class: {
    transaction_class: "deposit",
    transaction_class_description: "",
    transaction_class_code: 1,
    transaction_class_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  payment_method: {
    payment_method: "Bank transfer",
    payment_method_description: "",
    payment_method_code: 1,
    payment_method_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  transaction_category: {
    transaction_category: "Partner",
    transaction_category_code: 1,
    transaction_category_description: "",
    category_emoji: "",
    transaction_category_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  display_money: { amount: "50.00", currency: "GBP" },
  account_balance_currency: "USD",
  settlement: {
    source_money: { amount: "50.00", currency: "GBP" },
    destination_money: null,
    wallet_impact: {
      wallet_id: "usd-1",
      direction: "credit",
      gross: { amount: "64.20", currency: "USD" },
      fees: [
        {
          code: "deposit_fee",
          label: "Fee",
          amount: { amount: "1.00", currency: "USD" },
        },
      ],
      net: { amount: "63.20", currency: "USD" },
      balance_after: { amount: "30000.00", currency: "USD" },
    },
    rate: {
      value: "1.2840",
      base_currency: "GBP",
      quote_currency: "USD",
    },
  },
  ...overrides,
});

test("detectKind maps foreign deposit and payout", () => {
  assert.equal(detectKind(base()), "foreign_deposit");
  assert.equal(
    detectKind(
      base({
        transaction_type: {
          ...base().transaction_type,
          transaction_type: "debit",
        },
        settlement: {
          source_money: { amount: "54.80", currency: "USD" },
          destination_money: { amount: "50.00", currency: "EUR" },
          wallet_impact: {
            wallet_id: "usd-1",
            direction: "debit",
            gross: { amount: "51.80", currency: "USD" },
            fees: [
              {
                code: "fee",
                label: "Fee",
                amount: { amount: "3.00", currency: "USD" },
              },
            ],
            net: { amount: "54.80", currency: "USD" },
            balance_after: null,
          },
          rate: {
            value: "1.0360",
            base_currency: "EUR",
            quote_currency: "USD",
          },
        },
        display_money: { amount: "50.00", currency: "EUR" },
        currency: "EUR",
        third_party_name: "Desirae Bergson",
      }),
    ),
    "foreign_payout",
  );
});

test("mapStatus keeps pending and reconciliation distinct from completed", () => {
  assert.equal(mapStatus(base()).label, "Completed");
  assert.equal(
    mapStatus(
      base({
        transaction_status: {
          ...base().transaction_status,
          transaction_status: "pending",
        },
      }),
    ).label,
    "On its way",
  );
  assert.equal(
    mapStatus(
      base({
        transaction_status: {
          ...base().transaction_status,
          transaction_status: "reconciliation_required",
        },
      }),
    ).label,
    "Under review",
  );
  assert.equal(
    mapStatus(
      base({
        transaction_status: {
          ...base().transaction_status,
          transaction_status: "reversed",
        },
      }),
    ).tone,
    "refunded",
  );
});

test("toTransactionView shows dual money views and USD fee", () => {
  const view = toTransactionView(base(), {
    receivingAccounts: [
      {
        receiving_account_id: "r1",
        asset: "GBP",
        kind: "bank_account",
        status: "active",
        settlement_wallet_id: "usd-1",
        settlement_currency: "USD",
        provider: "bridge",
        bank: { payment_rail: "faster_payments" },
        crypto: null,
        disclosures: [],
        created_at: "2026-01-01",
      },
    ],
    businessName: "Kijani Foods Ltd",
  });
  assert.equal(view.primaryAmount.amount, "63.20");
  assert.equal(view.primaryAmount.currency, "USD");
  assert.equal(view.primarySign, "+");
  assert.equal(view.secondaryLine, "£50.00");
  assert.equal(view.railLabel, "Faster Payments · GBP");
  assert.equal(view.fees[0].amount.currency, "USD");
  assert.equal(view.rateLabel, "1 GBP = 1.2840 USD");
  assert.ok(view.detailRows.some((r) => r.label === "They sent"));
  assert.ok(view.detailRows.some((r) => r.label === "Settled to"));
  assert.equal(view.primaryAction, "account_details");
  assert.equal(heroStatusLabel(view), "Money received");
});

test("pending review does not claim added to USD", () => {
  const view = toTransactionView(
    base({
      transaction_status: {
        ...base().transaction_status,
        transaction_status: "pending",
      },
      settlement: {
        ...base().settlement,
        wallet_impact: {
          ...base().settlement.wallet_impact,
          direction: "none",
          balance_after: null,
        },
      },
    }),
  );
  assert.equal(view.isPendingGroup, true);
  assert.equal(view.primaryAmount.currency, "GBP");
  assert.equal(
    view.detailRows.some((r) => r.label.startsWith("Added to")),
    false,
  );
});

test("outbound receipt headline uses total deducted", () => {
  const view = toTransactionView(
    base({
      currency: "EUR",
      display_money: { amount: "50.00", currency: "EUR" },
      third_party_name: "Desirae Bergson",
      transaction_type: {
        ...base().transaction_type,
        transaction_type: "debit",
      },
      settlement: {
        source_money: { amount: "54.80", currency: "USD" },
        destination_money: { amount: "50.00", currency: "EUR" },
        wallet_impact: {
          wallet_id: "usd-1",
          direction: "debit",
          gross: { amount: "51.80", currency: "USD" },
          fees: [
            {
              code: "fee",
              label: "Fee",
              amount: { amount: "3.00", currency: "USD" },
            },
          ],
          net: { amount: "54.80", currency: "USD" },
          balance_after: null,
        },
        rate: {
          value: "1.0360",
          base_currency: "EUR",
          quote_currency: "USD",
        },
      },
    }),
  );
  assert.equal(view.receiptHeadline, "Total USD deducted");
  assert.equal(view.primarySign, "−");
  assert.ok(view.detailRows.some((r) => r.label === "Recipient gets"));
});

test("groupTransactions puts pending first", () => {
  const completed = toTransactionView(base({ transaction_report_id: "a" }));
  const pending = toTransactionView(
    base({
      transaction_report_id: "b",
      transaction_status: {
        ...base().transaction_status,
        transaction_status: "pending",
      },
      settlement: {
        ...base().settlement,
        wallet_impact: {
          ...base().settlement.wallet_impact,
          direction: "none",
        },
      },
    }),
  );
  const groups = groupTransactions([completed, pending]);
  assert.equal(groups[0].label, "Pending");
  assert.equal(groups[0].items[0].id, "b");
});

test("filterTransactionsLocally matches name reference and amount", () => {
  const views = [toTransactionView(base())];
  assert.equal(filterTransactionsLocally(views, "john").length, 1);
  assert.equal(filterTransactionsLocally(views, "010010003").length, 1);
  assert.equal(filterTransactionsLocally(views, "63.20").length, 1);
  assert.equal(filterTransactionsLocally(views, "nobody").length, 0);
});
