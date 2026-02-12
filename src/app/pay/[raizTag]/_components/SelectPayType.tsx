import { IBusinessPaymentData } from "@/types/services";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";

import { useGuestSendStore } from "@/store/GuestSend";
import { z } from "zod";
import Avatar from "@/components/ui/Avatar";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { WALLET_TYPES } from "@/constants/misc";
import { GuestPaymentType } from "../PayUserClient";
import { useTopupStore } from "@/store/TopUp";
import { useMutation } from "@tanstack/react-query";
import { InitiateGuestZellePaymentApi } from "@/services/transactions";

interface Props {
  data: IBusinessPaymentData;
  goNext: () => void;
  paymentType: GuestPaymentType | undefined;
  setPaymentType: Dispatch<SetStateAction<GuestPaymentType | undefined>>;
  amountFromLink?: string;
}

const SelectPayType = ({
  data,
  goNext,
  paymentType,
  setPaymentType,
  amountFromLink,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { amount, actions } = useGuestSendStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { actions: tActions } = useTopupStore();
  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine((val) => parseFloat(val) >= 1, {
      message: "Amount must be at least 1",
    });
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    if (value.startsWith(".")) value = "0" + value;

    const decimalCount = value.split(".").length - 1;
    if (decimalCount > 1) return;

    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

    setRawAmount(formattedValue);
    actions.setField("amount", value);
    if (paymentType === "transfer") {
      setError(null);
      return;
    }

    const result = amountSchema.safeParse(value);
    setError(!result.success ? result.error.errors[0].message : null);
  };

  const displayValue = () => {
    if (isFocused || !amount) return amount ? `$${rawAmount}` : "";
    const num = parseFloat(rawAmount);
    return isNaN(num) ? "" : `$${num.toFixed(2)}`;
  };

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

  const paymentTypes = [
    { label: "Pay with Card", value: "card" },
    ...(availablepaymentOptsArr.length > 0
      ? [{ label: "Pay with Transfer", value: "transfer" }]
      : []),
    { label: "Pay with Zelle", value: "zelle" }
    // { label: "Pay in African currency", value: "local" },

  ];

  const displayName = () => {
    let str = "";
    if (data?.account_user?.account_name) {
      str = `${data?.account_user?.account_name}`;
    } else {
      str = `${data?.account_user?.username || ""}`;
    }
    return str;
  }

  const USDAcct = data?.wallets?.find(
    (acct: { wallet_type: { currency: string } }) =>
      acct.wallet_type.currency === "USD"
  );

  const zelleMutation = useMutation({
    mutationFn: (payload: { expected_amount: number }) =>
      InitiateGuestZellePaymentApi(USDAcct?.wallet_id || null, payload),
    onSuccess: (res) => {
      tActions.setZelleInfo(res);
      goNext();
    },
  });

  const handleNext = () => {
    if (paymentType === "zelle") {
      zelleMutation.mutate({ expected_amount: Number(amount) })
    } else {
      goNext()
    }
  }

  return (
    <section className="flex flex-col  h-full">
      <div className="mt-6 md:mt-10">
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-[23px] font-semibold  leading-10">
            Pay {displayName()}
          </h2>
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <path
              d="M19 22.1667H9.5C6.87642 22.1667 4.75 20.0403 4.75 17.4167V7.91675C4.75 5.29316 6.87642 3.16675 9.5 3.16675H19C21.6236 3.16675 23.75 5.29316 23.75 7.91675V17.4167C23.75 20.0403 21.6236 22.1667 19 22.1667Z"
              fill="#733B9C"
            />
            <path
              opacity="0.35"
              d="M30.0833 34.8335H20.5833C17.9597 34.8335 15.8333 32.7071 15.8333 30.0835V20.5835C15.8333 17.9599 17.9597 15.8335 20.5833 15.8335H30.0833C32.7069 15.8335 34.8333 17.9599 34.8333 20.5835V30.0835C34.8333 32.7071 32.7069 34.8335 30.0833 34.8335Z"
              fill="#C6ADD5"
            />
            <g clipPath="url(#clip0_25992_4531)">
              <g opacity="0.5">
                <path
                  d="M6.50466 24.505C7.39966 23.61 8.8505 23.61 9.7455 24.505C9.81675 24.5762 10.0909 24.8504 10.1622 24.9217C10.8072 25.5667 10.9801 26.4992 10.6951 27.3058C11.5017 27.0208 12.4338 27.1933 13.0788 27.8383C13.1501 27.9096 13.4242 28.1837 13.4955 28.255C14.3905 29.15 14.3905 30.6008 13.4955 31.4958C12.6005 32.3908 11.1497 32.3908 10.2547 31.4958C10.1834 31.4246 9.90925 31.1504 9.838 31.0792C9.193 30.4342 9.02008 29.5017 9.30508 28.695C8.49841 28.98 7.56633 28.8075 6.92133 28.1625C6.85008 28.0912 6.57591 27.8171 6.50466 27.7458C5.60966 26.8508 5.60966 25.4 6.50466 24.505Z"
                  fill="#493260"
                />
              </g>
              <path
                d="M8.16086 26.1606C8.48627 25.8351 9.01377 25.8351 9.33919 26.1606L11.8392 28.6606C12.1646 28.986 12.1646 29.5135 11.8392 29.8389C11.5138 30.1643 10.9863 30.1643 10.6609 29.8389L8.16086 27.3389C7.83544 27.0135 7.83544 26.486 8.16086 26.1606Z"
                fill="black"
              />
            </g>
            <defs>
              <clipPath id="clip0_25992_4531">
                <rect
                  width="10"
                  height="10"
                  fill="white"
                  transform="matrix(-1 0 0 1 15 22.9998)"
                />
              </clipPath>
            </defs>
          </svg>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug">
          Pay {data?.account_user?.username} in your preferred method
        </p>{" "}
      </div>
      <div className="flex flex-col h-full justify-between items-center w-full mt-5">
        <div className="w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <div className="relative w-10 h-10">
              <Avatar
                src={data?.account_user?.selfie_image}
                name={data?.account_user?.username}
              />
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                className="absolute bottom-[-11px] right-[-15px]"
              >
                <rect
                  x="1"
                  y="1"
                  width="20"
                  height="20"
                  rx="10"
                  fill="#EAECFF"
                />
                <rect
                  x="1"
                  y="1"
                  width="20"
                  height="20"
                  rx="10"
                  stroke="#E4E0EA"
                  strokeWidth="0.5"
                />
                <path
                  d="M13.7598 5.97312L7.73977 7.97312C3.69311 9.32645 3.69311 11.5331 7.73977 12.8798L9.52644 13.4731L10.1198 15.2598C11.4664 19.3065 13.6798 19.3065 15.0264 15.2598L17.0331 9.24645C17.9264 6.54645 16.4598 5.07312 13.7598 5.97312ZM13.9731 9.55978L11.4398 12.1065C11.3398 12.2065 11.2131 12.2531 11.0864 12.2531C10.9598 12.2531 10.8331 12.2065 10.7331 12.1065C10.5398 11.9131 10.5398 11.5931 10.7331 11.3998L13.2664 8.85312C13.4598 8.65978 13.7798 8.65978 13.9731 8.85312C14.1664 9.04645 14.1664 9.36645 13.9731 9.55978Z"
                  fill="#4B0082"
                />
              </svg>
            </div>
            <p className="text-center mt-4 justify-start text-zinc-900 text-sm font-bold  leading-none capitalize">
              {data?.account_user?.username}
            </p>
            <p className="text-center mt-10 justify-start text-zinc-900 text-base mb-3">
              How much do you want to send?
            </p>
            <div className="flex items-center">
              <input
                ref={inputRef}
                autoFocus
                className={`outline-none h-[91px] bg-transparent w-fit xl:mx-auto text-center 
    text-zinc-900 placeholder:text-zinc-900 !text-3xl font-semibold leading-10
    ${paymentType === "transfer" ? "opacity-40 cursor-not-allowed" : ""}
  `}
                placeholder="0.00"
                value={displayValue()}
                onChange={handleAmountChange}
                onFocus={() => setIsFocused(true)}
                disabled={paymentType === "transfer" || !!amountFromLink}
              />

            </div>
            {error && <ErrorMessage message={error} />}
          </div>
          <SelectField
            label="Payment Method"
            placeholder="Select a payment method"
            name="method"
            options={paymentTypes}
            onChange={(i) =>
              i?.value ? setPaymentType(i.value as GuestPaymentType) : null
            }
            value={
              paymentType
                ? paymentTypes.find((option) => option.value === paymentType) ||
                null
                : null
            }
          />
        </div>
        <div className="w-full py-5">
          <Button
            disabled={
              !!error ||
              (paymentType !== "transfer" && !amount) ||
              !paymentType || zelleMutation.isPending
            }
            loading={zelleMutation.isPending}
            onClick={handleNext}
          >
            Continue
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
    </section>
  );
};

export default SelectPayType;
