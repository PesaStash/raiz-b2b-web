"use client";
import { usePermissions } from "@/lib/hooks/usePermissions";

import React from "react";
import { PartChildProps } from "../../help&support/_components/HelpSupportNav";
import { loginSecurityData } from "@/constants/SettingsMenuData";
import Image from "next/image";

const LsNav = ({ setPart }: PartChildProps) => {
  const { canWriteBusiness } = usePermissions();
  const handleNavigate = (part: number) => {
    setPart(part);
  };
  return (
    <div className=" flex flex-col gap-5 mt-10 w-full">
      {loginSecurityData.filter(item => canWriteBusiness || item.part !== 2).map((data, index) => {
        return (
          <button
            onClick={() => handleNavigate(data.part)}
            key={index}
            className="flex justify-between items-center"
          >
            <div className="flex gap-[15px] items-center">
              {data.icon}
              <div className="flex flex-col ">
                <span className="text-raiz-gray-950 text-[15px] w-full text-left font-semibold leading-snug">
                  {data.name}
                </span>
                <p className="text-left text-[#6c6982] text-[13px] font-normal leading-[18px]">
                  {data.text}
                </p>
              </div>
            </div>
            <Image
              src="/icons/arrow-right.svg"
              alt="arrow-right"
              width={18}
              height={18}
            />
          </button>
        );
      })}
    </div>
  );
};

export default LsNav;
