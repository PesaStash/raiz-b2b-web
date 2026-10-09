"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/lib/hooks/useUser";
import { consumePaystackCallbackReference, resolvePaystackCheckout } from "@/lib/paystackCallback";
import type { PendingPaystackCheckout } from "@/types/paystackCardCollection";
import PaystackFundingStatus from "@/app/(dashboard)/_components/topUp/NgnTopup/PaystackFundingStatus";
import PaystackStatusPanel from "@/app/(dashboard)/_components/topUp/NgnTopup/PaystackStatusPanel";
import PaystackCardTopUp from "@/app/(dashboard)/_components/topUp/NgnTopup/PaystackCardTopUp";
import PaystackAppReturn from "@/app/(dashboard)/_components/topUp/NgnTopup/PaystackAppReturn";
import { GetItemFromCookie } from "@/utils/CookiesFunc";

/**
 * Paystack redirect target shared by web and mobile. Without a web session the
 * visitor is a mobile checkout and is handed back to the app; signed-in web
 * users get status polling. The redirect itself never confirms payment.
 */
const PaystackCallbackPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const entityId = user?.business_account?.entity_id;
  const [checkout, setCheckout] = useState<PendingPaystackCheckout | null | undefined>(undefined);
  const [startNew, setStartNew] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | undefined>(undefined);
  const callbackReferenceRef = useRef<string | null>(null);

  useEffect(() => {
    callbackReferenceRef.current = consumePaystackCallbackReference();
    setHasSession(!!GetItemFromCookie("access_token"));
  }, []);

  useEffect(() => {
    // Without a web session any API call would 401 and force a login redirect.
    if (!hasSession || !entityId) return;
    let active = true;
    void resolvePaystackCheckout(entityId, callbackReferenceRef.current).then((record) => {
      if (active) setCheckout(record);
    });
    return () => {
      active = false;
    };
  }, [hasSession, entityId]);

  const goHome = () => router.replace("/");

  const renderContent = () => {
    if (hasSession === false) return <PaystackAppReturn />;
    if (startNew) return <PaystackCardTopUp close={goHome} />;
    if (hasSession === undefined || !entityId || checkout === undefined) {
      return (
        <div className="flex flex-col min-h-[440px] w-full max-w-[400px]">
          <PaystackStatusPanel
            icon="pending"
            title="Returning from Paystack"
            message="Loading your payment details…"
            busy
            primary={{ label: "Go to dashboard", onClick: goHome }}
          />
        </div>
      );
    }
    if (!checkout) {
      return (
        <div className="flex flex-col min-h-[440px] w-full max-w-[400px]">
          <PaystackStatusPanel
            icon="pending"
            title="No payment in progress"
            message="We couldn't find a card payment started on this browser. Check your wallet activity for recent payments."
            secondary={{ label: "View transactions", onClick: () => router.replace("/transactions") }}
            primary={{ label: "Go to dashboard", onClick: goHome }}
          />
        </div>
      );
    }
    return (
      <PaystackFundingStatus
        checkout={checkout}
        entityId={entityId}
        variant="page"
        onClose={goHome}
        onStartNew={() => setStartNew(true)}
      />
    );
  };

  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center gap-8 px-4 py-10 bg-[#F8F7FA]">
      <Image src="/icons/Logo-4.svg" width={104} height={46} alt="Raiz" />
      {renderContent()}
    </section>
  );
};

export default PaystackCallbackPage;
