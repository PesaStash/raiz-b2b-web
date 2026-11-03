import type {
  PaystackFundingAnalyticsProps,
  PaystackFundingEventName,
} from "@/types/analytics";
import { pushDataLayerEvent } from "./dataLayer";

export function trackPaystackFunding(
  event: PaystackFundingEventName,
  props: Omit<PaystackFundingAnalyticsProps, "actor_type"> = {},
  dedupId?: string,
): void {
  pushDataLayerEvent(
    event,
    { actor_type: "business", ...props },
    dedupId ? { dedupId } : undefined,
  );
}
