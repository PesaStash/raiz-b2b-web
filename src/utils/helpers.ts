import { months, tiers } from "@/constants/misc";
import { toast } from "sonner";
import * as CryptoJS from "crypto-js";
import { ICurrencyName, SwapPairResult } from "@/types/misc";
import { IUser, IWallet } from "@/types/user";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { CurrencyTypeKey } from "@/store/Swap/swapSlice.types";

dayjs.extend(utc);

export const getLastThreeMonths = () => {
  const currentMonth = new Date().getMonth();
  return [
    months[(currentMonth + 11) % 12], // Previous month
    months[currentMonth], // Current month
    months[(currentMonth + 1) % 12], // Next month
  ];
};

// Format time to display as "00:59"
export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

export const truncateString = (str: string, length: number): string => {
  return str?.length > length ? `${str?.substring(0, length - 2)}...` : str;
};

export const copyToClipboard = (value: string) => {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      toast.success("Copied to clipboard");
    })
    .catch((error) => {
      toast.error("Unable to copy to clipboard:", error);
    });
};

export const getInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

export function extractObjectUrlFromSignedUrl(signedUrl: string): string {
  const url = new URL(signedUrl);
  return url.origin + url.pathname;
}

export const getTierInfo = (value: number) => {
  const currentTier =
    tiers.find((tier) => value >= tier.min && value <= tier.max) || tiers[0];

  const currentTierIndex = tiers.findIndex(
    (tier) => value >= tier.min && value <= tier.max
  );

  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < tiers.length - 1
      ? tiers[currentTierIndex + 1]
      : tiers[tiers.length - 1];

  return { currentTier, nextTier };
};

export const getAppRatingLink = () => {
  if (typeof window !== "undefined") {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.userAgent.toLowerCase();

    if (/android/i.test(userAgent)) {
      return "https://play.google.com/store/apps/details?id=com.raiz.application&hl=en&pli=1";
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return "https://apps.apple.com/us/app/raiz-app/id6502309659?mt=8";
    } else if (platform.includes("win")) {
      return "https://play.google.com/store/apps/details?id=com.raiz.application&hl=en&pli=1";
    } else if (platform.includes("mac")) {
      return "https://apps.apple.com/us/app/raiz-app/id6502309659?mt=8";
    }
  }

  return "https://apps.apple.com/us/app/raiz-app/id6502309659?mt=8";
};

export const iv = CryptoJS.enc.Hex.parse("000102030405060708090a0b0c0d0e0f");

export const passwordHash = (password: string): string => {
  const fixedSalt = "myFixedSalt";
  const keySize = 256 / 32; // 256-bit key size
  const iterations = 1000;
  const key = CryptoJS.PBKDF2(password, fixedSalt, {
    keySize,
    iterations,
  });
  // Use the derived key for encryption
  return CryptoJS.AES.encrypt(password, key, {
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.Pkcs7,
    iv,
  }).toString();
};

export const findWalletByCurrency = (
  user: IUser | undefined,
  currency: ICurrencyName
) => {
  return user?.business_account?.wallets?.find(
    (acct: { wallet_type: { currency: string } }) =>
      acct.wallet_type.currency === currency
  );
};

export const getDaysBetween = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) =>
  endDate.diff(startDate, "day") + 1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const groupByDate = <T extends Record<string, any>>(
  items: T[],
  dateField: keyof T
): Record<string, T[]> => {
  const grouped: Record<string, T[]> = {};

  items.forEach((item) => {
    const dateValue = item[dateField];
    if (typeof dateValue !== "string") return; // Ensure it's a string before passing to dayjs

    const createdAt = dayjs(dateValue);
    let groupKey = createdAt.format("D MMMM"); // Default format: "2nd February"

    if (createdAt.isSame(dayjs(), "day")) {
      groupKey = "Today";
    } else if (createdAt.isSame(dayjs().subtract(1, "day"), "day")) {
      groupKey = "Yesterday";
    } else if (createdAt.isSame(dayjs().subtract(2, "day"), "day")) {
      groupKey = "2 days ago";
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(item);
  });

  return grouped;
};

const currencySymbols: Record<string, string> = {
  USD: "$", // US Dollar
  NGN: "₦", // Nigerian Naira
  EUR: "€", // Euro
  GBP: "£", // British Pound
  JPY: "¥", // Japanese Yen
  CNY: "¥", // Chinese Yuan
  INR: "₹", // Indian Rupee
  CAD: "C$", // Canadian Dollar
  AUD: "A$", // Australian Dollar
  NZD: "NZ$", // New Zealand Dollar
  CHF: "CHF", // Swiss Franc
  SEK: "kr", // Swedish Krona
  NOK: "kr", // Norwegian Krone
  DKK: "kr", // Danish Krone
  ZAR: "R", // South African Rand
  BRL: "R$", // Brazilian Real
  MXN: "$", // Mexican Peso
  RUB: "₽", // Russian Ruble
  KRW: "₩", // South Korean Won
  SGD: "S$", // Singapore Dollar
  HKD: "HK$", // Hong Kong Dollar
  TRY: "₺", // Turkish Lira
  SAR: "﷼", // Saudi Riyal
  AED: "د.إ", // UAE Dirham
  ARS: "$", // Argentine Peso
  CLP: "$", // Chilean Peso
  COP: "$", // Colombian Peso
  MYR: "RM", // Malaysian Ringgit
  THB: "฿", // Thai Baht
  IDR: "Rp", // Indonesian Rupiah
  PHP: "₱", // Philippine Peso
  VND: "₫", // Vietnamese Dong
  EGP: "£", // Egyptian Pound
  KES: "KSh", // Kenyan Shilling
  GHS: "₵", // Ghanaian Cedi
  TZS: "TSh", // Tanzanian Shilling
  UGX: "USh", // Ugandan Shilling
  RWF: "FRw", // Rwandan Franc
  BIF: "FBu", // Burundian Franc
  XOF: "CFA", // West African CFA franc (BCEAO)
  XAF: "FCFA", // Central African CFA franc (BEAC)
  ZMW: "ZK", // Zambian Kwacha
  MZN: "MT", // Mozambican Metical
  MWK: "MK", // Malawian Kwacha
  GMD: "D", // Gambian Dalasi
  SLL: "Le", // Sierra Leonean Leone
  LRD: "$L", // Liberian Dollar
  GNF: "FG", // Guinean Franc
  MAD: "د.م.", // Moroccan Dirham
  DZD: "دج", // Algerian Dinar
  TND: "د.ت", // Tunisian Dinar
  LYD: "ل.د", // Libyan Dinar
  SDG: "ج.س.", // Sudanese Pound
  SSP: "£", // South Sudanese Pound
  ERN: "Nfk", // Eritrean Nakfa
  ETB: "Br", // Ethiopian Birr
  DJF: "Fdj", // Djiboutian Franc
  SOS: "Sh.So.", // Somali Shilling
  SZL: "E", // Swazi Lilangeni
  NAD: "$", // Namibian Dollar
  BWP: "P", // Botswana Pula
  MUR: "₨", // Mauritian Rupee
  SCR: "₨", // Seychellois Rupee
  MGA: "Ar", // Malagasy Ariary
  KMF: "CF", // Comorian Franc
  CVE: "$", // Cape Verdean Escudo
  STD: "Db", // São Tomé and Príncipe Dobra
  MRU: "UM", // Mauritanian Ouguiya
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return currencySymbols[currencyCode] || currencyCode;
};

export const formatRelativeTime = (date: Date | string) => {
  const localDate =
    typeof date === "string" ? dayjs.utc(date).local() : dayjs(date);

  const time = localDate.fromNow(true);
  return time
    .replace("minutes", "min")
    .replace("hours", "hr")
    .replace("seconds", "sec");
};

export const convertTime = (utcTime: Date | string): string => {
  return dayjs.utc(utcTime).local().format("YYYY-MM-DD HH:mm:ss");
};

export function convertToTitle(input: string): string {
  const words = input?.split("_").map((word) => {
    return word?.charAt(0).toUpperCase() + word?.slice(1).toLowerCase();
  });
  return words?.join(" ");
}
export function convertField(input: string): string {
  if (input === "account_number" || input === "account number") {
    return "Account Number";
  }
  return convertToTitle(input);
}

export const getReadablePatternMessage = (
  pattern: string,
  fieldName: string
) => {
  const fieldLabel = fieldName.replace(/_/g, " ").toLowerCase();

  const patternMessages: Record<string, string> = {
    "^\\d{9}$": `${fieldLabel} must be exactly 9 digits`,
    "^\\d{10}$": `${fieldLabel} must be exactly 10 digits`,
    "^[a-zA-Z]+$": `${fieldLabel} must contain only letters`,
    "^[0-9]+$": `${fieldLabel} must contain only numbers`,
    "^[a-zA-Z0-9]+$": `${fieldLabel} must contain only letters and numbers`,
  };

  return patternMessages[pattern] || `${fieldLabel} format is invalid`;
};

export const formatCardNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");
  // Split into groups of 4 and join with spaces
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(" ").slice(0, 19); // Limit to 19 chars (16 digits + 3 spaces)
};

// Utility function to remove undefined values from an object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeUndefinedValues = <T extends Record<string, any>>(
  obj: T
): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Skip undefined values
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recursively clean nested objects
      cleaned[key] = removeUndefinedValues(value);
    } else if (Array.isArray(value)) {
      // Handle arrays by cleaning each element
      cleaned[key] = value
        .map((item) =>
          item !== null && typeof item === "object" && !Array.isArray(item)
            ? removeUndefinedValues(item)
            : item
        )
        .filter((item) => item !== undefined);
    } else {
      // Copy non-undefined, non-object values
      cleaned[key] = value;
    }
  }

  return cleaned as T;
};

export const fetchPublicIP = async (): Promise<string | null> => {
  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip;
  } catch (err) {
    console.log("ip ERRRROR IP", err);
    return null;
  }
};

export const formatAmount = (
  value: number,
  options?: {
    currency?: string;
  } & Intl.NumberFormatOptions
): string => {
  const { currency, ...restOptions } = options ?? {};

  const formatterOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...restOptions,
  };

  // Only add currency-related options if currency is provided
  if (currency) {
    formatterOptions.style = "currency";
    formatterOptions.currency = currency.toUpperCase();
  }

  return value?.toLocaleString("en-US", formatterOptions);
};

export const downloadInvoice = async (
  elementRef: React.RefObject<HTMLDivElement | null>,
  invoiceNumber: string,
  format: "png" | "pdf" = "pdf"
) => {
  if (!elementRef.current) return;

  try {
    const canvas = await html2canvas(elementRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    if (format === "png") {
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${invoiceNumber}.png`;
      link.click();
      link.remove();
    } else {
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width
      const pageHeight = 297; // A4 height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${invoiceNumber}.pdf`);
    }
  } catch (err) {
    console.error("Failed to download invoice:", err);
    alert("Failed to download invoice. Please try again.");
  }
};

export const generateInvoicePDFBlob = async (
  elementRef: React.RefObject<HTMLDivElement | null>
): Promise<Blob | null> => {
  if (!elementRef.current) return null;

  const canvas = await html2canvas(elementRef.current, {
    scale: 1.5, // Reduced from 2 to 1.5 for smaller file size (still good quality)
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 0,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.85); // 85% quality JPEG

  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Use JPEG instead of PNG for smaller file size
  pdf.addImage(
    imgData,
    "JPEG",
    0,
    position,
    imgWidth,
    imgHeight,
    undefined,
    "FAST"
  );
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(
      imgData,
      "JPEG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );
    heightLeft -= pageHeight;
  }

  const blob = pdf.output("blob");
  return blob;
};

export const uploadPDF = async (file: Blob, fileName: string) => {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url as string;
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const sanitizeAddressField = (value: string): string => {
  if (!value) return value;
  // Normalize accented characters (é → e, à → a, etc.)
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Keep only allowed characters: a-zA-Z0-9\s\-'&.,#/
  const sanitized = normalized.replace(/[^a-zA-Z0-9\s\-'&.,#/]/g, "");
  // Clean up multiple spaces
  return sanitized.replace(/\s+/g, " ").trim();
};

export const toMinorUnitWithDecimals = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor);
};

const currencyMinorUnits: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  NGN: 2,
  JPY: 0,
  KWD: 3,
};

export const toMinorUnitByCurrency = (
  value: number,
  currency: string,
  fallbackDecimals = 2
) => {
  const dec = currencyMinorUnits[currency?.toUpperCase()] ?? fallbackDecimals;
  return toMinorUnitWithDecimals(value, dec);
};

export const toMinorUnit = (value: number) => toMinorUnitWithDecimals(value, 2);

export const determineSwapPair = (
  currentCurrency: CurrencyTypeKey,
  wallets: IWallet[]
): SwapPairResult => {
  const availableCurrencies = wallets.map((w) => w.wallet_type.currency);

  // Check what wallets the user has
  const hasUSD = availableCurrencies.includes("USD");
  const hasNGN = availableCurrencies.includes("NGN");
  const hasSBC = availableCurrencies.includes("SBC");

  switch (currentCurrency) {
    case "USD":
      // USD can swap to NGN or SBC (prioritize NGN if both exist)
      if (hasNGN) {
        return {
          fromCurrency: "USD",
          toCurrency: "NGN",
          isValid: true,
        };
      } else if (hasSBC) {
        return {
          fromCurrency: "USD",
          toCurrency: "SBC",
          isValid: true,
        };
      }
      return {
        fromCurrency: "USD",
        toCurrency: "NGN",
        isValid: false,
        message: "You need an NGN or SBC wallet to swap from USD",
      };

    case "NGN" as CurrencyTypeKey:
      // NGN can only swap to USD
      if (hasUSD) {
        return {
          fromCurrency: "NGN",
          toCurrency: "USD",
          isValid: true,
        };
      }
      return {
        fromCurrency: "NGN",
        toCurrency: "USD",
        isValid: false,
        message: "You need a USD wallet to swap from NGN",
      };

    case "SBC":
      // SBC can only swap to USD (NOT to NGN)
      if (hasUSD) {
        return {
          fromCurrency: "SBC",
          toCurrency: "USD",
          isValid: true,
        };
      }
      return {
        fromCurrency: "SBC",
        toCurrency: "USD",
        isValid: false,
        message: "You need a USD wallet to swap from SBC",
      };

    default:
      return {
        fromCurrency: currentCurrency,
        toCurrency: "USD",
        isValid: false,
        message: "Invalid currency selected",
      };
  }
};

export const getAvailableSwapDestinations = (
  fromCurrency: CurrencyTypeKey,
  wallets: IWallet[]
): CurrencyTypeKey[] => {
  const availableCurrencies = wallets.map(
    (w) => w.wallet_type.currency as CurrencyTypeKey
  );

  switch (fromCurrency) {
    case "USD":
      // USD can swap to both NGN and SBC
      return availableCurrencies.filter(
        (c): c is CurrencyTypeKey => c === "NGN" || c === "SBC"
      );

    case "NGN":
      // NGN can only swap to USD
      return availableCurrencies.filter(
        (c): c is CurrencyTypeKey => c === "USD"
      );

    case "SBC":
      // SBC can only swap to USD (not NGN)
      return availableCurrencies.filter(
        (c): c is CurrencyTypeKey => c === "USD"
      );

    default:
      return [];
  }
};
