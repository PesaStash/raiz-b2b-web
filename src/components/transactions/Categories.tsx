"use client";
import React from "react";
import Image from "next/image";
import { useSendStore } from "@/store/Send";
import { useTransactionCategories } from "@/lib/hooks/useTransactionCategories";
import { ITransactionCategory } from "@/types/transactions";
import Spinner from "../ui/Spinner";
import { FlowHeader, FlowCard, FlowActions } from "./send-flow/Flow";

interface Props {
  goBack: () => void;
  goNext: () => void;
  loading: boolean;
}

const Categories = ({ goBack, goNext, loading }: Props) => {
  const { actions, category } = useSendStore();

  const { data, isLoading, isError, refetch } = useTransactionCategories();

  const handleSelect = (newCategory: ITransactionCategory) => {
    if (
      category?.transaction_category_id === newCategory?.transaction_category_id
    ) {
      actions.selectCategory(null);
    } else {
      actions.selectCategory(newCategory);
    }
  };

  return (
    <>
      <FlowHeader title="Choose a category" onBack={goBack} />
      <FlowCard>
        {isError && (
          <p role="alert" className="text-sm text-[#79708d]">
            Unable to load categories. You can skip this step or{" "}
            <button
              type="button"
              className="text-primary2 font-semibold"
              onClick={() => refetch()}
            >
              retry
            </button>
            .
          </p>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data?.map((each) => {
              const selected =
                each.transaction_category_id ===
                category?.transaction_category_id;
              return (
                <button
                  type="button"
                  key={each.transaction_category_id}
                  aria-pressed={selected}
                  onClick={() => handleSelect(each)}
                  className={`relative flex flex-col items-center justify-center gap-2.5 border rounded-2xl px-2 pt-4 pb-3.5 min-h-[111px] text-xs ${selected ? "border-primary2 bg-[#f3f1fd]" : "border-[#eaecf0] bg-white hover:bg-[#f8f7fa]"}`}
                >
                  {selected && (
                    <Image
                      src="/icons/category-check.svg"
                      width={16}
                      height={16}
                      alt="Selected"
                      className="absolute top-2 right-2"
                    />
                  )}
                  <span className="rounded-full bg-[#EAECFF99] size-[52px] flex items-center justify-center">
                    <Image
                      src={each.category_emoji || "/icons/notif-general.svg"}
                      width={28}
                      height={28}
                      alt=""
                    />
                  </span>
                  <span>{each.transaction_category}</span>
                </button>
              );
            })}
          </div>
        )}
        <FlowActions
          onBack={() => {
            actions.selectCategory(null);
            goNext();
          }}
          backLabel="Skip"
          onNext={goNext}
          disabled={!category || isLoading}
          loading={loading}
        />
      </FlowCard>
    </>
  );
};
export default Categories;
