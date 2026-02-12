"use client";
import React, { useMemo, useState } from "react";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import SearchBox from "@/components/ui/SearchBox";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { FetchTaxesApi } from "@/services/invoice";
import { IInvoiceTax } from "@/types/services";

interface TaxSelectProps {
  value?: string;
  onChange: (value: IInvoiceTax) => void;
  displayNewTax: () => void;
}

const TaxSelect: React.FC<TaxSelectProps> = ({
  value,
  onChange,
  displayNewTax,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useOutsideClick(() => setOpen(false));

  const { data, isLoading } = useQuery({
    queryKey: ["invoice-tax"],
    queryFn: FetchTaxesApi,
  });

  const taxOptions: IInvoiceTax[] = useMemo(() => {
    if (!data) return [];
    return data.map((tax: IInvoiceTax) => ({
      tax_name: tax.tax_name,
      tax_percentage: tax.tax_percentage,
      business_account_id: tax.business_account_id,
      tax_rate_id: tax.tax_rate_id,
    }));
  }, [data]);

  const filtered = taxOptions.filter((opt) =>
    opt.tax_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = taxOptions.find((opt) => opt.tax_rate_id === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-md bg-[#F3F1F6] h-[44px] text-left px-3 text-sm flex items-center justify-between"
      >
        <span className={selectedOption ? "text-zinc-900" : "text-gray-400"}>
          {selectedOption
            ? `${selectedOption.tax_name} (${selectedOption.tax_percentage}%)`
            : "Select a Tax"}
        </span>
        <Image
          className={`w-3 h-3 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
          src="/icons/s-arrow-down.svg"
          alt=""
          width={12}
          height={12}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute w-[236px] z-20 p-2 mt-1 bg-white border border-gray-100 rounded-lg shadow-md">
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-48 overflow-auto">
            {isLoading ? (
              <p className="py-2 text-sm text-gray-500">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="py-2 text-zinc-700 text-sm">No Results Found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.tax_rate_id}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                    value === opt.tax_rate_id
                      ? "bg-violet-50 text-violet-800 font-medium"
                      : "hover:bg-violet-50"
                  }`}
                >
                  {opt.tax_name} ({opt.tax_percentage}%)
                </button>
              ))
            )}
          </div>

          {/* Add new tax */}
          <div className="w-full">
            <div className="h-px bg-gray-100 mt-2 mb-1" />
            <button
              type="button"
              onClick={displayNewTax}
              className="flex gap-4 items-center hover:bg-[#EAECFF99] pl-3.5 pr-2.5 py-2 mt-2 w-full rounded-md transition-colors"
            >
              <svg width="16" height="17" viewBox="0 0 16 17" fill="none">
                <path
                  d="M8.00031 2.33334C11.3973 2.33352 14.1663 5.10325 14.1663 8.50034C14.1661 11.8973 11.3972 14.6662 8.00031 14.6664C4.60322 14.6664 1.83349 11.8974 1.83331 8.50034C1.83331 5.10314 4.60311 2.33334 8.00031 2.33334ZM8.00031 4.83334C7.45083 4.83334 7.00031 5.28387 7.00031 5.83334V7.50034H5.33331C4.78384 7.50034 4.33331 7.95086 4.33331 8.50034C4.33349 9.04966 4.78395 9.50034 5.33331 9.50034H7.00031V11.1664C7.00031 11.7158 7.45083 12.1664 8.00031 12.1664C8.54963 12.1662 9.00031 11.7157 9.00031 11.1664V9.50034H10.6663C11.2157 9.50034 11.6661 9.04966 11.6663 8.50034C11.6663 7.95086 11.2158 7.50034 10.6663 7.50034H9.00031V5.83334C9.00031 5.28398 8.54963 4.83352 8.00031 4.83334Z"
                  fill="#0D6494"
                  stroke="#0D6494"
                />
              </svg>
              <span className="text-cyan-700 text-sm font-semibold">
                Add New Tax
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxSelect;
