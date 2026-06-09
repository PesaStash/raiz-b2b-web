"use client";
import React from "react";
import Overlay from "../ui/Overlay";
import NumberKeypad from "../ui/NumberKeyPad";
import Image from "next/image";

interface Props {
  pin: string;
  setPin: (value: string) => void;
  close: () => void;
}

const EnterPin = ({ pin, setPin, close }: Props) => {
  return (
    <Overlay width="385px" close={close}>
      <div
        className={`flex flex-col lg:h-[90%] xl:h-full
        }  py-8 px-5  text-raiz-gray-950 overflow-y-scroll`}
      >
        <div className="flex justify-between px-6">
          <h2 className=" text-lg md:text-xl font-bold  leading-normal">Enter Pin</h2>
          <button onClick={close}>
            <Image
              src={"/icons/close.svg"}
              alt="close"
              width={16}
              height={16}
            />
          </button>
        </div>
        <div className="my-[30px]">
          <NumberKeypad otpValue={pin} setOtpValue={setPin} />
        </div>
      </div>
    </Overlay>
  );
};

export default EnterPin;
