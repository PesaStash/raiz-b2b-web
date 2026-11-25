import type { IEntity, IWallet } from "@/types/user";

export const NGN_HOLDING_LIMIT = 300_000;

export function isWalletOnly(wallet?: IWallet | null) {
  const code = wallet?.wallet_type?.wallet_type_code;
  return code === 4 || code === 5;
}

export function hasBankDetails(wallet?: IWallet | null) {
  if (!wallet || isWalletOnly(wallet)) return false;
  const { wallet_type, wallet_status, account_number, bank_name, iban, routing } = wallet;
  if (wallet_status && !["active", "activated", "complete", "completed"].includes(wallet_status)) return false;

  const number = account_number?.trim();
  const hasNumber = !!number && !number.includes("@");
  if (wallet_type.currency === "NGN") return hasNumber && !!bank_name?.trim();
  if (wallet_type.currency === "USD") {
    return hasNumber && !!routing?.some((item) => item.routing?.trim());
  }
  return !!iban?.trim() || hasNumber;
}

export function isEntityRestricted(entity?: IEntity) {
  return !!(entity?.is_entity_blocked || entity?.is_entity_closed ||
    entity?.is_entity_blacklisted || entity?.is_entity_frozen);
}

function decimalParts(value: string | number | undefined) {
  const match = /^(-?\d+)(?:\.(\d+))?$/.exec(String(value));
  return match ? { whole: match[1], fraction: match[2] ?? "" } : undefined;
}

export function ngnHeadroom(bookedBalance: string | number | undefined) {
  const booked = decimalParts(bookedBalance);
  if (!booked) return undefined;
  const places = booked.fraction.length;
  const scale = BigInt(10) ** BigInt(places);
  const room = BigInt(NGN_HOLDING_LIMIT) * scale - BigInt(booked.whole + booked.fraction);
  if (room <= BigInt(0)) return "0";
  if (!places) return String(room);
  return `${room / scale}.${String(room % scale).padStart(places, "0")}`;
}

export function exceedsNgnHeadroom(
  bookedBalance: string | number | undefined,
  netCredit: string | number,
) {
  const room = decimalParts(ngnHeadroom(bookedBalance));
  const credit = decimalParts(netCredit);
  if (!room || !credit) return false;
  const places = Math.max(room.fraction.length, credit.fraction.length);
  return BigInt(credit.whole + credit.fraction.padEnd(places, "0")) >
    BigInt(room.whole + room.fraction.padEnd(places, "0"));
}

export function isNgnHoldingLimitError(message?: string) {
  return /(?:NGN|naira).{0,45}(?:cannot hold|holding limit|balance limit)|(?:cannot hold|holding limit|balance limit).{0,45}(?:NGN|naira|₦)/i
    .test(message ?? "");
}
