import { IChain, ITiers } from "@/types/misc";

export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const FOREIGN_ACCOUNT_ACTIVATION_FEE_USD = 3;
export const FOREIGN_MIN_SEND_AMOUNT = 3;

export const ACCOUNT_CURRENCIES = {
  USD: { name: "USD", sign: "$", logo: "/icons/flag-us.webp" } as const,
  NGN: { name: "NGN", sign: "₦", logo: "/icons/flag-ng.png" } as const,
  GBP: { name: "GBP", sign: "£", logo: "/icons/flag-gb.png" } as const,
  EUR: { name: "EUR", sign: "€", logo: "/icons/flag-fr.png" } as const,
  SBC: { name: "SBC", sign: "$", logo: "/icons/sbc.svg" } as const,
} as const;
export const CRYPTO_SWAP_ACCOUNT_CURRENCIES = {
  USD: { name: "USD", sign: "$" } as const,
  SBC: { name: "SBC", sign: "$" } as const,
} as const;

export const tiers: ITiers[] = [
  { level: "Amateur ", min: 0, max: 24 },
  { level: "Senior  ", min: 25, max: 49 },
  { level: "Professional", min: 50, max: 99 },
  { level: "Leader", min: 100, max: 199 },
  { level: "Expert", min: 200, max: 399 },
  { level: "Master", min: 400, max: 749 },
  { level: "Veteran", min: 750, max: 999 },
];

export const monthsData = [
  { id: "01", value: "Jan" },
  { id: "02", value: "Feb" },
  { id: "03", value: "Mar" },
  { id: "04", value: "Apr" },
  { id: "05", value: "May" },
  { id: "06", value: "Jun" },
  { id: "07", value: "Jul" },
  { id: "08", value: "Aug" },
  { id: "09", value: "Sep" },
  { id: "10", value: "Oct" },
  { id: "11", value: "Nov" },
  { id: "12", value: "Dec" },
];

export const CHAINS: { name: string; value: IChain; icon: string }[] = [
  {
    name: "BNB Smart Chain (BEP20)",
    value: "bsc",
    icon: "/icons/bsc.svg",
  },
  {
    name: "Tron (TRC20)",
    value: "tron",
    icon: "/icons/tron.svg",
  },
  {
    name: "Polygon",
    value: "polygon",
    icon: "/icons/polygon.svg",
  },
  {
    name: "Ethereum (ERC20)",
    value: "ethereum",
    icon: "/icons/eth.svg",
  },
];
export const USAstateCodes = [
  { name: "Alabama", abbreviation: "AL" },
  { name: "Alaska", abbreviation: "AK" },
  { name: "Arizona", abbreviation: "AZ" },
  { name: "Arkansas", abbreviation: "AR" },
  { name: "California", abbreviation: "CA" },
  { name: "Colorado", abbreviation: "CO" },
  { name: "Connecticut", abbreviation: "CT" },
  { name: "Delaware", abbreviation: "DE" },
  { name: "Florida", abbreviation: "FL" },
  { name: "Georgia", abbreviation: "GA" },
  { name: "Hawaii", abbreviation: "HI" },
  { name: "Idaho", abbreviation: "ID" },
  { name: "Illinois", abbreviation: "IL" },
  { name: "Indiana", abbreviation: "IN" },
  { name: "Iowa", abbreviation: "IA" },
  { name: "Kansas", abbreviation: "KS" },
  { name: "Kentucky", abbreviation: "KY" },
  { name: "Louisiana", abbreviation: "LA" },
  { name: "Maine", abbreviation: "ME" },
  { name: "Maryland", abbreviation: "MD" },
  { name: "Massachusetts", abbreviation: "MA" },
  { name: "Michigan", abbreviation: "MI" },
  { name: "Minnesota", abbreviation: "MN" },
  { name: "Mississippi", abbreviation: "MS" },
  { name: "Missouri", abbreviation: "MO" },
  { name: "Montana", abbreviation: "MT" },
  { name: "Nebraska", abbreviation: "NE" },
  { name: "Nevada", abbreviation: "NV" },
  { name: "New Hampshire", abbreviation: "NH" },
  { name: "New Jersey", abbreviation: "NJ" },
  { name: "New Mexico", abbreviation: "NM" },
  { name: "New York", abbreviation: "NY" },
  { name: "North Carolina", abbreviation: "NC" },
  { name: "North Dakota", abbreviation: "ND" },
  { name: "Ohio", abbreviation: "OH" },
  { name: "Oklahoma", abbreviation: "OK" },
  { name: "Oregon", abbreviation: "OR" },
  { name: "Pennsylvania", abbreviation: "PA" },
  { name: "Rhode Island", abbreviation: "RI" },
  { name: "South Carolina", abbreviation: "SC" },
  { name: "South Dakota", abbreviation: "SD" },
  { name: "Tennessee", abbreviation: "TN" },
  { name: "Texas", abbreviation: "TX" },
  { name: "Utah", abbreviation: "UT" },
  { name: "Vermont", abbreviation: "VT" },
  { name: "Virginia", abbreviation: "VA" },
  { name: "Washington", abbreviation: "WA" },
  { name: "West Virginia", abbreviation: "WV" },
  { name: "Wisconsin", abbreviation: "WI" },
  { name: "Wyoming", abbreviation: "WY" },
];
