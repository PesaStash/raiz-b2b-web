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
      <SideWrapperHeader
        close={goBack}
        title="Select category"
        titleColor="text-zinc-900"
        // rightComponent={<SkipButton />}
      />
      <div className="flex flex-col h-full justify-between items-center">
        <div className="grid grid-cols-4 gap-y-5 gap-x-3 w-full justify-center items-center">
          {data?.map((each, index) => {
            return (
              <div key={index} className="relative w-full ">
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
                  className="flex flex-wrap flex-col w-full gap-2 items-center justify-center"
                >
                  <Image
                    className="w-12 h-12"
                    src={each?.category_emoji || "/icons/notif-general.svg"}
                    // src={"/icons/notif-general.svg"}
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
