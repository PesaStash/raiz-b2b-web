import React, { InputHTMLAttributes, ReactNode, useRef } from "react";
import Image from "next/image";
import InputLabel from "./InputLabel";
import ErrorMessage from "./ErrorMessage";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  status?: "success" | "error" | "warning" | null;
  icon?: string | ReactNode;
  name: string;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  className?: string;
  type?: string;
  errorMessage?: string | false | undefined;
  hidden?: boolean;
  labelClass?: string;
}

const InputField: React.FC<InputProps> = ({
  label,
  status,
  icon,
  name,
  iconPosition = "right",
  onClick,
  className,
  type = "text",
  errorMessage,
  hidden = false,
  labelClass,
  ...props
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBorderColor = () => {
    if (status === "success") return "border-[#2BAC47]";
    if (status === "error") return "border-raiz-error";
    if (status === "warning") return "border-yellow-500";
    return "border-raiz-gray-100";
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <div className={`relative w-full rounded-lg transition-all duration-300`}>
        {type === "file" && !hidden ? (
          <div
            className="flex items-center cursor-pointer"
            onClick={handleFileClick}
          >
            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              name={name}
              {...props}
            />

            {/* Custom Placeholder */}
            <div className={`w-full text-xs md:text-sm text-[#667085] py-1 ${className}`}>
              {label || "Choose a file"}
            </div>

            {/* Icon */}
            {icon && (
              <div
                className={`${
                  iconPosition === "right"
                    ? "absolute right-4"
                    : "absolute left-4"
                } z-10`}
              >
                {typeof icon === "string" ? (
                  <Image
                    className="w-6 h-6 cursor-pointer"
                    src={icon}
                    alt={label || ""}
                    width={20}
                    height={20}
                  />
                ) : (
                  icon
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {label && <InputLabel content={label} labelClass={labelClass} />}
            <div className={`flex items-center  ${label ? "mt-2" : ""} `}>
              <input
                className={`w-full p-[15px] h-[50px] text-[13px] md:text-sm text-raiz-gray-950  border bg-raiz-gray-100 focus:bg-white focus:border-raiz-gray-600 active:border-raiz-gray-600  outline-none rounded-lg leading-tight placeholder:text-raiz-gray-400 placeholder:text-[13px] md:placeholder:text-sm ${className} ${getBorderColor()}`}
                name={name}
                type={type}
                placeholder={label || ""}
                {...props}
              />

              {/* Icon */}
              {icon && (
                <div
                  className={`${
                    iconPosition === "right"
                      ? "absolute right-4"
                      : "absolute left-4"
                  } w-6 h-6`}
                >
                  {typeof icon === "string" ? (
                    <Image
                      className="w-6 h-6 cursor-pointer"
                      src={icon}
                      alt={label || ""}
                      onClick={onClick}
                      layout="fill"
                      objectFit="cover"
                    />
                  ) : (
                    icon
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {errorMessage && <ErrorMessage message={errorMessage} />}
    </div>
  );
};

export default InputField;
