"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUserStore } from "@/store/useUserStore";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { FiChevronRight } from "react-icons/fi";
import "swiper/css";

type WalletTheme = {
  borderGradient: [string, string, string, string];
  mainCardGradient: [string, string];
  layers: [string, string];
  iconColor: string;
};

const ACTIVE_WALLET_THEMES: Record<string, WalletTheme> = {
  NGN: {
    borderGradient: [
      "rgb(204, 183, 221)",
      "rgb(116, 58, 158)",
      "rgb(136, 87, 172)",
      "rgb(148, 104, 182)",
    ],
    mainCardGradient: ["rgba(255,255,255,0.28)", "rgba(255,255,255,0.14)"],
    layers: ["rgb(220, 203, 230)", "rgb(219, 204, 230)"],
    iconColor: "#D0C8D9",
  },
  USD: {
    borderGradient: [
      "rgb(158, 193, 212)",
      "rgb(15, 101, 149)",
      "rgb(85, 146, 180)",
      "rgb(15, 101, 149)",
    ],
    mainCardGradient: ["rgba(13, 100, 148, 0.18)", "rgba(13, 100, 148, 0.08)"],
    layers: ["rgb(229, 239, 244)", "rgb(206, 224, 234)"],
    iconColor: "#D0D9C8",
  },
  GBP: {
    borderGradient: [
      "rgb(188, 187, 248)",
      "rgb(79, 70, 229)",
      "rgb(106, 97, 236)",
      "rgb(130, 122, 240)",
    ],
    mainCardGradient: ["rgba(79, 70, 229, 0.2)", "rgba(79, 70, 229, 0.1)"],
    layers: ["rgb(232, 231, 251)", "rgb(220, 218, 248)"],
    iconColor: "#D0C8D9",
  },
  EUR: {
    borderGradient: [
      "rgb(241, 184, 194)",
      "rgb(200, 16, 46)",
      "rgb(218, 78, 103)",
      "rgb(219, 117, 135)",
    ],
    mainCardGradient: ["rgba(200, 16, 46, 0.2)", "rgba(200, 16, 46, 0.1)"],
    layers: ["rgb(251, 230, 234)", "rgb(248, 212, 220)"],
    iconColor: "#E4C8D0",
  },
  SBC: {
    borderGradient: [
      "rgb(150, 185, 234)",
      "rgb(19, 98, 207)",
      "rgb(71, 132, 218)",
      "rgb(2, 87, 205)",
    ],
    mainCardGradient: ["rgba(0, 85, 204, 0.2)", "rgba(0, 85, 204, 0.1)"],
    layers: ["rgb(218, 231, 248)", "rgb(203, 221, 245)"],
    iconColor: "#D9C8D0",
  },
};

const ACTIVE_BACKGROUND: Record<string, string> = {
  NGN: "#4B0082",
  USD: "#0D6494",
  GBP: "#4F46E5",
  EUR: "#C8102E",
  SBC: "#0055CC",
  CAD: "#B91C1C",
};

const MobileWalletCarousel = () => {
  const { user } = useUser();
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const { showBalance, setShowBalance } = useUserStore();
  const swiperRef = useRef<SwiperType | null>(null);

  const wallets = user?.business_account?.wallets ?? [];

  const selectedIndex = useMemo(
    () =>
      Math.max(
        wallets.findIndex(
          (wallet) => wallet.wallet_type.currency === selectedCurrency.name,
        ),
        0,
      ),
    [wallets, selectedCurrency.name],
  );

  const selectWalletAtIndex = (index: number) => {
    const wallet = wallets[index];
    if (!wallet) return;
    const currency = wallet.wallet_type.currency;
    if (currency !== selectedCurrency.name) {
      setSelectedCurrency(currency, user);
    }
  };

  const switchToNextWallet = () => {
    if (wallets.length <= 1 || !swiperRef.current) return;
    swiperRef.current.slideNext();
  };

  if (wallets.length === 0) return null;

  return (
    <section className="lg:hidden w-full max-w-full overflow-x-hidden">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        slidesPerView={1.12}
        spaceBetween={12}
        centeredSlides
        centeredSlidesBounds={false}
        slideToClickedSlide
        grabCursor
        rewind={wallets.length > 1}
        initialSlide={selectedIndex}
        speed={320}
        resistanceRatio={0.85}
        className="wallet-horizontal-swiper w-full max-w-full overflow-x-hidden overflow-y-visible px-4 pb-1"
        onSlideChange={(swiper) => {
          selectWalletAtIndex(swiper.activeIndex);
        }}
        onTap={(swiper) => {
          selectWalletAtIndex(swiper.activeIndex);
        }}
      >
        {wallets.map((wallet) => {
          const currency = wallet.wallet_type.currency;
          const meta =
            ACCOUNT_CURRENCIES[currency as keyof typeof ACCOUNT_CURRENCIES];
          const sign = meta?.sign ?? "$";
          const isSelected = selectedCurrency.name === currency;
          const walletTheme =
            ACTIVE_WALLET_THEMES[currency] ?? ACTIVE_WALLET_THEMES.NGN;
          const activeBackground = ACTIVE_BACKGROUND[currency] ?? "#4B0082";

          const formattedBalance = wallet.account_balance.toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          );

          return (
            <SwiperSlide
              key={wallet.wallet_id}
              className="!h-auto !overflow-visible"
            >
              <div className="relative w-full min-h-[131px] overflow-visible pb-2.5">
                {isSelected && (
                  <>
                    <div
                      className="absolute left-[10px] top-[10px] z-0 h-[121px] w-[90%] rounded-[29px] opacity-55"
                      style={{ backgroundColor: walletTheme.layers[0] }}
                    />
                    <div
                      className="absolute left-0 top-[5px] z-[1] h-[121px] w-[95%] rounded-[29px]"
                      style={{ backgroundColor: walletTheme.layers[1] }}
                    />
                  </>
                )}

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const index = wallets.findIndex(
                      (w) => w.wallet_id === wallet.wallet_id,
                    );
                    if (index >= 0 && swiperRef.current) {
                      swiperRef.current.slideTo(index);
                    }
                    setSelectedCurrency(currency, user);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedCurrency(currency, user);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`relative z-10 rounded-[20px] transition-all duration-200 ${
                    isSelected ? "" : "opacity-85"
                  }`}
                  style={
                    isSelected
                      ? {
                          background: `linear-gradient(145deg, ${walletTheme.borderGradient[0]} 0%, ${walletTheme.borderGradient[1]} 33%, ${walletTheme.borderGradient[2]} 68%, ${walletTheme.borderGradient[3]} 100%)`,
                          padding: "4px",
                          height: "121px",
                        }
                      : {
                          background: "#F3F1F6",
                          height: "121px",
                        }
                  }
                >
                  <div
                    className="h-full w-full rounded-[18px] px-4 py-3 flex flex-col justify-between"
                    style={
                      isSelected
                        ? {
                            background: `linear-gradient(170deg, ${walletTheme.mainCardGradient[0]} 0%, ${walletTheme.mainCardGradient[1]} 100%), ${activeBackground}`,
                          }
                        : { background: "#D9D7DB" }
                    }
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-[15px] font-medium ${
                          isSelected
                            ? "text-raiz-gray-50"
                            : "text-raiz-gray-500"
                        }`}
                      >
                        Total balance
                      </p>

                      <Link
                        href="/transactions"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                          isSelected
                            ? "text-raiz-gray-50/90 hover:text-raiz-gray-50"
                            : "text-raiz-gray-500 hover:text-raiz-gray-700"
                        }`}
                      >
                        Transaction History
                        <FiChevronRight className="size-4" />
                      </Link>
                    </div>

                    <div className="flex items-center relative gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-2xl leading-none font-semibold tracking-[-0.02em] ${
                            isSelected
                              ? "text-raiz-gray-50"
                              : "text-raiz-gray-700"
                          }`}
                        >
                          {showBalance
                            ? `${sign}${formattedBalance}`
                            : `${sign}XXX.XXX`}
                        </p>

                        <button
                          type="button"
                          aria-label={
                            showBalance ? "Hide balance" : "Show balance"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBalance(!showBalance);
                          }}
                          className=" active:scale-95 transition-transform"
                        >
                          {showBalance ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6.99713 1.45825C4.82044 1.45825 2.81929 2.45403 1.45945 3.98812C1.40586 4.04496 1.36423 4.11198 1.33703 4.18522C1.30984 4.25845 1.29762 4.3364 1.30112 4.41444C1.30462 4.49248 1.32375 4.56902 1.35739 4.63953C1.39103 4.71004 1.43849 4.77307 1.49695 4.82489C1.55541 4.87671 1.62368 4.91626 1.69771 4.94119C1.77174 4.96613 1.85003 4.97594 1.92793 4.97005C2.00582 4.96416 2.08174 4.94268 2.15118 4.9069C2.22062 4.87111 2.28217 4.82174 2.33217 4.76172C3.48066 3.46606 5.17799 2.62492 6.99713 2.62492C8.81627 2.62492 10.5164 3.46638 11.6678 4.76229C11.7705 4.87802 11.915 4.9482 12.0695 4.95738C12.224 4.96657 12.3758 4.91402 12.4915 4.81128C12.6072 4.70854 12.6774 4.56404 12.6866 4.40956C12.6958 4.25508 12.6432 4.10328 12.5405 3.98755C11.1777 2.45371 9.17382 1.45825 6.99713 1.45825ZM2.21425 6.70028C2.12291 6.69801 2.03232 6.71723 1.94977 6.75638C1.86722 6.79553 1.79502 6.85352 1.73899 6.92569C1.68295 6.99785 1.64465 7.08217 1.62717 7.17184C1.60968 7.26152 1.6135 7.35405 1.63832 7.44198C1.78066 7.97585 2.02025 8.4736 2.32761 8.92822L1.67193 9.46541C1.61116 9.51346 1.56057 9.57313 1.52311 9.64094C1.48564 9.70875 1.46206 9.78334 1.45374 9.86037C1.44541 9.93739 1.45251 10.0153 1.47462 10.0895C1.49673 10.1638 1.53341 10.2329 1.58251 10.2928C1.63161 10.3527 1.69216 10.4023 1.76061 10.4386C1.82907 10.4748 1.90406 10.4971 1.98122 10.5041C2.05838 10.511 2.13615 10.5026 2.21 10.4792C2.28385 10.4558 2.3523 10.4179 2.41135 10.3678L3.13027 9.7793C3.40027 10.0343 3.67774 10.2637 3.99729 10.4629L3.55352 11.4216C3.52136 11.4912 3.50321 11.5664 3.50011 11.643C3.49702 11.7196 3.50904 11.796 3.53549 11.868C3.56194 11.9399 3.60229 12.006 3.65426 12.0623C3.70623 12.1186 3.76878 12.1642 3.83836 12.1964C3.90793 12.2285 3.98315 12.2467 4.05974 12.2498C4.13633 12.2529 4.21277 12.2409 4.28472 12.2144C4.35666 12.188 4.42268 12.1476 4.47903 12.0956C4.53537 12.0437 4.58093 11.9811 4.6131 11.9115L5.03294 11.0024C5.47473 11.165 5.93452 11.2774 6.41664 11.3271V12.2499C6.41555 12.3272 6.42983 12.404 6.45866 12.4757C6.48748 12.5474 6.53027 12.6127 6.58455 12.6678C6.63883 12.7228 6.7035 12.7665 6.77482 12.7964C6.84613 12.8262 6.92267 12.8416 6.99998 12.8416C7.07728 12.8416 7.15382 12.8262 7.22514 12.7964C7.29645 12.7665 7.36113 12.7228 7.4154 12.6678C7.46968 12.6127 7.51247 12.5474 7.5413 12.4757C7.57012 12.404 7.5844 12.3272 7.58331 12.2499V11.3271C8.06508 11.277 8.52419 11.1628 8.96588 11.0001L9.38686 11.9115C9.45182 12.052 9.56995 12.161 9.71524 12.2144C9.86053 12.2678 10.0211 12.2613 10.1616 12.1964C10.3021 12.1314 10.4111 12.0133 10.4645 11.868C10.5179 11.7227 10.5114 11.5621 10.4464 11.4216L10.0021 10.4618C10.3216 10.2627 10.5985 10.033 10.8685 9.77816L11.5886 10.3678C11.6477 10.4179 11.7161 10.4558 11.79 10.4792C11.8638 10.5026 11.9416 10.511 12.0187 10.5041C12.0959 10.4971 12.1709 10.4748 12.2393 10.4386C12.3078 10.4023 12.3683 10.3527 12.4174 10.2928C12.4665 10.2329 12.5032 10.1638 12.5253 10.0895C12.5474 10.0153 12.5545 9.93739 12.5462 9.86037C12.5379 9.78334 12.5143 9.70875 12.4768 9.64094C12.4394 9.57313 12.3888 9.51346 12.328 9.46541L11.6718 8.92765C11.9793 8.47324 12.2193 7.97569 12.3616 7.44198C12.3814 7.36795 12.3864 7.29076 12.3763 7.2148C12.3662 7.13885 12.3413 7.06563 12.3029 6.99931C12.2645 6.933 12.2135 6.8749 12.1526 6.82832C12.0918 6.78174 12.0224 6.7476 11.9484 6.72785C11.8743 6.7081 11.7971 6.70312 11.7212 6.71321C11.6452 6.72329 11.572 6.74824 11.5057 6.78662C11.4394 6.825 11.3813 6.87607 11.3347 6.93691C11.2881 6.99775 11.254 7.06716 11.2343 7.14119C10.7851 8.82599 8.99891 10.2083 6.99713 10.2083C4.99534 10.2083 3.21513 8.82692 2.76568 7.14119C2.73458 7.01754 2.66383 6.90748 2.56424 6.82785C2.46465 6.74822 2.34172 6.70341 2.21425 6.70028Z"
                                fill="#FCFCFD"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_25363_2740)">
                                <path
                                  d="M6.99609 2.625C3.69453 2.625 0.785494 4.91339 0.0137447 7.91203C-0.0151123 8.02443 0.00186584 8.1437 0.0609441 8.24359C0.120022 8.34348 0.216361 8.4158 0.328767 8.44466C0.441174 8.47352 0.560439 8.45654 0.660327 8.39746C0.760216 8.33838 0.832544 8.24205 0.861401 8.12964C1.5264 5.54577 4.10264 3.5 6.99609 3.5C9.88953 3.5 12.4739 5.54649 13.1387 8.12964C13.1676 8.24205 13.2399 8.33838 13.3398 8.39746C13.4397 8.45654 13.559 8.47352 13.6714 8.44466C13.7838 8.4158 13.8801 8.34348 13.9392 8.24359C13.9983 8.1437 14.0153 8.02443 13.9864 7.91203C13.2145 4.91267 10.2976 2.625 6.99609 2.625ZM7.00064 4.95833C5.44896 4.95833 4.18196 6.22533 4.18196 7.77702C4.18196 9.3287 5.44896 10.5963 7.00064 10.5963C8.55233 10.5963 9.8199 9.3287 9.8199 7.77702C9.8199 6.22533 8.55233 4.95833 7.00064 4.95833Z"
                                  fill="#FCFCFD"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_25363_2740">
                                  <rect width="14" height="14" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                          )}
                        </button>
                      </div>
                      {isSelected && wallets.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToNextWallet();
                          }}
                          className="absolute -right-[20px] top-1/2 z-10 flex h-[32px] min-w-[78px] -translate-y-1/2 items-center justify-center gap-1.5 rounded-l-full rounded-r-none bg-raiz-gray-50 py-1.5 pl-3 pr-2.5 shadow-[0_2px_8px_rgba(25,21,30,0.12)]"
                          aria-label="Switch wallet"
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-raiz-gray-950">
                            {currency}
                          </span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.64014 5.22488L10.5001 3.36487L8.64014 1.50488"
                              stroke="#19151E"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M1.5 3.36475H10.5"
                              stroke="#19151E"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M3.35999 6.7749L1.5 8.63492L3.35999 10.4949"
                              stroke="#19151E"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10.5 8.63477H1.5"
                              stroke="#19151E"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {wallets.length > 1 && (
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-raiz-gray-500">
          <FiChevronRight className="size-3.5 -scale-x-100 text-raiz-gray-400" aria-hidden />
          Swipe to switch wallet
          <FiChevronRight className="size-3.5 text-raiz-gray-400" aria-hidden />
        </p>
      )}
    </section>
  );
};

export default MobileWalletCarousel;
