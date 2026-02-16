"use client";
import Image from "next/image";

const CenterModalHeader = ({ close }: { close: () => void }) => {
  return (
    <button onClick={close} className="mb-4">
      <Image src={"/icons/arrow-left.svg"} width={18} height={18} alt="back" />
    </button>
  );
};

export default CenterModalHeader;
