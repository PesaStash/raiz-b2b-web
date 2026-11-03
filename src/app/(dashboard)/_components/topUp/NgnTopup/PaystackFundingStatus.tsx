"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Overlay from "@/components/ui/Overlay";
import { usePaystackCollectionPolling } from "@/lib/hooks/usePaystackCollectionPolling";
import { formatDecimalMoney } from "@/lib/paystackCardCollection";
import { clearPendingPaystackCheckout } from "@/lib/paystackCheckoutSession";
import type { PendingPaystackCheckout } from "@/types/paystackCardCollection";
import { trackPaystackFunding } from "@/utils/analytics/paystackFunding";
import PaystackStatusPanel from "./PaystackStatusPanel";

interface Props {
  checkout: PendingPaystackCheckout;
  entityId: string;
  /** `acknowledged` is true once a terminal result was shown and dismissed. */
  onClose: (acknowledged: boolean) => void;
  onStartNew?: () => void;
  variant?: "overlay" | "page";
}

const openSupportEmail = (reference: string) => {
  const subject = encodeURIComponent(`Card funding payment ${reference}`);
  const body = encodeURIComponent(
    `Hello Support Team,\n\nI need help with an NGN card funding payment.\nRaiz reference: ${reference}\n\nThank you!`,
  );
  window.open(`mailto:support@raiz.app?subject=${subject}&body=${body}`, "_blank");
};

const PaystackFundingStatus = ({ checkout, entityId, onClose, onStartNew, variant = "overlay" }: Props) => {
  const router = useRouter();
  const { payment, viewState, phase, error, refresh } = usePaystackCollectionPolling(checkout.reference);

  useEffect(() => {
    trackPaystackFunding(
      "paystack_card_funding_checkout_closed",
      { collection_id: checkout.collection_id, reference: checkout.reference, wallet_id: checkout.wallet_id },
      `paystack_card_funding_checkout_closed:${checkout.reference}`,
    );
  }, [checkout.collection_id, checkout.reference, checkout.wallet_id]);

  const isNotFound = phase === "error" && error?.kind === "collection_not_found";
  useEffect(() => {
    if (isNotFound) clearPendingPaystackCheckout(entityId);
  }, [isNotFound, entityId]);

  const principal = formatDecimalMoney(payment?.principal_amount ?? checkout.principal_amount);
  const total = formatDecimalMoney(payment?.total_amount ?? checkout.total_amount);
  const details = [
    { label: "Amount to wallet", value: principal },
    { label: "Total card charge", value: total },
    { label: "Reference", value: checkout.reference },
  ];

  const acknowledge = () => {
    clearPendingPaystackCheckout(entityId);
    onClose(true);
  };
  const checkLater = () => onClose(false);
  const support = { label: "Contact support", onClick: () => openSupportEmail(checkout.reference) };

  const renderPanel = () => {
    if (phase === "terminal") {
      switch (viewState) {
        case "success":
          return (
            <PaystackStatusPanel
              icon="success"
              title="Payment complete"
              message={`${principal} has been added to your NGN wallet.`}
              details={details}
              secondary={{
                label: "View transactions",
                onClick: () => {
                  acknowledge();
                  router.push("/transactions");
                },
              }}
              primary={{ label: "Done", onClick: acknowledge }}
            />
          );
        case "failed":
          return (
            <PaystackStatusPanel
              icon="failed"
              title="Payment unsuccessful"
              message="This card payment was not completed. Your wallet was not credited."
              details={details}
              secondary={
                onStartNew
                  ? {
                      label: "Start new payment",
                      onClick: () => {
                        clearPendingPaystackCheckout(entityId);
                        onStartNew();
                      },
                    }
                  : undefined
              }
              primary={{ label: "Done", onClick: acknowledge }}
            />
          );
        case "review":
          return (
            <PaystackStatusPanel
              icon="pending"
              title="Payment under review"
              message="Your payment is being reviewed. Your wallet has not been credited yet. Please contact support if this status does not change."
              details={details}
              secondary={support}
              primary={{ label: "Done", onClick: acknowledge }}
            />
          );
        case "disputed":
          return (
            <PaystackStatusPanel
              icon="failed"
              title="Payment under dispute"
              message="This payment is under dispute and account access may be restricted. Please contact support for assistance."
              details={details}
              secondary={support}
              primary={{ label: "Done", onClick: acknowledge }}
            />
          );
        default:
          break;
      }
    }

    if (isNotFound) {
      return (
        <PaystackStatusPanel
          icon="failed"
          title="Payment not found"
          message="We couldn't find this card payment on your business account. Check your wallet activity for recent payments."
          primary={{ label: "Done", onClick: () => onClose(true) }}
        />
      );
    }

    if (phase === "error") {
      return (
        <PaystackStatusPanel
          icon="pending"
          title="Unable to check payment"
          message={error?.message || "We couldn't check this payment right now."}
          details={details}
          secondary={{ label: "Try again", onClick: refresh }}
          primary={{ label: "Check later", onClick: checkLater }}
        />
      );
    }

    if (phase === "timed_out") {
      return (
        <PaystackStatusPanel
          icon="pending"
          title="Still processing"
          message="Paystack is still confirming this payment. You can refresh this status here or check your wallet activity later."
          details={details}
          secondary={{ label: "Refresh status", onClick: refresh }}
          primary={{ label: "Check later", onClick: checkLater }}
        />
      );
    }

    return (
      <PaystackStatusPanel
        icon="pending"
        title="Confirming your payment"
        message="We're confirming your card payment. Keep this screen open, or check your wallet activity in a few minutes."
        busy
        details={details}
        primary={{ label: "Check later", onClick: checkLater }}
      />
    );
  };

  const content = <div className="flex flex-col  w-full">{renderPanel()}</div>;

  if (variant === "page") {
    return <div className="w-full max-w-[400px]">{content}</div>;
  }

  return (
    <Overlay close={() => {}} width="400px">
      {content}
    </Overlay>
  );
};

export default PaystackFundingStatus;
