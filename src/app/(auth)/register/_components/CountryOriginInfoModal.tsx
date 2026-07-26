import Overlay from "@/components/ui/Overlay";
import Image from "next/image";
import React from "react";

const CountryOriginInfoModal = ({ close }: { close: () => void }) => {
  return (
    <Overlay width="375px" close={close}>
      <div className="flex flex-col  h-full py-8 px-5 ">
        <div className="flex justify-between items-center">
          <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Business Location
          </h5>
          <button onClick={close}>
            <Image
              src={"/icons/close.svg"}
              alt="close"
              width={16}
              height={16}
            />
          </button>
        </div>
        <p className="text-raiz-gray-950 text-[13px] font-normal  leading-tight">
        What is your business location?
        </p>
        <div className="mt-[44px] flex flex-col justify-center items-center gap-4">
          <svg width="49" height="48" viewBox="0 0 49 48" fill="none">
            <rect
              x="0.5"
              width="48"
              height="48"
              rx="24"
              fill="#EAECFF"
              fillOpacity="0.6"
            />
            <path
              opacity="0.35"
              d="M28.4999 13.5H33.1666C34.4558 13.5 35.4999 14.5442 35.4999 15.8333V20.3623C35.4999 21.2198 35.3004 22.0657 34.9166 22.8333C34.5328 23.601 34.3333 24.4468 34.3333 25.3043V32.0512C34.3333 33.4908 33.3533 34.745 31.9568 35.0938L29.6666 35.6667H28.2118C27.6296 35.6667 27.0521 35.5733 26.4991 35.389L25.7396 35.1358C24.5099 34.7263 23.1729 34.7707 21.9736 35.263C21.3226 35.529 20.6249 35.6667 19.9203 35.6667H17.3081C16.2546 35.6667 15.2443 35.2467 14.4999 34.5L14.4941 34.4942C13.7509 33.7475 13.3333 32.7372 13.3333 31.6837V27.6377C13.3333 26.7802 13.5328 25.9343 13.9166 25.1667C14.3004 24.399 14.4999 23.5532 14.4999 22.6957V19.3333C14.4999 18.0442 15.5441 17 16.8333 17H21.4999L24.9999 14.6667L28.4999 13.5Z"
              fill="#ECD95C"
            />
            <path
              d="M19.75 31C20.7165 31 21.5 30.2165 21.5 29.25C21.5 28.2835 20.7165 27.5 19.75 27.5C18.7835 27.5 18 28.2835 18 29.25C18 30.2165 18.7835 31 19.75 31Z"
              fill="#EA7441"
            />
            <path
              d="M25.0001 12.334C21.7789 12.334 19.1667 14.9462 19.1667 18.1673C19.1667 20.4738 21.5012 23.6553 23.2162 25.6818C24.1484 26.7832 25.8517 26.7832 26.7839 25.6818C28.4989 23.6553 30.8334 20.4738 30.8334 18.1673C30.8334 14.9462 28.2212 12.334 25.0001 12.334ZM25.0001 20.6675C23.6199 20.6675 22.4999 19.5487 22.4999 18.1673C22.4999 16.786 23.6199 15.6672 25.0001 15.6672C26.3802 15.6672 27.5002 16.7872 27.5002 18.1673C27.5002 19.5475 26.3802 20.6675 25.0001 20.6675Z"
              fill="#EA7441"
            />
          </svg>
          <p className="text-center text-raiz-gray-950 text-[13px] leading-tight">
          Choose the country where your business is legally incorporated or primarily operates.
          </p>
        </div>
      </div>
    </Overlay>
  );
};

export default CountryOriginInfoModal;
