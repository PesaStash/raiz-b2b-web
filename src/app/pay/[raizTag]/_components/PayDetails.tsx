"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { IBusinessPaymentData } from "@/types/services";

import { toast } from "sonner";
import CopyButton from "@/components/ui/CopyButton";
import QRCode from "react-qr-code";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { WALLET_TYPES } from "@/constants/misc";
import { GuestPaymentType } from "../PayUserClient";

interface Props {
  setScreen: Dispatch<SetStateAction<GuestPaymentType | "detail" | null>>;
  data: IBusinessPaymentData;
}

type CurrencyType = "NGN" | "SBC" | "USD" | "GBP"

const PayDetails = ({ setScreen, data }: Props) => {
  const NGNAcct = data?.wallets?.find(
    (acct: { wallet_type: { currency: string } }) =>
      acct.wallet_type.currency === "NGN"
  );
  const USDAcct = data?.wallets?.find(
    (acct: { wallet_type: { currency: string } }) =>
      acct.wallet_type.currency === "USD"
  );
  const SBCAcct = data?.wallets?.find(
    (acct: { wallet_type: { currency: string } }) =>
      acct.wallet_type.currency === "SBC"
  );
  const allowedWalletTypeCodes = Object.keys(WALLET_TYPES)
    .map(Number)
    .filter((code) => [1, 2, 3].includes(code));

  const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const availablepaymentOptsArr = data?.wallets
    ?.filter((acct) => {
      const allowedType = allowedWalletTypeCodes.includes(acct?.wallet_type?.wallet_type_code);
      const notEmail = !isEmail(acct.account_number || "");
      return allowedType && notEmail;
    })
    .map((acct) => ({
      label: `${acct.wallet_type.currency !== "SBC"
        ? acct.wallet_type.currency
        : "Crypto"
        } Transfer`,
      value: acct.wallet_type.currency,
    })) ?? [];


  const secondarySBCAccts = SBCAcct?.secondary_crypto_details?.map((acct) => ({
    label: acct?.chain,
    value: acct.crypto_id,
  }))

  const [type, setType] = useState<CurrencyType>(availablepaymentOptsArr?.[0].value || "");
  const [sbcType, setSbcType] = useState(secondarySBCAccts?.[0].value || "")
  const handleType = (value: CurrencyType) => {
    // actions.selectCurrency(value === "ngn" ? "NGN" : "USD");
    setType(value);
  };


  const handlePaid = () => {
    setScreen(null)
    toast.success(`${data?.account_user?.account_name} will be notified once the payment is successful.`)
  }

  const subSBCAcct = SBCAcct?.secondary_crypto_details?.find((acct) => acct.crypto_id === sbcType)
  const displayName = () => {
    let str = "";
    if (data?.account_user?.account_name) {
      str = `${data?.account_user?.account_name}`;
    } else {
      str = `${data?.account_user?.username || ""}`;
    }
    return str;
  }
  return (
    <>

      <Image
        className="mt-10"
        src={"/icons/paylink.svg"}
        width={38}
        height={38}
        alt="Logo"
      />
      <div className="mt-2 ">
        <div className="flex  gap-4">
          <button onClick={() => setScreen(null)}>
            <Image
              className="w-4 h-4 md:w-[18px] md:h-[18px]"
              src={"/icons/arrow-left.svg"}
              width={18.48}
              height={18.48}
              alt="back"
            />
          </button>
          <h2 className="text-raiz-gray-950 font-semibold text-lg md:text-[23px] leading-normal md:leading-[40px]">
            Pay {displayName()}
          </h2>
        </div>
        <p className="text-raiz-gray-700 text-sm md:text-base mt-1 font-[15px] ">
          Transfer the amount you want to fund.
        </p>
      </div>
      <div className="flex gap-4 w-full overflow-x-auto mt-4 pb-2 pl-2 min-h-[50px] items-center no-scrollbar">
        {availablepaymentOptsArr?.map((opt, i) => (
          <motion.button
            key={opt.value}
            onClick={() => handleType(opt.value)}
            className={`flex h-9 min-h-[36px] whitespace-nowrap items-center gap-1 py-2 px-[10px] border rounded-full text-sm bg-[#FCFCFD] flex-shrink-0 ${opt.value === type ? "border-[#6F5B86] text-primary2 font-semibold" : "border-[#E4E0EA] text-[#6F5B86]"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: opt.value === type ? 1.05 : 1,
              backgroundColor: opt.value === type ? "#F8F6FA" : "#FCFCFD"
            }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: 0.3,
              delay: i * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <motion.div
              animate={{
                rotate: opt.value === type ? [0, -10, 10, 0] : 0
              }}
              transition={{
                duration: 0.5,
                delay: 0.1
              }}
            >
              <Image src={`/icons/${opt.value === "NGN" ? "ngn" : opt.value === "USD" ? "dollar" : "sbc"}.svg`} alt={opt.value} width={20} height={20} />
            </motion.div>
            <span>{opt.label}</span>
          </motion.button>
        ))}
        <motion.button
          onClick={() => handleType("GBP")}
          className={`flex h-9 min-h-[36px] whitespace-nowrap items-center gap-1 py-2 px-[10px] border rounded-full text-sm bg-[#FCFCFD] flex-shrink-0 ${type === "GBP" ? "border-[#6F5B86] text-primary2 font-semibold" : "border-[#E4E0EA] text-[#6F5B86]"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: type === "GBP" ? 1.05 : 1,
            backgroundColor: type === "GBP" ? "#F8F6FA" : "#FCFCFD"
          }}
          whileHover={{
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          transition={{
            duration: 0.3,
            delay: availablepaymentOptsArr?.length * 0.05,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          <motion.div
            animate={{
              rotate: type === "GBP" ? [0, -10, 10, 0] : 0
            }}
            transition={{
              duration: 0.5,
              delay: 0.1
            }}
          >
            <Image src={`/icons/gbp.png`} alt="GBP" width={20} height={20} />
          </motion.div>
          <span>GBP</span>
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        {type === "SBC" && (
          <motion.div
            className="flex gap-4 w-full overflow-x-auto mt-1 pb-2 pl-1 items-center min-h-[40px] no-scrollbar"
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto"
            }}
            exit={{
              opacity: 0,
              height: 0
            }}
            transition={{ duration: 0.3 }}
          >
            {secondarySBCAccts?.map((opt, i) => (
              <motion.button
                key={opt.value}
                onClick={() => setSbcType(opt.value)}
                className={`flex h-6 min-h-[24px] capitalize whitespace-nowrap items-center gap-1 py-2 px-2 border rounded-full text-xs bg-[#FCFCFD] flex-shrink-0 ${opt.value === sbcType ? "border-[#6F5B86] text-primary2 font-semibold" : "border-[#E4E0EA] text-[#6F5B86]"}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: opt.value === sbcType ? 1.05 : 1,
                  backgroundColor: opt.value === sbcType ? "#F8F6FA" : "#FCFCFD"
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <motion.div
                  animate={{
                    rotate: opt.value === sbcType ? [0, -10, 10, 0] : 0
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1
                  }}
                >
                  <Image src={`/icons/${opt.label === "ethereum" ? "eth" : opt.label}.svg`} alt={opt.label} width={14} height={14} />
                </motion.div>
                <span>{opt.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col h-full justify-between">
        {type === "USD" && (
          <div className="p-7 bg-violet-100/60 rounded-[20px]  inline-flex flex-col justify-center items-center gap-5 w-full my-3">
            {/* Bank details */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Bank Name
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {USDAcct?.bank_name || ""}
              </p>
            </div>
            {/* Acct number */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Account Number
              </span>
              <div className="flex items-cen text-basetmd:er gap-2">
                <p className="text-center justify-start text-zinc-900 text-lg font-semibold  leading-normal">
                  {USDAcct?.account_number || ""}
                </p>
                <CopyButton value={USDAcct?.account_number || ""} />
              </div>
            </div>
            {/* Routing Number (ACH) */}

            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Routing Number (ACH)
              </span>
              <div className="flex items-cen text-basetmd:er gap-2">
                <p className="text-center justify-start text-zinc-900 text-lg font-semibold  leading-normal">
                  {
                    USDAcct?.routing?.find(
                      (route) => route.routing_type_name === "ACH"
                    )?.routing
                  }
                </p>
                <CopyButton value={USDAcct?.routing?.find(
                  (route) => route.routing_type_name === "ACH"
                )?.routing || ""} />
              </div>
            </div>
            {/* Routing Number (WIRE) */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Routing Number (WIRE)
              </span>
              <div className="flex items-cen text-basetmd:er gap-2">
                <p className="text-center justify-start text-zinc-900 text-lg font-semibold  leading-normal">
                  {
                    USDAcct?.routing?.find(
                      (route) => route.routing_type_name === "WIRE"
                    )?.routing
                  }
                </p>
                <CopyButton value={USDAcct?.routing?.find(
                  (route) => route.routing_type_name === "WIRE"
                )?.routing || ""} />
              </div>
            </div>
            {/* Currency */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Currency
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {USDAcct?.wallet_type.currency || ""}
              </p>
            </div>
            {/*  Address */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Address
              </span>
              <div className="flex text-l text-baseemd:ft gap-2">
                <p className="text-center justify-start text-zinc-900 text-lg font-semibold  leading-normal">
                  1801 Main St., Kansas City, MO 64108
                  {/* {USDAcct?.} */}
                </p>
                <CopyButton value="1801 Main St., Kansas City, MO 64108" />
              </div>
            </div>
          </div>
        )}
        {type === "NGN" && (
          <div className="p-7 bg-violet-100/60 rounded-[20px] inline-flex flex-col justify-center items-center gap-5 w-full my-3">
            {/* Bank details */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Bank Name
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {NGNAcct?.bank_name || ""}
              </p>
            </div>
            {/* Acct number */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Account Number
              </span>
              <div className="flex items-center gap-2">
                <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                  {NGNAcct?.account_number || ""}
                </p>
                <CopyButton value={NGNAcct?.account_number || ""} />

              </div>
            </div>

            {/* Currency */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Currency
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {NGNAcct?.wallet_type.currency || ""}
              </p>
            </div>
          </div>
        )}
        {type === "SBC" && (
          <div className="p-7 bg-violet-100/60 rounded-[20px] inline-flex flex-col justify-center items-center gap-5 w-full my-[30px]">

            <QRCode
              value={subSBCAcct?.qr_code || subSBCAcct?.address || ""}
              size={231}
              className="p-[17px] bg-[#EAECFF99] rounded-[20px]"
            />
            {/* Address */}
            <div className="w-full flex flex-col justify-center items-center">
              <p className="text-left w-full md:text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Deposit Address
              </p>
              <div className="flex justify-between gap-2">
                <p style={{ overflowWrap: "anywhere" }} className="text-left wrap-anywhere justify-start text-zinc-900 text-sm font-semibold  leading-normal">
                  {subSBCAcct?.address || ""}
                </p>
                <div className="size-4">
                  <CopyButton value={subSBCAcct?.address || ""} />
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-left w-full md:text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Chain
              </span>
              <p className="w-full md:text-center capitalize justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {subSBCAcct?.chain || ""}
              </p>
            </div>
          </div>
        )}
        {type === "GBP" && (
          <div className="p-7 bg-violet-100/60 rounded-[20px] inline-flex flex-col justify-center items-center gap-5 w-full my-[30px]">
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Account Holder
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                Vestafrik Technologies Limited
              </p>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Account number
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                35486872
              </p>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Sort code
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                60-84-64
              </p>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-gray-500 text-sm md:text-base font-normal leading-normal">
                Address
              </span>
              <p className="text-center justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                Worship Square, 65 Clifton Street, London. EC2A 4JE. United Kingdom
              </p>
            </div>
          </div>
        )}
        <div>
          {/* <Button
            onClick={() => setScreen("card")}
            className="mt-5 mb-4">
            Pay with Card
          </Button> */}
          <Button
            onClick={handlePaid}
            className="mt-5 mb-4">
            I&apos;ve made payment
          </Button>
          <p className="text-[13px] text-raiz-gray-900  text-center mt-2">
            Don&#39;t have Raiz? <Link
              target="_blank"
              className="font-bold"
              href={"https://raizapp.onelink.me/RiOx/webdirect"}
            >
              Download
            </Link> Raiz app |  <Link
              target="_blank"
              className="font-bold"
              href={"/register"}
            >
              Sign up{" "}
            </Link>{" "} on Raiz Business

          </p>
        </div>
      </div>
    </>
  );
};

export default PayDetails;
