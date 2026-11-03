"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RAIZ_APP_RETURN_URL, isMobileUserAgent } from "@/lib/paystackCardCollection";

/**
 * Shown when Paystack returns to the web callback without a web session,
 * which is the mobile checkout path. It only hands control back to the app.
 */
const PaystackAppReturn = () => {
  const [isMobile, setIsMobile] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    const mobile = isMobileUserAgent(navigator.userAgent, navigator.maxTouchPoints);
    setIsMobile(mobile);
    if (mobile && !attemptedRef.current) {
      attemptedRef.current = true;
      window.location.href = RAIZ_APP_RETURN_URL;
    }
  }, []);

  return (
    <div className="flex flex-col min-h-[440px] w-full max-w-[400px]">
      <div className="w-full flex-1 bg-gradient-to-l from-indigo-900 to-violet-600 rounded-[36px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.30)] flex flex-col">
        <div className="flex flex-col justify-between gap-6 flex-1 pt-[64px] p-[30px] items-center w-full">
          <div className="text-center w-full flex flex-col items-center" role="status" aria-live="polite">
            <Image src="/icons/pending.svg" width={50} height={50} alt="" aria-hidden />
            <h4 className="mt-[15px] text-gray-100 text-xl font-bold leading-relaxed">Return to the Raiz app</h4>
            <p className="text-gray-100 mt-3 text-xs font-normal leading-tight">
              Your card payment is being confirmed in the Raiz app. Open the app to see the result. Your wallet is
              only credited once Raiz confirms the payment.
            </p>
          </div>
          <div className="flex flex-col w-full gap-3">
            <a
              href={RAIZ_APP_RETURN_URL}
              className="w-full px-4 md:px-6 py-3.5 rounded-[100px] bg-zinc-200 text-zinc-900 text-[13px] md:text-sm font-medium text-center"
            >
              Open the Raiz app
            </a>
            {!isMobile && (
              <Link
                href="/login"
                className="w-full px-4 md:px-6 py-3.5 rounded-[100px] bg-indigo-900 text-[#f9f9f9] text-[13px] md:text-sm text-center"
              >
                Sign in to Raiz Business
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackAppReturn;
