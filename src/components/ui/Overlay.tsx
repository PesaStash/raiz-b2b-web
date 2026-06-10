"use client";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import * as motion from "motion/react-client";
import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Overlay = ({
  children,
  width,
  height,
  close,
  className,
  disableAnimation = false,
}: {
  children: ReactNode;
  width?: string;
  height?: string;
  close: () => void;
  className?: string;
  disableAnimation?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [hydrated, setHydrated] = useState(false);
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => setAllowBackdropClose(true), 0);
    return () => window.clearTimeout(id);
  }, [hydrated]);

  if (!hydrated) return null;

  const overlay = (
    <motion.section
      {...(!disableAnimation && {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "linear" },
      })}
      onClick={allowBackdropClose ? close : undefined}
      className={`fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)] z-[110] ${
        className || ""
      }`}
    >
      <motion.section
        initial={disableAnimation ? {} : { scale: 0.9, opacity: 0 }}
        animate={disableAnimation ? {} : { scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? "90%" : width || "auto",
          height: height || "auto",
        }}
        className="bg-white rounded-[36px] overflow-y-auto no-scrollbar w-full max-w-[95vw] md:max-w-none min-w-0"
      >
        {children}
      </motion.section>
    </motion.section>
  );

  return createPortal(overlay, document.body);
};

export default Overlay;
