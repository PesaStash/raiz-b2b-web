import React from "react";

const InputLabel = ({
  content,
  labelClass,
}: {
  content: string;
  labelClass?: string;
}) => {
  return (
    <label
      className={` text-raiz-gray-950 md:text-sm text-[13px] font-medium font-brSonoma leading-normal ${labelClass}`}
    >
      {content}
    </label>
  );
};

export default InputLabel;
