"use client";
import React, { JSX, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import GuestPayWithCard from "./GuestPayWithCard";
// import PayWithCard from './_components/PayWithCard';
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { FetchPaymentInfoApi } from "@/services/business";
import Spinner from "@/components/ui/Spinner";
import GuestPayWithZelle from "./GuestPayWithZelle";
import GuestPayWithTransfer, {
  TransferCurrencyType,
} from "./GuestPayWithTransfer";
import { WALLET_TYPES } from "@/constants/misc";
import * as motion from "motion/react-client";
// import { decryptData } from '@/lib/headerEncryption';
// import { useGuestSendStore } from '@/store/GuestSend';
// import { useTopupStore } from '@/store/TopUp';
// import { IBusinessPaymentData } from '@/types/services';

export type GuestPaymentType = "card" | "transfer" | "zelle";
export type GuestPayDetailsSteps = "details" | "summary" | "status" | "receipt";

const paymentMethodsArr: {
  id: GuestPaymentType;
  label: string;
  icon: (active: boolean) => JSX.Element;
  subText: string;
}[] = [
  // {
  //   id: "card",
  //   label: "Pay with card",
  //   icon: (active: boolean) => (
  //     <svg width="24" height="24" viewBox="0 0 24 24">
  //       <path
  //         d="M22 7.55002C22 8.21002 21.46 8.75002 20.8 8.75002H3.2C2.54 8.75002 2 8.21002 2 7.55002V7.54002C2 5.25002 3.85 3.40002 6.14 3.40002H17.85C20.14 3.40002 22 5.26002 22 7.55002Z"
  //         fill={active ? "#3C2875" : "#A89AB9"}
  //       />
  //       <path
  //         d="M2 11.45V16.46C2 18.75 3.85 20.6 6.14 20.6H17.85C20.14 20.6 22 18.74 22 16.45V11.45C22 10.79 21.46 10.25 20.8 10.25H3.2C2.54 10.25 2 10.79 2 11.45Z"
  //         fill={active ? "#3C2875" : "#A89AB9"}
  //       />
  //     </svg>
  //   ),
  //   subText: "Pay with your credit or debit card",
  // },
  {
    id: "transfer",
    label: "Pay with transfer",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 12.2H15"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
        <path
          d="M8 16.2H12.38"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
        <path
          d="M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
        <path
          d="M16 4.02C19.33 4.2 21 5.43 21 10V16C21 20 20 22 15 22H9C4 22 3 20 3 16V10C3 5.44 4.67 4.2 8 4.02"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
      </svg>
    ),
    subText: "Send money through bank transfer",
  },
  {
    id: "zelle",
    label: "Pay with Zelle",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M8.67 14.33C8.67 15.62 9.66 16.66 10.89 16.66H13.4C14.47 16.66 15.34 15.75 15.34 14.63C15.34 13.41 14.81 12.98 14.02 12.7L9.99 11.3C9.2 11.02 8.67 10.59 8.67 9.37C8.67 8.25 9.54 7.34 10.61 7.34H13.12C14.35 7.34 15.34 8.38 15.34 9.67"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
        <path
          d="M12 6V18"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
        <path
          d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
          stroke={active ? "#3C2875" : "#A89AB9"}
          strokeWidth="1.5"
        />
      </svg>
    ),
    subText: "Pay with Zelle",
  },
];

const RaizPaymentPage = () => {
  const params = useParams();
  // const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState<string | null>("transfer");
  // const [amount, setAmount] = useState<string | undefined>();
  const [screen, setScreen] = useState<GuestPaymentType | "detail" | null>(
    "transfer"
  );
  const [transferCurrency, setTransferCurrency] =
    useState<TransferCurrencyType>("GBP");
  // const [step, setStep] = useState<GuestPayDetailsSteps>("details");
  // const [paymentType, setPaymentType] = useState<
  //     GuestPaymentType | undefined
  // >();
  // const { actions } = useGuestSendStore();
  // const { actions: topupActions } = useTopupStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ["business-payment-info"],
    queryFn: () => FetchPaymentInfoApi(params?.raizTag as string),
  });

  // useEffect(() => {
  //     const encryptedData = searchParams.get("data");

  //     if (encryptedData) {
  //         try {
  //             const decrypted = decryptData(encryptedData);
  //             if (decrypted) {
  //                 const data = JSON.parse(decrypted);
  //                 if (data.amount) {
  //                     setAmount(data.amount);
  //                     actions.setField("amount", data.amount);
  //                 }
  //             }
  //         } catch (error) {
  //             console.error("Failed to decrypt or parse data", error);
  //         }
  //     }
  // }, [searchParams]);

  const allowedWalletTypeCodes = Object.keys(WALLET_TYPES)
    .map(Number)
    .filter((code) => [1, 2, 3].includes(code));

  const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const availablepaymentOptsArr =
    data?.wallets
      ?.filter((acct) => {
        const allowedType = allowedWalletTypeCodes.includes(
          acct?.wallet_type?.wallet_type_code
        );
        const notEmail = !isEmail(acct.account_number || "");
        return allowedType && notEmail;
      })
      .map((acct) => ({
        label: `${
          acct.wallet_type.currency !== "SBC"
            ? acct.wallet_type.currency
            : "Crypto"
        } Transfer`,
        value: acct.wallet_type.currency,
      })) ?? [];

  const hasNgnAcct = data?.wallets?.find(
    (acct) => acct.wallet_type.wallet_type_code === 2
  );

  const handleMethodClick = (id: GuestPaymentType) => {
    setScreen((prev) => (prev === id ? null : id));
    setMobileOpen((prev) => (prev === id ? null : id));
  };
  const displayScreen = () => {
    switch (screen) {
      case "card":
        if (data) return <GuestPayWithCard data={data} />;
      case "transfer":
        if (data)
          return (
            <GuestPayWithTransfer
              transferCurrency={transferCurrency}
              data={data}
            />
          );
      case "zelle":
        if (data) return <GuestPayWithZelle data={data} />;
      default:
        return null;
    }
  };
  if ((error || !data) && !isLoading) {
    return (
      <section className="p-6 md:p-12 lg:px-8 xl:px-12 h-[calc(100vh-2rem)] md:h-full min-h-[100vh] flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 w-full max-w-md text-center shadow-md">
          <div className="flex flex-col items-center gap-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.4"
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                fill="#D03660"
              />
              <path
                d="M12 13.75C12.41 13.75 12.75 13.41 12.75 13V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V13C11.25 13.41 11.59 13.75 12 13.75Z"
                fill="#0C160E"
              />
              <path
                d="M12.92 15.6199C12.87 15.4999 12.8 15.3899 12.71 15.2899C12.61 15.1999 12.5 15.1299 12.38 15.0799C12.14 14.9799 11.86 14.9799 11.62 15.0799C11.5 15.1299 11.39 15.1999 11.29 15.2899C11.2 15.3899 11.13 15.4999 11.08 15.6199C11.03 15.7399 11 15.8699 11 15.9999C11 16.1299 11.03 16.2599 11.08 16.3799C11.13 16.5099 11.2 16.6099 11.29 16.7099C11.39 16.7999 11.5 16.8699 11.62 16.9199C11.74 16.9699 11.87 16.9999 12 16.9999C12.13 16.9999 12.26 16.9699 12.38 16.9199C12.5 16.8699 12.61 16.7999 12.71 16.7099C12.8 16.6099 12.87 16.5099 12.92 16.3799C12.97 16.2599 13 16.1299 13 15.9999C13 15.8699 12.97 15.7399 12.92 15.6199Z"
                fill="#0C160E"
              />
            </svg>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-red-700">
              We couldn&#39;t fetch the payment information. Please try again
              later.
            </p>
          </div>
        </div>
      </section>
    );
  }
  const selectedMethodObj = paymentMethodsArr.find(
    (item) => item.id === screen
  );
  return (
    <div className="min-h-screen bg-[url('/images/paybg.gif')] bg-no-repeat bg-cover flex md:items-center justify-center p-0 md:p-4">
      {/* Logo */}
      <div className="absolute top-8 left-8">
        <Link href={"https://www.raiz.app"}>
          <Image
            src={"/icons/Logo-3.svg"}
            alt="Raiz"
            width={91.9}
            height={32}
          />
        </Link>
      </div>

      {/* Main Container */}
      {isLoading ? (
        <div className="flex justify-center items-center w-full mt-5">
          <Spinner className="border-white" />
        </div>
      ) : (
        <div className="w-full mt-[100px] lg:mt-[50px] xl:mt-0 max-w-4xl md:h-[80vh] bg-white rounded-[20px] rounded-b-none md:rounded-b-[20px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Left Sidebar */}
          <div className="w-full md:[32.8%] md:max-w-[296px] bg-[#FCFCFD]  flex flex-col">
            {/* Store Info */}
            <div className=" p-5 flex flex-row items-center gap-2 md:flex-col md:items-start">
              <Avatar
                size={36}
                className="w-9 h-9 md:w-[48px] md:h-[48px] md:mb-3"
                src={""}
                name={""}
              />
              <h2 className="text-base font-bold text-raiz-gray-950">{`${data?.account_user?.account_name}`}</h2>
            </div>

            {/* Payment Methods */}
            <div className="flex-1 mx-5 md:mx-0">
              <h3 className="text-raiz-gray-950 mb-4 px-5 hidden md:block">
                Payment Methods
              </h3>
              <h3 className="text-raiz-gray-950 mb-4 block font-normal leading-6 md:hidden">
                Choose your payment method
              </h3>
              <div className="block w-[calc(100%+40px)] -ml-[19px] mb-8 h-[1px] md:hidden border-b-[1.5px] border-[#F3F1F6]" />
              <div className="space-y-4 md:space-y-1.5">
                {paymentMethodsArr.map(({ id, label, icon }) => {
                  const active = screen === id;
                  const isOpen = mobileOpen === id;

                  return (
                    <div key={id} className="md:border-none border rounded-xl">
                      <button
                        onClick={() => handleMethodClick(id)}
                        className={`w-full flex items-center justify-between gap-3 px-5 py-3 border-t-[0.5px] md:border-t-0 border-b-0 rounded-xl transition-all
                    ${isOpen || active ? "bg-indigo-50" : ""}`}
                      >
                        <div className="flex gap-2 items-center">
                          {icon(isOpen)}
                          <span
                            className={`text-xs md:text-base font-bold ${
                              isOpen || active
                                ? "text-primary2"
                                : "text-raiz-gray-600"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        <Image
                          className={`${
                            id === "transfer" ? "" : "md:hidden"
                          } transition-all ${isOpen ? "rotate-180" : ""}`}
                          src="/icons/arrow-down.svg"
                          alt="down"
                          width={16}
                          height={16}
                        />
                      </button>
                      {id === "transfer" && (active || isOpen) && (
                        <div className={`mt-4 flex flex-col gap-1`}>
                          <motion.button
                            onClick={() => setTransferCurrency("GBP")}
                            className={`flex   mx-6 px-5 whitespace-nowrap items-center gap-1 py-2  rounded-xl text-sm w-[85%]  flex-shrink-0  ${
                              transferCurrency === "GBP"
                                ? "bg-[#EAECFF66] text-primary2 font-semibold"
                                : "text-[#6F5B86]"
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: transferCurrency === "GBP" ? 1.05 : 1,
                              backgroundColor:
                                transferCurrency === "GBP"
                                  ? "#F8F6FA"
                                  : "#FCFCFD",
                            }}
                            whileHover={{
                              scale: 1.05,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                              duration: 0.3,
                              delay: availablepaymentOptsArr?.length * 0.05,
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            <motion.div
                              animate={{
                                rotate:
                                  transferCurrency === "GBP"
                                    ? [0, -10, 10, 0]
                                    : 0,
                              }}
                              transition={{
                                duration: 0.5,
                                delay: 0.1,
                              }}
                            >
                              <Image
                                src={`/icons/gbp.png`}
                                alt="GBP"
                                width={20}
                                height={20}
                              />
                            </motion.div>
                            <span>GBP transfer</span>
                          </motion.button>
                          {availablepaymentOptsArr?.map((opt, i) => (
                            <motion.button
                              key={opt.value}
                              onClick={() => setTransferCurrency(opt.value)}
                              className={`flex   mx-6 px-5 whitespace-nowrap items-center gap-1 py-2  rounded-xl text-sm w-[85%]  flex-shrink-0 ${
                                opt.value === transferCurrency
                                  ? "bg-[#EAECFF66] text-primary2 font-semibold"
                                  : "text-[#6F5B86]"
                              }`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                scale:
                                  opt.value === transferCurrency ? 1.05 : 1,
                                backgroundColor:
                                  opt.value === transferCurrency
                                    ? "#F8F6FA"
                                    : "#FCFCFD",
                              }}
                              whileHover={{
                                scale: 1.05,
                                transition: { duration: 0.2 },
                              }}
                              whileTap={{ scale: 0.95 }}
                              transition={{
                                duration: 0.3,
                                delay: i * 0.05,
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                              }}
                            >
                              <motion.div
                                animate={{
                                  rotate:
                                    opt.value === transferCurrency
                                      ? [0, -10, 10, 0]
                                      : 0,
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: 0.1,
                                }}
                              >
                                <Image
                                  src={`/icons/${
                                    opt.value === "NGN"
                                      ? "ngn"
                                      : opt.value === "USD"
                                      ? "dollar"
                                      : "sbc"
                                  }.svg`}
                                  alt={opt.value}
                                  width={20}
                                  height={20}
                                />
                              </motion.div>
                              <span>{opt.label}</span>
                            </motion.button>
                          ))}
                          {!hasNgnAcct && (
                            <motion.button
                              onClick={() => setTransferCurrency("NGN")}
                              className={`flex   mx-6 px-5 whitespace-nowrap items-center gap-1 py-2  rounded-xl text-sm w-[85%]  flex-shrink-0  ${
                                transferCurrency === "NGN"
                                  ? "bg-[#EAECFF66] text-primary2 font-semibold"
                                  : "text-[#6F5B86]"
                              }`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                scale: transferCurrency === "NGN" ? 1.05 : 1,
                                backgroundColor:
                                  transferCurrency === "NGN"
                                    ? "#F8F6FA"
                                    : "#FCFCFD",
                              }}
                              whileHover={{
                                scale: 1.05,
                                transition: { duration: 0.2 },
                              }}
                              whileTap={{ scale: 0.95 }}
                              transition={{
                                duration: 0.3,
                                delay: availablepaymentOptsArr?.length * 0.05,
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                              }}
                            >
                              <motion.div
                                animate={{
                                  rotate:
                                    transferCurrency === "NGN"
                                      ? [0, -10, 10, 0]
                                      : 0,
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: 0.1,
                                }}
                              >
                                <Image
                                  src={`/icons/ngn.svg`}
                                  alt="NGN"
                                  width={20}
                                  height={20}
                                />
                              </motion.div>
                              <span>NGN transfer</span>
                            </motion.button>
                          )}
                        </div>
                      )}
                      <div
                        className={`md:hidden overflow-auto no-scrollbar transition-all duration-300 
                ${isOpen ? "max-h-[500px] py-4 px-2" : "max-h-0"}`}
                      >
                        {id === "card" && data && (
                          <GuestPayWithCard data={data} />
                        )}
                        {id === "transfer" && data && (
                          <GuestPayWithTransfer
                            transferCurrency={transferCurrency}
                            data={data}
                          />
                        )}
                        {id === "zelle" && data && (
                          <GuestPayWithZelle data={data} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connect Section */}
            <div className="mt-8 pt-8 px-5 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-raiz-gray-950 mb-3">
                Connect with Raiz
              </h3>
              <div className="flex items-center gap-4">
                <a
                  target="_blank"
                  href="https://www.instagram.com/raizdigitalcompany/"
                  className="flex gap-1 items-center text-raiz-gray-950 text-[13px] hover:text-blue-800 transition"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.75"
                      d="M10.6667 14H5.33333C3.49267 14 2 12.5073 2 10.6667V5.33333C2 3.49267 3.49267 2 5.33333 2H10.6667C12.5073 2 14 3.49267 14 5.33333V10.6667C14 12.5073 12.5073 14 10.6667 14Z"
                      fill="url(#paint0_linear_27874_18957)"
                    />
                    <path
                      d="M7.99996 4.66663C6.15929 4.66663 4.66663 6.15929 4.66663 7.99996C4.66663 9.84063 6.15929 11.3333 7.99996 11.3333C9.84063 11.3333 11.3333 9.84063 11.3333 7.99996C11.3333 6.15929 9.84063 4.66663 7.99996 4.66663ZM7.99996 9.99996C6.89529 9.99996 5.99996 9.10463 5.99996 7.99996C5.99996 6.89529 6.89529 5.99996 7.99996 5.99996C9.10463 5.99996 9.99996 6.89529 9.99996 7.99996C9.99996 9.10463 9.10463 9.99996 7.99996 9.99996Z"
                      fill="white"
                    />
                    <path
                      d="M11.3333 5.33333C11.7015 5.33333 12 5.03486 12 4.66667C12 4.29848 11.7015 4 11.3333 4C10.9651 4 10.6666 4.29848 10.6666 4.66667C10.6666 5.03486 10.9651 5.33333 11.3333 5.33333Z"
                      fill="white"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_27874_18957"
                        x1="8"
                        y1="2"
                        x2="8"
                        y2="14"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#AE06FE" />
                        <stop offset="1" stopColor="#FF8A00" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-[13px] font-semibold leading-snug tracking-tight">
                    Instagram
                  </span>
                </a>
                <a
                  target="_blank"
                  href={"https://www.raiz.app/"}
                  className="flex gap-1 items-center text-raiz-gray-950 text-[13px] hover:text-blue-800 transition"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_27874_18963)">
                      <path
                        opacity="0.35"
                        d="M8.00004 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8.00004C14.6667 4.31814 11.6819 1.33337 8.00004 1.33337C4.31814 1.33337 1.33337 4.31814 1.33337 8.00004C1.33337 11.6819 4.31814 14.6667 8.00004 14.6667Z"
                        fill="#3F8CFF"
                      />
                      <path
                        d="M9.33337 14.5087V11.8154C8.93137 12.7854 8.41737 13.3334 8.00004 13.3334C7.24204 13.3334 6.16604 11.5354 6.01871 8.66671H9.33337V8.49071C9.33337 8.04937 9.49737 7.64937 9.76004 7.33337H6.01871C6.16604 4.46471 7.24204 2.66671 8.00004 2.66671C8.73937 2.66671 9.77737 4.37804 9.96604 7.12137C10.2874 6.84204 10.702 6.66671 11.16 6.66671C11.194 6.66671 11.226 6.67471 11.2594 6.67671C11.1334 5.32671 10.828 4.13604 10.3734 3.23071C11.9347 4.01137 13.0607 5.53204 13.2867 7.33337H12.5774L14.538 9.29404C14.6214 8.87537 14.6667 8.44271 14.6667 8.00004C14.6667 4.32404 11.676 1.33337 8.00004 1.33337C4.32404 1.33337 1.33337 4.32404 1.33337 8.00004C1.33337 11.676 4.32404 14.6667 8.00004 14.6667C8.45737 14.6667 8.90404 14.62 9.33604 14.532C9.33537 14.524 9.33337 14.5167 9.33337 14.5087ZM2.71271 8.66671H4.68204C4.75604 10.2947 5.09804 11.718 5.62604 12.7694C4.06471 11.9887 2.93937 10.4674 2.71271 8.66671ZM4.68271 7.33337H2.71271C2.93871 5.53271 4.06471 4.01137 5.62604 3.23071C5.09871 4.28204 4.75604 5.70537 4.68271 7.33337Z"
                        fill="#2E3787"
                      />
                      <path
                        d="M15.7 12.342L11.5026 8.14462C11.1946 7.83595 10.6666 8.05462 10.6666 8.49062V14.5086C10.6666 14.9073 11.108 15.1466 11.4426 14.9306L12.6826 14.1273L13.4466 15.6153C13.6253 15.9633 14.0526 16.1006 14.4006 15.922C14.7486 15.7433 14.886 15.316 14.7073 14.968L13.956 13.5073L15.45 13.1886C15.8393 13.1053 15.982 12.6233 15.7 12.342Z"
                        fill="#2E3787"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_27874_18963">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="text-[13px] font-semibold leading-snug tracking-tight">
                    Website
                  </span>
                </a>
                <a
                  target="_blank"
                  href={
                    "https://web.facebook.com/people/Raiz-Digital-Services-Company/61557956021410/"
                  }
                  className="text-raiz-gray-950 text-[13px] hover:text-blue-800 transition flex gap-1 items-center"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.75"
                      d="M12 14H4C2.89533 14 2 13.1047 2 12V4C2 2.89533 2.89533 2 4 2H12C13.1047 2 14 2.89533 14 4V12C14 13.1047 13.1047 14 12 14Z"
                      fill="#003A90"
                    />
                    <path
                      d="M8.41405 13.9999V9.35927H6.85205V7.54261H8.41405V6.20594C8.41405 4.65661 9.36138 3.81194 10.7441 3.81194C11.2101 3.81061 11.6754 3.83461 12.1387 3.88194V5.50194H11.1867C10.4334 5.50194 10.2867 5.85794 10.2867 6.38328V7.53994H12.0867L11.8527 9.35661H10.2761V13.9999H8.41405Z"
                      fill="white"
                    />
                  </svg>
                  <span className="text-[13px] font-semibold leading-snug tracking-tight">
                    Facebook
                  </span>
                </a>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-8  px-5 pb-8">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Don&apos;t have Raiz?
              </p>
              <div className="flex gap-3 text-[13px]">
                <a
                  target="_blank"
                  href="https://raizapp.onelink.me/RiOx/webdirect"
                  className="text-raiz-gray-950 underline"
                >
                  App store (iOS)
                </a>
                <a
                  target="_blank"
                  href="https://raizapp.onelink.me/RiOx/webdirect"
                  className="text-raiz-gray-950 underline"
                >
                  Play store (Android)
                </a>
              </div>
              <Link
                href="/register"
                className="text-[13px] text-raiz-gray-950 underline mt-2 inline-block"
              >
                Sign up on Business
              </Link>
            </div>
          </div>
          {/* Right Content */}
          <div
            id="payment-scroll-container"
            className={`w-full md:w-[67.18%] hidden p-5  md:p-12 overflow-y-auto no-scrollbar ${
              !screen || !mobileOpen ? "hidden md:block" : "md:block"
            }`}
          >
            <div className="flex items-start justify-between mb-11">
              <div>
                <h1 className="text-[23px] font-semibold text-raiz-gray-950 mb-1">
                  {selectedMethodObj?.label}
                </h1>
                <p className="text-raiz-gray-700 text-sm">
                  {selectedMethodObj?.subText}
                </p>
              </div>
              <div className="w-10 h-10 ">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.35"
                    d="M30 10H20V3.33337H13.3333V10H10C7.23833 10 5 12.2384 5 15V30C5 32.7617 7.23833 35 10 35H30C32.7617 35 35 32.7617 35 30V15C35 12.2384 32.7617 10 30 10Z"
                    fill="#C6ADD5"
                  />
                  <path
                    d="M29.1667 25C30.5475 25 31.6667 23.8807 31.6667 22.5C31.6667 21.1193 30.5475 20 29.1667 20C27.786 20 26.6667 21.1193 26.6667 22.5C26.6667 23.8807 27.786 25 29.1667 25Z"
                    fill="#493260"
                  />
                  <path
                    d="M10 6.66671V10H15V3.33337H13.3333C11.4917 3.33337 10 4.82504 10 6.66671Z"
                    fill="#733B9C"
                  />
                  <path
                    d="M18.3333 10H26.6666V6.66671C26.6666 4.82504 25.1749 3.33337 23.3333 3.33337H18.3333V10Z"
                    fill="#733B9C"
                  />
                </svg>
              </div>
            </div>
            {displayScreen()}
          </div>
        </div>
      )}
    </div>
  );
};

export default RaizPaymentPage;
