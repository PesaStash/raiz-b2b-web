import React from "react";
import Image from "next/image";
import { copyToClipboard, truncateString } from "@/utils/helpers";

interface Props {
  title: string;
  value: string | number;
  border?: boolean;
  copyable?: boolean;
  truncate?: number; // Optional: truncate value if too long
}

const ListDetailItem = ({
  title,
  value,
  border,
  copyable = false,
  truncate,
}: Props) => {
  const valueStr = String(value);
  const displayValue = truncate ? truncateString(valueStr, truncate) : valueStr;

  const handleCopy = () => copyToClipboard(valueStr);

  return (
    <div
      className={`flex text-zinc-900 justify-between gap-4 items-start pb-3 ${
        border ? "border-b-[0.5px] border-zinc-200" : ""
      }`}
    >
      <span className="text-xs font-normal leading-tight">{title}</span>

      <div className="flex items-center gap-1 justify-end max-w-[90%]">
        <span
          className={`text-sm text-right font-semibold font-brSonoma leading-tight break-words  ${
            copyable
              ? "cursor-pointer hover:text-zinc-600 transition-colors"
              : ""
          }`}
          onClick={copyable ? handleCopy : undefined}
          title={copyable ? `Click to copy: ${valueStr}` : undefined}
        >
          {displayValue}
        </span>

        {copyable && (
          <button
            onClick={handleCopy}
            className="opacity-60 hover:opacity-100 transition-opacity"
            title="Copy to clipboard"
          >
            <Image src="/icons/copy.svg" alt="copy" width={16} height={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ListDetailItem;
