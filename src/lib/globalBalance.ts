import type { IBusinessAccount, IWallet } from "@/types/user";
import type {
  BalanceCurrency,
  FeeCatalogComponent,
  ReceivingAccount,
  SpendableBalance,
} from "@/types/globalBalance";

export const isGlobalBalance = (account?: IBusinessAccount) =>
  account?.balance_model === "ngn_usd_v2";

/** Account APIs use both activation and setup-completion status names. */
export function isAccountReady(status?: string): boolean {
  return ["active", "activated", "complete", "completed"].includes(
    status?.trim().toLowerCase() ?? "",
  );
}

export function spendableBalances(
  account?: IBusinessAccount,
): SpendableBalance[] {
  if (!account) return [];
  if (isGlobalBalance(account))
    return (account.balances ?? []).filter(
      (b) => b.currency === "USD" || b.currency === "NGN",
    );
  return (account.wallets ?? [])
    .filter(
      (w) =>
        w.wallet_type.currency === "USD" || w.wallet_type.currency === "NGN",
    )
    .map((w) => ({
      wallet_id: w.wallet_id,
      currency: w.wallet_type.currency as BalanceCurrency,
      available_balance: String(w.account_balance),
      pending_debits: "0",
      status: w.status ?? "active",
      supported_receive_assets: null,
      supported_send_assets: null,
    }));
}

// Decimal strings stay decimal strings. Extra places are cut, not rounded, so a balance is never shown higher than the ledger amount.
export function formatMoney(
  value: string | number | undefined,
  currency: string,
): string {
  if (value === undefined) return "—";
  const raw = String(value);
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return "—";
  const negative = raw.startsWith("-");
  const [whole, fraction = ""] = (negative ? raw.slice(1) : raw).split(".");
  const precision = ["USDT", "USDC"].includes(currency) ? 6 : 2;
  const decimals = fraction.slice(0, precision).padEnd(precision, "0");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbols: Record<string, string> = {
    USD: "$",
    NGN: "₦",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
  };
  const sign = negative && (whole !== "0" || decimals !== "00") ? "-" : "";
  return `${sign}${symbols[currency] ?? ""}${grouped}.${decimals}${symbols[currency] ? "" : ` ${currency}`}`;
}

export interface AccountInstructions {
  id: string;
  asset: string;
  title: string;
  status: string;
  fields: { label: string; value: string }[];
  disclosures: string[];
  network?: string;
  address?: string;
  receiving?: ReceivingAccount;
}
const bankLabels: Record<string, string> = {
  account_name: "Account name",
  account_number: "Account number",
  iban: "IBAN",
  sort_code: "Sort code",
  bic: "BIC",
  routing_number: "Routing number",
  bank_name: "Bank",
  bank_country: "Bank country",
  account_type: "Account type",
  bank_address: "Bank address",
  payment_rail: "Payment rail",
};
export function receivingInstructions(
  account: ReceivingAccount,
): AccountInstructions {
  const details =
    account.kind === "crypto_address" ? account.crypto : account.bank;
  const labels =
    account.kind === "crypto_address"
      ? {
          address: "Wallet address",
          network: "Network",
          memo: "Memo / tag",
          minimum_deposit: "Minimum deposit",
        }
      : bankLabels;
  const fields = Object.entries(labels).flatMap(([key, label]) => {
    const value = details?.[key];
    return typeof value === "string" || typeof value === "number"
      ? [{ label, value: String(value) }]
      : [];
  });
  return {
    id: account.receiving_account_id,
    asset: account.asset,
    title: `${account.asset} ${account.kind === "crypto_address" ? "receiving address" : "account"}`,
    status: account.status,
    fields,
    disclosures: account.disclosures ?? [],
    network:
      typeof account.crypto?.network === "string"
        ? account.crypto.network
        : undefined,
    address:
      typeof account.crypto?.address === "string"
        ? account.crypto.address
        : undefined,
    receiving: account,
  };
}
export function walletInstructions(
  wallet: IWallet,
  businessName: string,
): AccountInstructions {
  const values: Record<string, unknown> = {
    account_name: wallet.account_name || businessName,
    account_number: wallet.account_number,
    bank_name: wallet.bank_name,
    iban: wallet.iban,
    sort_code: wallet.sort_code,
    bic: wallet.bic,
    account_type: wallet.wallet_account_type,
    bank_address: wallet.bank_address,
  };
  const fields = Object.entries(bankLabels).flatMap(([key, label]) =>
    typeof values[key] === "string" && values[key]
      ? [{ label, value: values[key] as string }]
      : [],
  );
  for (const route of wallet.routing ?? [])
    if (route.routing)
      fields.push({
        label: `Routing number (${route.routing_type_name})`,
        value: route.routing,
      });
  return {
    id: wallet.wallet_id,
    asset: wallet.wallet_type.currency,
    title: `${wallet.wallet_type.currency} account`,
    status: wallet.status ?? "active",
    fields,
    disclosures: [],
  };
}
export function instructionsText(
  accounts: AccountInstructions[],
  businessName: string,
): string {
  return [
    businessName,
    ...accounts.map((a) =>
      [
        a.title,
        // `Status: ${a.status}`,
        ...a.fields.map((f) => `${f.label}: ${f.value}`),
        ...a.disclosures,
      ].join("\n"),
    ),
  ].join("\n\n");
}
export function describeFee(component: FeeCatalogComponent): string {
  const value =
    component.value_unit === "percent_points"
      ? `${component.configured_value}%`
      : formatMoney(component.configured_value, component.fee_currency);
  return [
    value,
    component.calculation_kind === "gross_up_percentage" ? "(grossed up)" : "",
    component.basis ? `of ${component.basis.replaceAll("_", " ")}` : "",
    component.minimum_fee !== null
      ? `minimum ${formatMoney(component.minimum_fee, component.fee_currency)}`
      : "",
    component.maximum_fee !== null
      ? `maximum ${formatMoney(component.maximum_fee, component.fee_currency)}`
      : "",
    component.condition ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Indicative conversion only; confirmation uses the existing server flow. */
export function conversionEstimate(
  amount: string,
  rate: string,
  divide: boolean,
): string | undefined {
  if (!/^\d+(\.\d{0,2})?$/.test(amount) || !/^\d+(\.\d+)?$/.test(rate))
    return undefined;
  const [whole, fraction = ""] = amount.split(".");
  const cents = BigInt(whole + fraction.padEnd(2, "0"));
  const [rateWhole, rateFraction = ""] = rate.split(".");
  const rateUnits = BigInt(rateWhole + rateFraction);
  if (rateUnits === BigInt(0)) return undefined;
  const scale = BigInt(10) ** BigInt(rateFraction.length);
  const numerator = divide ? cents * scale : cents * rateUnits;
  const denominator = divide ? rateUnits : scale;
  const result = (numerator + denominator / BigInt(2)) / denominator;
  return `${result / BigInt(100)}.${String(result % BigInt(100)).padStart(2, "0")}`;
}
