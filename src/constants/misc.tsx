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

export const nigeriaStates = [
  { value: "abia", label: "Abia" },
  { value: "adamawa", label: "Adamawa" },
  { value: "akwa_ibom", label: "Akwa Ibom" },
  { value: "anambra", label: "Anambra" },
  { value: "bauchi", label: "Bauchi" },
  { value: "bayelsa", label: "Bayelsa" },
  { value: "benue", label: "Benue" },
  { value: "borno", label: "Borno" },
  { value: "cross_river", label: "Cross River" },
  { value: "delta", label: "Delta" },
  { value: "ebonyi", label: "Ebonyi" },
  { value: "edo", label: "Edo" },
  { value: "ekiti", label: "Ekiti" },
  { value: "enugu", label: "Enugu" },
  { value: "gombe", label: "Gombe" },
  { value: "imo", label: "Imo" },
  { value: "jigawa", label: "Jigawa" },
  { value: "kaduna", label: "Kaduna" },
  { value: "kano", label: "Kano" },
  { value: "katsina", label: "Katsina" },
  { value: "kebbi", label: "Kebbi" },
  { value: "kogi", label: "Kogi" },
  { value: "kwara", label: "Kwara" },
  { value: "lagos", label: "Lagos" },
  { value: "nasarawa", label: "Nasarawa" },
  { value: "niger", label: "Niger" },
  { value: "ogun", label: "Ogun" },
  { value: "ondo", label: "Ondo" },
  { value: "osun", label: "Osun" },
  { value: "oyo", label: "Oyo" },
  { value: "plateau", label: "Plateau" },
  { value: "rivers", label: "Rivers" },
  { value: "sokoto", label: "Sokoto" },
  { value: "taraba", label: "Taraba" },
  { value: "yobe", label: "Yobe" },
  { value: "zamfara", label: "Zamfara" },
  { value: "fct", label: "Federal Capital Territory" },
];

export const ACCOUNT_CURRENCIES = {
  USD: { name: "USD", sign: "$", logo: "/icons/flag-us.webp" } as const,
  NGN: { name: "NGN", sign: "₦", logo: "/icons/flag-ng.png" } as const,
  SBC: { name: "SBC", sign: "$", logo: "/icons/sbc.svg" } as const,
} as const;

export const SWAP_ACCOUNT_CURRENCIES = {
  USD: { name: "USD", sign: "$" } as const,
  NGN: { name: "NGN", sign: "₦" } as const,
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

export const WALLET_TYPES = {
  1: "USD Holding Account",
  2: "NGN Holding Account",
  3: "Crypto Holding Wallet",
  4: "Naira virtual wallet",
  5: "USD Holding Wallet",
};
