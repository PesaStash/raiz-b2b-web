"use client";
import Image from "next/image";
import React, { ReactNode, useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

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

  if (!isHydrated) return null; // Avoid mismatch between SSR and client render

  const initial = isMobile
    ? { opacity: 0, y: "100%" }
    : { opacity: 0, scale: 0.95, y: 20 };
  const animate = { opacity: 1, scale: 1, x: 0, y: 0 };
  const exit = isMobile
    ? { opacity: 0, y: "100%" }
    : { opacity: 0, scale: 0.95, y: 20 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 flex items-center justify-center bg-[#F8F7FA] z-50 `}
    >
      <Image
        src={"/icons/Logo-4.svg"}
        width={103.95}
        height={46}
        alt="Logo"
        className="absolute top-6 left-6"
      />
      <motion.div
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 30,
        }}
        key="modal"
        className={`p-[25px] xl:p-[64px] no-scrollbar justify-start gap-2 flex flex-col fixed bottom-0 w-full max-w-[562px] lg:top-[45px] xl:top-0 ${
          isMobile
            ? "max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-white shadow-2xl"
            : "md:h-screen overflow-y-scroll"
        } ${wrapperStyle}`}
      >
        <button onClick={close} className="mb-4">
          <Image
            src={"/icons/arrow-left.svg"}
            width={18}
            height={18}
            alt="back"
          />
        </button>
        <div className="w-full flex flex-col">{children}</div>
      </motion.div>
    </motion.div>
  );
};

export default CenterModalWrapper;
