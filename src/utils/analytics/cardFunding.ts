import type {
  CardFundingAnalyticsProps,
  CardFundingEventName,
} from "@/types/analytics";
import { CARD_PAYMENT_PROVIDER } from "@/lib/cardCollection";
import { pushDataLayerEvent } from "./dataLayer";

export function trackCardFunding(
  event: CardFundingEventName,
  props: Omit<CardFundingAnalyticsProps, "actor_type" | "provider"> &
    Partial<Pick<CardFundingAnalyticsProps, "provider">> = {},
  dedupId?: string,
): void {
  const { provider, ...rest } = props;
  pushDataLayerEvent(
    event,
    {
      actor_type: "business",
      provider: provider ?? CARD_PAYMENT_PROVIDER,
      ...rest,
    },
    dedupId ? { dedupId } : undefined,
  );
}
