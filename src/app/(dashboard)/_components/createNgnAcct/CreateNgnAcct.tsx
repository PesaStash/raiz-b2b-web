"use client";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import { CreateNGNVirtualWalletApi } from "@/services/business";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";

const list = [
  {
    icon: "/icons/send.svg",
    title: "Send Money",
    text: "Quickly send Naira to other NGN accounts within Nigeria for seamless transactions.",
  },
  {
    icon: "/icons/receive.svg",
    title: "Recieve Funds",
    text: "Accept payments directly in Naira, making it easy to manage local income.",
  },
  {
    icon: "/icons/bank-cards.svg",
    title: "NGN Virtual Account",
    text: "Access a secure virtual Naira account for online and in-app transactions.",
  },
];

const CreateNgnAcct = ({ close }: { close: () => void }) => {
  const qc = useQueryClient();
  const NGNWalletMutation = useMutation({
    mutationFn: CreateNGNVirtualWalletApi,
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["user"] });
      close();
    },
  });
  const handleCreate = () => {
    NGNWalletMutation.mutate();
  };
  return (
    <>
      <div className="w-full  xl:max-h-[85vh] lg:max-h-[80vh] flex flex-col font-brSonoma">
        <CenterModalHeader close={close} />
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
          NGN Account
        </h2>
        <div className="flex flex-col justify-between gap-8 h-full pb-[30px]">
          <div className="">
            <div className="bg-raiz-gray-50 p-6 rounded-[20px] flex flex-col justify-center text-raiz-gray-950  gap-3">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.35"
                  d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                  fill="#7EB7B7"
                />
                <path
                  d="M27.8777 34C26.6917 34 25.6277 33.268 25.2057 32.158L21.2717 21.826H21.1897L21.2837 32.04C21.2957 33.12 20.4217 34 19.3417 34H19.2037C18.1317 34 17.2617 33.13 17.2617 32.058V16.86C17.2617 15.28 18.5417 14 20.1217 14H20.2517C21.4457 14 22.5137 14.742 22.9317 15.86L26.8417 26.344H26.9237L26.8537 15.954C26.8457 14.878 27.7177 14 28.7957 14C29.8677 14 30.7377 14.87 30.7377 15.942V31.14C30.7377 32.72 29.4577 34 27.8777 34Z"
                  fill="#5E6CE9"
                />
              </svg>

              <h3 className=" xl:text-xl text-lg font-bold leading-normal mt-2">
                Naira Account Benefits
              </h3>
              <p className="xl:text-sm text-xs font-normal  leading-tight">
                Hold, send, and receive Naira with ease, making everyday
                payments and transfers simple.
              </p>
            </div>
            <div className="bg-raiz-gray-50 p-6 rounded-[20px] flex flex-col gap-[22px] xl:gap-[32px] mt-[30px]">
              {list.map((each, index) => (
                <div key={index} className="flex gap-4 items-start ">
                  <Image
                    src={each.icon}
                    alt={each.title}
                    width={30}
                    height={30}
                  />
                  <div className=" flex flex-col gap-1">
                    <h6 className="text-[13px] xl:text-sm font-bold  leading-[16.80px]">
                      {each.title}
                    </h6>
                    <p className=" text-xs xl:text-[13px] font-normal leading-tight">
                      {each.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={handleCreate}
            loading={NGNWalletMutation.isPending}
            className="bg-primary disabled:!bg-slate-500  "
          >
            Create NGN Account
          </Button>
        </div>
      </div>
    </>
  );
};

export default CreateNgnAcct;
