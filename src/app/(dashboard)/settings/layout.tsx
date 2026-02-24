import React, { ReactNode } from "react";
import SideLayout from "./_components/SideLayout";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <section className=" w-full flex gap-[25px] px-8 -ml-8 h-screen  relative bg-[#F8F7FA] ">
      <SideLayout />
      <section className="w-[77%] ml-6 xl:ml-8 pt-8 bg-raiz-gray-50 p-8 pb-4  rounded-[20px] border-[1.5px] border-raiz-gray-200">
        {children}
      </section>
    </section>
  );
};

export default layout;
