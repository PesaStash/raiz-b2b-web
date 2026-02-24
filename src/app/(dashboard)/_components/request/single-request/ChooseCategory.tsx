"use client";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { FetchTransactionCategoriesApi } from "@/services/transactions";
import { ITransactionCategory } from "@/types/transactions";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { Dispatch, SetStateAction } from "react";

interface Props {
  goBack: () => void;
  goNext: () => void;
  category: ITransactionCategory | null;
  setCategory: Dispatch<SetStateAction<ITransactionCategory | null>>;
}

const ChooseCategory = ({ goBack, goNext, category, setCategory }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["transactions-category"],
    queryFn: () => FetchTransactionCategoriesApi(),
  });

  const handleSelect = (newCategory: ITransactionCategory) => {
    if (
      category?.transaction_category_id === newCategory?.transaction_category_id
    ) {
      setCategory(null);
    } else {
      setCategory(newCategory);
    }
  };

  // const SkipButton = () => {
  //   return (
  //     <button
  //       onClick={() => {
  //         setCategory(null);
  //         goNext();
  //       }}
  //       className="text-right justify-center text-zinc-700 text-sm leading-tight"
  //     >
  //       Skip
  //     </button>
  //   );
  // };

  return (
    <div className="flex flex-col h-full mb-12">
      <CenterModalHeader close={goBack} />
      <div className="flex flex-col gap-1  mb-10">
        <h5 className="text-raiz-gray-950 text-[22px] font-semibold leading-tight">
          Choose Categories
        </h5>
        <p className=" text-raiz-gray-700 text-sm font-normal leading-tight">
          Select your preferred category
        </p>
      </div>
      <div className="flex flex-col h-full justify-between items-center">
        <div className="w-full grid grid-cols-4 gap-y-5 xl:gap-y-10 gap-x-3 rounded-[20px] bg-raiz-gray-50 p-6 overflow-y-auto mb-6 no-scrollbar">
          {isLoading ? (
            <Spinner />
          ) : (
            data?.map((each, index) => {
              return (
                <div key={index} className="relative w-full">
                  {each.transaction_category_id ===
                    category?.transaction_category_id && (
                    <Image
                      className="w-5 h-5 absolute right-0 top-0"
                      src={"/icons/category-check.svg"}
                      alt={each?.transaction_category}
                      width={20}
                      height={20}
                    />
                  )}
                  <button
                    onClick={() => handleSelect(each)}
                    className="flex flex-wrap flex-col gap-2 w-full items-center justify-center"
                  >
                    <Image
                      className="w-12 h-12"
                      src={each?.category_emoji}
                      alt={each?.transaction_category}
                      width={64}
                      height={64}
                    />
                    <p className="text-center text-zinc-900 text-[10px] xl:text-xs font-normal leading-none">
                      {each?.transaction_category}
                    </p>
                  </button>
                </div>
              );
            })
          )}
        </div>
        <Button disabled={!category} onClick={goNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ChooseCategory;
