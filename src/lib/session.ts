import type { QueryClient } from "@tanstack/react-query";
import { RemoveItemFromCookie } from "@/utils/CookiesFunc";
import { useUserStore } from "@/store/useUserStore";
import { useSendStore } from "@/store/Send";
import { useSwapStore } from "@/store/Swap";
import { useTopupStore } from "@/store/TopUp";
import { useCryptoSwapStore } from "@/store/CryptoSwap";
import { clearPendingPaystackCheckout } from "@/lib/paystackCheckoutSession";

let client: QueryClient | undefined;
let generation = 0;
export const sessionGeneration = () => generation;
export function registerSessionClient(queryClient: QueryClient) {
  client = queryClient;
  return () => { if (client === queryClient) client = undefined; };
}
export function refreshSessionProfile() {
  void client?.invalidateQueries({ queryKey: ["user"] });
}
export function clearLocalSession() {
  generation += 1;
  RemoveItemFromCookie("access_token");
  void client?.cancelQueries();
  client?.clear();
  const entityId = useUserStore.getState().user?.business_account?.entity_id;
  if (typeof window !== "undefined" && entityId) localStorage.removeItem(`usd-onboarding-case:${entityId}`);
  clearPendingPaystackCheckout(entityId);
  useUserStore.getState().clearUser();
  useUserStore.persist.clearStorage();
  useSendStore.setState(useSendStore.getInitialState());
  useSwapStore.setState(useSwapStore.getInitialState());
  useTopupStore.setState(useTopupStore.getInitialState());
  useCryptoSwapStore.setState(useCryptoSwapStore.getInitialState());
  if (typeof window !== "undefined") {
    // These session-only stores contain onboarding state for the old business.
    for (const key of Object.keys(sessionStorage)) {
      if (/usd.onboarding|usd-onboarding|user_data|user-data|analytics.user/i.test(key)) sessionStorage.removeItem(key);
    }
  }
}
export function endSession(deactivated = false) {
  clearLocalSession();
  if (typeof window !== "undefined") window.location.replace(deactivated ? "/login?reason=deactivated" : "/login");
}
