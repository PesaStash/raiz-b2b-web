"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import SideModalWrapper from "../../app/(dashboard)/_components/SideModalWrapper";
import Notifications from "../../app/(dashboard)/_components/notification/Notifications";
import { AnimatePresence } from "motion/react";
import Rewards from "../../app/(dashboard)/_components/rewards/Rewards";
import SelectAccount from "../../app/(dashboard)/_components/SelectAccount";
import CreateNgnAcct from "../../app/(dashboard)/_components/createNgnAcct/CreateNgnAcct";
import AddBvnModal from "../../app/(dashboard)/_components/createNgnAcct/AddBvnModal";
import NgnSuccessModal from "../../app/(dashboard)/_components/createNgnAcct/NgnSuccessModal";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FetchUserRewardsApi } from "@/services/user";
import { useNotifications } from "@/lib/hooks/useNotifications";
import * as motion from "motion/react-client";
import CreateCryptoWallet from "@/app/(dashboard)/_components/crypto/dashboard/CreateCryptoWallet";
import { getTierInfo } from "@/utils/helpers";
import SelectField, { Option } from "../ui/SelectField";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";

const searchItems = [
  { name: "Dashboard", type: "route", path: "/" },
  // { name: "Top Up", type: "modal" },
  // { name: "Send", type: "modal" },
  { name: "Create NGN Account", type: "modal" },
  { name: "Rewards", type: "modal" },
  { name: "Notifications", type: "modal" },
  { name: "Profile settings", type: "route", path: "/settings" },
  {
    name: "Password & Security",
    type: "route",
    path: "/settings/login-security",
  },
  { name: "Dollar Account (USD)", type: "modal" },
  { name: "Naira Account  (NGN)", type: "modal" },
  { name: "Account", type: "modal" },
];

const Header = () => {
  const pathName = usePathname();
  const { data: pointsData } = useQuery({
    queryKey: ["reward-points"],
    queryFn: FetchUserRewardsApi,
  });
  // const [userPfp, setUserPfp] = useState(
  //   user?.business_account?.business_image || "/images/default-pfp.svg"
  // );

  // useEffect(() => {
  //   if (user?.business_account?.business_image) {
  //     setUserPfp(user.business_account.business_image);
  //   }
  // }, [user]);

  const [showModal, setShowModal] = useState<
    | "notifications"
    | "rewards"
    | "selectAcct"
    | "createNGN"
    | "createCrypto"
    | null
  >(null);
  const [showBvnModal, setShowBvnModal] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<typeof searchItems>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedAction, setSelectedAction] = useState("send");
  const [showActionOpts, setShowActionOpts] = useState(false);
  const router = useRouter();
  const params = useParams();
  const invoiceNo = params?.invoiceNo as string | undefined;
  // const { selectedCurrency } = useCurrencyStore();
  // const currentWallet = useMemo(() => {
  //   if (!user || !user?.business_account?.wallets || !selectedCurrency?.name)
  //     return null;
  //   return user?.business_account?.wallets.find(
  //     (wallet) => wallet.wallet_type.currency === selectedCurrency.name
  //   );
  // }, [user, selectedCurrency]);
  const { currentTier } = getTierInfo(pointsData?.point || 0);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const results = searchItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setSearchResults(results);
  }, [searchTerm]);

  const handleSearchAction = (item: (typeof searchItems)[number]) => {
    if (item.type === "route" && item.path) {
      router.push(item.path);
    } else if (item.type === "modal") {
      switch (item.name) {
        case "Create NGN Account":
          setShowModal("createNGN");
          break;
        case "Rewards":
          setShowModal("rewards");
          break;
        case "Notifications":
          setShowModal("notifications");
          break;
        case "Dollar Account (USD)":
        case "Naira Account  (NGN)":
        case "Account":
          setShowModal("selectAcct");
        default:
          break;
      }
    }
    setSearchTerm("");
    setSearchResults([]);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev <= 0 ? searchResults.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSearchAction(searchResults[focusedIndex]);
    } else if (e.key === "Escape") {
      setFocusedIndex(-1);
      setIsFocused(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(null);
  };
  const openNGNModal = () => {
    setShowModal("createNGN");
  };

  const openCryptoModal = () => {
    setShowModal("createCrypto");
  };
  const { data, refetch } = useNotifications(15);
  const notifications = data?.pages[0]?.notifications || [];
  const hasUnreadNotif = notifications.some(
    (notification) => !notification.read,
  );

  useEffect(() => {
    refetch();
  }, [pathName, refetch]);

  const displayModal = () => {
    switch (showModal) {
      case "notifications":
        return <Notifications close={handleCloseModal} />;
      case "rewards":
        return <Rewards close={handleCloseModal} data={pointsData} />;
      case "createNGN":
        return (
          <CreateNgnAcct
            close={handleCloseModal}
            // openBvnModal={() => setShowBvnModal(true)}
          />
        );
      case "createCrypto":
        return <CreateCryptoWallet close={handleCloseModal} />;
      default:
        break;
    }
  };

  const actionOpts = [
    { title: "Move Money", value: "send" },
    { title: "Top Up", value: "topUp" },
    { title: "Swap funds", value: "swap" },
    { title: "Request funds", value: "request" },
  ];

  const actionDropdownRef = useOutsideClick(() => {
    setShowActionOpts(false);
  });
  return (
    <div className="flex  justify-between pb-5 gap-2">
      <div className="relative h-12 w-[285px] xl:w-[312px] ">
        <Image
          className="absolute top-3.5 left-3"
          src={"/icons/search.svg"}
          alt="search"
          width={22}
          height={22}
        />
        <input
          placeholder="Search..."
          className="pl-10 h-full bg-raiz-gray-50 rounded-[20px] text-sm placeholder:text-raiz-gray-500 border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
        />
        <AnimatePresence>
          {isFocused && searchResults.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-2xl z-50 max-h-72 overflow-y-auto"
            >
              {searchResults.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  onMouseDown={() => handleSearchAction(item)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
                    index === focusedIndex
                      ? "bg-blue-100 text-blue-800"
                      : "hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800 text-sm font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.type === "modal"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.type}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* <div className="relative">
        <button
          onClick={() => setShowActionOpts(!showActionOpts)}
          className="flex justify-between items-center gap-3 min-w-[175px] xl:min-w-[220px] px-4 h-12 bg-raiz-gray-50 rounded-[20px] transition-all duration-200"
        >
          <span className="text-sm font-medium text-raiz-gray-800">
            {actionOpts.find((each) => each.value === selectedAction)?.title}
          </span>
          <motion.div
            animate={{ rotate: showActionOpts ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={"/icons/arrow-down.svg"}
              alt="arrow down"
              width={20}
              height={20}
            />
          </motion.div>
        </button>
        <AnimatePresence>
          {showActionOpts && (
            <motion.div
              ref={actionDropdownRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-2xl z-50 overflow-hidden py-1"
            >
              {actionOpts.map((each) => (
                <button
                  key={each.value}
                  onClick={() => {
                    setSelectedAction(each.value);
                    setShowActionOpts(false);
                  }}
                  className={`text-sm text-left px-4 py-3 hover:bg-raiz-gray-50 transition-colors duration-200 w-full ${
                    selectedAction === each.value
                      ? "font-semibold text-raiz-gray-900 bg-raiz-gray-50/50"
                      : "font-normal text-raiz-gray-800"
                  }`}
                >
                  {each.title}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div> */}

      {pathName.includes("invoice") && (
        <div className="flex items-center gap-1 xl:gap-2.5 ">
          <Link
            className={`px-2 py-1 ${
              pathName.endsWith("invoice")
                ? "text-raiz-gray-900 font-semibold"
                : "text-raiz-gray-700 font-medium"
            }  text-sm  font-brSonoma leading-tight `}
            href={"/invoice"}
          >
            Invoices
          </Link>
          <Image
            src={"/icons/forward.svg"}
            alt="forward"
            width={16}
            height={16}
          />
          {invoiceNo ? (
            <Link
              className={`px-2 py-1 ${
                pathName.endsWith(invoiceNo)
                  ? "text-raiz-gray-900 font-semibold"
                  : "text-raiz-gray-700 font-medium"
              }  text-sm font-medium font-brSonoma leading-tight `}
              href={`/invoice/${invoiceNo}`}
            >
              {invoiceNo}
            </Link>
          ) : (
            <Link
              className={`px-2 py-1 ${
                pathName.endsWith("create-new")
                  ? "text-raiz-gray-900 font-semibold"
                  : "text-raiz-gray-700 font-medium"
              }  text-sm font-medium font-brSonoma leading-tight `}
              href={"/invoice/create-new"}
            >
              New Invoice
            </Link>
          )}
        </div>
      )}

      <div className="flex gap-4 items-center">
        <button
          onClick={() => setShowModal("rewards")}
          className="py-2 px-5 bg-raiz-gray-50 hover:bg-raiz-gray-200 transition-colors duration-300 group h-12  rounded-[20px] justify-center items-center gap-2 inline-flex"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-300 group-hover:scale-110"
          >
            <path
              d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM15.162 9.287L13.597 10.808C13.361 11.037 13.253 11.368 13.308 11.693L13.673 13.845C13.812 14.662 12.953 15.284 12.22 14.897L10.29 13.878C9.999 13.724 9.651 13.724 9.359 13.876L7.426 14.888C6.692 15.272 5.835 14.648 5.977 13.831L6.35 11.681C6.406 11.357 6.299 11.025 6.064 10.795L4.504 9.269C3.91 8.689 4.24 7.681 5.06 7.564L7.22 7.254C7.546 7.207 7.828 7.003 7.974 6.708L8.943 4.753C9.311 4.01 10.371 4.012 10.737 4.756L11.699 6.715C11.844 7.01 12.125 7.215 12.451 7.263L14.61 7.58C15.43 7.701 15.756 8.709 15.162 9.287Z"
              fill="#FBB756"
            />
          </svg>
          <span className="text-raiz-gray-900 text-sm font-semibold  leading-[20px]">
            {pointsData?.point || 0}
          </span>
          <span className="size-1.5 bg-raiz-gray-200 group-hover:bg-raiz-gray-300 transition-colors duration-300 rounded-full" />
          <span className="text-raiz-gray-900 text-sm font-semibold  leading-[20px]">
            {currentTier?.level || ""}
          </span>
        </button>
        <div className="relative">
          <button
            className="bg-raiz-gray-50 hover:bg-raiz-gray-200 transition-colors duration-300 group size-12 rounded-full flex items-center justify-center"
            onClick={() => setShowModal("notifications")}
          >
            <svg
              width="15"
              height="17"
              viewBox="0 0 15 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-300 group-hover:scale-110"
            >
              <path
                d="M13.551 13.3429H1.46031C0.957856 13.3429 0.497097 13.0898 0.228147 12.6653C-0.0408029 12.2408 -0.074161 11.7167 0.139748 11.2622L1.25099 9.02635V6.41316C1.25099 2.97769 3.86585 0.163931 7.20416 0.00673055C8.93503 -0.071661 10.5733 0.536708 11.8222 1.72801C13.0723 2.92015 13.7603 4.52759 13.7603 6.25429V9.02635L14.8653 11.2501C15.085 11.7167 15.0521 12.2412 14.7831 12.6657C14.5142 13.0902 14.0534 13.3429 13.551 13.3429ZM5.04131 14.1768C5.24062 15.3581 6.26805 16.2617 7.50564 16.2617C8.74322 16.2617 9.77024 15.3581 9.96997 14.1768H5.04131Z"
                fill="#19151E"
              />
            </svg>
          </button>
          {hasUnreadNotif && (
            <span className="w-1.5 h-1.5 bg-[#A12121] rounded-full absolute top-3.5 right-4" />
          )}
        </div>
        <Link href={"/settings"}>
          <button className="bg-raiz-gray-50 hover:bg-raiz-gray-200 transition-colors duration-300 group size-12 rounded-full flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-300 group-hover:scale-110"
            >
              <path
                d="M15.075 6.91507C13.7175 6.91507 13.1625 5.95507 13.8375 4.77757C14.2275 4.09507 13.995 3.22507 13.3125 2.83507L12.015 2.09257C11.4225 1.74007 10.6575 1.95007 10.305 2.54257L10.2225 2.68507C9.5475 3.86257 8.4375 3.86257 7.755 2.68507L7.6725 2.54257C7.335 1.95007 6.57 1.74007 5.9775 2.09257L4.68 2.83507C3.9975 3.22507 3.765 4.10257 4.155 4.78507C4.8375 5.95507 4.2825 6.91507 2.925 6.91507C2.145 6.91507 1.5 7.55257 1.5 8.34007V9.66007C1.5 10.4401 2.1375 11.0851 2.925 11.0851C4.2825 11.0851 4.8375 12.0451 4.155 13.2226C3.765 13.9051 3.9975 14.7751 4.68 15.1651L5.9775 15.9076C6.57 16.2601 7.335 16.0501 7.6875 15.4576L7.77 15.3151C8.445 14.1376 9.555 14.1376 10.2375 15.3151L10.32 15.4576C10.6725 16.0501 11.4375 16.2601 12.03 15.9076L13.3275 15.1651C14.01 14.7751 14.2425 13.8976 13.8525 13.2226C13.17 12.0451 13.725 11.0851 15.0825 11.0851C15.8625 11.0851 16.5075 10.4476 16.5075 9.66007V8.34007C16.5 7.56007 15.8625 6.91507 15.075 6.91507ZM9 11.4376C7.6575 11.4376 6.5625 10.3426 6.5625 9.00007C6.5625 7.65757 7.6575 6.56257 9 6.56257C10.3425 6.56257 11.4375 7.65757 11.4375 9.00007C11.4375 10.3426 10.3425 11.4376 9 11.4376Z"
                fill="#19151E"
              />
            </svg>
          </button>
        </Link>
      </div>

      <AnimatePresence>
        {showModal !== null && showModal !== "selectAcct" && (
          <SideModalWrapper
            close={handleCloseModal}
            wrapperStyle={
              showModal === "createNGN"
                ? "!bg-primary2"
                : showModal === "createCrypto"
                  ? "!bg-raiz-crypto-primary"
                  : ""
            }
          >
            {displayModal()}
          </SideModalWrapper>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBvnModal && (
          <AddBvnModal
            close={() => setShowBvnModal(false)}
            openSuccessModal={() => setSuccessful(true)}
          />
        )}
      </AnimatePresence>
      {showModal === "selectAcct" && (
        <SelectAccount
          close={handleCloseModal}
          openNgnModal={openNGNModal}
          openCryptoModal={openCryptoModal}
        />
      )}
      {successful && <NgnSuccessModal close={() => setSuccessful(false)} />}
    </div>
  );
};

export default Header;
