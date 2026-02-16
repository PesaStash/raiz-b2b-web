"use client";
import Avatar from "@/components/ui/Avatar";
import { useUser } from "@/lib/hooks/useUser";
import { IInvoice } from "@/types/invoice";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import React, { forwardRef } from "react";

interface Props {
  data: IInvoice;
}

const InvoiceFile = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { user } = useUser();
  return (
    <section
      ref={ref}
      className="max-w-[1200px] px-14  w-full bg-white rounded-3xl border border-gray-200 inline-flex flex-col justify-start items-start overflow-hidden"
    >
      {/* Header Section */}
      <div className="w-full">
        <div className="w-full  pt-14 pb-5 flex justify-between items-end">
          <div className="flex flex-col gap-3">
            <Avatar
              className="size-6"
              src={
                user?.selfie_image ||
                user?.business_account?.business_image ||
                ""
              }
              name={user?.business_account?.business_name || ""}
            />
            <div>
              <h1 className="text-zinc-900 text-lg font-bold  leading-snug">
                {user?.business_account?.business_name || ""}
              </h1>
              <p className="text-zinc-700  text-sm mt-2">
                {`${
                  user?.business_account?.entity?.entity_address?.[0]?.city ||
                  ""
                }, ${
                  user?.business_account?.entity?.entity_address?.[0]?.state ||
                  ""
                } ${
                  user?.business_account?.entity?.entity_address?.[0]?.country
                    ?.country_name || ""
                }`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <h2 className=" text-zinc-900 text-4xl font-semibold  leading-10">
              INVOICE
            </h2>
          </div>
        </div>
        <p className=" text-zinc-900 text-sm font-bold  mb-12 text-right">
          {data?.invoice_number}
        </p>
      </div>

      {/* Bill To Section */}
      <div className="w-full pb-12 flex justify-between items-start">
        <div>
          <p className="text-zinc-700 text-sm mb-2">Bill To:</p>
          <p className="text-zinc-900 text-base font-semibold">
            {data?.customer?.full_name || data?.customer?.business_name || ""}
          </p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <div className="flex gap-20">
            <span className=" text-zinc-800 text-sm font-semibold ">
              Issue Date:
            </span>
            <span className="text-zinc-700 text-sm leading-tight">
              {data?.issue_date}
            </span>
          </div>
          <div className="flex gap-20">
            <span className=" text-zinc-800 text-sm font-semibold ">
              Due Date:
            </span>
            <span className="text-zinc-700 text-sm leading-tight">
              {data?.due_date}
            </span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full  pb-8">
        <table className="w-full">
          <thead className="text-zinc-700 text-xs">
            <tr className="bg-violet-100/60 border-t border-b border-gray-200">
              <th className="text-left py-4 px-4 text-zinc-700 text-xs font-normal w-12">
                SN.
              </th>
              <th className="text-left py-4 px-4 text-zinc-700 text-xs font-normal">
                Item Details
              </th>
              <th className="text-left py-4 px-4 text-zinc-700 text-xs font-normal w-24">
                Qty
              </th>
              <th className="text-left py-4 px-4 text-zinc-700 text-xs font-normal w-32">
                Unit Price
              </th>
              <th className="text-right py-4 px-4 text-zinc-700 text-xs font-normal w-32">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="font-brSonoma ">
            {data?.invoice_items?.map((item, i) => (
              <tr
                key={item.invoice_item_id}
                className="border-b border-gray-100"
              >
                <td className="py-6 px-4 text-zinc-700 text-sm">{i + 1}</td>
                <td className="py-6 px-4 text-zinc-900 font-medium text-sm">
                  {item.description}
                </td>
                <td className="py-6 px-4 text-zinc-700 text-sm">
                  {item.quantity}
                </td>
                <td className="py-6 px-4 text-zinc-700 text-sm">
                  {`${getCurrencySymbol(data?.currency)}${formatAmount(
                    item.unit_price
                  )}`}
                </td>
                <td className="py-6 px-4 text-zinc-700 text-sm text-right">
                  {`${getCurrencySymbol(data?.currency)}${formatAmount(
                    item.total_price
                  )}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="w-full pb-12 gap-8 flex justify-between items-end">
        <div className="flex-1 flex flex-col justify-between ">
          <p className="text-zinc-900 text-sm mb-6">{data?.note}</p>
          <div className="mt-5">
            <h3 className="text-zinc-900 text-base font-semibold mb-2">
              Terms & Conditions
            </h3>
            <p className="text-zinc-700 text-xs leading-relaxed max-w-sm">
              {data?.terms_and_conditions}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-5 min-w-80 font-medium text-sm  text-zinc-700 font-brSonoma border border-b-0 rounded-t-lg border-gray-100 rounded-b-lg  ">
          <div className="flex justify-between pt-6 px-6">
            <span className="">Sub Total:</span>
            <span className="">{`${getCurrencySymbol(
              data?.currency
            )}${formatAmount(data?.total_amount)}`}</span>
          </div>
          {data?.discount_amount ? (
            <div className="flex justify-between  px-6">
              <span className="">Discount:</span>
              <span className="">{`${getCurrencySymbol(
                data?.currency
              )}${formatAmount(data?.discount_amount)}`}</span>
            </div>
          ) : null}
          {data?.tax_amount ? (
            <div className="flex justify-between  px-6">
              <span className="">Tax:</span>
              <span className="">{`${getCurrencySymbol(
                data?.currency
              )}${formatAmount(data?.tax_amount)}`}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-zinc-700 text-base font-semibold  py-4 px-6 bg-zinc-200  rounded-bl-lg rounded-br-lg">
            <span className="">Total:</span>
            <span className="">{`${getCurrencySymbol(
              data?.currency
            )}${formatAmount(data?.total_amount)}`}</span>
          </div>
        </div>
      </div>

      {/* Contact Footer */}
      <div className="w-full  py-8 flex gap-8 text-zinc-800 font-semibold text-sm border-t border-gray-100 ">
        <span>{user?.business_account?.business_phone_number}</span>
        <span>{user?.email}</span>
        {/* <span>{data?.customer?.website}</span> */}
      </div>
    </section>
  );
});

InvoiceFile.displayName = "InvoiceFile";
export default InvoiceFile;
