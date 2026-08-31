"use client";
import React from "react";
import Image from "next/image";
import SideWrapperHeader from "../SideWrapperHeader";
import { useSendStore } from "@/store/Send";
import { useQuery } from "@tanstack/react-query";
import { FetchTransactionCategoriesApi } from "@/services/transactions";
import { ITransactionCategory } from "@/types/transactions";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CenterModalHeader from "../layouts/CenterModalHeader";

interface Props {
  goBack: () => void;
  goNext: () => void;
  loading: boolean;
}

const Categories = ({ goBack, goNext, loading }: Props) => {
  const { actions, category } = useSendStore();

  const { data, isLoading } = useQuery({
    queryKey: ["transactions-category"],
    queryFn: () => FetchTransactionCategoriesApi(),
  });
  // const SkipButton = () => {
  //   return (
  //     <button
  //       onClick={() => {
  //         actions.selectCategory(null);
  //         goNext();
  //       }}
  //       className="text-right justify-center text-zinc-700 text-sm leading-tight"
  //     >
  //       Skip
  //     </button>
  //   );
  // };

  const handleSelect = (newCategory: ITransactionCategory) => {
    if (
      category?.transaction_category_id === newCategory?.transaction_category_id
    ) {
      actions.selectCategory(null);
    } else {
      actions.selectCategory(newCategory);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 mt-10 justify-center items-center">
        <Spinner />
        <p>Fetching categories...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <CenterModalHeader close={goBack} />
      <div className="flex flex-col gap-1  mb-10">
        <h5 className="text-raiz-gray-950 md:text-[22px] text-lg font-semibold leading-tight">
          Choose Categories
        </h5>
        <p className=" text-raiz-gray-700 text-sm font-normal leading-tight">
          Select your preferred category
        </p>
      </div>
      <div className="flex flex-col h-full justify-between items-center pb-7">
        <div className=" grid grid-cols-4 gap-y-5 xl:gap-y-10 gap-x-3 w-full justify-center items-center rounded-[20px] bg-raiz-gray-50 p-3 md:p-6 overflow-y-auto mb-6 no-scrollbar">
          {data?.map((each, index) => {
            return (
              <div key={index} className="relative w-full ">
                {each.transaction_category_id ===
                  category?.transaction_category_id && (
                  <Image
                    className="w-5 h-5 absolute right-2 md:right-4 top-0"
                    src={"/icons/category-check.svg"}
                    alt={each?.transaction_category}
                    width={20}
                    height={20}
                  />
                )}
                <button
                  onClick={() => handleSelect(each)}
                  className="flex flex-wrap flex-col w-full gap-2 items-center justify-center"
                >
                  <div className="bg-[#EAECFF99] size-16 p-4 rounded-full flex items-center justify-center">
                  <Image
                    className="w-12 h-12 object-contain"
                    src={each?.category_emoji || "/icons/notif-general.svg"}
                    // src={"/icons/notif-general.svg"}
                    alt={each?.transaction_category}
                    width={64}
                    height={64}
                  />
                  </div>
                  <p className="text-center text-zinc-900 text-[10px] xl:text-xs font-normal leading-none">
                    {each?.transaction_category}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
        <Button disabled={!category} loading={loading} onClick={goNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Categories;
