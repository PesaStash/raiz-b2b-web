import { useEffect } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ICurrencyName } from "@/types/misc";

export function useSyncSelectedCurrency({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const { user } = useUser();
  const { selectedCurrency, syncWithUser } = useCurrencyStore();
  const { actions: sendActions } = useSendStore();

  useEffect(() => {
    if (!enabled) return;
    syncWithUser(user);
  }, [enabled, user, syncWithUser]);

  useEffect(() => {
    if (!enabled || !user) return;

    const currency = selectedCurrency.name as ICurrencyName;
    sendActions.selectCurrency(currency);
  }, [enabled, user, selectedCurrency.name, sendActions]);
}
