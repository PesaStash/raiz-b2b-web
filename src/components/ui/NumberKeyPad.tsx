import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import OTPInput from "react-otp-input";

interface NumberKeypadProps {
  onInputChange?: (value: string) => void;
  maxLength?: number;
  otpValue: string;
  setOtpValue: (val: string) => void;
}

const NumberKeypad: React.FC<NumberKeypadProps> = ({
  onInputChange,
  maxLength = 4,
  otpValue = "",
  setOtpValue,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = useRef<HTMLInputElement[]>([]); // Ref to store input elements

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus(); // Focus the first input
    }
  }, []);

  const handleNumberClick = (number: string) => {
    if (currentIndex < maxLength) {
      const newValue = otpValue + number;
      setOtpValue(newValue);
      setCurrentIndex(currentIndex + 1);

      if (onInputChange) {
        onInputChange(newValue);
      }

      // Focus the next input if available
      if (currentIndex + 1 < maxLength && inputRefs.current[currentIndex + 1]) {
        inputRefs.current[currentIndex + 1].focus();
      }
    }
  };

  const handleBackspace = () => {
    if (currentIndex > 0) {
      const newValue = otpValue.slice(0, -1);
      setOtpValue(newValue);
      setCurrentIndex(currentIndex - 1);

      if (onInputChange) {
        onInputChange(newValue);
      }

      // Focus the previous input
      if (inputRefs.current[currentIndex - 1]) {
        inputRefs.current[currentIndex - 1].focus();
      }
    }
  };

  const handleOtpChange = useCallback(
    (value: string) => {
      const sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, maxLength); // Allow only numbers, limit to maxLength
      setOtpValue(sanitizedValue);
      setCurrentIndex(sanitizedValue.length);
      if (onInputChange) {
        onInputChange(sanitizedValue);
      }

      // Focus the input corresponding to the current length
      if (inputRefs.current[sanitizedValue.length]) {
        inputRefs.current[sanitizedValue.length].focus();
      }
    },
    [maxLength, onInputChange, setOtpValue]
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <OTPInput
        value={otpValue}
        onChange={handleOtpChange}
        numInputs={maxLength}
        renderSeparator={<span className="mx-2" />}
        inputType="tel"
        renderInput={(props, index) => (
          <input
            {...props}
            type="password"
            autoComplete="off"
            maxLength={1}
            aria-label={`PIN input field ${index + 1}`}
            ref={(el) => {
              if (el) {
                inputRefs.current[index] = el; // Store input ref
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" || e.key === "Delete") {
                if (otpValue.length > 0) {
                  handleBackspace();
                }
                e.preventDefault(); // Prevent default backspace/delete behavior
              }
            }}
            className="!w-[56px] !h-[56px] p-2 focus:bg-[#fcfcfc] bg-[#f3f1f6] rounded-full border focus:border-gray-800 outline-none flex-col justify-center items-center gap-2 inline-flex text-gray-950 md:text-xl text-base font-normal"
          />
        )}
      />

      {/* Number Keypad */}
      <div className="grid grid-cols-3 gap-x-14 gap-y-8 mt-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button
            key={number}
            onClick={() => handleNumberClick(number.toString())}
            className="w-14 h-14 rounded-full bg-[#f3f1f6] hover:bg-gray-300 transition-colors flex items-center justify-center text-lg md:text-xl font-semibold"
          >
            {number}
          </button>
        ))}
        <div className="w-14 h-14 rounded-full transition-colors flex items-center justify-center text-xl font-semibold"></div>
        <button
          onClick={() => handleNumberClick("0")}
          className="w-14 h-14 rounded-full bg-[#f3f1f6] hover:bg-gray-300 transition-colors flex items-center justify-center text-xl font-semibold"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-14 h-14 rounded-full bg-[#f3f1f6] hover:bg-red-300 transition-colors flex items-center justify-center text-xl"
        >
          <Image
            src="/icons/close-circle.svg"
            width={32}
            height={32}
            alt="delete"
          />
        </button>
      </div>
    </div>
  );
};

export default NumberKeypad;
