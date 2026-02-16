/* eslint-disable */

"use client";

import React, { useState, useEffect } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import Select, { StylesConfig } from "react-select";
import InputLabel from "./InputLabel";

export interface Option {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  onChange: (selectedOption: Option | null) => void;
  status?: "success" | "error" | "warning" | null;
  helper?: string | null;
  value: any;
  options: Option[];
  labels?: boolean;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  width?: string;
  style?: React.CSSProperties;
  isSearchable?: boolean;
  height?: string;
  isLoading?: boolean;
  controlPadding?: string;
  bgColor?: string;
  minHeight?: string;
  placeholderStyle?: React.CSSProperties;
  labelClass?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  onChange,
  value,
  options,
  label,
  placeholder = "",
  name,
  status,
  helper,
  disabled,
  className,
  width,
  isSearchable = true,
  style,
  height,
  isLoading,
  controlPadding,
  bgColor = "#F3F1F6",
  minHeight = "50px",
  placeholderStyle,
  labelClass
}) => {
  const [optionsIsShown, setOptionsIsShown] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(value);

  const customStyles: StylesConfig<Option, boolean> = {
    control: (provided: any, state: any) => ({
      ...provided,
      padding: controlPadding || "0 15px",
      fontSize: "14px",
      outline: "none",
      boxShadow: state.isFocused ? "" : "",
      borderColor: state.isFocused ? "#6F5B86" : "#F3F1F6",
      borderWidth: "1px",
      backgroundColor: state.isFocused ? "#fff" : bgColor,
      borderRadius: "8px",
      height: height ? height : "44px",
      minHeight: minHeight,
      "&:hover": {
        cursor: "pointer",
        borderColor: "none",
        outline: "none",
      },
      "&:focus": {
        borderColor: "none",
        outline: "none",
        boxShadow: "none",
      },
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      //   paddingLeft: "14px",
      //   paddingRight: "14px",
    }),

    placeholder: (provided: any) => ({
      ...provided,
      ...placeholderStyle,
    }),

    option: (provided: any, state: any) => ({
      ...provided,
      fontSize: "14px",
      color: "#101828",
      backgroundColor: "white",
      fontWeight: "500",

      "&:hover": {
        cursor: "pointer",
        backgroundColor: "#F9FAFB",
        color: "#101828",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      background: "#fff",
      border: "1px solid #EAECF0",
      borderRadius: "8px",
      boxShadow:
        " 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);",
    }),
  };

  useEffect(() => {
    setSelectedOption(value); // Sync selectedOption with value prop
  }, [value]);

  const toggleOptions = () => {
    setOptionsIsShown((prevState) => !prevState);
  };

  const handleInputChange = (selectedOption: any) => {
    setSelectedOption(selectedOption);
    setOptionsIsShown(false);
    onChange(selectedOption);
  };

  const handleBlur = () => {
    setOptionsIsShown(false);
  };

  const handleInputClick = () => {
    setOptionsIsShown(true);
  };

  return (
    <div
      style={{
        ...style,
        width: width || "100%",
        // height: height || "44px",
      }}
      className=""
    >
      {label && <InputLabel content={label} labelClass={labelClass} />}
      <Select
        className={`${
          status === "success"
            ? "focus:border-[#2BAC47] !border-[#2BAC47] active:border-[#2BAC47] bg-[#F1F8F2] border-2 focus:border-2"
            : status === "error"
            ? "focus:border-[#C83532] !border-[#C83532] active:border-[#C83532] bg-[#FBEFEF] border-2 focus:border-2"
            : status === "warning"
            ? "focus:border-[#EF8943] !border-[#EF8943] active:border-[#EF8943] bg-[#FDF3EC] border-2 focus:border-2"
            : null
        } shadow rounded-lg  ${label ? "mt-2" : ""}   ${className} `}
        styles={customStyles}
        components={{
          DropdownIndicator: () => (
            <div
              onClick={toggleOptions}
              role="button"
              tabIndex={0}
              onKeyDown={() => {}}
              className="pr-2 h-full flex items-center justify-center"
            >
              {!optionsIsShown ? <IoIosArrowDown /> : <IoIosArrowUp />}
            </div>
          ),
          IndicatorSeparator: () => null,
        }}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleInputClick}
        value={selectedOption}
        options={options}
        placeholder={placeholder}
        menuIsOpen={optionsIsShown}
        name={name}
        isDisabled={disabled || isLoading}
        isSearchable={isSearchable}
        isLoading={isLoading}
      />
      <p
        className={`${
          status === "success"
            ? "text-[#2BAC47]"
            : status === "error"
            ? "text-[#C83532]"
            : status === "warning"
            ? "text-[#EF8943]"
            : null
        } mt-[0.5em] text-[#736A85] text-sm flex gap-1 items-start`}
      >
        {status === "success" && helper ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 13.6666C3.318 13.6666 0.333328 10.682 0.333328 6.99998C0.333328 3.31798 3.318 0.333313 7 0.333313C10.682 0.333313 13.6667 3.31798 13.6667 6.99998C13.6667 10.682 10.682 13.6666 7 13.6666ZM6.22933 9.98998L10.9427 5.27598L10 4.33331L6.22933 8.10465L4.34333 6.21865L3.40066 7.16131L6.22933 9.98998Z"
              fill="#2BAC47"
            />
          </svg>
        ) : status === "error" && helper ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_1123_1854)">
              <path
                d="M8 14.6667C4.318 14.6667 1.33333 11.682 1.33333 8.00001C1.33333 4.31801 4.318 1.33334 8 1.33334C11.682 1.33334 14.6667 4.31801 14.6667 8.00001C14.6667 11.682 11.682 14.6667 8 14.6667ZM7.33333 10V11.3333H8.66666V10H7.33333ZM7.33333 4.66668V8.66668H8.66666V4.66668H7.33333Z"
                fill="#C83532"
              />
            </g>
            <defs>
              <clipPath id="clip0_1123_1854">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        ) : status === "warning" && helper ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 14.6667C4.318 14.6667 1.33333 11.682 1.33333 8.00001C1.33333 4.31801 4.318 1.33334 8 1.33334C11.682 1.33334 14.6667 4.31801 14.6667 8.00001C14.6667 11.682 11.682 14.6667 8 14.6667ZM7.33333 10V11.3333H8.66666V10H7.33333ZM7.33333 4.66668V8.66668H8.66666V4.66668H7.33333Z"
              fill="#EF8943"
            />
          </svg>
        ) : null}

        <span>{helper}</span>
      </p>
    </div>
  );
};

export default SelectField;
