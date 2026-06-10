import React, { ReactNode } from "react";
import SideLayout from "./_components/SideLayout";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <section className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-0 md:px-4 lg:px-6 min-h-0 relative bg-transparent md:bg-[#F8F7FA]">
      <div className="hidden lg:block w-full lg:w-[20%] lg:shrink-0">
        <SideLayout />
      </div>
      <section className="w-full lg:flex-1 min-w-0 pt-0 lg:pt-6 bg-transparent lg:bg-raiz-gray-50 p-0 md:p-4 lg:p-8 pb-24 lg:pb-8 lg:rounded-[20px] lg:border-[1.5px] lg:border-raiz-gray-200">
        {children}
      </section>
    </section>
  );
};

export default layout;
