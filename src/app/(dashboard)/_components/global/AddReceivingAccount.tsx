"use client";
import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readApiError } from "@/lib/apiError";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  CreateReceivingAccountApi,
  FetchFeeCatalogApi,
} from "@/services/globalBalance";
import { ReceivingAccount, ReceivingAsset } from "@/types/globalBalance";
import { describeFee, isAccountReady } from "@/lib/globalBalance";
import {
  CurrencyFlag,
  DesignIcon,
  GlobalDialog,
  primaryButton,
} from "./GlobalUI";

const networks = [
  {
    id: "bsc",
    name: "BNB Smart Chain",
    text: "BEP20",
    icon: "BinanceCoinBnb",
    color: "bg-amber-50",
  },
  {
    id: "tron",
    name: "Tron",
    text: "TRC20",
    icon: "TrontronTrx",
    color: "bg-rose-50",
  },
  {
    id: "polygon",
    name: "Polygon",
    text: "Polygon network",
    icon: "PolygonMatic",
    color: "bg-purple-50",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    text: "ERC20",
    icon: "EthereumEth",
    color: "bg-indigo-50",
  },
];
export default function AddReceivingAccount({
  asset,
  close,
  onCreated,
  existingAccounts = [],
}: {
  existingAccounts?: ReceivingAccount[];
  asset: "EUR" | "GBP" | "SBC";
  close: () => void;
  onCreated: (accounts: ReceivingAccount[]) => void;
}) {
  const { user, refetch } = useUser();
  const { canWriteBusiness } = usePermissions();
  const qc = useQueryClient();
  const entityId = user?.business_account.entity_id;
  const [step, setStep] = useState<"intro" | "confirm" | "done">("intro");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [token, setToken] = useState<"USDT" | "USDC">("USDT");
  const [created, setCreated] = useState<ReceivingAccount[]>([]);
  // Reuse the same idempotency key when retrying a token/network pair.
  const attempts = useRef(
    new Map<string, { key: string; result?: ReceivingAccount }>(),
  );
  const {
    data: catalog,
    isLoading,
    isError,
    refetch: refreshFees,
  } = useQuery({
    queryKey: ["fee-catalog", entityId],
    queryFn: FetchFeeCatalogApi,
    enabled: !!entityId,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const fees =
    catalog?.fees.filter(
      (f) =>
        f.asset === (asset === "SBC" ? token : asset) &&
        f.direction === "inbound" &&
        f.service.startsWith("treasury_"),
    ) ?? [];
  const hasAccount = (network: string) =>
    [...existingAccounts, ...created].some(
      (account) =>
        account.asset === token && account.crypto?.network === network,
    );
  const mutation = useMutation({
    mutationFn: async () => {
      if (!canWriteBusiness)
        throw new Error("You do not have permission to create accounts.");
      if (asset === "SBC" && (!selectedNetwork || hasAccount(selectedNetwork)))
        throw new Error(
          "Choose a network that has not already been added for this token.",
        );
      const body: { asset: ReceivingAsset; network?: string } =
        asset === "SBC"
          ? { asset: token, network: selectedNetwork }
          : { asset };
      const signature = JSON.stringify(body);
      let attempt = attempts.current.get(signature);
      if (!attempt) {
        attempt = { key: crypto.randomUUID() };
        attempts.current.set(signature, attempt);
      }
      if (!attempt.result)
        attempt.result = await CreateReceivingAccountApi(body, attempt.key);
      return [attempt.result];
    },
    onSuccess: async (results) => {
      setCreated(results);
      setStep("done");
      onCreated(results);
      await Promise.all([
        refetch(),
        qc.invalidateQueries({ queryKey: ["receiving-accounts", entityId] }),
      ]);
    },
  });
  const failure = mutation.error as {
    response?: { data?: { error?: { message?: string } } };
    data?: { error?: { message?: string } };
  } | null;
  const error =
    failure?.response?.data?.error?.message ??
    failure?.data?.error?.message ??
    readApiError(mutation.error).message;
  const closeDialog = useCallback(() => {
    if (!mutation.isPending) close();
  }, [mutation.isPending, close]);
  const isCrypto = asset === "SBC";
  const businessName = user?.business_account.business_name ?? "your business";
  const intro = isCrypto
    ? {
        title: "Stablecoin wallet",
        subtitle: "Receive USDT and USDC from customers and partners.",
        color: "bg-[#05c]",
        ellipse: "32269-stablecoin-modal-ellipse.svg",
        feeLabel: "Activation fee",
        fee: "Free",
        action: "Choose a network",
        benefits: [
          "Wallet addresses for USDT and USDC",
          "Choose BNB Chain, Tron, Polygon or Ethereum",
          "Every deposit lands in your USD balance",
          "Arrives in minutes, any day of the week",
        ],
      }
    : asset === "EUR"
      ? {
          title: "EUR account",
          subtitle: "Get paid in euros by customers across Europe.",
          color: "bg-[#c8102e]",
          ellipse: "32269-account-modal-ellipse.svg",
          feeLabel: "One-time activation fee",
          fee: "$3.00",
          action: "Create EUR account for $3",
          benefits: [
            `Your own IBAN in ${businessName}’s name`,
            "Receive SEPA payments, usually in 1 working day",
            "Euros convert to USD as they arrive",
            "Competitive exchange rates",
          ],
        }
      : {
          title: "GBP account",
          subtitle: "Get paid in pounds by customers in the UK.",
          color: "bg-[#4f46e5]",
          ellipse: "32269-gbp-modal-ellipse.svg",
          feeLabel: "One-time activation fee",
          fee: "$3.00",
          action: "Create GBP account for $3",
          benefits: [
            `UK sort code and account number in ${businessName}’s name`,
            "Faster Payments, usually the same day",
            "Pounds convert to USD as they arrive",
            "Competitive exchange rates",
          ],
        };
  const receivingFees = (
    <div>
      <h4 className="text-[13px] font-semibold leading-normal text-[#19151e]">
        Receiving fees
      </h4>
      {isLoading ? (
        <p className="mt-2.5 text-sm leading-normal text-[#6b6b80]">
          Loading fees…
        </p>
      ) : isError ? (
        <button
          onClick={() => refreshFees()}
          className="mt-2.5 text-sm leading-normal text-primary2 underline"
        >
          Could not load fees. Retry
        </button>
      ) : fees.length ? (
        <ul className="mt-2.5">
          {fees
            .flatMap((f) => [
              ...f.components.map((c) => ({
                key: `${f.service}-${c.code}`,
                title: c.label,
                detail: describeFee(c),
              })),
              ...f.notes.map((note) => ({
                key: `${f.service}-${note}`,
                title: note,
                detail: "",
              })),
            ])
            .map((item) => (
              <li
                key={item.key}
                className="flex items-start gap-2.5 py-[5px] text-sm leading-normal text-[#19151e]"
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#eaf3f8]">
                  <DesignIcon name="32269-11653-imgVuesaxBoldTickCircle.svg" />
                </span>
                <span className="min-w-0 flex-1">
                  {item.title}
                  {item.detail && (
                    <span className="block text-xs text-[#6b6b80]">
                      {item.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
        </ul>
      ) : (
        <p className="mt-2.5 text-[13px] leading-normal text-[#6b6b80]">
          No receiving fee information was supplied. Final settlement fees are
          determined by the service.
        </p>
      )}
    </div>
  );
  const errorAlert = mutation.isError ? (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {typeof error === "string"
        ? error
        : "Account setup could not be completed. Retry to continue the same request."}
    </p>
  ) : null;
  return (
    <GlobalDialog
      title={
        step === "done"
          ? "Account setup"
          : step === "confirm"
            ? isCrypto
              ? "Choose your network"
              : `Confirm ${asset} account`
            : intro.title
      }
      close={closeDialog}
      hero={step === "intro" || (step === "confirm" && !isCrypto)}
    >
      {step === "intro" ? (
        <>
          <section
            className={`relative flex shrink-0 flex-col items-center overflow-hidden px-7 pb-7 pt-5 text-white ${intro.color}`}
          >
            <span className="pointer-events-none absolute left-[200px] top-[-220px]">
              <DesignIcon name={intro.ellipse} />
            </span>
            <div className="relative flex h-9 w-full justify-end">
              <button
                aria-label="Close"
                onClick={closeDialog}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
              >
                <DesignIcon name="32269-account-modal-close.svg" />
              </button>
            </div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white">
              <CurrencyFlag currency={asset} hero />
            </div>
            <h3 className="relative mt-[18px] text-2xl font-bold leading-normal">
              {intro.title}
            </h3>
            <p className="relative mt-1.5 w-full max-w-[380px] text-center text-sm leading-normal text-white/85">
              {intro.subtitle}
            </p>
          </section>
          <section className="flex flex-col gap-[14px] bg-white px-7 py-6">
            <h4 className="text-[13px] font-semibold leading-normal text-[#6b6b80]">
              What you get
            </h4>
            <ul className="flex flex-col gap-[14px]">
              {intro.benefits.map((text) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm leading-normal text-[#19151e]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaf3f8]">
                    <DesignIcon name="32269-account-modal-tick.svg" />
                  </span>
                  <span className="min-w-0 flex-1">{text}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center rounded-xl bg-[#f5f9fc] px-4 py-3.5 leading-normal">
              <span className="min-w-0 flex-1 text-[13px] text-[#6b6b80]">
                {intro.feeLabel}
              </span>
              <strong className="text-sm font-semibold text-[#19151e]">
                {intro.fee}
              </strong>
            </div>
            <button
              className="flex w-full items-center justify-center rounded-[14px] bg-raiz-usd-primary py-[15px] text-[15px] font-semibold leading-normal text-white transition hover:brightness-110"
              onClick={() => setStep("confirm")}
            >
              {intro.action}
            </button>
          </section>
        </>
      ) : step === "confirm" && !isCrypto ? (
        <section className="flex min-h-0 flex-col items-center overflow-y-auto bg-white p-7">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f5f9fc]">
            <CurrencyFlag currency={asset} badge />
          </span>
          <h3 className="mt-3.5 text-xl font-semibold leading-normal text-[#19151e]">
            Confirm {asset} account
          </h3>
          <p className="mt-1 text-[13px] leading-normal text-[#6b6b80]">
            Summary
          </p>
          <dl className="mt-4 w-full text-sm leading-normal">
            {[
              { label: "Account type", value: `${asset} account` },
              { label: "Activation fee", value: intro.fee },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center border-b border-[#eaecf0] py-3.5"
              >
                <dt className="min-w-0 flex-1 text-[#6b6b80]">{row.label}</dt>
                <dd className="font-semibold text-[#19151e]">{row.value}</dd>
              </div>
            ))}
            <div className="flex items-center py-3.5">
              <dt className="min-w-0 flex-1 text-[#6b6b80]">Pay from</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-[#19151e]">
                <CurrencyFlag currency="USD" mini />
                USD balance
              </dd>
            </div>
          </dl>
          <div className="mt-3 w-full">{receivingFees}</div>
          {errorAlert && <div className="mt-5 w-full">{errorAlert}</div>}
          <button
            disabled={
              !canWriteBusiness || mutation.isPending || isLoading || isError
            }
            className="mt-5 flex w-full items-center justify-center rounded-[14px] bg-raiz-usd-primary py-[15px] text-[15px] font-semibold leading-normal text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? "Creating account…"
              : mutation.isError
                ? "Retry account setup"
                : `Pay ${intro.fee}`}
          </button>
          <button
            disabled={mutation.isPending}
            className="mt-2.5 flex w-full items-center justify-center rounded-[14px] bg-[#eeeef3] py-[15px] text-[15px] font-semibold leading-normal text-[#19151e] disabled:opacity-50"
            onClick={closeDialog}
          >
            Cancel
          </button>
        </section>
      ) : step === "confirm" ? (
        <>
          <p className="mb-5 text-sm text-raiz-gray-600">
            Choose one network for your selected token. Add other networks one
            at a time.
          </p>
          <label className="mb-4 text-xs text-raiz-gray-600">
            Token
            <select
              disabled={mutation.isPending}
              value={token}
              onChange={(e) => {
                setToken(e.target.value as "USDT" | "USDC");
                setSelectedNetwork("");
                mutation.reset();
              }}
              className="mt-2 w-full rounded-xl border border-kyb-border bg-white p-3 text-sm text-raiz-gray-950"
            >
              <option>USDT</option>
              <option>USDC</option>
            </select>
          </label>
          <div className="space-y-3">
            {networks.map((network) => (
              <label
                key={network.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${selectedNetwork === network.id ? "border-[#b7a6ff] bg-[#fbfaff]" : "border-kyb-border"}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${network.color}`}
                >
                  <DesignIcon
                    name={`32296-2894-imgVuesaxBold${network.icon}.svg`}
                  />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">
                    {network.name}
                  </span>
                  <span className="text-xs text-raiz-gray-600">
                    {network.text}
                    {hasAccount(network.id) ? " · Already added" : ""}
                  </span>
                </span>
                <input
                  disabled={mutation.isPending || hasAccount(network.id)}
                  type="radio"
                  name="receiving-network"
                  className="h-5 w-5 accent-primary2"
                  checked={selectedNetwork === network.id}
                  onChange={() => {
                    setSelectedNetwork(network.id);
                    mutation.reset();
                  }}
                />
              </label>
            ))}
          </div>
          <p className="my-5 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
            Each token and network has its own receiving instructions. Only use
            a pair after the service confirms it is supported and active.
          </p>
          <div className="mb-5">{receivingFees}</div>
          {errorAlert && <div className="mb-4">{errorAlert}</div>}
          <button
            disabled={
              !canWriteBusiness ||
              mutation.isPending ||
              isLoading ||
              isError ||
              !selectedNetwork ||
              hasAccount(selectedNetwork)
            }
            className={primaryButton}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? "Creating account…"
              : mutation.isError
                ? "Retry account setup"
                : "Create receiving account"}
          </button>
          <button
            disabled={mutation.isPending}
            className="mt-3 p-2 text-sm text-primary2"
            onClick={close}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="mb-5 flex justify-center">
            <CurrencyFlag currency={asset} large />
          </div>
          <h3 className="text-center text-xl font-semibold">
            {created.every((a) => isAccountReady(a.status))
              ? "Your account is ready!"
              : "Account setup submitted"}
          </h3>
          <p className="mt-3 text-center text-sm text-raiz-gray-600">
            {created.every((a) => isAccountReady(a.status))
              ? "Share your receiving details to get paid."
              : "We’ll show your receiving instructions when setup is complete."}
          </p>
          <div className="my-6 space-y-3 rounded-2xl bg-kyb-soft p-5 text-sm">
            {created.map((a) => (
              <div key={a.receiving_account_id}>
                <p className="font-semibold">
                  {a.asset}
                  {a.crypto?.network
                    ? ` · ${String(a.crypto.network)}`
                    : ""} · {a.status}
                </p>
                {a.disclosures.map((d) => (
                  <p key={d} className="mt-2 text-xs text-raiz-gray-600">
                    {d}
                  </p>
                ))}
              </div>
            ))}
          </div>
          {isCrypto && (
            <button
              className={`${primaryButton} mb-3`}
              onClick={() => {
                setSelectedNetwork("");
                mutation.reset();
                setStep("confirm");
              }}
            >
              Add another network
            </button>
          )}
          <button onClick={close} className={primaryButton}>
            Done
          </button>
        </>
      )}
    </GlobalDialog>
  );
}
