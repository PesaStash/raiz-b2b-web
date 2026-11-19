import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  exceedsBalance,
  feeTotal,
  formatCountdown,
  formatSwapRateLabel,
  isInsufficient,
  previewFromLiveRate,
  previewFromV2Quote,
  readQuoteExpiry,
  debitIncreased,
  secondsUntil,
} from "../src/lib/swapQuote.ts";

describe("swapQuote helpers", () => {
  it("detects amounts that exceed the available balance", () => {
    assert.equal(exceedsBalance("3200.00", "3000.00"), true);
    assert.equal(exceedsBalance("3000.00", "3000.00"), false);
    assert.equal(exceedsBalance("2999.99", "3000.00"), false);
    assert.equal(exceedsBalance("abc", "3000.00"), false);
  });

  it("formats the rate from the paying side", () => {
    assert.equal(formatSwapRateLabel("USD", "1532"), "$1 = ₦1,532.00");
    assert.equal(formatSwapRateLabel("NGN", "1542"), "₦1,542.00 = $1");
  });

  it("formats countdown as m:ss", () => {
    assert.equal(formatCountdown(24), "0:24");
    assert.equal(formatCountdown(90), "1:30");
    assert.equal(formatCountdown(0), "0:00");
  });

  it("builds a live preview without inventing a fee", () => {
    const preview = previewFromLiveRate(
      "USD",
      "NGN",
      "100.00",
      { currency: "NGN", buy_rate: 1542, sell_rate: 1532 },
      Date.parse("2026-11-06T12:00:00.000Z"),
    );
    assert.ok(preview);
    assert.equal(preview.mode, "live");
    assert.equal(preview.quoteId, null);
    assert.equal(preview.fee, null);
    assert.equal(preview.totalDebit.amount, "100.00");
    assert.equal(preview.destinationMoney.amount, "153200.00");
    assert.equal(preview.rateLabel, "$1 = ₦1,532.00");
    assert.equal(preview.expiresAt, "2026-11-06T12:00:30.000Z");
  });

  it("builds an NGN→USD live preview by dividing", () => {
    const preview = previewFromLiveRate("NGN", "USD", "154200.00", {
      currency: "NGN",
      buy_rate: 1542,
      sell_rate: 1532,
    });
    assert.ok(preview);
    assert.equal(preview.destinationMoney.amount, "100.00");
    assert.equal(preview.rateLabel, "₦1,542.00 = $1");
  });

  it("maps a v2 quote into the UI preview", () => {
    const preview = previewFromV2Quote(
      {
        quote_id: "q-1",
        source_money: { amount: "100.00", currency: "USD" },
        destination_money: { amount: "153200.00", currency: "NGN" },
        fees: [
          {
            code: "swap_fee",
            label: "Fee",
            amount: { amount: "1.00", currency: "USD" },
          },
        ],
        total_debit: { amount: "101.00", currency: "USD" },
        rate: {
          value: "1532",
          base_currency: "USD",
          quote_currency: "NGN",
        },
        expires_at: "2026-11-06T12:00:30.000Z",
      },
      "USD",
    );
    assert.ok(preview);
    assert.equal(preview.mode, "v2");
    assert.equal(preview.quoteId, "q-1");
    assert.equal(preview.fee?.amount, "1.00");
    assert.equal(preview.totalDebit.amount, "101.00");
    assert.equal(isInsufficient(preview, "100.00"), true);
    assert.equal(isInsufficient(preview, "101.00"), false);
  });

  it("rejects incomplete v2 quotes and treats missing debit as sufficient", () => {
    assert.equal(
      previewFromV2Quote(
        {
          quote_id: "q-bad",
          source_money: { amount: "100.00", currency: "USD" },
          destination_money: { amount: "153200.00", currency: "NGN" },
          fees: [],
          // @ts-expect-error incomplete fixture
          total_debit: undefined,
          rate: { value: "1532", base_currency: "USD", quote_currency: "NGN" },
          expires_at: "2026-11-06T12:00:30.000Z",
        },
        "USD",
      )?.totalDebit.amount,
      "100.00",
    );
    assert.equal(isInsufficient({ totalDebit: undefined }, "100.00"), false);
    assert.equal(isInsufficient(null, "100.00"), false);
  });

  it("sums same-currency fees", () => {
    assert.deepEqual(
      feeTotal([
        { amount: { amount: "1.00", currency: "USD" } },
        { amount: { amount: "0.50", currency: "USD" } },
      ]),
      { amount: "1.50", currency: "USD" },
    );
  });

  it("computes seconds until expiry", () => {
    assert.equal(
      secondsUntil(
        "2026-11-06T12:00:24.000Z",
        Date.parse("2026-11-06T12:00:00.000Z"),
      ),
      24,
    );
    assert.equal(
      secondsUntil(
        "2026-11-06T11:59:00.000Z",
        Date.parse("2026-11-06T12:00:00.000Z"),
      ),
      0,
    );
  });

  it("treats timezone-less microsecond timestamps as UTC", () => {
    assert.equal(
      secondsUntil(
        "2026-11-06T12:32:36.467365",
        Date.parse("2026-11-06T12:32:06.467Z"),
      ),
      30,
    );
  });

  it("reads a quote_expired error and its replacement quote", () => {
    const expiry = readQuoteExpiry({
      status: 409,
      data: {
        error: {
          code: "quote_expired",
          message: "The rate changed. Review the updated quote before continuing.",
          replacement_quote: {
            quote_id: "q-next",
            source_money: { amount: "100.00", currency: "USD" },
            destination_money: { amount: "9500.00", currency: "NGN" },
            total_debit: { amount: "102.00", currency: "USD" },
            rate: { value: "95", base_currency: "USD", quote_currency: "NGN" },
            expires_at: "2026-11-06T12:33:00Z",
          },
        },
      },
    });
    assert.equal(expiry.expired, true);
    assert.equal(expiry.replacement?.quote_id, "q-next");
    assert.equal(debitIncreased("101.00", "102.00"), true);
    assert.equal(debitIncreased("102.00", "101.00"), false);
    assert.equal(
      readQuoteExpiry({
        status: 400,
        data: { detail: "Swap quote has expired" },
      }).expired,
      true,
    );
  });

  it("maps a live v2 quote that omits fees and total debit", () => {
    const preview = previewFromV2Quote(
      {
        quote_id: "996dd65b-50b6-4c3a-824b-f8f66be944d5",
        source_money: {
          amount: "100.000000000000000000",
          currency: "USD",
        },
        destination_money: {
          amount: "9532.960000000000000000",
          currency: "NGN",
        },
        rate: {
          value: "95.329625000000000000",
          base_currency: "USD",
          quote_currency: "NGN",
        },
        expires_at: "2026-11-06T12:32:36.467365",
      },
      "USD",
    );
    assert.ok(preview);
    assert.equal(preview.fee?.amount, "0.00");
    assert.equal(preview.totalDebit.amount, "100.000000000000000000");
    assert.equal(
      secondsUntil(preview.expiresAt, Date.parse("2026-11-06T12:32:06.467Z")),
      30,
    );
    assert.equal(exceedsBalance(preview.totalDebit.amount, "50.00"), true);
    assert.equal(exceedsBalance(preview.totalDebit.amount, "100.00"), false);
  });
});
