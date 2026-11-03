"use client";

import React from "react";
import ListDetailItem from "@/components/ui/ListDetailItem";
import { IGatewaySubaccountAccount } from "@/types/services";

type Props = {
  accounts: IGatewaySubaccountAccount[];
  status: string;
};

const fieldRowsForAccount = (account: IGatewaySubaccountAccount) => {
  const currency = account.currency?.toUpperCase();
  const rows: { title: string; value: string }[] = [];

  if (currency === "USD") {
    if (account.account_number) {
      rows.push({ title: "Account Number", value: account.account_number });
    }
    if (account.routing_number) {
      rows.push({ title: "Routing Number", value: account.routing_number });
    }
    if (account.bic) {
      rows.push({ title: "SWIFT / BIC", value: account.bic });
    }
    if (account.iban) {
      rows.push({ title: "IBAN", value: account.iban });
    }
    if (account.bank_name) {
      rows.push({ title: "Bank", value: account.bank_name });
    }
    if (account.account_name) {
      rows.push({ title: "Beneficiary", value: account.account_name });
    }
  } else if (currency === "EUR") {
    if (account.account_number) {
      rows.push({ title: "Account Number", value: account.account_number });
    }
    if (account.bic) {
      rows.push({ title: "BIC / SWIFT", value: account.bic });
    }
    if (account.iban) {
      rows.push({ title: "IBAN", value: account.iban });
    }
    if (account.bank_name) {
      rows.push({ title: "Bank", value: account.bank_name });
    }
    if (account.bank_address) {
      rows.push({ title: "Bank Address", value: account.bank_address });
    }
    if (account.account_name) {
      rows.push({ title: "Beneficiary", value: account.account_name });
    }
  } else if (currency === "GBP") {
    if (account.account_number) {
      rows.push({ title: "Account Number", value: account.account_number });
    }
    if (account.sort_code) {
      rows.push({ title: "Sort Code", value: account.sort_code });
    }
    if (account.iban) {
      rows.push({ title: "IBAN", value: account.iban });
    }
    if (account.bic) {
      rows.push({ title: "SWIFT / BIC", value: account.bic });
    }
    if (account.bank_name) {
      rows.push({ title: "Bank", value: account.bank_name });
    }
    if (account.account_name) {
      rows.push({ title: "Beneficiary", value: account.account_name });
    }
  } else {
    if (account.account_number) {
      rows.push({ title: "Account Number", value: account.account_number });
    }
    if (account.routing_number) {
      rows.push({ title: "Routing Number", value: account.routing_number });
    }
    if (account.sort_code) {
      rows.push({ title: "Sort Code", value: account.sort_code });
    }
    if (account.iban) {
      rows.push({ title: "IBAN", value: account.iban });
    }
    if (account.bic) {
      rows.push({ title: "SWIFT / BIC", value: account.bic });
    }
    if (account.bank_name) {
      rows.push({ title: "Bank", value: account.bank_name });
    }
    if (account.bank_address) {
      rows.push({ title: "Bank Address", value: account.bank_address });
    }
    if (account.account_name) {
      rows.push({ title: "Beneficiary", value: account.account_name });
    }
  }

  return rows;
};

const isAccountActive = (status?: string | null) => {
  if (!status) return true;
  const normalized = status.toLowerCase();
  return normalized === "activated" || normalized === "active";
};

const AccountInstructions = ({ accounts, status }: Props) => {
  if (!accounts.length) {
    if (status !== "active") {
      return null;
    }
    return (
      <div className="rounded-2xl border border-raiz-gray-100 bg-white p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
        <p className="text-sm text-raiz-gray-600">
          Account details are being generated. Please refresh shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {accounts.map((account) => {
        const rows = fieldRowsForAccount(account);
        const currency = account.currency?.toUpperCase() || "";
        return (
          <div
            key={account.subaccount_account_id}
            className="rounded-2xl border border-raiz-gray-100 bg-white p-4 md:p-5 flex flex-col gap-4 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
          >
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <h4 className="text-sm font-brSonoma font-bold text-raiz-gray-950">
                {currency} Virtual Account
              </h4>
              {isAccountActive(account.status) ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border border-[#D1FADF] tracking-wide bg-[#ECFDF3] text-[#027A48]">
                  Active
                </span>
              ) : account.status ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-raiz-gray-50 text-raiz-gray-600">
                  {account.status.replace(/_/g, " ")}
                </span>
              ) : null}
            </div>
            {rows.length ? (
              <div className="flex flex-col gap-1">
                {rows.map((row, index) => (
                  <ListDetailItem
                    key={`${row.title}-${row.value}`}
                    title={row.title}
                    value={row.value}
                    copyable
                    
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-raiz-gray-500">
                No instruction fields available yet.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AccountInstructions;
