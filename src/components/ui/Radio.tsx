import React from "react";

interface RadioProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  readOnly?: boolean;
  checkedColor?: string;
  "aria-label"?: string;
}

const Radio: React.FC<RadioProps> = ({
  checked,
  onChange,
  className,
  readOnly,
  checkedColor = "#7F56D9",
  "aria-label": ariaLabel,
}) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`w-5 h-5 border-2 rounded-full flex items-center justify-center cursor-pointer ${
        checked ? `border-[${checkedColor}] border-[5px]` : "border-gray-300"
      } ${className}`}
      onClick={onChange}
      disabled={readOnly}
    />
  );
};

export default Radio;
