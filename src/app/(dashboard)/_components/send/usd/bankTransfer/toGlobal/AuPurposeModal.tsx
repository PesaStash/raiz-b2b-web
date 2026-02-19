import Overlay from "@/components/ui/Overlay";
import Radio from "@/components/ui/Radio";
import { convertField } from "@/utils/helpers";
import React from "react";

interface Props {
  data: string[];
  close: () => void;
  setRemittancePurpose: (arg: string) => void;
  remittancePurpose: string;
}
const AuPurposeModal = ({
  data,
  close,
  setRemittancePurpose,
  remittancePurpose,
}: Props) => {
  const handleClick = (val: string) => {
    close();
    setRemittancePurpose(val);
  };

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Select Remittance Purpose
        </h5>
        <div className="flex flex-col gap-4 mt-5 max-h-[450px] overflow-y-scroll no-scrollbar  w-full items-start">
          {data?.map((each, index) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleClick(each)}
              className="text-sm font-medium w-full flex gap-2 "
              key={index}
            >
              <Radio
                checked={each === remittancePurpose}
                onChange={() => handleClick(each)}
              />
              {convertField(each)}
            </div>
          ))}
        </div>
      </div>
    </Overlay>
  );
};

export default AuPurposeModal;
