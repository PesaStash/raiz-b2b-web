"use client";

import React from "react";
import PhoneInput, { Country, Value as PhoneValue } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import InputLabel from "./InputLabel";

interface Props {
  value: PhoneValue | string;
  onChange: (value: PhoneValue) => void;
  error?: string;
  touched?: boolean;
  label?: string;
  defaultCountry?: Country
}

const PhoneNumberInput = ({
  value,
  onChange,
  error,
  touched,
  label = "Phone Number",
  defaultCountry = "NG",
}: Props) => {
  return (
    <div className="w-full">
      {label && <InputLabel content={label} />}

      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        className="phone-input-wrapper"
        numberInputProps={{
          className: `w-full px-4 py-3.5 rounded-lg border ${
            error && touched
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
          } text-sm placeholder:text-gray-400 outline-none transition-colors`,
        }}
        countrySelectProps={{
          className: "country-select-button",
        }}
      />

      {error && touched && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}

      <style jsx global>{`
        .phone-input-wrapper {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .PhoneInputCountry {
          position: relative;
          align-self: stretch;
          display: flex;
          align-items: center;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 8px;
          min-width: 28%;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .PhoneInputCountry:hover {
          background-color: #ebebeb;
        }

        .PhoneInputCountryIcon {
          width: 34px;
          height: 17px;
          margin-right: 8px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .PhoneInputCountryIcon img {
          display: block;
          width: 100%;
          height: 100%;
        }

        .PhoneInputCountrySelectArrow {
          width: 8px;
          height: 8px;
          margin-left: 8px;
          opacity: 0.5;
          border: none;
          border-left: 2px solid currentColor;
          border-bottom: 2px solid currentColor;
          transform: rotate(-45deg);
          margin-top: -4px;
        }

        .PhoneInputCountryCode {
          font-size: 13px;
          font-weight: 500;
          color: #1f1f1f;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .PhoneInputInput {
          flex: 1;
          background-color: #f3f1f6;
        }

        .PhoneInputInput:focus {
          border-color: #6f5b86;
          background-color: #fff;
        }

        select.PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          z-index: 1;
          border: 0;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default PhoneNumberInput;
