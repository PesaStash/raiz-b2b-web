import { create } from "zustand";
import {
  AfricaPayinSessionSnapshot,
  GuestAfricaPayinStep,
  GuestSendSlice,
  initialGuestSendState,
} from "./guestSendSlice.types";

const SESSION_KEY_PREFIX = "africa-payin-session:";

export const getAfricaPayinSessionKey = (username: string) =>
  `${SESSION_KEY_PREFIX}${username.toLowerCase()}`;

export const loadAfricaPayinSession = (
  username: string,
): AfricaPayinSessionSnapshot | null => {
  if (typeof window === "undefined" || !username) return null;
  try {
    const raw = sessionStorage.getItem(getAfricaPayinSessionKey(username));
    if (!raw) return null;
    return JSON.parse(raw) as AfricaPayinSessionSnapshot;
  } catch {
    return null;
  }
};

export const saveAfricaPayinSession = (
  username: string,
  snapshot: AfricaPayinSessionSnapshot,
) => {
  if (typeof window === "undefined" || !username || !snapshot.payin_id) return;
  try {
    sessionStorage.setItem(
      getAfricaPayinSessionKey(username),
      JSON.stringify(snapshot),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
};

export const clearAfricaPayinSession = (username?: string) => {
  if (typeof window === "undefined") return;
  try {
    if (username) {
      sessionStorage.removeItem(getAfricaPayinSessionKey(username));
      return;
    }
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(SESSION_KEY_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore storage failures.
  }
};

export const isTerminalAfricaPayinStatus = (status?: string | null) => {
  return (
    status === "complete" ||
    status === "completed" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "canceled"
  );
};

export const isSuccessAfricaPayinStatus = (status?: string | null) =>
  status === "complete" || status === "completed";

export const isCancelledAfricaPayinStatus = (status?: string | null) =>
  status === "cancelled" || status === "canceled";

export const normalizeAfricaPayinStep = (
  status: string | null | undefined,
  fallback: GuestAfricaPayinStep = "details",
): GuestAfricaPayinStep => {
  if (isSuccessAfricaPayinStatus(status)) return "status";
  if (status === "failed") return "status";
  if (isCancelledAfricaPayinStatus(status)) return "status";
  if (status === "pending") return "instructions";
  if (status === "created") return "summary";
  return fallback;
};

export const useGuestSendStore = create<GuestSendSlice>((set) => ({
  ...initialGuestSendState,
  actions: {
    setField: (key, value) => set((state) => ({ ...state, [key]: value })),
    setFields: (fields) => set((state) => ({ ...state, ...fields })),
    reset: () => set(() => ({ ...initialGuestSendState })),
    resetPaymentSession: () => {
      set((state) => ({
        ...state,
        ...initialGuestSendState,
        guestLocalCurrency: state.guestLocalCurrency,
        actions: state.actions,
      }));
    },
  },
}));

export const buildAfricaPayinSessionSnapshot = (
  username: string,
): AfricaPayinSessionSnapshot | null => {
  const state = useGuestSendStore.getState();
  if (!state.payin_id) return null;
  return {
    username,
    payin_id: state.payin_id,
    lifecycleStep: state.lifecycleStep,
    amount: state.amount,
    payout_currency: state.payout_currency,
    channel_id: state.channel_id,
    channel_name: state.channel_name,
    network_id: state.network_id,
    network_name: state.network_name,
    account_type: state.account_type,
    sender_name: state.sender_name,
    purpose: state.purpose,
    transaction_description: state.transaction_description || state.purpose,
    expires_at: state.expires_at,
    payment_instruction: state.payment_instruction,
    collection_method: state.collection_method,
    status: state.status,
    guestLocalCurrency: state.guestLocalCurrency,
    guestAccount: state.guestAccount,
  };
};
