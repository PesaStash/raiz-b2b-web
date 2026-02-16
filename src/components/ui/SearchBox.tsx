import React, { ChangeEvent } from "react";
import Image from "next/image";

interface Props {
  className?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputClassName?: string;
  iconClassName?: string;
}

const SearchBox = ({
  className,
  value,
  onChange,
  placeholder = "Search...",
  inputClassName,
  iconClassName,
}: Props) => {
  return (
    <div className={`relative h-12 w-full ${className}`}>
      <Image
        className={`absolute top-3.5 left-3 ${iconClassName}`}
        src="/icons/search.svg"
        alt="search"
        width={22}
        height={22}
      />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pl-10 h-full w-full bg-raiz-gray-50 text-sm rounded-[20px] border-raiz-gray-200 focus:outline-none border focus:border-2 ${inputClassName}`}
      />
    </div>
  );
};

export default SearchBox;
