"use client";
import Image from "next/image";


interface Props {
  close: () => void;
  title?: string;
  titleClassname?: string;

}

const CenterModalHeader = ({ close, title, titleClassname }: Props) => {
  return (
    <div className="flex items-center mb-4 gap-2 w-full justify-between py-4 md:py-0">
    <button onClick={close} className=" flex items-center justify-center gap-2 ">
      <Image src={"/icons/arrow-left.svg"} className="w-4 h-4 md:w-4.5 md:h-4.5" width={18} height={18} alt="back" />
      </button>
    {title && <h2 className={`text-raiz-gray-950 text-base md:text-xl font-bold leading-normal ${titleClassname}`}>{title}</h2>}
    <div className="size-1"/>
    
    </div>
  );
};

export default CenterModalHeader;
