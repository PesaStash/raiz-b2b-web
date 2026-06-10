"use client";
import Overlay from "@/components/ui/Overlay";
import React, { ReactNode, useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { createPortal } from "react-dom";

interface Props {
  children: ReactNode;
  close: () => void;
  wrapperStyle?: string;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 180,
  damping: 25,
  ease: "easeInOut" as const,
};

const SideModalWrapper = ({ children, close, wrapperStyle }: Props) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isHydrated, isMobile]);

  if (!isHydrated) return null;

  if (isMobile) {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={close}
        className="fixed inset-0 z-[110] flex flex-col justify-end bg-black/50"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={springTransition}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-h-[92dvh] flex flex-col bg-raiz-gray-50 rounded-t-[24px] shadow-[0_-8px_40px_rgba(16,24,40,0.18)] overflow-hidden ${wrapperStyle ?? ""}`}
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-raiz-gray-200" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 no-scrollbar">
            <div className="w-full flex flex-col min-h-0">{children}</div>
          </div>
        </motion.div>
      </motion.div>,
      document.body,
    );
  }

  return (
    <Overlay close={close} disableAnimation className="!z-[110]">
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={springTransition}
        key="modal"
        className={`p-[25px] xl:p-[30px] bg-raiz-gray-50 no-scrollbar justify-start gap-2 inline-flex fixed right-0 top-0 bottom-0 w-full md:w-[50%] lg:w-[31%] xl:w-[28.57%] md:h-screen overflow-hidden ${wrapperStyle ?? ""}`}
      >
        <div className="w-full flex flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </Overlay>
  );
};

export default SideModalWrapper;
