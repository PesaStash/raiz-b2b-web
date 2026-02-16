import React, { ReactNode } from "react";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  width?: "fit" | "full";
  icon?: string | ReactNode;
  iconPosition?: "left" | "right";
  iconLabel?: string;
  iconClassName?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  width = "full",
  icon,
  iconPosition,
  iconLabel,
  iconClassName,
}) => {
  const { selectedCurrency } = useCurrencyStore();
  const baseStyles = `relative px-6 py-3.5 rounded-[100px] focus:outline-none transition ease-in-out duration-300 text-[15px]`;
  const disabledStyles = `bg-raiz-gray-200 hover:cursor-not-allowed  text-raiz-gray-400`;

  const getPrimaryStyles = () => {
    if (variant !== "primary") return "";

    switch (selectedCurrency.name.toLowerCase()) {
      case "usd":
        return "bg-raiz-usd-primary text-[#f9f9f9] enabled:hover:bg-raiz-usd-primary/90";
      case "ngn":
        return "bg-primary2 text-[#f9f9f9] enabled:hover:bg-primary2/90";
      case "sbc":
        return "bg-raiz-crypto-primary text-[#f9f9f9] enabled:hover:bg-raiz-crypto-primary/90";
      default:
        return "bg-primary2 text-[#f9f9f9] enabled:hover:bg-primary2/90";
    }
  };

  const variants = {
    primary: getPrimaryStyles(),
    secondary: `bg-zinc-200 hover:bg-zinc-300 text-zinc-900`,
    tertiary: `border border-zinc-300 hover:bg-zinc-600 text-zinc-900`,
  };

  const widthStyles = {
    fit: "w-auto",
    full: "w-full",
  };

  const selectedStyles = disabled ? disabledStyles : variants[variant];

  // Check if className contains a width-related class
  const hasCustomWidth = className.includes("w-");

  // Apply widthStyles only if no custom width is specified in className and width prop is provided
  const finalClassName = `${baseStyles} ${selectedStyles} ${
    !hasCustomWidth && width ? widthStyles[width] : ""
  } ${className} flex items-center justify-center`;

  return (
    <button
      onClick={onClick}
      className={finalClassName}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? (
        <span
          className={`ml-3 w-5 h-5 border-2 border-t-transparent ${
            variant === "primary" ? "border-white" : "border-primary2"
          } rounded-full animate-spin`}
        />
      ) : (
        children
      )}
      {icon && (
        <div
          className={`${
            iconPosition === "right" ? "absolute right-4" : "absolute left-4"
          } ${iconClassName}`}
          onClick={onClick}
        >
          {typeof icon === "string" ? (
            <Image
              className="w-5 h-5 cursor-pointer"
              width={20}
              height={20}
              src={icon || ""}
              alt={iconLabel || ""}
            />
          ) : (
            icon
          )}
        </div>
      )}
    </button>
  );
};

export default Button;
