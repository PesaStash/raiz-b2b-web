import type { IBusinessAccount } from "../types/user.ts";
import { isAccountReady, isGlobalBalance } from "./globalBalance.ts";

export function invoicePaymentReady(account: IBusinessAccount | undefined, currency: string | null | undefined): boolean {
  if (!account || !currency || account.entity?.is_entity_blocked || account.entity?.is_entity_frozen || account.entity?.is_entity_closed || account.entity?.is_entity_blacklisted) return false;
  if (isGlobalBalance(account)) return !!account.balances?.some(balance => balance.currency === currency && isAccountReady(balance.status));
  return !!account.wallets?.some(wallet => wallet.wallet_type?.currency === currency && isAccountReady(wallet.wallet_status ?? wallet.status ?? undefined));
}

export const invoiceUnavailableMessage = "You can save this invoice, but you can only email a payment request once your receiving account for this currency is approved and opened.";
