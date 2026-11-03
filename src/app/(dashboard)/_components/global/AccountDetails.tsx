"use client";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { FetchFeeCatalogApi } from "@/services/globalBalance";
import {
  AccountInstructions,
  isAccountReady,
  describeFee,
  instructionsText,
} from "@/lib/globalBalance";
import SelectField from "@/components/ui/SelectField";
import {
  CurrencyFlag,
  DesignIcon,
  GlobalDialog,
  primaryButton,
  secondaryButton,
} from "./GlobalUI";

export async function copyInstructions(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Unable to copy. Please select and copy the details manually.");
  }
}

async function accountPdf(
  accounts: AccountInstructions[],
  businessName: string,
  preview = false,
) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    accounts.forEach((account, index) => {
      if (index) doc.addPage();
      let y = 24;
      const write = (text: string, size = 11) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, 166) as string[];
        for (const line of lines) {
          if (y > 274) {
            doc.addPage();
            y = 24;
          }
          doc.text(line, 22, y);
          y += size === 20 ? 10 : 6;
        }
        y += 5;
      };
      doc.setTextColor(13, 100, 148);
      write("RAIZ | ACCOUNT DETAILS", 11);
      doc.setTextColor(25, 21, 30);
      write(businessName, 20);
      write(account.title, 16);
      // write(`Status: ${account.status}`);
      account.fields.forEach((field) =>
        write(`${field.label}\n${field.value}`),
      );
      account.disclosures.forEach((disclosure) => write(disclosure));
    });
    if (preview) {
      const url = doc.output("bloburl");
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened)
        toast.info(
          "If the preview did not open, allow pop-ups or download the PDF.",
        );
      setTimeout(() => URL.revokeObjectURL(String(url)), 60_000);
    } else
      doc.save(
        `${businessName.replace(/[^a-zA-Z0-9 _-]/g, "") || "Raiz"} - account details.pdf`,
      );
  } catch {
    toast.error("Unable to generate the PDF. Please try again.");
  }
}

export function AccountDetails({
  accounts,
  initialId,
  businessName,
  entityId,
  global,
  onAddCrypto,
  close,
}: {
  accounts: AccountInstructions[];
  initialId: string;
  businessName: string;
  entityId: string;
  global: boolean;
  onAddCrypto?: () => void;
  close: () => void;
}) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [exporting, setExporting] = useState(false);
  const account = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  const cryptoAccounts = accounts.filter(
    (a) => a.address || a.receiving?.kind === "crypto_address",
  );
  const isCrypto =
    !!account?.address || account?.receiving?.kind === "crypto_address";
  const {
    data: catalog,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["fee-catalog", entityId],
    queryFn: FetchFeeCatalogApi,
    enabled: global,
    staleTime: 0,
    refetchOnMount: "always",
  });
  if (!account) return null;
  const fees =
    catalog?.fees.filter(
      (f) =>
        f.direction === "inbound" &&
        (f.asset === account.asset ||
          (!f.asset && f.transaction_currency === account.asset)) &&
        (f.service === "treasury_foreign_deposit_inbound" ||
          f.service === "international_usd_deposit" ||
          f.service.startsWith("treasury_")),
    ) ?? [];
  const active = isAccountReady(account.status);
  const tokenOptions = [...new Set(cryptoAccounts.map((a) => a.asset))].map(
    (asset) => ({ value: asset, label: asset }),
  );
  const networkOptions = cryptoAccounts
    .filter((a) => a.asset === account.asset)
    .map((a) => ({
      value: a.id,
      label: a.network ?? "Pending network",
    }));
  const exportPdf = async () => {
    setExporting(true);
    await accountPdf([account], businessName);
    setExporting(false);
  };
  return (
    <GlobalDialog
      title={
        isCrypto
          ? "Stablecoin account details"
          : `${account.asset} account details`
      }
      close={close}
      drawer
    >
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <CurrencyFlag currency={isCrypto ? "SBC" : account.asset} large />
        <h3 className="text-2xl font-semibold">
          {isCrypto
            ? "Stablecoin receiving account"
            : account.asset === "USD"
              ? "US Dollar account"
              : account.asset === "GBP"
                ? "British Pound account"
                : account.asset === "EUR"
                  ? "Euro account"
                  : "Naira account"}
        </h3>
        <p className="text-sm text-raiz-gray-600">
          {isCrypto
            ? "For USDT and USDC deposits"
            : account.asset === "NGN"
              ? "Local transfers from Nigerian banks"
              : account.asset === "USD"
                ? "For ACH and wire transfers from US banks"
                : account.asset === "EUR"
                  ? "For SEPA transfers from European banks"
                  : "For UK bank transfers via Faster Payments"}
        </p>
      </div>
      {isCrypto && onAddCrypto && <button className="mb-5 text-sm font-semibold text-primary2" onClick={onAddCrypto}>Add token or network</button>}
      {!active && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          Account {account.status}.{" "}
          {account.status === "pending"
            ? "Your details will be available when account setup is complete."
            : "This account is not currently available for deposits."}
        </p>
      )}
      {isCrypto && (
        <>
          {active && account.address && (
            <div className="mx-auto mb-6 rounded-xl bg-white p-3">
              <QRCode value={account.address} size={184} />
            </div>
          )}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <SelectField
              instanceId="stablecoin-token"
              label="Token"
              labelClass="!text-xs !font-normal !text-raiz-gray-600"
              name="token"
              isSearchable={false}
              bgColor="#ffffff"
              className="!shadow-none"
              options={tokenOptions}
              value={
                tokenOptions.find((option) => option.value === account.asset) ??
                null
              }
              onChange={(option) => {
                const next =
                  cryptoAccounts.find(
                    (a) =>
                      a.asset === option?.value && a.network === account.network,
                  ) ?? cryptoAccounts.find((a) => a.asset === option?.value);
                if (next) setSelectedId(next.id);
              }}
            />
            <SelectField
              instanceId="stablecoin-network"
              label="Network"
              labelClass="!text-xs !font-normal !text-raiz-gray-600"
              name="network"
              isSearchable={false}
              bgColor="#ffffff"
              className="!shadow-none"
              options={networkOptions}
              value={
                networkOptions.find((option) => option.value === account.id) ??
                null
              }
              onChange={(option) => {
                if (option) setSelectedId(String(option.value));
              }}
            />
          </div>
        </>
      )}
      <dl className="divide-y divide-kyb-border rounded-2xl border border-kyb-border bg-white px-4">
        {account.fields.map((field) => (
          <div key={field.label} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-raiz-gray-600">{field.label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">
                {field.value}
              </dd>
            </div>
            <button
              disabled={!active}
              onClick={() => copyInstructions(field.value)}
              aria-label={`Copy ${field.label}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eeebfc] disabled:opacity-40"
            >
              <DesignIcon name="32273-13049-imgVuesaxBoldCopy.svg" />
            </button>
          </div>
        ))}
        {!account.fields.length && (
          <p className="py-5 text-sm text-raiz-gray-600">
            Account instructions are not available yet.
          </p>
        )}
      </dl>
      {global && (
        <div className="my-5 space-y-3 text-xs">
          {isLoading ? (
            <p>Loading receiving fees…</p>
          ) : isError ? (
            <button
              onClick={() => refetch()}
              className="text-primary2 underline"
            >
              Unable to load fees. Retry
            </button>
          ) : (
            fees.map((fee) => (
              <div
                key={`${fee.service}-${fee.asset}-${fee.schedule_version}-${fee.payment_rail}`}
              >
                <p className="font-semibold">
                  {fee.display_name}
                  {fee.payment_rail ? ` · ${fee.payment_rail}` : ""}
                </p>
                {fee.components.map((c) => (
                  <p key={c.code} className="mt-1 text-raiz-gray-600">
                    {c.label}: {describeFee(c)}
                  </p>
                ))}
                {fee.notes.map((n) => (
                  <p key={n} className="mt-1 text-raiz-gray-600">
                    {n}
                  </p>
                ))}
              </div>
            ))
          )}
        </div>
      )}
      <div
        className={`my-6 rounded-2xl p-4 text-sm ${isCrypto ? "bg-amber-50" : "bg-[#eeebfc]"}`}
      >
        <p className="font-semibold">
          {isCrypto
            ? "Only send on the selected network"
            : account.receiving
              ? "Settles to your USD balance"
              : `Lands in your ${account.asset} balance`}
        </p>
        {account.disclosures.map((text) => (
          <p
            key={text}
            className="mt-2 text-xs leading-relaxed text-raiz-gray-600"
          >
            {text}
          </p>
        ))}
        {isCrypto && (
          <p className="mt-2 text-xs text-raiz-gray-600">
            Tokens sent on another network may be lost.
          </p>
        )}
      </div>
      <footer className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <button
          disabled={!active || !account.fields.length}
          onClick={() =>
            copyInstructions(instructionsText([account], businessName))
          }
          className={secondaryButton}
        >
          <DesignIcon name="32273-13049-imgVuesaxLinearCopy.svg" />
          Copy all
        </button>
        <button
          disabled={!active || !account.fields.length || exporting}
          onClick={exportPdf}
          className={primaryButton}
        >
          <DesignIcon name="32273-13049-imgVuesaxLinearDocumentDownload.svg" />
          {exporting ? "Preparing…" : "Download PDF"}
        </button>
      </footer>
    </GlobalDialog>
  );
}

export function ShareAccounts({
  accounts,
  businessName,
  close,
}: {
  accounts: AccountInstructions[];
  businessName: string;
  close: () => void;
}) {
  const available = accounts.filter(
    (a) => isAccountReady(a.status) && a.fields.length,
  );
  const [selected, setSelected] = useState(() =>
    available.filter((a) => !a.address).map((a) => a.id),
  );
  const [busy, setBusy] = useState(false);
  const chosen = available.filter((a) => selected.includes(a.id));
  const download = async (preview = false) => {
    setBusy(true);
    await accountPdf(chosen, businessName, preview);
    setBusy(false);
  };
  return (
    <GlobalDialog title="Share account details" close={close} drawer>
      <div className="mb-8 text-center">
        <div className="mb-5 flex justify-center -space-x-1">
          {[...new Set(available.map((a) => a.asset))].map((asset) => (
            <CurrencyFlag currency={asset} key={asset} />
          ))}
        </div>
        <h3 className="text-xl font-semibold">
          Which accounts should we include?
        </h3>
        <p className="mt-2 text-sm text-raiz-gray-600">
          We’ll put them in one PDF in {businessName}’s name, ready to send to
          customers.
        </p>
      </div>
      <div className="mb-4 flex justify-between text-xs">
        <span>
          {chosen.length} of {available.length} selected
        </span>
        <button
          className="font-semibold text-primary2"
          onClick={() =>
            setSelected(
              chosen.length === available.length
                ? []
                : available.map((a) => a.id),
            )
          }
        >
          {chosen.length === available.length ? "Deselect all" : "Select all"}
        </button>
      </div>
      <div className="divide-y divide-kyb-border rounded-2xl border border-kyb-border bg-white px-4">
        {available.map((a) => (
          <label
            key={a.id}
            className="flex cursor-pointer items-center gap-3 py-4"
          >
            <CurrencyFlag currency={a.asset} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{a.title}</span>
              <span className="block truncate text-xs text-raiz-gray-600">
                {a.network ??
                  a.fields.find(
                    (f) => f.label === "Account number" || f.label === "IBAN",
                  )?.value}
              </span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-primary2"
              checked={selected.includes(a.id)}
              onChange={() =>
                setSelected((ids) =>
                  ids.includes(a.id)
                    ? ids.filter((id) => id !== a.id)
                    : [...ids, a.id],
                )
              }
            />
          </label>
        ))}
        {!available.length && (
          <p className="py-6 text-sm text-raiz-gray-600">
            Your active account details will appear here when they are ready.
          </p>
        )}
      </div>
      <div className="mt-8 rounded-2xl bg-[#eeebfc] p-4">
        <p className="break-words text-sm font-semibold">
          {businessName} — account details.pdf
        </p>
        <p className="mt-1 text-xs text-raiz-gray-600">
          {chosen.map((a) => a.asset).join(", ") || "Select an account"}
        </p>
        <button
          disabled={!chosen.length || busy}
          onClick={() => download(true)}
          className="mt-3 text-xs font-semibold text-primary2 disabled:opacity-40"
        >
          Preview
        </button>
      </div>
      <p className="my-7 text-xs text-raiz-gray-600">
        Only share with people paying you. Include the correct token and network
        for stablecoin deposits.
      </p>
      <footer className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <button
          disabled={!chosen.length}
          onClick={() =>
            copyInstructions(instructionsText(chosen, businessName))
          }
          className={secondaryButton}
        >
          Copy as text
        </button>
        <button
          disabled={!chosen.length || busy}
          onClick={() => download()}
          className={primaryButton}
        >
          {busy ? "Preparing…" : "Download PDF"}
        </button>
      </footer>
    </GlobalDialog>
  );
}
