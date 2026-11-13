/** Canonical choices copied from raiz-admin/src/types/usd-kyb/bridge-options.ts.
 * The frontend contract requires these values until business reference APIs expose them.
 */
export interface BridgeSelectOption {
  value: string;
  label: string;
}

export const ACCOUNT_PURPOSE_OPTIONS: BridgeSelectOption[] = [
  { value: "treasury_management", label: "Treasury Management" },
  {
    value: "receive_payments_for_goods_and_services",
    label: "Receive Payments for Goods and Services",
  },
  {
    value: "purchase_goods_and_services",
    label: "Purchase Goods and Services",
  },
  { value: "payroll", label: "Payroll" },
  { value: "ecommerce_retail_payments", label: "E-commerce / Retail Payments" },
  { value: "investment_purposes", label: "Investment Purposes" },
  {
    value: "third_party_money_transmission",
    label: "Third-Party Money Transmission",
  },
  { value: "charitable_donations", label: "Charitable Donations" },
  {
    value: "payments_to_friends_or_family_abroad",
    label: "Payments to Friends or Family Abroad",
  },
  {
    value: "personal_or_living_expenses",
    label: "Personal or Living Expenses",
  },
  { value: "protect_wealth", label: "Protect Wealth" },
  { value: "tax_optimization", label: "Tax Optimization" },
  { value: "other", label: "Other" },
];

export const SOURCE_OF_FUNDS_OPTIONS: BridgeSelectOption[] = [
  {
    value: "sales_of_goods_and_services",
    label: "Sales of Goods and Services",
  },
  { value: "owners_capital", label: "Owner's Capital" },
  { value: "investment_proceeds", label: "Investment Proceeds" },
  { value: "business_loans", label: "Business Loans" },
  { value: "grants", label: "Grants" },
  { value: "inter_company_funds", label: "Inter-Company Funds" },
  { value: "treasury_reserves", label: "Treasury Reserves" },
  { value: "third_party_funds", label: "Third-Party Funds" },
  { value: "sale_of_assets", label: "Sale of Assets" },
  { value: "legal_settlement", label: "Legal Settlement" },
  { value: "pension_retirement", label: "Pension / Retirement" },
];

export const REVENUE_OPTIONS: BridgeSelectOption[] = [
  { value: "0_99999", label: "Under $100,000" },
  { value: "100000_999999", label: "$100,000 – $999,999" },
  { value: "1000000_9999999", label: "$1M – $9.99M" },
  { value: "10000000_49999999", label: "$10M – $49.99M" },
  { value: "50000000_249999999", label: "$50M – $249.99M" },
  { value: "250000000_plus", label: "$250M+" },
];

export const HIGH_RISK_ACTIVITIES: BridgeSelectOption[] = [
  { value: "money_services", label: "Money Services" },
  {
    value: "third_party_payment_processing",
    label: "Third-Party Payment Processing",
  },
  {
    value: "operate_foreign_exchange_virtual_currencies_brokerage_otc",
    label: "Foreign Exchange / Virtual Currencies / Brokerage / OTC",
  },
  { value: "investment_services", label: "Investment Services" },
  { value: "lending_banking", label: "Lending / Banking" },
  { value: "hold_client_funds", label: "Hold Client Funds" },
  { value: "gambling", label: "Gambling" },
  { value: "adult_entertainment", label: "Adult Entertainment" },
  {
    value: "marijuana_or_related_services",
    label: "Marijuana or Related Services",
  },
  {
    value: "nicotine_tobacco_or_related_services",
    label: "Nicotine / Tobacco or Related Services",
  },
  { value: "pharmaceuticals", label: "Pharmaceuticals" },
  {
    value: "precious_metals_precious_stones_jewelry",
    label: "Precious Metals / Stones / Jewelry",
  },
  { value: "safe_deposit_box_rentals", label: "Safe Deposit Box Rentals" },
  {
    value: "weapons_firearms_and_explosives",
    label: "Weapons / Firearms / Explosives",
  },
  { value: "none_of_the_above", label: "None of the above" },
];
