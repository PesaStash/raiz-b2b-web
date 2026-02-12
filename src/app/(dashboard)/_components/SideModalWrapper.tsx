"use client";
import Overlay from "@/components/ui/Overlay";
import React, { ReactNode, useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface Props {
  children: ReactNode;
  close: () => void;
  wrapperStyle?: string;
}

const SideModalWrapper = ({ children, close, wrapperStyle }: Props) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null; // Avoid mismatch between SSR and client render

  const initial = isMobile
    ? { opacity: 0, y: "100%" }
    : { opacity: 0, x: "100%" };
  const animate = { opacity: 1, x: 0, y: 0 };
  const exit = isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, x: "100%" };

  return (
    <Overlay close={close}>
      <motion.div
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 25,
          ease: "easeInOut",
        }}
        key="modal"
        className={`p-[25px] xl:p-[30px] bg-raiz-gray-50 no-scrollbar  justify-start gap-2 inline-flex fixed right-0 md:top-0 bottom-0 w-full md:w-[50%] lg:w-[31%] xl:w-[28.57%] ${isMobile
            ? "max-h-[70vh] overflow-y-auto"
            : "md:h-screen overflow-y-scroll"
          } ${wrapperStyle}`}
      >
        <div className="w-full flex flex-col">{children}</div>
      </motion.div>
    </Overlay>
  );
};

export default SideModalWrapper;
