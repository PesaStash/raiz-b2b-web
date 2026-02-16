"use client";
import React from "react";
import Image from "next/image";
import InputLabel from "./InputLabel";

type Props = {
  onClick: () => void;
  placeholder: string;
  value: string;
  label?: string;
  className?: string;
};

const ModalTrigger = ({
  onClick,
  placeholder,
  value,
  label,
  className,
}: Props) => {
  return (
    <div className="flex flex-col gap-3">
      {label && <InputLabel content={label} />}
      <button
        onClick={onClick}
        type="button"
        className={`flex justify-between w-full h-[50px] p-[15px] bg-raiz-gray-100 rounded-lg items-center text-left ${className}`}
      >
        <span
          className={`${
            value ? "text-raiz-gray-950" : "text-raiz-gray-400"
          } text-sm font-normal leading-tight`}
        >
          {value ? value : placeholder}
        </span>
        <Image
          src="/icons/arrow-down.svg"
          alt="dropdown"
          width={16}
          height={16}
        />
      </button>
    </div>
  );
};

export default ModalTrigger;
