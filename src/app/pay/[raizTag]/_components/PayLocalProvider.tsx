"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import SelectField from "@/components/ui/SelectField";
import PayStepActions from "./PayStepActions";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import { useGuestSendStore } from "@/store/GuestSend";
import { GetAfricaPayinNetworksApi } from "@/services/business";
import { Country } from "react-phone-number-input";

interface Props {
  goBack: () => void;
  goNext: () => void;
}

const PayLocalProvider = ({ goBack, goNext }: Props) => {
  const {
    guestLocalCurrency,
    network_id,
    guestAccount,
    channel_id,
    actions,
  } = useGuestSendStore();

  const countryCode = guestLocalCurrency?.value || "";

  const { data: networks = [], isLoading: networksLoading } = useQuery({
    queryKey: ["africa-payin-networks", countryCode, channel_id],
    queryFn: () => GetAfricaPayinNetworksApi(countryCode, channel_id),
    enabled: !!countryCode && !!channel_id,
  });

  const networkOptions = networks.map((network) => ({
    label: network.network_name,
    value: network.network_id,
  }));

  const canContinue = !!network_id && !!guestAccount;

  return (
    <section className="flex flex-col h-full ">
      <div className="mt-2 md:mt-0">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-raiz-gray-950 mt-7 md:mt-0 text-xl md:text-[23px] font-bold md:font-semibold leading-tight md:leading-10">
              Mobile-Money Provider
            </h2>
            <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
              Select your local mobile wallet network.
            </p>
          </div>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block shrink-0"
          >
            <rect
              width="48"
              height="48"
              rx="16"
              fill="#EAECFF"
              fillOpacity="0.4"
            />
            <path
              d="M34.084 16.376C33.872 15.147 32.906 14.119 31.688 13.849C30.385 13.56 29.199 14.086 28.489 15H24V33H30C31.657 33 33 31.657 33 30V19.33C33.814 18.643 34.289 17.567 34.084 16.376Z"
              fill="#F2ED9F"
            />
            <path
              d="M31 12C28.239 12 26 14.239 26 17C26 18.977 28.001 21.704 29.471 23.441C30.27 24.385 31.73 24.385 32.529 23.441C33.999 21.704 36 18.977 36 17C36 14.239 33.761 12 31 12ZM31 19.143C29.817 19.143 28.857 18.184 28.857 17C28.857 15.816 29.817 14.857 31 14.857C32.183 14.857 33.143 15.817 33.143 17C33.143 18.183 32.183 19.143 31 19.143Z"
              fill="#EDB637"
            />
            <path
              d="M18.697 13.786L16.459 15.126C15.554 15.668 15 16.645 15 17.7V31.106C15 32.38 16.39 33.167 17.482 32.512L18.696 31.785C19.098 31.544 19.547 31.415 20 31.395V13.397C19.547 13.417 19.098 13.546 18.697 13.786Z"
              fill="#F2ED9F"
            />
            <path
              d="M21.359 13.6829C20.931 13.4699 20.463 13.3759 20 13.3969V31.3949C20.464 31.3749 20.932 31.4689 21.36 31.6829L24 32.9999V14.9999L21.359 13.6829Z"
              fill="#EDB637"
            />
          </svg>
        </header>
      </div>

      <div className="flex flex-col justify-between gap-4 h-full mt-5">
        <div className="flex flex-col gap-4">
          <SelectField
            label="Network Provider"
            placeholder={
              networksLoading
                ? "Loading networks..."
                : "Select mobile money network"
            }
            name="network"
            options={networkOptions}
            onChange={(i) => {
              if (!i?.value) return;
              const network = networks.find(
                (item) => item.network_id === String(i.value),
              );
              actions.setFields({
                network_id: String(i.value),
                network_name: network?.network_name || String(i.label || ""),
              });
            }}
            value={
              network_id
                ? networkOptions.find((option) => option.value === network_id) ||
                  null
                : null
            }
            height="auto"
          />
          <PhoneNumberInput
            defaultCountry={(guestLocalCurrency?.value || "KE") as Country}
            label="Mobile Money Account Number"
            value={guestAccount}
            onChange={(value) => actions.setField("guestAccount", value || "")}
          />
        </div>
        <PayStepActions
          onBack={goBack}
          onContinue={goNext}
          continueDisabled={!canContinue}
          continueLabel="Continue to identification"
        />
      </div>
    </section>
  );
};

export default PayLocalProvider;
