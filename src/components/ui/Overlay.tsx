"use client";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import * as motion from "motion/react-client";
import React, { ReactNode, useEffect, useState } from "react";

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

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <motion.section
      {...(!disableAnimation && {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "linear" },
      })}
      onClick={close}
      className={`fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)] z-50 ${
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
        className="bg-white rounded-[36px] overflow-y-auto no-scrollbar"
      >
        {children}
      </motion.section>
    </motion.section>
  );
};

export default Overlay;
