"use client";
import React, { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ISidebarMenuItem } from "@/types/misc";
import { SidebarMenus } from "@/constants/SidebarMenuData";
import SideModalWrapper from "@/app/(dashboard)/_components/SideModalWrapper";
// import AccountSetup from "@/app/(dashboard)/_components/account-setup/AccountSetup";
import { AnimatePresence } from "motion/react";
import CreateNgnAcct from "@/app/(dashboard)/_components/createNgnAcct/CreateNgnAcct";
import AddBvnModal from "@/app/(dashboard)/_components/createNgnAcct/AddBvnModal";
import NgnSuccessModal from "@/app/(dashboard)/_components/createNgnAcct/NgnSuccessModal";
import LogoutModal from "../modals/LogoutModal";
import { useUser } from "@/lib/hooks/useUser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FetchUserRewardsApi,

  // PersonaVerificationApi
} from "@/services/user";
import { toast } from "sonner";
// import dynamic from "next/dynamic";
import SetTransactionPin from "@/app/(dashboard)/_components/transaction-pin/SetTransactionPin";
import {
  convertToTitle,
  findWalletByCurrency,
  getTierInfo,
  truncateString,
} from "@/utils/helpers";
import PaymentLinkModal from "../modals/PaymentLinkModal";
import {
  CheckBrigdeVerificationStatusApi,
  CreateUSDWalletApi,
  GetKYBLinksApi,
} from "@/services/business";
import Spinner from "../ui/Spinner";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Avatar from "../ui/Avatar";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import Rewards from "@/app/(dashboard)/_components/rewards/Rewards";
import FeedbacksModal from "../modals/FeedbacksModal";
import BusinessVerificationModal from "@/app/(dashboard)/_components/BusinessVerificationModal";
import Button from "../ui/Button";

const Sidebar = () => {
  const { user, refetch } = useUser();
  const pathName = usePathname();
  const { setSelectedCurrency } = useCurrencyStore();
  const [showModal, setShowModal] = useState<
    "acctSetup" | "getNgn" | "set-pin" | "rewards" | null
  >(null);
  const [showBvnModal, setShowBvnModal] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [userPfp, setUserPfp] = useState(
    user?.business_account?.business_image || "/images/default-pfp.svg",
  );
  const isXLarge = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (user?.business_account?.business_image) {
      setUserPfp(user.business_account.business_image);
    }
  }, [user]);

  const handleCloseModal = () => {
    setShowModal(null);
  };

  const qc = useQueryClient();

  const displayModal = () => {
    switch (showModal) {
      case "acctSetup":
        return <BusinessVerificationModal close={handleCloseModal} />;

      case "getNgn":
        return (
          <CreateNgnAcct
            close={handleCloseModal}
            // openBvnModal={() => setShowBvnModal(true)}
          />
        );
      case "set-pin":
        return <SetTransactionPin close={handleCloseModal} />;
      case "rewards":
        return <Rewards close={handleCloseModal} data={pointsData} />;
      default:
        break;
    }
  };

  const renderMenuItem = (item: ISidebarMenuItem, index: number) => {
    const isActive =
      item.link === "/" ? pathName === item.link : pathName.includes(item.link);
    const isLocked = item?.locked;
    return (
      <Link
        key={index}
        href={isLocked ? "#" : item.link}
        tabIndex={isLocked ? -1 : 0}
        className={`flex items-center justify-between gap-3 py-2 px-2 xl:px-3  text-sm leading-tight outline-none
        ${
          isLocked
            ? "cursor-not-allowed pointer-events-none opacity-60"
            : "hover:bg-[#eaecff]/40 hover:rounded-md"
        }
        ${
          isActive && !isLocked
            ? "bg-[#eaecff]/40 rounded-[6px] text-primary2 font-bold"
            : "text-raiz-gray-600 font-medium"
        }`}
      >
        <div className="flex gap-3 items-center">
          {item.icon(isActive)}
          {item.name}
        </div>
        {isLocked && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              opacity="0.35"
              d="M15 17.5002H5C3.61917 17.5002 2.5 16.381 2.5 15.0002V8.3335C2.5 6.95266 3.61917 5.8335 5 5.8335H15C16.3808 5.8335 17.5 6.95266 17.5 8.3335V15.0002C17.5 16.381 16.3808 17.5002 15 17.5002Z"
              fill="black"
            />
            <path
              d="M6.66667 5.8335C6.66667 3.99266 8.15917 2.50016 10 2.50016C11.8408 2.50016 13.3333 3.99266 13.3333 5.8335H15C15 3.07183 12.7617 0.833496 10 0.833496C7.23833 0.833496 5 3.07183 5 5.8335H6.66667Z"
              fill="black"
            />
            <path
              d="M9.99992 10C9.07909 10 8.33325 10.7458 8.33325 11.6667C8.33325 12.5875 9.07909 13.3333 9.99992 13.3333C10.9208 13.3333 11.6666 12.5875 11.6666 11.6667C11.6666 10.7458 10.9208 10 9.99992 10Z"
              fill="black"
            />
          </svg>
        )}
      </Link>
    );
  };

  const USDWalletMutation = useMutation({
    mutationFn: CreateUSDWalletApi,
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["user"] });
      refetch();
      setSelectedCurrency("USD", user);
      handleCloseModal();
    },
  });

  const { data: pointsData } = useQuery({
    queryKey: ["reward-points"],
    queryFn: FetchUserRewardsApi,
  });

  const CheckBridgeVerification = useMutation({
    mutationFn: CheckBrigdeVerificationStatusApi,
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      if (response === "completed") {
        refetch();
      }
      toast.info(`Your verification status is ${convertToTitle(response)}`);
    },
  });

  const { data } = useQuery({
    queryKey: ["KYB-links"],
    queryFn: GetKYBLinksApi,
    refetchOnWindowFocus: true,
  });

  const tosPending = data?.tos_status === "pending";
  const tosApproved = data?.tos_status === "approved";
  const kycNotStarted = data?.kyc_status === "not_started";
  const kycAwaitingUbo = data?.kyc_status === "awaiting_ubo";

  const handleAcceptTOS = () => {
    window.open(data?.tos_link, "_blank");
    // optional immediate refetch
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      CheckBridgeVerification.mutate();
    }, 5000);
  };

  const { currentTier } = getTierInfo(pointsData?.point || 0);
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const isNigerian =
    user?.business_account?.entity?.country?.country_name?.toLowerCase() ===
    "nigeria";
  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  const hasTransactionPin = user?.has_transaction_pin;

  const statuses = [
    {
      condition: verificationStatus === "not_started",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M15.9997 2.66699C12.333 2.66699 9.33301 5.66699 9.33301 9.33366V12.0003H11.9997V9.33366C11.9997 7.13366 13.7997 5.33366 15.9997 5.33366C18.1997 5.33366 19.9997 7.13366 19.9997 9.33366V12.0003H22.6663V9.33366C22.6663 5.66699 19.6663 2.66699 15.9997 2.66699Z"
            fill="#424242"
          />
          <path
            d="M23.9997 29.3333H7.99967C6.53301 29.3333 5.33301 28.1333 5.33301 26.6667V14.6667C5.33301 13.2 6.53301 12 7.99967 12H23.9997C25.4663 12 26.6663 13.2 26.6663 14.6667V26.6667C26.6663 28.1333 25.4663 29.3333 23.9997 29.3333Z"
            fill="#FB8C00"
          />
          <path
            d="M16 18.6665C15.4696 18.6665 14.9609 18.8772 14.5858 19.2523C14.2107 19.6274 14 20.1361 14 20.6665C14 21.1969 14.2107 21.7056 14.5858 22.0807C14.9609 22.4558 15.4696 22.6665 16 22.6665C16.5304 22.6665 17.0391 22.4558 17.4142 22.0807C17.7893 21.7056 18 21.1969 18 20.6665C18 20.1361 17.7893 19.6274 17.4142 19.2523C17.0391 18.8772 16.5304 18.6665 16 18.6665Z"
            fill="#C76E00"
          />
        </svg>
      ),
      title: "Complete account set up",
      description: "Complete Account Set Up and Get unlimited access",
      action: (
        <div className=" w-full">
          <button
            onClick={() => setShowModal("acctSetup")}
            className="group px-6 py-2.5 w-full flex items-center gap-3 justify-center  bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors  disabled:opacity-50"
          >
            <span>Get Started</span>
            <Image
              src={"/icons/long-arrow-right.svg"}
              alt="right"
              width={20}
              height={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      ),
      bg: "bg-[#FFF3E666]",
    },
    {
      condition: verificationStatus === "pending",
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.5"
            d="M16 29.3335C22.6274 29.3335 28 23.9609 28 17.3335C28 10.7061 22.6274 5.3335 16 5.3335C9.37258 5.3335 4 10.7061 4 17.3335C4 23.9609 9.37258 29.3335 16 29.3335Z"
            fill="#CEBF36"
          />
          <path
            d="M14.1147 19.2186C13.5253 18.6292 11.1907 15.0879 9.27335 12.1226C8.63068 11.1292 9.79601 9.96389 10.7893 10.6052C13.7547 12.5226 17.296 14.8586 17.8853 15.4466C18.9267 16.4879 18.9267 18.1759 17.8853 19.2172C16.844 20.2599 15.156 20.2599 14.1147 19.2186Z"
            fill="#568C21"
          />
          <path
            d="M18 1.3335C17.4853 1.3335 14.5147 1.3335 14 1.3335C12.896 1.3335 12 2.2295 12 3.3335C12 4.4375 12.896 5.3335 14 5.3335C14.5147 5.3335 17.4853 5.3335 18 5.3335C19.104 5.3335 20 4.4375 20 3.3335C20 2.2295 19.104 1.3335 18 1.3335Z"
            fill="#568C21"
          />
          <path
            d="M27.4148 6.86119C27.0508 6.49719 26.8361 6.28252 26.4721 5.91852C25.6908 5.13719 24.4241 5.13719 23.6441 5.91852C22.8641 6.69985 22.8628 7.96652 23.6441 8.74652C24.0081 9.11052 24.2228 9.32519 24.5868 9.68919C25.3681 10.4705 26.6348 10.4705 27.4148 9.68919C28.1948 8.90919 28.1948 7.64252 27.4148 6.86119Z"
            fill="#568C21"
          />
        </svg>
      ),
      title: "Complete Account Setup",
      description: "Complete Account Set Up and Get unlimited access ",
      bg: "bg-[#f2f4e9]/60",
      action: (
        <>
          {verificationStatus === "pending" && tosPending && (
            <button
              onClick={handleAcceptTOS}
              disabled={tosApproved || !data?.tos_status}
              className="group px-4 xl:px-0 py-2.5 w-full flex items-center gap-3 justify-center  bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl  hover:bg-gray-50 transition-colors  disabled:opacity-50"
            >
              <span className="text-xs xl:text-sm">
                {tosApproved ? "Accepted" : "Review & Accept"}
              </span>
              <Image
                src={"/icons/long-arrow-right.svg"}
                alt="right"
                width={20}
                height={20}
                className="hidden xl:block group-hover:translate-x-1 transition-transform"
              />
            </button>
          )}

          {verificationStatus === "pending" && tosApproved && kycNotStarted && (
            <button
              onClick={() => window.open(data?.kyc_link)}
              disabled={!tosApproved || !kycNotStarted}
              className="group px-6 py-2.5 w-full flex items-center gap-3 justify-center  bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors  disabled:opacity-50"
            >
              {kycAwaitingUbo ? "Awaiting UBOs" : "Start KYB"}
              <Image
                src={"/icons/long-arrow-right.svg"}
                alt="right"
                width={20}
                height={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          )}
          {kycAwaitingUbo && (
            <span className="text-xs text-raiz-gray-500">
              Awaiting UBOs verification
            </span>
          )}
        </>
      ),
    },
    {
      condition: verificationStatus === "completed" && !hasTransactionPin,
      icon: (
        <svg
          width="30"
          height="31"
          viewBox="0 0 30 31"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.55"
            d="M22.5 26.7305H7.5C5.42875 26.7305 3.75 25.0517 3.75 22.9805V12.9805C3.75 10.9092 5.42875 9.23047 7.5 9.23047H22.5C24.5712 9.23047 26.25 10.9092 26.25 12.9805V22.9805C26.25 25.0517 24.5712 26.7305 22.5 26.7305Z"
            fill="#F7A900"
          />
          <path
            d="M10 9.23047C10 6.46922 12.2387 4.23047 15 4.23047C17.7613 4.23047 20 6.46922 20 9.23047H22.5C22.5 5.08797 19.1425 1.73047 15 1.73047C10.8575 1.73047 7.5 5.08797 7.5 9.23047H10Z"
            fill="#292D32"
          />
          <path
            d="M15 19.8555C16.0355 19.8555 16.875 19.016 16.875 17.9805C16.875 16.9449 16.0355 16.1055 15 16.1055C13.9645 16.1055 13.125 16.9449 13.125 17.9805C13.125 19.016 13.9645 19.8555 15 19.8555Z"
            fill="#6C265B"
          />
          <path
            d="M21.25 19.8555C22.2855 19.8555 23.125 19.016 23.125 17.9805C23.125 16.9449 22.2855 16.1055 21.25 16.1055C20.2145 16.1055 19.375 16.9449 19.375 17.9805C19.375 19.016 20.2145 19.8555 21.25 19.8555Z"
            fill="#6C265B"
          />
          <path
            d="M8.75 19.8555C9.78553 19.8555 10.625 19.016 10.625 17.9805C10.625 16.9449 9.78553 16.1055 8.75 16.1055C7.71447 16.1055 6.875 16.9449 6.875 17.9805C6.875 19.016 7.71447 19.8555 8.75 19.8555Z"
            fill="#6C265B"
          />
        </svg>
      ),
      title: "Secure your Account",
      description: "Set a 4-digit PIN to your transaction",
      action: (
        <button
          onClick={() => setShowModal("set-pin")}
          className="group text-primary2 bg-white flex py-4 px-8 rounded-3xl gap-3 h-[52px] hover:underline border-2 border-[#F8F7FA] text-xs xl:text-sm font-bold"
        >
          Set Up
          <Image
            src={"/icons/long-arrow-right.svg"}
            alt=""
            width={20}
            height={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      ),
      bg: "bg-[#eaecff]/40",
    },
    {
      condition:
        verificationStatus === "completed" && !USDAcct && hasTransactionPin,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <g clipPath="url(#clip0_23665_5245)">
            <rect width="48" height="48" rx="24" fill="#FCFCFD" />
            <path
              d="M4 0.333008H44C46.025 0.333008 47.667 1.97496 47.667 4V44C47.667 46.025 46.025 47.667 44 47.667H4C1.97496 47.667 0.333008 46.025 0.333008 44V4C0.333008 1.97496 1.97496 0.333008 4 0.333008Z"
              stroke="black"
              strokeOpacity="0.08"
              strokeWidth="0.666667"
            />
            <path
              opacity="0.35"
              d="M32 36H16C13.7907 36 12 34.2093 12 32V19.6867C12 18.2333 12.788 16.896 14.0573 16.1907L22.0573 11.7467C23.2653 11.076 24.7347 11.076 25.9427 11.7467L33.9427 16.1907C35.212 16.896 36 18.2347 36 19.6867V32C36 34.2093 34.2093 36 32 36Z"
              fill="#53940D"
            />
            <path
              d="M27.7867 27.3319C27.7867 23.2079 23.2347 23.7719 23.2347 21.6226C23.2347 20.3573 24.2307 20.2239 24.5733 20.2239C24.9133 20.2239 25.2133 20.3039 25.468 20.4199C26.0667 20.6906 26.776 20.4399 27.1547 19.9026C27.64 19.2159 27.3893 18.2493 26.6227 17.9026C26.2013 17.7133 25.6773 17.5599 25.0413 17.4999V16.9026C25.0413 16.3519 24.5947 15.9053 24.044 15.9053C23.4933 15.9053 23.0467 16.3519 23.0467 16.9026V17.7119C21.376 18.2693 20.2907 19.7973 20.2907 21.7533C20.2907 26.0813 24.7867 25.2986 24.7867 27.5479C24.7867 27.9813 24.5813 28.9239 23.4667 28.9239C22.9707 28.9239 22.5427 28.7839 22.1947 28.6026C21.604 28.2933 20.8693 28.5213 20.4933 29.0719L20.4533 29.1306C20.0173 29.7679 20.1933 30.6586 20.8653 31.0399C21.4293 31.3599 22.1187 31.6079 22.9507 31.6959V32.3973C22.9507 32.9479 23.3973 33.3946 23.948 33.3946C24.4987 33.3946 24.9453 32.9479 24.9453 32.3973V31.5173C26.7907 30.9519 27.7867 29.2666 27.7867 27.3319Z"
              fill="#1D546F"
            />
          </g>
          <defs>
            <clipPath id="clip0_23665_5245">
              <rect width="48" height="48" rx="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      title: "Get Your USD Account Now",
      description: "Enjoy Seamless Transactions and Exclusive Features Today!",
      action: (
        <button
          onClick={() => USDWalletMutation.mutate()}
          className="text-primary2 text-sm font-bold flex items-center gap-2"
          disabled={USDWalletMutation.isPending}
        >
          {USDWalletMutation.isPending ? (
            <Spinner className="!w-4 !h-4 !border-t-2 !border-b-2" />
          ) : null}
          {USDWalletMutation.isPending ? "Processing..." : "Get USD Account"}
        </button>
      ),
      bg: "bg-[#EAECFF66]",
    },
    {
      condition:
        verificationStatus === "completed" &&
        USDAcct &&
        isNigerian &&
        (isNigerian ? !NGNAcct : true) &&
        hasTransactionPin,
      icon: <Image src={"/icons/ngn.svg"} width={32} height={32} alt="NGN" />,
      title: "Get a Naira (NGN) Account",
      description:
        "Manage funds and make transactions in Naira, simplifying local payments and daily finances.",
      action: (
        <button
          onClick={() => setShowModal("getNgn")}
          className="text-primary2 text-sm font-bold"
        >
          Get Naira Account
        </button>
      ),
      bg: "bg-[#eaecff]/40",
    },
    {
      condition:
        verificationStatus === "completed" &&
        (isNigerian ? NGNAcct : true) &&
        hasTransactionPin &&
        USDAcct,
      icon: <Image src={"/icons/paylink.svg"} width={32} height={32} alt="" />,
      title: "Payment Link",
      description: "Allows Guest Users to Securely Send you Money Seamlessly.",
      action: (
        <button
          onClick={() => setShowPaymentLinkModal(true)}
          className="text-primary2 text-sm font-bold"
        >
          Share Link
        </button>
      ),
      bg: "bg-[#eaecff]/40",
    },
  ];

  return (
    <aside className="w-[19.444%] pt-8 hidden lg:block  fixed top-0 bottom-0 left-0 z-20 bg-raiz-gray-50 border-r border-raiz-gray-200 h-[100vh] overflow-x-hidden overflow-y-scroll">
      <div className="px-6">
        <Image
          className="w-12 h-12"
          src={"/icons/Logo-2.svg"}
          width={48}
          height={48}
          alt="Raiz logo"
        />
      </div>
      <section className="flex flex-col justify-between h-[85%] mt-8 px-4 gap-8">
        <nav className="flex flex-col gap-5">
          {SidebarMenus.map((item, index) => renderMenuItem(item, index))}
          <button
            onClick={() => setShowFeedbacks(true)}
            className={`flex items-center justify-between gap-2 py-2 px-2 xl:px-3 text-sm leading-tight outline-none hover:bg-[#eaecff]/40 hover:rounded-md  }
        ${
          showFeedbacks
            ? "bg-[#eaecff]/40 rounded-[6px] text-primary2 font-bold"
            : "text-raiz-gray-600 font-medium"
        }`}
          >
            <div className="flex gap-3 items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 18.43H13L8.54999 21.39C7.88999 21.83 7 21.36 7 20.56V18.43C4 18.43 2 16.43 2 13.43V7.42993C2 4.42993 4 2.42993 7 2.42993H17C20 2.42993 22 4.42993 22 7.42993V13.43C22 16.43 20 18.43 17 18.43Z"
                  stroke="#A89AB9"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11.9998 11.3599V11.1499C11.9998 10.4699 12.4198 10.1099 12.8398 9.81989C13.2498 9.53989 13.6598 9.1799 13.6598 8.5199C13.6598 7.5999 12.9198 6.85986 11.9998 6.85986C11.0798 6.85986 10.3398 7.5999 10.3398 8.5199"
                  stroke="#A89AB9"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11.9955 13.75H12.0045"
                  stroke="#A89AB9"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className=" text-left"> Feedback & Requests</span>
            </div>
          </button>
        </nav>

        {/* User status Info */}
        <div>
          {!verificationStatus
            ? null
            : statuses.map((status, index) =>
                status.condition ? (
                  <StatusCard key={index} {...status} />
                ) : null,
              )}
          <div className="flex gap-2 items-center mt-6">
            <button
              onClick={() => setShowModal("rewards")}
              className="pl-2 pr-2.5 py-1.5 bg-amber-100 rounded-3xl inline-flex justify-center items-center gap-0.5 overflow-hidden"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7.99967 1.33333C4.31767 1.33333 1.33301 4.31799 1.33301 7.99999C1.33301 11.682 4.31767 14.6667 7.99967 14.6667C11.6817 14.6667 14.6663 11.682 14.6663 7.99999C14.6663 4.31799 11.6817 1.33333 7.99967 1.33333ZM11.441 7.52466L10.3977 8.53866C10.2403 8.69133 10.1683 8.91199 10.205 9.12866L10.4483 10.5633C10.541 11.108 9.96834 11.5227 9.47967 11.2647L8.19301 10.5853C7.99901 10.4827 7.76701 10.4827 7.57234 10.584L6.28367 11.2587C5.79434 11.5147 5.22301 11.0987 5.31767 10.554L5.56634 9.12066C5.60367 8.90466 5.53234 8.68333 5.37567 8.52999L4.33567 7.51266C3.93967 7.12599 4.15967 6.45399 4.70634 6.37599L6.14634 6.16933C6.36367 6.13799 6.55167 6.00199 6.64901 5.80533L7.29501 4.50199C7.54034 4.00666 8.24701 4.00799 8.49101 4.50399L9.13234 5.80999C9.22901 6.00666 9.41634 6.14333 9.63367 6.17533L11.073 6.38666C11.6197 6.46733 11.837 7.13933 11.441 7.52466Z"
                  fill="#FBB756"
                />
                <path
                  d="M9.6338 6.17534L11.0731 6.38667C11.6198 6.46734 11.8371 7.13934 11.4405 7.52467L10.3971 8.53867C10.2398 8.69134 10.1678 8.91201 10.2045 9.12867L10.4478 10.5633C10.5405 11.108 9.9678 11.5227 9.47913 11.2647L8.19246 10.5853C7.99846 10.4827 7.76646 10.4827 7.5718 10.584L6.28313 11.2587C5.7938 11.5147 5.22246 11.0987 5.31713 10.554L5.5658 9.12067C5.60313 8.90467 5.5318 8.68401 5.37513 8.53001L4.33513 7.51267C3.9398 7.12601 4.1598 6.45401 4.70646 6.37601L6.14646 6.16934C6.3638 6.13801 6.5518 6.00201 6.64913 5.80534L7.29513 4.50201C7.54046 4.00667 8.24713 4.00801 8.49046 4.50401L9.1318 5.81001C9.22913 6.00667 9.41713 6.14334 9.6338 6.17534Z"
                  fill="#FCF2E3"
                />
              </svg>
              <span className="justify-start text-zinc-900 text-xs font-normal  leading-tight">
                {pointsData?.point || 0}
              </span>
            </button>
            <button
              onClick={() => setShowModal("rewards")}
              className="pl-2 pr-2.5 py-1.5 bg-amber-100 rounded-3xl inline-flex justify-center items-center gap-0.5 overflow-hidden"
            >
              <div className="justify-start text-zinc-900 text-xs font-normal leading-tight">
                {currentTier?.level || ""}
              </div>
            </button>
          </div>
          <div className="flex justify-between items-center gap-2 mt-6 w-full pb-5 pt-4 border-t border-[#eaecf0]">
            <div className="flex items-center gap-1.5  ">
              <Avatar src={userPfp} name="pfp" size={isXLarge ? 40 : 30} />
              <div className="flex flex-col gap-0.5">
                <span className="text-raiz-gray-700 font-semibold lg:text-xs xl:text-sm">
                  {user?.business_account?.business_name}
                </span>
                <span className="text-raiz-gray-600 lg:text-xs xl:text-sm">
                  {truncateString(user?.email || "", isXLarge ? 20 : 15)}
                </span>
              </div>
            </div>
            <button
              className="flex gap-[15px] items-center w-9 h-9 absolute right-2"
              onClick={() => setShowLogoutModal(true)}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="18" fill="#F3F1F6" />
                <path
                  opacity="0.35"
                  d="M25.1998 11.7001V24.3001C25.1998 25.7914 23.9911 27.0001 22.4998 27.0001H13.4998C12.0085 27.0001 10.7998 25.7914 10.7998 24.3001V11.7001C10.7998 10.2088 12.0085 9.00006 13.4998 9.00006H22.4998C23.9911 9.00006 25.1998 10.2088 25.1998 11.7001Z"
                  fill="#B3261E"
                />
                <path
                  d="M23.3998 16.2001H17.0998C16.1053 16.2001 15.2998 17.0056 15.2998 18.0001C15.2998 18.9946 16.1053 19.8001 17.0998 19.8001H23.3998V16.2001Z"
                  fill="#951F38"
                />
                <path
                  d="M22.1211 21.7179C22.1211 22.4118 22.9581 22.761 23.4513 22.2723L26.955 18.8019C27.4005 18.36 27.4005 17.64 26.955 17.1981L23.4513 13.7277C22.9581 13.2399 22.1211 13.5891 22.1211 14.2821V21.7179Z"
                  fill="#951F38"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
      <AnimatePresence>
        {showModal ? (
          <SideModalWrapper
            close={handleCloseModal}
            wrapperStyle={showModal === "getNgn" ? "!bg-primary2" : ""}
          >
            {displayModal()}
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showBvnModal && (
          <AddBvnModal
            close={() => setShowBvnModal(false)}
            openSuccessModal={() => setSuccessful(true)}
          />
        )}
      </AnimatePresence>
      {successful && <NgnSuccessModal close={() => setSuccessful(false)} />}
      {showLogoutModal && (
        <LogoutModal close={() => setShowLogoutModal(false)} />
      )}
      {showPaymentLinkModal && (
        <PaymentLinkModal close={() => setShowPaymentLinkModal(false)} />
      )}
      {showFeedbacks && (
        <FeedbacksModal close={() => setShowFeedbacks(false)} />
      )}
    </aside>
  );
};

export default Sidebar;

const StatusCard = ({
  icon,
  title,
  description,
  action,
  bg,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  bg: string;
}) => (
  <div
    className={`px-3 xl:px-4 py-5 ${bg}  rounded-lg flex-col justify-start items-start gap-3 inline-flex`}
  >
    <div className="w-12 h-12 relative bg-[#fcfcfd] rounded-[66.67px] flex items-center justify-center">
      {icon}
    </div>
    <h5 className="text-raiz-gray-900 text-sm font-bold leading-[16.80px]">
      {title}
    </h5>
    <p className="text-gray-600 lg:text-xs xl:text-sm font-normal leading-tight">
      {description}
    </p>
    {action}
  </div>
);
