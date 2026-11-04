"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";

export interface PanelAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

interface Props {
  icon: "success" | "failed" | "pending";
  title: string;
  message: string;
  busy?: boolean;
  details?: { label: string; value: string }[];
  secondary?: PanelAction;
  primary: PanelAction;
}

const ICONS = {
  success: "/icons/success.svg",
  failed: "/icons/failed.svg",
  pending: "/icons/pending.svg",
};

const PaystackStatusPanel = ({ icon, title, message, busy, details, secondary, primary }: Props) => (
  <div className="w-full h-full bg-gradient-to-l from-indigo-900 to-violet-600 rounded-[36px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.30)] inline-flex flex-col justify-center items-center">
    <div className="flex flex-col justify-between gap-6 h-full pt-[64px] p-[30px] items-center w-full">
      <div
        className="text-center w-full flex flex-col justify-center items-center"
        role="status"
        aria-live="polite"
        aria-busy={busy || undefined}
      >
        <Image src={ICONS[icon]} width={50} height={50} alt="" aria-hidden />
        <h4 className="mt-[15px] text-gray-100 text-xl font-bold leading-relaxed">{title}</h4>
        <p className="text-gray-100 mt-3 text-xs font-normal leading-tight text-wrap">{message}</p>
        {busy && (
          <span
            className="mt-4 w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"
            aria-hidden
          />
        )}
        {details && details.length > 0 && (
          <dl className="mt-5 w-full space-y-1.5 text-left">
            {details.map((item) => (
              <div key={item.label} className="flex justify-between gap-3 text-xs">
                <dt className="text-gray-200">{item.label}</dt>
                <dd className="text-gray-100 font-semibold text-right break-all">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="flex justify-between w-full gap-[15px]">
        {secondary && (
          <Button
            onClick={secondary.onClick}
            loading={secondary.loading}
            className="bg-zinc-200 text-zinc-900 whitespace-nowrap"
            variant="secondary"
          >
            {secondary.label}
          </Button>
        )}
        <Button onClick={primary.onClick} loading={primary.loading} className="bg-indigo-900 whitespace-nowrap">
          {primary.label}
        </Button>
      </div>
    </div>
  </div>
);

export default PaystackStatusPanel;
