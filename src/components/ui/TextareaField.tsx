"use client";
import React, { TextareaHTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import InputLabel from "./InputLabel";
import ErrorMessage from "./ErrorMessage";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  status?: "success" | "error" | "warning" | null;
  icon?: string | ReactNode;
  name: string;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  className?: string;
  errorMessage?: string | false | undefined;
  labelClass?: string;
}

const TextareaField: React.FC<TextareaProps> = ({
  label,
  status,
  icon,
  name,
  iconPosition = "right",
  onClick,
  className,
  errorMessage,
  labelClass,
  ...props
}) => {
  const getBorderColor = () => {
    if (status === "success") return "border-[#2BAC47]";
    if (status === "error") return "border-raiz-error";
    if (status === "warning") return "border-yellow-500";
    return "border-raiz-gray-100";
  };

  return (
    <div className="w-full">
      {label && <InputLabel content={label} labelClass={labelClass} />}

      <div className={`relative ${label ? "mt-2" : ""}`}>
        <textarea
          className={`w-full p-[15px] min-h-[120px] resize-y text-sm text-raiz-gray-950 border bg-raiz-gray-100 focus:bg-white focus:border-raiz-gray-600 active:border-raiz-gray-600 outline-none rounded-lg leading-tight placeholder:text-raiz-gray-400 placeholder:text-sm ${className} ${getBorderColor()}`}
          name={name}
          placeholder={label || ""}
          {...props}
        />

        {/* Optional Icon */}
        {icon && (
          <div
            className={`${
              iconPosition === "right"
                ? "absolute right-4 top-4"
                : "absolute left-4 top-4"
            } w-6 h-6`}
          >
            {typeof icon === "string" ? (
              <Image
                className="w-6 h-6 cursor-pointer"
                src={icon}
                alt={label || ""}
                onClick={onClick}
                width={20}
                height={20}
              />
            ) : (
              icon
            )}
          </div>
        )}
      </div>

      {errorMessage && <ErrorMessage message={errorMessage} />}
    </div>
  );
};

export default TextareaField;
