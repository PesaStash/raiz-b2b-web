import React from "react";

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  bgStyle?: string;
  label?: string;
  checkMarkColor?: string;
  labelClass?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  className = "",
  bgStyle = "bg-[#5BC88A]/30 border-transparent",
  label,
  checkMarkColor = "#5ac88a",
  labelClass,
}) => {
  const checkboxId = id || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <label
        htmlFor={checkboxId}
        className={`flex items-center justify-center w-[18px] h-[18px] border-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out ${
          checked ? bgStyle : "bg-white border-gray-300"
        }`}
        style={{
          minWidth: "20px",
          minHeight: "20px",
        }}
      >
        {checked && (
          <svg
            width="10"
            height="7"
            viewBox="0 0 10 7"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.00025 7.00025C3.74425 7.00025 3.48825 6.90225 3.29325 6.70725L0.29325 3.70725C-0.09775 3.31625 -0.09775 2.68425 0.29325 2.29325C0.68425 1.90225 1.31625 1.90225 1.70725 2.29325L4.00025 4.58625L8.29325 0.29325C8.68425 -0.09775 9.31625 -0.09775 9.70725 0.29325C10.0983 0.68425 10.0983 1.31625 9.70725 1.70725L4.70725 6.70725C4.51225 6.90225 4.25625 7.00025 4.00025 7.00025Z"
              fill={checkMarkColor}
            />
          </svg>
        )}
      </label>
      {label && (
        <span
          className={`ml-2 text-bg-text text-sm max-sm:text-xs ${labelClass}`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Checkbox;
