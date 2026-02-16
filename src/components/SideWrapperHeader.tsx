"use client";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import React, { ReactNode } from "react";

interface Props {
  close: () => void;
  title: string;
  rightComponent?: ReactNode;
  titleColor?: string;
  backArrow?: boolean;
}

const SideWrapperHeader = ({
  close,
  title,
  rightComponent,
  titleColor,
  backArrow = true,
}: Props) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return (
    <div className=" flex justify-between items-center mb-[30px] w-full">
      {backArrow && (
        <button type="button" onClick={close}>
          {titleColor ? (
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              className={isMobile ? "-rotate-90" : ""}
            >
              <path
                d="M18.48 8.43332V10.7667H4.48L10.8967 17.1833L9.24 18.84L0 9.59999L9.24 0.359985L10.8967 2.01665L4.48 8.43332H18.48Z"
                fill="#19151E"
              />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
              <path
                d="M18.48 8.33334V10.6667H4.48L10.8967 17.0833L9.24 18.74L0 9.50001L9.24 0.26001L10.8967 1.91668L4.48 8.33334H18.48Z"
                fill={"#FCFCFD"}
              />
            </svg>
          )}
        </button>
      )}
      <h5
        className={`text-sm w-full md:w-auto md:text-base text-center ${titleColor ? titleColor : "text-raiz-gray-50 "
          }  font-bold  leading-tight `}
      >
        {title}
      </h5>
      {rightComponent ? rightComponent : <span />}
    </div>
  );
};

export default SideWrapperHeader;
