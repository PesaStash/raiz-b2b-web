"use client";
import Image from "next/image";
import React, { ReactNode, useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import Link from "next/link";
import { createPortal } from "react-dom";

interface Props {
  children: ReactNode;
  close: () => void;
  wrapperStyle?: string;
}

const CenterModalWrapper = ({ children, close, wrapperStyle }: Props) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isHydrated]);

  if (!isHydrated) return null;

  const initial = isMobile
    ? { opacity: 0, y: "100%" }
    : { opacity: 0, y: 20 };
  const animate = { opacity: 1, x: 0, y: 0 };
  const exit = isMobile
    ? { opacity: 0, y: "100%" }
    : { opacity: 0, y: 20 };

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={close}
      className={`fixed inset-0 z-[100] flex ${
        isMobile ? "flex-col justify-end" : "items-center justify-center"
      } ${isMobile ? "bg-black/50" : "bg-[#F8F7FA]"}`}
      role="dialog"
      aria-modal="true"
    >
      {!isMobile && (
        <Link
          href="/"
          onClick={close}
          className="absolute top-6 left-6 z-10"
        >
          <Image
            src={"/icons/Logo-4.svg"}
            width={104}
            height={46}
            alt="Raiz"
          />
        </Link>
      )}

      <motion.div
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 32,
        }}
        onClick={(e) => e.stopPropagation()}
        key="modal"
        className={
          isMobile
            ? `w-full max-h-[92dvh] flex flex-col bg-white rounded-t-[24px] shadow-[0_-8px_40px_rgba(16,24,40,0.18)] overflow-hidden ${wrapperStyle ?? ""}`
            : `p-4 lg:p-[25px] xl:p-10 desktop:p-[64px] no-scrollbar justify-start gap-2 flex flex-col fixed bottom-0 w-full max-w-[562px] lg:top-[45px] xl:top-0 md:h-screen overflow-y-scroll ${wrapperStyle ?? ""}`
        }
      >
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-raiz-gray-200" />
          </div>
        )}
        <div
          className={`w-full flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar ${
            isMobile ? "px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1" : "h-full"
          }`}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
};

export default CenterModalWrapper;
