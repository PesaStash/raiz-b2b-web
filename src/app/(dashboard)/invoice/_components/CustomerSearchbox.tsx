"use client";
import Avatar from "@/components/ui/Avatar";
import SearchBox from "@/components/ui/SearchBox";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { FetchCustomers } from "@/services/invoice";
import { ICustomer } from "@/types/invoice";
import { useQuery } from "@tanstack/react-query";
import { RefObject, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const CustomerSearchBox = ({
  setShowSearchBox,
  btnRef,
  addNew,
  onSelectCustomer,
  onUnselectCustomer,
  selectedCustomerId,
}: {
  setShowSearchBox: (show: boolean) => void;
  btnRef: RefObject<HTMLElement | null>;
  addNew: () => void;
  onSelectCustomer: (customer: ICustomer) => void;
  onUnselectCustomer?: () => void;
  selectedCustomerId?: string | number | null;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useOutsideClick(() => setShowSearchBox(false), btnRef);

  const debounceSearch = useDebounce(searchTerm, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debounceSearch],
    queryFn: () => FetchCustomers({ search: debounceSearch, limit: 3 }),
  });

  const customers: ICustomer[] = data?.customers || [];

  const handleSelect = (each: ICustomer) => {
    if (selectedCustomerId === each.customer_id) {
      onUnselectCustomer?.();
    } else {
      onSelectCustomer(each);
    }
    setShowSearchBox(false);
  };

  return (
    <div
      ref={searchRef}
      className="w-96 left-0 top-8 z-20 absolute bg-white p-2 rounded-lg shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)] outline outline-1 outline-offset-[-1px] outline-gray-100 inline-flex flex-col justify-start items-start gap-2 overflow-hidden"
    >
      <SearchBox
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="mt-1 w-full">
        <ul className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-2.5 py-2 w-full"
              >
                <Skeleton circle width={48} height={48} />
                <Skeleton width="285px" height={20} />
              </li>
            ))
          ) : customers?.length ? (
            customers.map((each, i) => {
              const isSelected = selectedCustomerId === each.customer_id;
              const name = each?.business_name || each?.full_name
              return (
                <li key={i}>
                  <button
                    onClick={() => handleSelect(each)}
                    className={`flex justify-between w-full items-center px-2.5 py-2 text-left text-sm rounded-md transition-colors ${
                      isSelected
                        ? "bg-violet-50 text-violet-900"
                        : "text-zinc-700 hover:bg-violet-100/60"
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <Avatar src={""} name={name} />
                      <span>{name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5  ">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
                            fill="#443852"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-gray-500 px-2 py-3 text-center">
              No customers found
            </li>
          )}
        </ul>
      </div>

      {/* Divider + Add Customer */}
      <div className="w-full">
        <div className="self-stretch h-px bg-gray-100 mt-2 mb-1"></div>
        <button
          onClick={() => {
            addNew();
            setShowSearchBox(false);
          }}
          className="flex gap-4 items-center hover:bg-[#EAECFF99] pl-3.5 pr-2.5 py-2 mt-1 w-full rounded-md transition-colors"
        >
          <svg width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path
              d="M8.00031 2.33334C11.3973 2.33352 14.1663 5.10325 14.1663 8.50034C14.1661 11.8973 11.3972 14.6662 8.00031 14.6664C4.60322 14.6664 1.83349 11.8974 1.83331 8.50034C1.83331 5.10314 4.60311 2.33334 8.00031 2.33334ZM8.00031 4.83334C7.45083 4.83334 7.00031 5.28387 7.00031 5.83334V7.50034H5.33331C4.78384 7.50034 4.33331 7.95086 4.33331 8.50034C4.33349 9.04966 4.78395 9.50034 5.33331 9.50034H7.00031V11.1664C7.00031 11.7158 7.45083 12.1664 8.00031 12.1664C8.54963 12.1662 9.00031 11.7157 9.00031 11.1664V9.50034H10.6663C11.2157 9.50034 11.6661 9.04966 11.6663 8.50034C11.6663 7.95086 11.2158 7.50034 10.6663 7.50034H9.00031V5.83334C9.00031 5.28398 8.54963 4.83352 8.00031 4.83334Z"
              fill="#0D6494"
              stroke="#0D6494"
            />
          </svg>
          <span className="text-cyan-700 text-sm font-semibold">
            Add New Customer
          </span>
        </button>
      </div>
    </div>
  );
};
