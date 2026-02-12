"use client"
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import { IBusinessPaymentData } from '@/types/services'
import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import Image from 'next/image'
import NGNPalmPayAcct from './NGNPalmPayAcct'

export type TransferCurrencyType = "NGN" | "SBC" | "USD" | "GBP"
interface Props {
  transferCurrency: TransferCurrencyType
  data: IBusinessPaymentData
}

const GuestPayWithTransfer = ({ transferCurrency, data }: Props) => {

  const hasNgnAcct = data?.wallets?.find(
    (acct) =>
      acct.wallet_type.wallet_type_code === 2
  );

  const NGNAcct = data?.wallets?.find(
    (acct) =>
      acct.wallet_type.currency === "NGN"
  );
  const USDAcct = data?.wallets?.find(
    (acct) =>
      acct.wallet_type.currency === "USD"
  );
  const SBCAcct = data?.wallets?.find(
    (acct) =>
      acct.wallet_type.currency === "SBC"
  );
  const GBPAcct = true
  const secondarySBCAccts = SBCAcct?.secondary_crypto_details?.map((acct) => ({
    label: acct?.chain,
    value: acct.crypto_id,
  }))
  const [sbcType, setSbcType] = useState(secondarySBCAccts?.[0].value || "")
  const subSBCAcct = SBCAcct?.secondary_crypto_details?.find((acct) => acct.crypto_id === sbcType)
  const handlePaid = () => {
    toast.success(`${data?.account_user?.account_name} will be notified once the payment is successful.`)
  }
  return (
    <div className='h-[85%] mb-4 overflow-y-auto no-scrollbar'>
      {transferCurrency === "SBC" &&
        <div className='flex md:hidden justify-between items-center gap-2'>
          <div className='bg-[#F3F1F6] h-[2px] w-full' />
          <p className="text-center justify-start uppercase text-gray-400 text-[10px] font-semibold leading-4">Details</p>
          <div className='bg-[#F3F1F6] h-[2px] w-full' />
        </div>}
      <AnimatePresence mode="wait">
        {transferCurrency === "SBC" && (
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
      <div className="flex flex-col h-full  justify-between">
        {transferCurrency === "USD" && (
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
        {transferCurrency === "NGN" && (
          hasNgnAcct ? (
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
            </div>) :
            <NGNPalmPayAcct walletId={USDAcct?.wallet_id || ""} userName={data?.account_user?.account_name || ""} />
        )}
        {transferCurrency === "SBC" && (
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
        {transferCurrency === "GBP" && (
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
        {(GBPAcct || USDAcct || NGNAcct || SBCAcct) && hasNgnAcct !== undefined && <Button
          onClick={handlePaid}
          className="mt-5 mb-4">
          I&apos;ve made payment
        </Button>}
      </div>

    </div>
  )
}

export default GuestPayWithTransfer