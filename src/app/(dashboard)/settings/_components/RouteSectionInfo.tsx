import React, { ReactNode } from "react";

interface RouteSectionInfoProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

const RouteSectionInfo = ({ title, subtitle, icon }: RouteSectionInfoProps) => {
  return (
    <div className="w-[30%]">
      {icon}
      <h1 className="text-raiz-gray-950 text-[22px] font-semibold leading-10 mt-1.5">
        {title}
      </h1>
      <p className="text-raiz-gray-700 text-[15px] leading-snug">{subtitle}</p>
    </div>
  );
};

export default RouteSectionInfo;
